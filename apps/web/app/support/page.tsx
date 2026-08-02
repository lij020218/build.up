/**
 * /support — 고객 지원 페이지.
 *
 * 왜 필요한가: App Store Connect 는 앱 정보에 **Support URL 을 필수**로 요구한다.
 *   mailto: 링크는 URL 로 받아주지 않고, 링크가 죽어 있으면 심사에서 거절된다
 *   (Guideline 1.5 — Support URL 은 실제로 동작해야 한다).
 *
 * 연락처는 businessInfo SSOT 를 그대로 쓴다 — 푸터와 다른 이메일을 적으면
 * 사장님이 두 곳을 관리하게 되고, 한쪽은 반드시 낡는다.
 */
import Link from "next/link";
import { BUSINESS_INFO } from "../lib/businessInfo";

export const metadata = {
  title: "고객 지원 | Found.One",
  description: "Found.One 문의·계정 삭제·오류 신고 안내",
};

const FAQ: Array<{ q: string; a: React.ReactNode }> = [
  {
    q: "계정을 삭제하고 싶어요",
    a: (
      <>
        앱과 웹 모두 <strong>내 정보 ▸ 계정 삭제</strong>에서 직접 삭제할 수 있습니다. 삭제하면 가게
        데이터·로드맵 진행·AI 코칭 기록이 함께 지워지며 되돌릴 수 없습니다. 직원 근로기록은 법정
        보존 의무(근로기준법 제42조)가 있어 화면에서만 사라지고 보존 기간 동안 남습니다.
      </>
    ),
  },
  {
    q: "비밀번호를 잊었어요",
    a: <>로그인 화면의 「비밀번호를 잊으셨나요?」를 눌러 가입 이메일로 재설정 링크를 받으세요.</>,
  },
  {
    q: "숫자가 실제와 다릅니다",
    a: (
      <>
        Found.One 의 세금·급여·손익 수치는 <strong>참고용 예상치</strong>입니다. 최종 확정은 홈택스·
        4대보험 포털·세무 대리인의 계산을 따릅니다. 차이가 크다면 아래로 화면 캡처와 함께 알려주세요.
      </>
    ),
  },
  {
    q: "직원이 초대를 못 받았어요",
    a: <>직원 ▸ 팀 관리에서 초대 링크를 다시 만들어 전달하거나, 6자리 참여 코드를 알려주세요.</>,
  },
];

export default function SupportPage() {
  const { email, serviceName, representative } = BUSINESS_INFO;
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "56px 20px 80px", lineHeight: 1.75 }}>
      <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 10 }}>고객 지원</h1>
      <p style={{ color: "#475569", marginBottom: 36 }}>
        {serviceName} 사용 중 막히는 부분이 있으면 언제든 알려주세요. 평일 기준 1~2일 안에 답장드립니다.
      </p>

      <section
        style={{
          border: "1px solid rgba(29,53,87,0.12)",
          borderRadius: 14,
          padding: "20px 22px",
          marginBottom: 36,
          background: "rgba(29,53,87,0.03)",
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 700, color: "#1d3557", marginBottom: 6 }}>문의 이메일</div>
        <a href={`mailto:${email}`} style={{ fontSize: 18, fontWeight: 700, color: "#191970" }}>
          {email}
        </a>
        <div style={{ fontSize: 13, color: "#64748b", marginTop: 10 }}>
          오류 신고는 <strong>어떤 화면에서 · 무엇을 눌렀을 때 · 무엇이 보였는지</strong> 세 가지와 화면
          캡처를 같이 보내주시면 훨씬 빨리 해결됩니다.
        </div>
      </section>

      <h2 style={{ fontSize: 19, fontWeight: 700, marginBottom: 16 }}>자주 묻는 질문</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 20, marginBottom: 40 }}>
        {FAQ.map((f) => (
          <div key={f.q}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>{f.q}</div>
            <div style={{ color: "#475569", fontSize: 15 }}>{f.a}</div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 13.5, color: "#64748b", borderTop: "1px solid rgba(29,53,87,0.1)", paddingTop: 20 }}>
        운영: {representative} ·{" "}
        <Link href="/legal/terms" style={{ color: "#475569", fontWeight: 600 }}>
          이용약관
        </Link>{" "}
        ·{" "}
        <Link href="/legal/privacy" style={{ color: "#475569", fontWeight: 600 }}>
          개인정보처리방침
        </Link>
      </div>
    </main>
  );
}
