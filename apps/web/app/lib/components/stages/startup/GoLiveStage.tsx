"use client";

/**
 * GoLiveStage — 실제 출시 (Go Live) Stage 10
 *
 * 5페이지 풍부한 단계별 가이드 — 사용자가 가이드만 따라가면 실제 출시 가능.
 *
 * 검증 출처 (2026.4 영어·한국어 양쪽):
 *   • Vercel docs (custom domain, SSL, sitemap)
 *   • developer.apple.com (App Store Connect, TestFlight, iOS 26 SDK)
 *   • Google Play Console (12 testers × 14 days policy)
 *   • Product Hunt 화·수 12am PT 가이드라인
 *   • Hacker News Show HN 가이드라인
 */

import { useState } from "react";
import {
  Rocket, Cloud, Megaphone, Sparkles, Lightbulb,
  Globe, Smartphone, BookOpen, AlertTriangle, Check, ExternalLink, XCircle, Clock,
} from "lucide-react";
import { useDashboardCtx } from "../../../contexts/DashboardContext";
import { MOBILE_LAUNCH_APPLE, MOBILE_LAUNCH_GOOGLE, MOBILE_LAUNCH_KOREA, MOBILE_LAUNCH_CROSSCUTTING, getClusterForSubIndustry } from "@foundone/shared";
import { DeepTechStageNotice, deepTechKindOf } from "./DeepTechStageNotice";
import { ModePathCard } from "./ModePathCard";
import { BuildMethodDialog, BuildMethodTrigger } from "./BuildMethodDialog";
import {
  MIDNIGHT,
  MIDNIGHT_SOFT,
  MIDNIGHT_BORDER,
  StartupKeyActionHero,
  StartupPageNav,
} from "./StartupStageShell";
import type { LucideIcon } from "lucide-react";
import { StageWrapup } from "../shared/StageWrapup";

export function GoLiveStage() {
  const d = useDashboardCtx();
  const ko = d.language === "ko";
  // 업종 정합(2026-07-02): 하드웨어·딥테크는 웹 배포·앱스토어·PH/HN 이 아니라 초도 양산·현장 배포.
  //   SW 전용 본문을 게이팅하고 트랙별 안내 + 전용 단계로 라우팅.
  const deepTechKind = deepTechKindOf(getClusterForSubIndustry(d.selectedIndustryId ?? undefined, d.industryCategoryId ?? ""));
  // guideStepIndex 가 다른 단계에서 carry-over 된 경우 (예: launch-gtm 의 page 5)
  // GoLiveStage 의 0-4 범위 밖이면 0 으로 강제. 빈 화면 방지.
  const rawPg = d.guideStepIndex;
  const pg = (typeof rawPg === "number" && rawPg >= 0 && rawPg <= 4) ? rawPg : 0;
  const totalPg = 5;
  const pgLabels = ko
    ? ["채널 선택", "웹 출시", "App Store", "Google Play", "PH·HN 론칭"]
    : ["Pick Channels", "Web", "App Store", "Google Play", "PH·HN"];

  const [methodDialogTaskId, setMethodDialogTaskId] = useState<string | null>(null);

  // 딥테크·하드웨어면 SW 본문 게이팅 → 트랙별 안내 (hook 선언 뒤에서 early-return).
  if (deepTechKind) return <DeepTechStageNotice stage="golive" kind={deepTechKind} ko={ko} />;

  return (
    <div className="bento-fade-in" style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "14px" }}>
      <StartupKeyActionHero
        eyebrow="KEY ACTION"
        title={ko ? "가이드만 따라가면 실제 출시 가능" : "Follow the guide → ship publicly"}
        subtitle={
          ko ? (
            <>
              본인 제품에 맞는 1-3개 채널 선택 후 단계별 절차를 따라가세요.
              웹 = 1-3시간, iOS = 3-7일, Android = 2-3주, PH/HN = 1-2주 준비.
              <strong style={{ fontWeight: 700 }}> 외주 없이 본인이 직접</strong> 가능하도록 모든 절차 제공.
            </>
          ) : (
            <>
              Pick 1-3 channels and follow step-by-step. <strong>DIY without agency.</strong>
            </>
          )
        }
        miniCards={[
          { icon: Globe, label: ko ? "웹 출시" : "Web", detail: ko ? "1-3시간" : "1-3hr" },
          { icon: Smartphone, label: ko ? "앱 스토어" : "App Stores", detail: ko ? "1-3주" : "1-3wk" },
          { icon: Megaphone, label: ko ? "PH·HN 론칭" : "PH·HN Launch", detail: ko ? "Top = 100K+ 방문" : "Top = 100K+" },
        ]}
      />

      <StartupPageNav
        page={pg}
        totalPages={totalPg}
        labels={pgLabels}
        onChange={(p) => d.setGuideStepIndex(p)}
        ko={ko}
      />

      {/* ═════════════ PAGE 0 — 채널 선택 가이드 ═════════════ */}
      {pg === 0 && (
        <>
          <ModePathCard stageId="go-live" />

          <Section icon={Lightbulb} title={ko ? "본인 제품에 맞는 채널 선택" : "Pick channels by product"}>
            <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column" as const, gap: "10px" }}>
              {(ko ? [
                { type: "웹 SaaS (대다수)", channels: "① 웹 + ④ Product Hunt + ⑤ HN", note: "모바일 앱 만들 필요 없음. 대다수 SaaS 가 이 패턴." },
                { type: "모바일 앱 (B2C)", channels: "① 웹(랜딩) + ② Apple + ③ Google + ④ PH", note: "iOS·Android 동시 권장. 한쪽만 하면 50% 시장 놓침." },
                { type: "개발자 도구", channels: "① 웹 + ⑤ HN(1순위) + ④ PH", note: "HN 이 가장 큰 화제성. Cursor·Linear 모두 HN 으로 시작." },
                { type: "한국 시장 위주", channels: "① 웹 + 디스콰이엇 + 당근비즈프로필", note: "PH·HN 효과 작음. 한국 커뮤니티가 핵심." },
                { type: "1인 인디", channels: "① 웹 + (⑤ HN or ④ PH) 1개만", note: "둘 다 풀 가동 어려움. 1개 채널에 집중." },
              ] : [
                { type: "Web SaaS (most)", channels: "① Web + ④ PH + ⑤ HN", note: "No mobile needed." },
                { type: "Mobile (B2C)", channels: "① Web + ② Apple + ③ Google + ④ PH", note: "Both stores recommended." },
                { type: "Dev tools", channels: "① Web + ⑤ HN + ④ PH", note: "HN biggest." },
                { type: "Korea-only", channels: "① Web + Disquiet + Karrot", note: "PH/HN low impact." },
                { type: "Solo indie", channels: "① Web + 1 of (⑤ or ④)", note: "Don't overcommit." },
              ]).map((p, i) => (
                <div key={i} style={{ padding: "14px 16px", borderRadius: "12px", background: "white", border: `1px solid ${MIDNIGHT_BORDER}` }}>
                  <div style={{ fontSize: "13.5px", fontWeight: 700, color: MIDNIGHT, marginBottom: "4px" }}>{p.type}</div>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a", marginBottom: "4px", letterSpacing: "-0.005em" }}>→ {p.channels}</div>
                  <div style={{ fontSize: "11.5px", color: "rgba(15,23,42,0.6)", lineHeight: 1.55 }}>{p.note}</div>
                </div>
              ))}
            </div>
          </Section>
        </>
      )}

      {/* ═════════════ PAGE 1 — 🌐 웹 출시 단계별 ═════════════ */}
      {pg === 1 && (
        <>
          <Section icon={Globe} title={ko ? "웹 출시 단계별 가이드 (1-3시간)" : "Web launch step-by-step (1-3hr)"}>
            <div style={{ padding: "14px 16px" }}>
              <div style={{ fontSize: "12.5px", color: "rgba(15,23,42,0.7)", lineHeight: 1.65, marginBottom: "12px" }}>
                {ko
                  ? "도메인 구매 → DNS → Vercel 배포 → SSL → SEO 메타 → Google Search Console. 1-3시간 안에 완전 라이브."
                  : "Domain → DNS → Vercel → SSL → SEO → Search Console. Live in 1-3hr."}
              </div>

              {(ko ? [
                {
                  step: 1, title: "도메인 구매 (Namecheap·가비아·Cloudflare)", time: "10분",
                  detail: "Namecheap (영문 .com 1-2만/년), 가비아 (한국 .kr 2-3만/년), Cloudflare Registrar (도매가 + 무료 WHOIS 프라이버시).",
                  todo: [
                    "Namecheap 또는 Cloudflare Registrar 가입",
                    "원하는 도메인 검색 → .com 우선, 없으면 .io / .app / .co",
                    "WHOIS 프라이버시 무료 옵션 켜기 (개인정보 보호)",
                    "1년 또는 2년 결제 (장기 할인)",
                  ],
                  links: [
                    { name: "Namecheap", url: "https://namecheap.com" },
                    { name: "Cloudflare Registrar", url: "https://www.cloudflare.com/products/registrar/" },
                    { name: "가비아", url: "https://gabia.com" },
                  ],
                },
                {
                  step: 2, title: "Vercel 프로젝트 생성 + GitHub 연결", time: "15분",
                  detail: "Vercel 가입 → New Project → GitHub repo 선택 → Auto-deploy. 빌드 명령은 Next.js 자동 감지.",
                  todo: [
                    "vercel.com 가입 (GitHub 계정 연동)",
                    "New Project → 본인 GitHub repo import",
                    "Framework Preset: Next.js 자동 선택",
                    "Environment Variables 추가 (Supabase 키 등)",
                    "Deploy 클릭 → 30초~3분 후 .vercel.app URL 발급",
                  ],
                  links: [{ name: "Vercel 공식", url: "https://vercel.com" }],
                },
                {
                  step: 3, title: "도메인 → Vercel 연결 (DNS 설정)", time: "20분 (반영 30분~)",
                  detail: "Vercel Settings → Domains → 도메인 입력. Vercel 이 알려주는 A record (또는 CNAME) 을 도메인 등록처에 추가.",
                  todo: [
                    "Vercel project → Settings → Domains → Add",
                    "본인 도메인 입력 (예: yourbiz.com) → Vercel 이 DNS 설정 안내",
                    "도메인 등록처 (Namecheap·가비아) 의 DNS 관리로 이동",
                    "Apex 도메인: A record → 76.76.21.21 (Vercel IP)",
                    "www 서브도메인: CNAME → cname.vercel-dns.com",
                    "30분~2시간 후 vercel.com 에서 ✓ 표시 확인",
                  ],
                  links: [
                    { name: "Vercel 도메인 가이드", url: "https://vercel.com/docs/domains/working-with-domains" },
                  ],
                },
                {
                  step: 4, title: "SSL 자동 발급 (Let's Encrypt)", time: "자동 (5-30분)",
                  detail: "DNS 설정 완료 후 Vercel 이 자동으로 Let's Encrypt SSL 발급. https:// 자동 활성화. 무료, 평생.",
                  todo: [
                    "DNS 설정 완료 후 자동 발급 — 별도 작업 X",
                    "vercel.com 에서 도메인 옆 🔒 아이콘 확인",
                    "https://yourbiz.com 직접 접속해서 SSL 작동 확인",
                    "(자동) 90일마다 갱신 — Vercel 이 알아서",
                  ],
                  links: [{ name: "Vercel SSL 문서", url: "https://vercel.com/docs/domains/working-with-ssl" }],
                },
                {
                  step: 5, title: "SEO 메타 태그 + OG 이미지", time: "30분",
                  detail: "Next.js app/layout.tsx 에 metadata. OG 이미지 1200×630 (GPT Image 2 활용). 한국어 검색 가산.",
                  todo: [
                    "app/layout.tsx 에 export const metadata = { title, description, openGraph, twitter } 추가",
                    "title: 60자 이내, description: 150자 이내",
                    "OG 이미지 1200×630 PNG (public/og-image.png) — GPT Image 2 또는 Canva 로 30분 안에 제작",
                    "favicon.ico (32×32) + apple-touch-icon.png (180×180) public/ 에",
                    "robots.txt + sitemap.xml — Next.js app/robots.ts, app/sitemap.ts 활용",
                  ],
                  links: [
                    { name: "Next.js Metadata 문서", url: "https://nextjs.org/docs/app/api-reference/functions/generate-metadata" },
                    { name: "OG 이미지 미리보기 도구", url: "https://www.opengraph.xyz" },
                  ],
                },
                {
                  step: 6, title: "Google Search Console 등록 + sitemap 제출", time: "30분 (인덱싱 1-2주)",
                  detail: "Google 이 사이트를 알아야 검색 결과에 노출. Domain 인증 (DNS TXT) → sitemap.xml 제출 → 1-2주 내 인덱싱.",
                  todo: [
                    "search.google.com/search-console 접속 → Add Property",
                    "Domain 선택 (URL prefix 아님) — 모든 서브도메인 한 번에",
                    "Google 이 제공하는 TXT record 를 도메인 DNS 에 추가",
                    "Verify 클릭 → 즉시 ~10분 내 인증",
                    "Sitemaps → https://yourbiz.com/sitemap.xml 제출",
                    "(1-2주 후) Performance 탭에서 검색 노출 시작",
                  ],
                  links: [
                    { name: "Google Search Console", url: "https://search.google.com/search-console" },
                    { name: "Naver 웹마스터도구 (한국 검색)", url: "https://searchadvisor.naver.com" },
                  ],
                },
                {
                  step: 7, title: "Analytics + 출시 전 최종 점검", time: "30분",
                  detail: "PostHog/Mixpanel 연결, 결제 테스트, 모바일 반응형 확인, 에러 모니터링 (Sentry).",
                  todo: [
                    "PostHog 또는 Vercel Analytics 코드 추가",
                    "주요 이벤트 5개 발생시켜 대시보드에 보이는지 확인",
                    "결제 1회 테스트 (Stripe 테스트 모드 → 실모드 전환)",
                    "모바일 (iPhone/Android) 에서 직접 접속해 깨짐 없는지",
                    "PageSpeed Insights 90+ 목표 (developers.google.com/speed/pagespeed)",
                  ],
                  links: [
                    { name: "PageSpeed Insights", url: "https://pagespeed.web.dev" },
                    { name: "PostHog", url: "https://posthog.com" },
                  ],
                },
              ] : []).map((s) => <StepCard key={s.step} {...s} />)}
            </div>
          </Section>
        </>
      )}

      {/* ═════════════ PAGE 2 — 🍎 Apple App Store ═════════════ */}
      {pg === 2 && (
        <>
          <div style={{ marginBottom: "12px", display: "flex", justifyContent: "flex-end" }}>
            <BuildMethodTrigger taskId="app-launch" label="📖 5가지 채널 비교 자세히 보기" onOpen={setMethodDialogTaskId} />
          </div>

          <Section icon={Smartphone} title={ko ? "Apple App Store 단계별 (3-7일)" : "Apple App Store step-by-step"}>
            <div style={{ padding: "14px 16px" }}>
              <div style={{ padding: "10px 12px", borderRadius: "10px", background: "rgba(182,76,76,0.05)", border: "1px solid rgba(182,76,76,0.2)", marginBottom: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 700, color: "#b64c4c", marginBottom: "4px" }}>
                  <AlertTriangle size={13} strokeWidth={2.4} color="#b64c4c" />
                  <span>2026 핵심 정책</span>
                </div>
                <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.75)", lineHeight: 1.6 }}>
                  {ko
                    ? "2026.4.28 이후 모든 신규/업데이트 앱은 iOS 26 SDK + Xcode 26 필수 (Apple Developer 공식). Xcode 16은 iOS 26 SDK 미지원이라 제출 시 거절. 2026.3 부터 리뷰 7-30일 지연 빈발 (평소 24h)."
                    : "From 4.28.2026, iOS 26 SDK + Xcode 26 mandatory (per Apple Developer). Xcode 16 cannot build iOS 26 SDK → rejected on submission. Review delays 7-30 days reported in March 2026."}
                </div>
              </div>

              {MOBILE_LAUNCH_APPLE.map((s) => <StepCard key={s.step} {...s} />)}
            </div>
          </Section>
        </>
      )}

      {/* ═════════════ PAGE 3 — 🤖 Google Play ═════════════ */}
      {pg === 3 && (
        <>
          <Section icon={Smartphone} title={ko ? "Google Play 단계별 (2-3주)" : "Google Play step-by-step"}>
            <div style={{ padding: "14px 16px" }}>
              <div style={{ padding: "10px 12px", borderRadius: "10px", background: "rgba(182,76,76,0.05)", border: "1px solid rgba(182,76,76,0.2)", marginBottom: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 700, color: "#b64c4c", marginBottom: "4px" }}>
                  <AlertTriangle size={13} strokeWidth={2.4} color="#b64c4c" />
                  <span>2026 핵심 정책</span>
                </div>
                <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.75)", lineHeight: 1.6 }}>
                  {ko
                    ? "개인 계정 = 12명 테스터 × 14일 폐쇄 테스트 의무. User Engagement Time 측정 (가짜 테스터 X). 회사 계정은 면제."
                    : "Personal accounts: 12 testers × 14 days closed testing mandatory. User Engagement Time measured."}
                </div>
              </div>

              {MOBILE_LAUNCH_GOOGLE.map((s) => <StepCard key={s.step} {...s} />)}
            </div>
          </Section>

          {ko && (
            <>
              <Section icon={AlertTriangle} title="양 스토어 공통 2026 필수">
                <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: "10px" }}>
                  {MOBILE_LAUNCH_CROSSCUTTING.map((n) => <NoteCard key={n.title} {...n} />)}
                </div>
              </Section>
              <Section icon={Globe} title="한국 특화 — 사업자·게임·결제">
                <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: "10px" }}>
                  {MOBILE_LAUNCH_KOREA.map((n) => <NoteCard key={n.title} {...n} />)}
                </div>
              </Section>
            </>
          )}
        </>
      )}

      {/* ═════════════ PAGE 4 — 📣 PH·HN 론칭 데이 ═════════════ */}
      {pg === 4 && (
        <>
          <Section icon={Megaphone} title={ko ? "Product Hunt 론칭 (Top 5 = 5-10K 방문)" : "Product Hunt Launch"}>
            <div style={{ padding: "14px 16px" }}>
              {(ko ? [
                {
                  step: 1, title: "출시 2주 전: 헌터 (Hunter) 섭외", time: "1주",
                  detail: "Top hunter (followers 10K+) 가 launch 해주면 알고리즘 가산점 큼. Twitter/X DM 으로 사전 컨택.",
                  todo: [
                    "producthunt.com 접속 → \"Top Hunters\" 페이지에서 Top 50 헌터 리스트",
                    "본인 카테고리 (SaaS·AI·Dev tools) 헌터 5-10명 선정",
                    "Twitter/X 에서 그들 활동 1주 관찰 → 부드러운 reply 로 친해지기",
                    "DM: \"Hi [name], I'm building [product] — would you be interested in hunting it?\"",
                    "응답률 10-20%. 안 되면 본인이 launch (가산점 X 지만 가능)",
                  ],
                  links: [{ name: "Top Hunters", url: "https://producthunt.com/leaderboard/hunters" }],
                },
                {
                  step: 2, title: "출시 1주 전: 자산 준비", time: "2-3일",
                  detail: "썸네일 240×240 (upvote 결정 요인), 갤러리 5장, gif/영상, 30초 데모.",
                  todo: [
                    "썸네일: 미드나이트·그라디언트·단순 일러 — GPT Image 2 또는 Figma 로 30분",
                    "갤러리 이미지 5장 (1270×760) — 핵심 기능별",
                    "Demo gif: 30초 핵심 워크플로우 — Loom 으로 녹화 후 ezgif.com 변환",
                    "Maker comment 미리 작성: \"Why I built this\" 1-2 문단",
                    "Tagline (60자), Description (260자) 영문",
                  ],
                  links: [
                    { name: "Loom (영상 녹화)", url: "https://loom.com" },
                    { name: "ezgif (gif 변환)", url: "https://ezgif.com" },
                  ],
                },
                {
                  step: 3, title: "출시 1일 전: 동원 인원 사전 알림", time: "2시간",
                  detail: "친구·팀·고객 50명+ 에게 \"내일 0시 PT 에 PH 론칭 — upvote + 진정성 댓글 부탁\". 가짜 알림 X.",
                  todo: [
                    "본인 네트워크 50-100명 명단 작성",
                    "각자에게 개인 메시지 (대규모 그룹 메시지 X — 알고리즘 검출)",
                    "\"진정성 댓글 (사용 후기·질문) 한 줄\" 부탁",
                    "0시 PT 직후 30분 이내 upvote + 댓글 동시 핵심",
                  ],
                  links: [],
                },
                {
                  step: 4, title: "출시 데이 (화·수 0시 PT — 한국 17시)", time: "24시간",
                  detail: "0시 PT 자동 발행. 첫 8시간이 \"Daily Top\" 결정. 모든 댓글 답변 + Twitter·HN 동시 공유.",
                  todo: [
                    "0:00 PT (한국 17:00) 자동 발행 확인",
                    "본인 첫 댓글: \"Why I built this\" 스토리 작성",
                    "Twitter·LinkedIn·HN 즉시 공유 (예약 X — 라이브 반응 핵심)",
                    "0:30~3:00: 친구 50명+ upvote + 진정성 댓글 (사전 합의)",
                    "8시간 동안 모든 댓글에 24h 내 답변",
                    "Top 5 진입 = 주간 5-10K 방문 + newsletter 자동 픽업",
                  ],
                  links: [],
                },
              ] : []).map((s) => <StepCard key={s.step} {...s} />)}
            </div>
          </Section>

          <Section icon={BookOpen} title={ko ? "Hacker News \"Show HN\" (Top 30 = 100K+)" : "Hacker News Show HN"}>
            <div style={{ padding: "14px 16px" }}>
              {(ko ? [
                {
                  step: 1, title: "HN 계정 + 1주 활동 (karma 50+)", time: "1주",
                  detail: "신규 계정 = 자동 의심 → upvote 안 받음. 사전에 다른 글 upvote·comment 로 활동 쌓기.",
                  todo: [
                    "news.ycombinator.com 가입",
                    "1주 동안 본인 카테고리 Top 글 매일 보기",
                    "본인 의견 있는 글에 진정성 comment 5-10개",
                    "다른 Show HN upvote — karma 50 이상 목표",
                  ],
                  links: [{ name: "HN", url: "https://news.ycombinator.com" }],
                },
                {
                  step: 2, title: "Show HN 가이드라인 정독 + 제목 작성", time: "30분",
                  detail: "\"Show HN: \" 접두사 필수. 자랑·과장 X. 솔직한 한 문장 + 작동 데모.",
                  todo: [
                    "news.ycombinator.com/showhn.html 정독",
                    "제목 = \"Show HN: [핵심 가치 한 문장]\"",
                    "예: \"Show HN: I built a tool that analyzes Korean cafe sales\"",
                    "❌ \"Show HN: AI-powered next-gen revolutionary tool\" (과장 키워드 거부감)",
                    "URL = 본인 사이트 (랜딩 페이지) 또는 GitHub repo",
                  ],
                  links: [{ name: "Show HN 가이드", url: "https://news.ycombinator.com/showhn.html" }],
                },
                {
                  step: 3, title: "화·수 미국 오전 9-11 PT (한국 새벽 1-3시) 게시", time: "8시간 모니터링",
                  detail: "PT 오전 9-11 = HN 사용자 active 시간. 첫 30분 upvote 5-10개 = 알고리즘 push.",
                  todo: [
                    "한국 시간 화·수 새벽 2시경 게시 (PT 오전 10시)",
                    "첫 댓글 (본인) — \"Why I built this\" 스토리 + 기술 스택",
                    "Twitter 에 동시 공유 (HN 댓글 링크)",
                    "8시간 동안 모든 댓글에 답변 (HN 사용자 = 까다롭지만 진정성에 반응)",
                    "Top 30 진입 = 100K+ 방문 + 1주 후에도 SEO 효과 (HN 백링크)",
                  ],
                  links: [],
                },
              ] : []).map((s) => <StepCard key={s.step} {...s} />)}
            </div>
          </Section>

          {/* 흔한 실수 */}
          <Section icon={AlertTriangle} title={ko ? "흔한 실수 — 미리 알아두기" : "Common mistakes"}>
            <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column" as const, gap: "8px" }}>
              {(ko ? [
                "Apple 거절 사유 무시 — 메타 불일치는 1주 더 걸림. 사유 메시지 정독 후 재제출.",
                "Google Play 폐쇄 테스트에 가짜 테스터 (가족) — User Engagement Time 측정 발각 시 카운트 리셋.",
                "PH 헌터 섭외 안 하고 본인이 launch — 알고리즘 가산점 X.",
                "HN 신규 계정으로 즉시 Show HN — karma 0 = 자동 차단 위험.",
                "친구 50명에게 upvote 만 부탁 (댓글 X) — 알고리즘이 가짜 upvote 검출.",
                "한국 시간 새벽 = 미국 활동 시간. 휴식 없이 24h 풀가동 필수.",
                "핫픽스 준비 X — 사용자 가입 후 첫 화면 깨지면 회복 불가.",
                "결제 1회 테스트 안 함 — 처음 100명 결제 실패 = 신뢰 잃음.",
              ] : [
                "Ignoring Apple rejection reasons",
                "Fake testers on Google Play",
                "No PH hunter, self-launch",
                "HN new account auto-banned",
                "Just upvotes no comments",
                "Sleeping during 24h launch",
                "No hotfix prep",
                "Payment not tested",
              ]).map((s, i) => (
                <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start", padding: "10px 12px", borderRadius: "10px", background: "rgba(182,76,76,0.04)", border: "1px solid rgba(182,76,76,0.12)" }}>
                  <XCircle size={14} strokeWidth={2.4} color="#b64c4c" style={{ flexShrink: 0, marginTop: "1px" }} />
                  <span style={{ fontSize: "12.5px", color: "rgba(15,23,42,0.78)", lineHeight: 1.6 }}>{s}</span>
                </div>
              ))}
            </div>
          </Section>
        </>
      )}

      {/* 빌드 방법 가이드 모달 */}
      <BuildMethodDialog taskId={methodDialogTaskId} onClose={() => setMethodDialogTaskId(null)} />

      {/* ── 2026-05-12: 출시 후 첫 30일 플레이북 (런칭 = 시작, 끝 X) ── */}
      <div style={{ marginTop: 18, padding: "20px 22px", borderRadius: 18, background: `linear-gradient(180deg, ${MIDNIGHT}06 0%, rgba(255,255,255,0.96) 100%)`, border: `1px solid ${MIDNIGHT}22` }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: MIDNIGHT, opacity: 0.75, letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: 6 }}>
          ⚡ 출시 후 첫 30일 플레이북 — 가장 중요한 30일
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em", marginBottom: 6 }}>
          {ko ? "런칭은 끝이 아니라 시작 — 첫 30일이 PMF 신호를 결정합니다" : "Launch is the start, not the end — first 30 days decide PMF signal"}
        </div>
        <div style={{ fontSize: 12.5, color: "rgba(15,23,42,0.6)", lineHeight: 1.6, marginBottom: 14 }}>
          {ko
            ? '벤치마크 (2026): **활성화 24h 내 61% 표준** · 자가서비스 TTV 12분 · 영업주도 TTV 2일. 첫 30-60일 "high-touch" 가 전환율을 결정 — 작은 팀의 장점은 모든 prospect 에게 직접 응대 가능한 것.'
            : 'Benchmarks 2026: 61% activate within 24h · self-serve TTV 12 min · sales-led 2 days. First 30-60 days "high-touch" determines conversion — small team advantage is personal attention to every prospect.'}
        </div>

        {/* 주차별 액션 */}
        <div style={{ display: "flex", flexDirection: "column" as const, gap: 10 }}>
          {[
            {
              week: "Week 1",
              focus: "Activation 추적 + 1:1 응대",
              tone: MIDNIGHT,
              actions: [
                "신규 가입자 100% 환영 메일 (24h 내, 본인 손으로 — 자동화 X)",
                "탑 50 supporter 와 founder call 일정 (15분 zoom)",
                "Activation 이벤트 정의 (예: 첫 핵심 워크플로 완료) + PostHog 추적",
                "활성화율 < 50% 면 onboarding 흐름 즉시 수정",
                "PH·HN·트위터 댓글 100% 답변 (48h 내)",
                "에러 대시보드 (Sentry) 매일 아침 + 저녁 확인",
              ],
            },
            {
              week: "Week 2",
              focus: "전환·결제 + 케이스 스터디 시작",
              tone: MIDNIGHT,
              actions: [
                "Free → Paid 트리거 모니터 (Stripe 대시보드 매일)",
                "활성 사용자 5명에 case-study 인터뷰 요청 (블로그·트위터 콘텐츠화)",
                "이탈 사용자 직접 메일 (\"왜 안 쓰셨어요?\" 30%+ 응답률)",
                "Cohort retention 차트 첫 측정 — D1·D7 데이터 첫 신호",
                "프라이싱 페이지 A/B 실험 시작 (Stripe Pricing Tables)",
                "트위터·LinkedIn 출시 후 인사이트 1포스트/일",
              ],
            },
            {
              week: "Week 3",
              focus: "PMF 첫 신호 + 분배 확장",
              tone: MIDNIGHT,
              actions: [
                "Sean Ellis 40% 테스트 — 활성 사용자 30+명에게 survey (pmfsurvey.com)",
                "PMF 임계 미달이면 ICP 좁히기·문제 재정의 (성장보다 제품 개선)",
                "G2·Capterra·AlternativeTo·SaaSHub 등재 (5-10 디렉토리)",
                "Pillar SEO 콘텐츠 1편 출판 (3,000자+, 핵심 키워드 1개)",
                "/llms.txt + Schema.org JSON-LD 셋업 (AI Discovery 최적화)",
                "두 번째 채널 launch (Reddit·관련 sub 또는 디스콰이엇 빌드로그)",
              ],
            },
            {
              week: "Week 4",
              focus: "정량 분석 + 다음 30일 결정",
              tone: MIDNIGHT,
              actions: [
                "30일 메트릭 종합: ARR·MRR·activation%·D30 retention·CAC·churn",
                "벤치마크 비교 (D30 B2B 40%+ / B2C 15%+)",
                "Support ticket·churn 사유 분석 — 반복 패턴 = 다음 PR 우선순위",
                "Pivot 결정 게이트: PMF 신호 약하면 ICP·문제 다시. 강하면 분배 가속.",
                "투자 라운드 시그널 준비 — runway 18+개월이면 grow / 미만이면 raise",
                "Month 2 OKR 1개 + 측정 가능 메트릭 (다음 30일 결정)",
              ],
            },
          ].map((w, i) => (
            <div key={w.week} style={{ padding: "12px 14px", borderRadius: 12, background: "white", border: `1px solid ${MIDNIGHT}1A` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ flexShrink: 0, fontSize: 11.5, fontWeight: 700, padding: "3px 10px", borderRadius: 6, background: w.tone, color: "#fff" }}>
                  {w.week}
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{w.focus}</span>
              </div>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "rgba(15,23,42,0.7)", lineHeight: 1.65 }}>
                {w.actions.map((a, j) => (
                  <li key={j}>{a}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div style={{ fontSize: 11.5, color: "rgba(15,23,42,0.6)", marginTop: 14, lineHeight: 1.55, padding: "10px 12px", borderRadius: 10, background: "rgba(25,25,112,0.04)", border: "1px solid rgba(25,25,112,0.18)" }}>
          💡 <strong>30일 후 분기점</strong>: PMF 신호 (Sean Ellis 40%+ 또는 retention curve 평평) 잡혔으면 → <strong>성장 엔진 단계</strong>로 진입. 신호 없으면 → ICP 재정의 + 문제 재검증 (피벗 결정 3-6개월 안에).
        </div>
      </div>

      <StageWrapup
        ko={ko}
        nextStageLabelKo="성장 엔진"
        doneItemsKo={[
          { label: "1. 도메인·SSL·SEO", detail: "도메인 + SSL 인증서 + sitemap.xml + robots.txt 셋업" },
          { label: "2. 앱 스토어 등록", detail: "App Store Connect + Google Play Console 14일 테스터 12명 정책" },
          { label: "3. PH·HN 출시", detail: "PH 화·수 12am PT + HN Show HN 게시" },
          { label: "4. 모니터링·롤백", detail: "Sentry 에러 + Statuspage + 즉시 롤백 절차 셋업" },
        ]}
        verifyItemsKo={[
          "보안 — 출시 트래픽 폭증 시 DDoS·Rate limit 사전 대비, 다운 시 PR 손상",
          "Apple/Google — 정책 위반(개인정보·결제·콘텐츠) 시 거절, 재심사 1~2주 추가",
          "TestFlight 정책 — 외부 테스트는 Beta App Review 필수, 미준수 시 거절",
          "Google Play — 14일 12명 클로즈드 테스트 의무, 미충족 시 출시 불가",
          "GDPR·개인정보 — 글로벌 출시 시 EU·미국 사용자 데이터 처리 약관 사전 게시",
          "롤백 — 출시 후 결함 발견 시 즉시 롤백 절차, 미준비 시 신뢰 회복 불가",
        ]}
        nextSummaryKo="실제 출시 + 도메인·앱·PH·모니터링 셋업 완료 → 성장 엔진 단계로 진입"
      />
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────────
 * StepCard — 각 단계별 풍부 카드
 * ───────────────────────────────────────────────────────────────── */
function StepCard({
  step,
  title,
  time,
  detail,
  todo,
  links,
}: {
  step: number;
  title: string;
  time: string;
  detail: string;
  todo: string[];
  links: { name: string; url: string }[];
}) {
  return (
    <div style={{ marginBottom: "10px", padding: "14px 16px", borderRadius: "12px", background: "white", border: `1px solid ${MIDNIGHT_BORDER}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px", flexWrap: "wrap" as const }}>
        <div style={{ width: "26px", height: "26px", borderRadius: "50%", background: MIDNIGHT, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700, flexShrink: 0 }}>
          {step}
        </div>
        <div style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a", letterSpacing: "-0.005em", flex: 1, minWidth: 0 }}>{title}</div>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "3px", fontSize: "10.5px", fontWeight: 700, padding: "2px 8px", borderRadius: "5px", background: MIDNIGHT_SOFT, color: MIDNIGHT, whiteSpace: "nowrap" as const }}>
          <Clock size={10} strokeWidth={2.4} />
          {time}
        </span>
      </div>
      <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.68)", lineHeight: 1.6, marginBottom: "10px", paddingLeft: "36px" }}>{detail}</div>
      <ul style={{ margin: 0, marginBottom: "10px", paddingLeft: "52px", fontSize: "12.5px", color: "rgba(15,23,42,0.78)", lineHeight: 1.7 }}>
        {todo.map((t, i) => (
          <li key={i}>{t}</li>
        ))}
      </ul>
      {links.length > 0 && (
        <div style={{ paddingLeft: "36px", display: "flex", gap: "6px", flexWrap: "wrap" as const }}>
          {links.map((l) => (
            <a
              key={l.url}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "5px 10px",
                borderRadius: "8px",
                background: MIDNIGHT_SOFT,
                border: `1px solid ${MIDNIGHT_BORDER}`,
                fontSize: "11.5px",
                fontWeight: 600,
                color: MIDNIGHT,
                textDecoration: "none",
              }}
            >
              {l.name}
              <ExternalLink size={11} strokeWidth={2.2} />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function NoteCard({ title, body, link }: { title: string; body: string; link?: { name: string; url: string } }) {
  return (
    <div style={{ padding: "14px 16px", borderRadius: "12px", background: "white", border: `1px solid ${MIDNIGHT_BORDER}` }}>
      <div style={{ fontSize: "13.5px", fontWeight: 700, color: MIDNIGHT, marginBottom: "5px" }}>{title}</div>
      <div style={{ fontSize: "12.5px", color: "rgba(15,23,42,0.7)", lineHeight: 1.6 }}>{body}</div>
      {link && (
        <a href={link.url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "4px", marginTop: "7px", fontSize: "12px", fontWeight: 600, color: MIDNIGHT, textDecoration: "none" }}>
          {link.name}
          <ExternalLink size={12} strokeWidth={2.2} />
        </a>
      )}
    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px", padding: "0 4px" }}>
        <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: MIDNIGHT_SOFT, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={16} strokeWidth={2.2} color={MIDNIGHT} />
        </div>
        <div style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a", letterSpacing: "-0.01em" }}>{title}</div>
      </div>
      <div style={{ background: "white", borderRadius: "14px", border: `1px solid ${MIDNIGHT_BORDER}`, overflow: "hidden", boxShadow: "0 1px 3px rgba(25,25,112,0.04)" }}>
        {children}
      </div>
    </div>
  );
}
