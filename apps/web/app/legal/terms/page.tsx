"use client";

import { useRouter } from "next/navigation";

export default function TermsPage() {
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
        <span style={{ fontSize: "15px", fontWeight: 600, color: "#1d1d1f" }}>서비스 이용약관</span>
      </div>

      <div style={{ maxWidth: "760px", margin: "0 auto", padding: "48px 24px 80px" }}>
        <h1 style={{ fontSize: "32px", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: "8px" }}>
          서비스 이용약관
        </h1>
        <p style={{ fontSize: "14px", color: "#6e6e73", marginBottom: "48px" }}>
          최종 업데이트: 2026년 5월 26일 · 시행일: 2026년 5월 26일
        </p>

        <Section title="제1조 (목적)">
          <p>본 약관은 build.up(이하 "회사")이 제공하는 경영 지원 서비스(이하 "서비스")의 이용 조건 및 절차, 이용자와 회사 간의 권리·의무 및 책임 사항을 규정함을 목적으로 합니다.</p>
        </Section>

        <Section title="제2조 (용어의 정의)">
          <ul>
            <li><strong>서비스</strong>: 회사가 제공하는 창업·경영 분석, AI 진단, 지원사업 매칭 등 일체의 웹 및 모바일 서비스</li>
            <li><strong>이용자</strong>: 본 약관에 동의하고 서비스를 이용하는 개인 또는 사업체</li>
            <li><strong>계정</strong>: 이용자가 서비스에 가입하여 부여받은 이메일 기반 식별 정보</li>
          </ul>
        </Section>

        <Section title="제3조 (약관의 효력 및 변경)">
          <p>본 약관은 서비스 화면에 게시함으로써 효력이 발생합니다. 회사는 합리적인 사유가 있는 경우 관련 법령을 위배하지 않는 범위에서 약관을 변경할 수 있으며, 변경 시 최소 7일 전 서비스 내 공지합니다. 변경된 약관에 동의하지 않으면 서비스 이용을 중단하고 탈퇴할 수 있습니다.</p>
        </Section>

        <Section title="제4조 (서비스 이용 계약의 성립)">
          <p>이용 계약은 이용자가 회원가입 시 본 약관에 동의하고, 회사가 이를 승낙함으로써 성립합니다. 만 14세 미만인 경우 서비스를 이용할 수 없습니다.</p>
        </Section>

        <Section title="제5조 (서비스 제공 내용)">
          <ul>
            <li>창업 단계별 로드맵 및 체크리스트</li>
            <li>매출·비용·손익 대시보드</li>
            <li>AI 기반 경영 진단 및 질의응답</li>
            <li>정부 지원사업 매칭 및 자금 조달 가이드</li>
            <li>세무·노무·법률 정보 안내 (법적 자문 아님)</li>
          </ul>
        </Section>

        <Section title="제6조 (서비스 이용 제한)">
          <p>이용자는 다음 행위를 해서는 안 됩니다.</p>
          <ul>
            <li>타인의 계정 도용 또는 허위 정보 제공</li>
            <li>서비스의 자동화된 수집·크롤링·역공학</li>
            <li>회사의 지식재산권 침해</li>
            <li>서비스를 이용한 불법 영업 행위</li>
            <li>기타 관련 법령 위반</li>
          </ul>
          <p>위반 시 회사는 사전 통지 없이 서비스 이용을 제한하거나 계정을 해지할 수 있습니다.</p>
        </Section>

        <Section title="제7조 (AI 서비스 이용 안내)">
          <p>서비스 내 AI 기능은 Anthropic Claude 및 OpenAI GPT 모델을 활용하며, 다음 사항에 유의하여 이용해 주세요.</p>
          <ul>
            <li>AI의 답변은 참고 정보이며, 법적·세무·노무 자문을 대체하지 않습니다.</li>
            <li>중요한 사업 결정에는 전문가 확인을 권장합니다.</li>
            <li>AI 처리를 위해 입력 내용이 익명화된 형태로 외부 API에 전달될 수 있습니다.</li>
          </ul>
        </Section>

        <Section title="제8조 (유료 서비스 및 환불)">
          <ul>
            <li>유료 서비스 이용 요금은 서비스 내 공지된 가격 정책에 따릅니다.</li>
            <li>구독 서비스는 결제일로부터 해당 기간 동안 제공됩니다.</li>
            <li>디지털 콘텐츠 특성상, 서비스 이용이 시작된 이후에는 전자상거래법 제17조에 따라 청약 철회가 제한될 수 있습니다.</li>
            <li>서비스 장애로 인한 이용 불가 시 해당 기간에 상응하는 환불 또는 이용 연장을 제공합니다.</li>
          </ul>
        </Section>

        <Section title="제9조 (지식재산권)">
          <p>서비스 내 콘텐츠(UI, 텍스트, 알고리즘, 데이터 구조 등)의 지식재산권은 회사에 귀속됩니다. 이용자가 서비스에 입력한 데이터의 소유권은 이용자에게 있으며, 회사는 서비스 제공 목적 범위 내에서만 해당 데이터를 활용합니다.</p>
        </Section>

        <Section title="제10조 (면책 조항)">
          <ul>
            <li>천재지변, 전쟁, 인터넷 장애 등 불가항력에 의한 서비스 중단에 대해 책임을 지지 않습니다.</li>
            <li>이용자의 귀책으로 발생한 서비스 이용 장애에 대해 책임을 지지 않습니다.</li>
            <li>서비스가 제공하는 경영·세무·법률 정보는 참고용이며, 이를 근거로 한 사업 결정의 결과에 대해 책임을 지지 않습니다.</li>
          </ul>
        </Section>

        <Section title="제11조 (분쟁 해결)">
          <p>본 약관에 관한 분쟁은 대한민국 법률을 준거법으로 하며, 분쟁 발생 시 서울중앙지방법원을 제1심 관할 법원으로 합니다.</p>
        </Section>

        <Section title="제12조 (문의)">
          <p>서비스 이용 관련 문의: <strong>lki720412@gmail.com</strong></p>
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
