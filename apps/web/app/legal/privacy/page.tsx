"use client";

import { useRouter } from "next/navigation";

export default function PrivacyPage() {
  const router = useRouter();
  return (
    <div style={{
      minHeight: "100vh",
      background: "#f5f5f7",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif",
      color: "#1d1d1f",
    }}>
      {/* 상단 네비 */}
      <div style={{
        position: "sticky", top: 0, zIndex: 10,
        background: "rgba(245,245,247,0.85)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(0,0,0,0.06)",
        padding: "14px 24px",
        display: "flex", alignItems: "center", gap: "12px",
      }}>
        <button
          type="button"
          onClick={() => router.back()}
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: "#0066cc", fontSize: "15px", fontWeight: 500, padding: 0,
          }}
        >
          ← 뒤로
        </button>
        <span style={{ fontSize: "15px", fontWeight: 600, color: "#1d1d1f" }}>개인정보처리방침</span>
      </div>

      <div style={{ maxWidth: "760px", margin: "0 auto", padding: "48px 24px 80px" }}>
        <h1 style={{ fontSize: "32px", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: "8px" }}>
          개인정보처리방침
        </h1>
        <p style={{ fontSize: "14px", color: "#6e6e73", marginBottom: "48px" }}>
          최종 업데이트: 2026년 5월 26일 · 시행일: 2026년 5월 26일
        </p>

        <Section title="1. 개인정보처리자 정보">
          <p>Found.One (이하 "회사" 또는 "서비스")는 창업자 및 소상공인을 위한 경영 지원 서비스를 제공하며, 개인정보보호법에 따라 이용자의 개인정보를 보호하고 관련 고충을 신속하게 처리합니다.</p>
          <Table rows={[
            ["서비스명", "Found.One"],
            ["운영 책임자", "이영준"],
            ["개인정보 보호 책임자", "이영준 (lki720412@gmail.com)"],
            ["서비스 URL", "https://foundone.dev"],
          ]} />
        </Section>

        <Section title="2. 수집하는 개인정보 항목">
          <p>회사는 서비스 제공을 위해 아래 정보를 수집합니다.</p>
          <Table rows={[
            ["수집 항목", "수집 목적", "보유 기간"],
            ["이메일 주소, 비밀번호(해시), 이름, 출생연도", "회원가입·로그인 인증 및 본인 식별(만 14세 이상 확인)", "회원 탈퇴 시 즉시 삭제"],
            ["상호명, 업종, 창업일, 사업자등록번호(선택)", "맞춤형 경영 분석 제공", "서비스 이용 기간"],
            ["매출·비용·직원 입력 데이터", "대시보드 분석 및 AI 진단", "서비스 이용 기간"],
            ["서비스 이용 기록 (접속 IP, 접속 시간)", "보안 사고 탐지 및 법적 의무", "1년"],
            ["결제 정보 (주문번호, 결제 상태 — 카드번호 미수집)", "구독 서비스 처리", "5년 (전자상거래법)"],
          ]} isHeader />
        </Section>

        <Section title="3. 개인정보 수집 및 이용 목적">
          <ul>
            <li>회원가입 및 본인 식별</li>
            <li>개인 맞춤형 경영 대시보드 및 AI 분석 제공</li>
            <li>창업 지원사업 매칭 및 정보 알림</li>
            <li>서비스 장애 대응 및 보안 사고 처리</li>
            <li>서비스 운영·개선 및 고객 지원 (권한이 부여된 내부 관리자에 한해 최소한으로 접근하며, 이메일 등은 마스킹 처리)</li>
            <li>법령상 의무 이행 (전자상거래법, 국세기본법 등)</li>
          </ul>
        </Section>

        <Section title="4. 개인정보 제3자 제공">
          <p>회사는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다. 다만 아래의 경우는 예외입니다.</p>
          <ul>
            <li>이용자가 사전에 동의한 경우</li>
            <li>법령의 규정에 의거하거나, 수사기관의 요청이 있는 경우</li>
          </ul>
        </Section>

        <Section title="5. 개인정보 처리 위탁">
          <Table rows={[
            ["수탁사", "위탁 업무", "보유 기간"],
            ["Supabase Inc.", "데이터베이스 저장 및 인증", "서비스 이용 기간"],
            ["Vercel Inc.", "웹 서버 호스팅 및 CDN", "서비스 이용 기간"],
            ["Anthropic PBC / OpenAI LLC", "AI 분석 처리 (식별정보 없이 사업 지표만 전달)", "처리 후 미보관"],
            ["PortOne (KG이니시스)", "결제 처리", "5년 (전자상거래법)"],
            ["Upstash Inc.", "API 요청 제한 처리 (키만 저장)", "24시간"],
            ["Functional Software, Inc. (Sentry)", "오류 모니터링 (에러 로그)", "90일"],
          ]} isHeader />
        </Section>

        <Section title="6. 개인정보의 국외 이전">
          <p>회사는 아래와 같이 개인정보를 국외로 이전합니다. 이용자는 본 이전에 대해 동의를 거부할 권리가 있으나, 거부 시 해당 기능(클라우드 저장·AI 분석 등) 이용이 제한될 수 있습니다.</p>
          <Table rows={[
            ["이전받는 자", "이전 국가", "이전 항목", "이전 목적 · 보유기간"],
            ["Supabase Inc. / Vercel Inc.", "미국", "이메일·이름·사업 데이터", "DB 저장·호스팅 / 서비스 이용 기간"],
            ["Anthropic PBC / OpenAI LLC", "미국", "사업 지표(매출·비용 등, 식별정보 제외)", "AI 분석 / 처리 후 미보관"],
            ["Upstash Inc. / Sentry", "미국", "요청 키·에러 로그", "요청 제한·오류 모니터링 / 24시간~90일"],
          ]} isHeader />
          <p style={{ marginTop: 8, fontSize: 13, opacity: 0.85 }}>
            ※ 이전 일시·방법: 서비스 이용 시점에 정보통신망(HTTPS 암호화 전송)을 통해 수시 이전됩니다.
            수탁자 연락처 등 세부사항은 개인정보 보호책임자(lki720412@gmail.com)에게 요청하실 수 있습니다.
          </p>
        </Section>

        <Section title="7. 개인정보 보유 및 이용 기간">
          <p>수집 목적이 달성된 후에는 즉시 파기합니다. 단, 관련 법령에 따라 다음 정보는 일정 기간 보존합니다.</p>
          <ul>
            <li>계약 또는 청약 철회 기록: 5년 (전자상거래법)</li>
            <li>대금 결제 및 재화 공급 기록: 5년 (전자상거래법)</li>
            <li>소비자 불만 또는 분쟁 처리 기록: 3년 (전자상거래법)</li>
            <li>서비스 접속 기록: 1년 (통신비밀보호법)</li>
          </ul>
        </Section>

        <Section title="8. 개인정보의 파기 절차 및 방법">
          <p>개인정보는 보유 기간 경과 후 지체 없이 파기합니다. 전자적 파일은 복구 불가능한 방법으로 영구 삭제하며, 종이에 출력된 정보는 분쇄기로 파기합니다.</p>
        </Section>

        <Section title="9. 이용자의 권리와 행사 방법">
          <p>이용자는 언제든지 아래의 권리를 행사할 수 있습니다.</p>
          <ul>
            <li>개인정보 열람 요청</li>
            <li>개인정보 정정·삭제 요청</li>
            <li>개인정보 처리 정지 요청</li>
            <li>회원 탈퇴 (서비스 내 "계정 삭제" 기능 또는 이메일 요청)</li>
          </ul>
          <p>권리 행사는 <strong>lki720412@gmail.com</strong>으로 이메일 요청하시면 지체 없이 처리합니다.</p>
        </Section>

        <Section title="10. 쿠키 및 유사 기술 사용">
          <p>회사는 로그인 세션 유지를 위해 필수 쿠키를 사용합니다. 광고·추적 목적의 제3자 쿠키는 사용하지 않습니다. 브라우저 설정에서 쿠키를 거부할 수 있으나, 일부 서비스 기능이 제한될 수 있습니다.</p>
        </Section>

        <Section title="11. 개인정보 보호 책임자">
          <Table rows={[
            ["이름", "이영준"],
            ["이메일", "lki720412@gmail.com"],
            ["민원 처리", "접수 후 10영업일 이내 처리"],
          ]} />
          <p style={{ marginTop: "16px" }}>
            개인정보 침해 신고는 개인정보보호위원회(privacy.go.kr) 또는 한국인터넷진흥원 개인정보침해신고센터(118)에 문의하실 수 있습니다.
          </p>
        </Section>

        <Section title="12. 만 14세 미만 아동의 개인정보">
          <p>회사는 만 14세 미만 아동의 개인정보를 수집하지 않습니다. 회원가입 시 출생연도로 만 14세 이상 여부를 확인하며, 만 14세 미만으로 확인되는 경우 가입이 제한됩니다. 만 14세 미만 아동의 개인정보가 수집된 사실이 확인되면 지체 없이 파기합니다.</p>
        </Section>

        <Section title="13. 개정 이력">
          <p>본 방침은 2026년 5월 26일에 최초 제정되었습니다. 방침 변경 시 서비스 내 공지를 통해 사전 안내합니다.</p>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: "40px" }}>
      <h2 style={{
        fontSize: "18px", fontWeight: 700, letterSpacing: "-0.01em",
        color: "#1d1d1f", marginBottom: "14px", paddingBottom: "10px",
        borderBottom: "1px solid rgba(0,0,0,0.08)",
      }}>
        {title}
      </h2>
      <div style={{ fontSize: "15px", lineHeight: 1.7, color: "#1d1d1f" }}>
        {children}
      </div>
    </section>
  );
}

function Table({ rows, isHeader }: { rows: string[][]; isHeader?: boolean }) {
  return (
    <div style={{ overflowX: "auto", marginTop: "12px" }}>
      <table style={{
        width: "100%", borderCollapse: "collapse",
        fontSize: "14px", lineHeight: 1.5,
      }}>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  style={{
                    padding: "10px 14px",
                    fontWeight: isHeader && ri === 0 ? 600 : (ci === 0 ? 500 : 400),
                    background: isHeader && ri === 0 ? "rgba(0,0,0,0.03)" : "transparent",
                    color: ci === 0 ? "#1d1d1f" : "#3d3d3f",
                    verticalAlign: "top",
                    minWidth: ci === 0 ? "140px" : undefined,
                  }}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
