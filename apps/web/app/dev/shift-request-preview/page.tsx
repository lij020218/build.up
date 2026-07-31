"use client";

/**
 * /dev/shift-request-preview — 희망 근무 신청 캘린더 검증 전용 (dev 빌드에서만).
 *   로그인·DB 없이 직원 모드/사장 모드를 나란히 밟아본다. ownerId=null 이라 서버 조회는
 *   건너뛰고 주입한 희망만으로 렌더된다. prod 에서는 404.
 *
 *   기준일을 2026-05-20 으로 고정 → "6월분 신청 중, 마감 5/31, D-11" 상태를 본다
 *   (사장님이 지적한 바로 그 경계).
 */
import { notFound } from "next/navigation";
import { ShiftAvailabilityCalendar } from "../../lib/components/team/ShiftAvailabilityCalendar";

const TODAY = new Date(2026, 4, 20); // 2026-05-20

// 6월 희망 — 교대가 이어지는 날(6/1), 공백 있는 날(6/2), 야간(6/6), 시간 무관(6/3)
const ROWS = [
  { member_user_id: "me", name: "나", work_date: "2026-06-01", start_time: "12:00", end_time: "15:00", note: null, mine: true },
  { member_user_id: "m2", name: "박준호", work_date: "2026-06-01", start_time: "15:00", end_time: "20:00", note: null },
  { member_user_id: "m3", name: "이가을", work_date: "2026-06-01", start_time: "09:00", end_time: "12:00", note: null },

  { member_user_id: "m2", name: "박준호", work_date: "2026-06-02", start_time: "09:00", end_time: "13:00", note: null },
  { member_user_id: "m3", name: "이가을", work_date: "2026-06-02", start_time: "18:00", end_time: "22:00", note: null },

  { member_user_id: "me", name: "나", work_date: "2026-06-03", start_time: null, end_time: null, note: null, mine: true },
  { member_user_id: "m2", name: "박준호", work_date: "2026-06-03", start_time: "13:00", end_time: "18:00", note: null },

  { member_user_id: "me", name: "나", work_date: "2026-06-06", start_time: "22:00", end_time: "02:00", note: null, mine: true },

  { member_user_id: "m3", name: "이가을", work_date: "2026-06-12", start_time: "13:00", end_time: "18:00", note: null },
  { member_user_id: "m2", name: "박준호", work_date: "2026-06-12", start_time: "18:00", end_time: "22:00", note: null },
  { member_user_id: "me", name: "나", work_date: "2026-06-19", start_time: "09:00", end_time: "13:00", note: null, mine: true },
];

// 박준호는 아직 미제출 — 사장 화면의 "대기" 표시 검증
const SUBS = [
  { member_user_id: "me", name: "나", submitted_at: null, day_count: 4, mine: true },
  { member_user_id: "m2", name: "박준호", submitted_at: null, day_count: 4 },
  { member_user_id: "m3", name: "이가을", submitted_at: "2026-05-18T02:00:00Z", day_count: 3 },
];

// 사장이 정한 시간대 — 카페 실제 교대(오픈/미들/마감)로 예시
const SLOTS = [
  { label: "오픈", start: "07:00", end: "12:00" },
  { label: "미들", start: "12:00", end: "17:00" },
  { label: "마감", start: "17:00", end: "22:00" },
];

const card: React.CSSProperties = {
  width: "100%", maxWidth: 420, padding: 20, borderRadius: 20,
  background: "rgba(255,255,255,0.9)", border: "1px solid rgba(25,25,112,0.10)",
  boxShadow: "0 1px 0 rgba(255,255,255,0.6) inset, 0 8px 32px rgba(25,25,112,0.06)",
  alignSelf: "flex-start",
};

export default function ShiftRequestPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <div style={{ minHeight: "100vh", padding: "40px 20px", display: "flex", gap: 24, justifyContent: "center", flexWrap: "wrap" }}>
      <div style={card}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#191970", letterSpacing: "0.12em", marginBottom: 6 }}>직원 화면</div>
        <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", marginBottom: 12 }}>근무 희망 신청</div>
        <ShiftAvailabilityCalendar
          ko mode="staff" ownerId={null} myUserId="me"
          previewRows={ROWS} previewSubs={SUBS} previewSlots={SLOTS} previewToday={TODAY}
        />
      </div>

      <div style={card}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#191970", letterSpacing: "0.12em", marginBottom: 6 }}>사장 화면</div>
        <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", marginBottom: 12 }}>희망 근무 취합</div>
        <ShiftAvailabilityCalendar
          ko mode="owner" ownerId={null} myUserId={null}
          previewRows={ROWS} previewSubs={SUBS} previewSlots={SLOTS} previewToday={TODAY}
        />
      </div>
    </div>
  );
}
