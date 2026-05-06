/**
 * ga4-client.ts — Google Analytics 4 Data API 래퍼.
 *
 * 무료 무제한. OAuth 2.0 + Refresh Token 흐름.
 *
 * 사장님 흐름:
 *   1) OAuth 동의 → /api/integrations/saas-metrics/ga4/callback 에서 refresh token 수령
 *   2) GA4 Property 선택 → 봉투 암호화 후 saas_metrics_connections 에 저장
 *   3) /api/integrations/saas-metrics/sync 가 매일 호출 → runReport 로 DAU/MAU/signup 수집
 *
 * 패키지: googleapis (npm install googleapis) — 이 모듈은 동적 require 라
 *        패키지 미설치 시 friendly error 반환. 활성화 시 한 번만 설치.
 */

import { getEnvVar } from "./env";

export type Ga4DailyMetric = {
  date: string;                    // YYYY-MM-DD
  activeUsers: number;             // DAU
  newUsers: number;                // 그날의 신규 사용자
  totalUsers?: number;             // 누적 (선택)
};

export class Ga4ApiError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "Ga4ApiError";
    this.code = code;
  }
}

// ─── 동적 SDK 로드 ──────────────────────────────────────────────────
//
// googleapis 가 미설치된 환경에서도 typecheck/build 가 통과하도록 require.

type OAuth2Client = {
  setCredentials(c: { refresh_token?: string; access_token?: string }): void;
  generateAuthUrl(opts: { access_type: string; scope: string[]; prompt?: string; state?: string }): string;
  getToken(code: string): Promise<{ tokens: { refresh_token?: string; access_token?: string; expiry_date?: number } }>;
};

type GoogleApis = {
  google: {
    auth: { OAuth2: new (clientId: string, clientSecret: string, redirectUri: string) => OAuth2Client };
    analyticsdata(opts: { version: string; auth: OAuth2Client }): {
      properties: {
        runReport(req: {
          property: string;
          requestBody: {
            dateRanges: { startDate: string; endDate: string }[];
            dimensions?: { name: string }[];
            metrics: { name: string }[];
          };
        }): Promise<{ data: Ga4ReportRaw }>;
      };
    };
    analyticsadmin(opts: { version: string; auth: OAuth2Client }): {
      properties: {
        list(opts: { filter?: string; pageSize?: number }): Promise<{
          data: { properties?: Array<{ name?: string; displayName?: string; propertyType?: string }> };
        }>;
      };
      accountSummaries: {
        list(opts: { pageSize?: number }): Promise<{
          data: {
            accountSummaries?: Array<{
              account?: string;
              displayName?: string;
              propertySummaries?: Array<{ property?: string; displayName?: string; propertyType?: string }>;
            }>;
          };
        }>;
      };
    };
  };
};

type Ga4ReportRaw = {
  rows?: Array<{
    dimensionValues?: Array<{ value?: string }>;
    metricValues?: Array<{ value?: string }>;
  }>;
};

let _sdk: GoogleApis | null = null;

function loadSdk(): GoogleApis {
  if (_sdk) return _sdk;
  try {
    /* eslint-disable @typescript-eslint/no-require-imports */
    _sdk = require("googleapis") as GoogleApis;
    return _sdk;
  } catch (e) {
    throw new Ga4ApiError(
      "GA4_SDK_NOT_INSTALLED",
      `googleapis 패키지 미설치. \`pnpm add googleapis\` 후 다시 시도해 주세요. (${(e as Error).message})`,
    );
  }
}

// ─── 환경변수 ──────────────────────────────────────────────────────
//
// Google Cloud Console > Credentials > OAuth 2.0 Client ID 발급 (무료).
// Authorized redirect URI: <base>/api/integrations/saas-metrics/ga4/callback

export function getGa4OAuthConfig(): { clientId: string; clientSecret: string; redirectUri: string } {
  const clientId = getEnvVar("GA4_OAUTH_CLIENT_ID");
  const clientSecret = getEnvVar("GA4_OAUTH_CLIENT_SECRET");
  const redirectUri = getEnvVar("GA4_OAUTH_REDIRECT_URI");
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Ga4ApiError(
      "GA4_NOT_CONFIGURED",
      "GA4 OAuth 환경변수가 설정되지 않았습니다. (GA4_OAUTH_CLIENT_ID / GA4_OAUTH_CLIENT_SECRET / GA4_OAUTH_REDIRECT_URI)",
    );
  }
  return { clientId, clientSecret, redirectUri };
}

export function isGa4Configured(): boolean {
  try {
    getGa4OAuthConfig();
    return true;
  } catch {
    return false;
  }
}

// ─── OAuth helpers ─────────────────────────────────────────────────

const SCOPES = [
  "https://www.googleapis.com/auth/analytics.readonly",
];

export function buildAuthUrl(state: string): string {
  const cfg = getGa4OAuthConfig();
  const sdk = loadSdk();
  const oauth = new sdk.google.auth.OAuth2(cfg.clientId, cfg.clientSecret, cfg.redirectUri);
  return oauth.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",                             // refresh_token 보장
    state,
  });
}

export async function exchangeCodeForRefreshToken(
  code: string,
): Promise<{ refreshToken: string; accessToken: string }> {
  const cfg = getGa4OAuthConfig();
  const sdk = loadSdk();
  const oauth = new sdk.google.auth.OAuth2(cfg.clientId, cfg.clientSecret, cfg.redirectUri);
  const { tokens } = await oauth.getToken(code);
  if (!tokens.refresh_token) {
    throw new Ga4ApiError(
      "GA4_NO_REFRESH_TOKEN",
      "Google 이 refresh_token 을 반환하지 않았습니다. 사용자가 이전에 동의했을 수 있습니다 — Google 계정 권한에서 build.up 을 제거하고 다시 시도해 주세요.",
    );
  }
  return {
    refreshToken: tokens.refresh_token,
    accessToken: tokens.access_token ?? "",
  };
}

function makeAuthClient(refreshToken: string): OAuth2Client {
  const cfg = getGa4OAuthConfig();
  const sdk = loadSdk();
  const oauth = new sdk.google.auth.OAuth2(cfg.clientId, cfg.clientSecret, cfg.redirectUri);
  oauth.setCredentials({ refresh_token: refreshToken });
  return oauth;
}

// ─── Property 목록 (사장님이 GA4 property 선택용) ────────────────

export type Ga4PropertySummary = {
  property: string;          // "properties/123456789"
  displayName: string;       // "My Startup"
  accountName: string;       // "Account display name"
};

export async function listProperties(refreshToken: string): Promise<Ga4PropertySummary[]> {
  const sdk = loadSdk();
  const auth = makeAuthClient(refreshToken);
  const admin = sdk.google.analyticsadmin({ version: "v1beta", auth });
  const res = await admin.accountSummaries.list({ pageSize: 200 });
  const out: Ga4PropertySummary[] = [];
  for (const acc of res.data.accountSummaries ?? []) {
    for (const p of acc.propertySummaries ?? []) {
      if (p.propertyType !== "PROPERTY_TYPE_ORDINARY") continue;
      out.push({
        property: p.property ?? "",
        displayName: p.displayName ?? "",
        accountName: acc.displayName ?? "",
      });
    }
  }
  return out.filter((p) => p.property);
}

// ─── 일별 지표 조회 ────────────────────────────────────────────────

export async function fetchDailyMetrics(input: {
  refreshToken: string;
  propertyId: string;       // "properties/123456789"
  startDate: string;        // YYYY-MM-DD
  endDate: string;          // YYYY-MM-DD
}): Promise<Ga4DailyMetric[]> {
  const sdk = loadSdk();
  const auth = makeAuthClient(input.refreshToken);
  const data = sdk.google.analyticsdata({ version: "v1beta", auth });
  const res = await data.properties.runReport({
    property: input.propertyId,
    requestBody: {
      dateRanges: [{ startDate: input.startDate, endDate: input.endDate }],
      dimensions: [{ name: "date" }],
      metrics: [
        { name: "activeUsers" },
        { name: "newUsers" },
        { name: "totalUsers" },
      ],
    },
  });
  const rows = res.data.rows ?? [];
  return rows
    .map((r) => {
      const rawDate = r.dimensionValues?.[0]?.value ?? "";
      // GA4 returns YYYYMMDD — convert to YYYY-MM-DD
      const date =
        rawDate.length === 8
          ? `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`
          : rawDate;
      const activeUsers = parseInt(r.metricValues?.[0]?.value ?? "0", 10);
      const newUsers = parseInt(r.metricValues?.[1]?.value ?? "0", 10);
      const totalUsers = parseInt(r.metricValues?.[2]?.value ?? "0", 10);
      return { date, activeUsers, newUsers, totalUsers };
    })
    .filter((m) => m.date && /^\d{4}-\d{2}-\d{2}$/.test(m.date))
    .sort((a, b) => a.date.localeCompare(b.date));
}
