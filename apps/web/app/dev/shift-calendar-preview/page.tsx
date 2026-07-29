"use client";

/**
 * /dev/shift-calendar-preview — 사장 근무 캘린더 디자인·로직 검증 전용 (dev 빌드에서만).
 *   로그인·직원 데이터 없이 그리드/명단 표시를 밟아보기 위한 페이지.
 *   ownerId=null 이라 서버 조회는 건너뛰고, 주입한 규칙만으로 렌더된다. prod 에서는 404.
 */
import { notFound } from "next/navigation";
import { OwnerScheduleCalendar } from "../../lib/components/team/OwnerScheduleCalendar";

const MEMBERS = [
  { member_user_id: "m1", name: "김서연" },
  { member_user_id: "m2", name: "박준호" },
  { member_user_id: "m3", name: "이가을" },
];

// 김서연 월·수·금 / 박준호 화·목·토 / 이가을 금·토 (비활성 규칙 1건 — 표시되면 안 됨)
const RULES = [
  { member_user_id: "m1", weekday: 1, start_time: "09:00", end_time: "18:00", active: true },
  { member_user_id: "m1", weekday: 3, start_time: "09:00", end_time: "18:00", active: true },
  { member_user_id: "m1", weekday: 5, start_time: "09:00", end_time: "18:00", active: true },
  { member_user_id: "m2", weekday: 2, start_time: "13:00", end_time: "22:00", active: true },
  { member_user_id: "m2", weekday: 4, start_time: "13:00", end_time: "22:00", active: true },
  { member_user_id: "m2", weekday: 6, start_time: "13:00", end_time: "22:00", active: true },
  { member_user_id: "m3", weekday: 5, start_time: "17:00", end_time: "23:00", active: true },
  { member_user_id: "m3", weekday: 6, start_time: "17:00", end_time: "23:00", active: true },
  { member_user_id: "m3", weekday: 0, start_time: "10:00", end_time: "16:00", active: false }, // 비활성 — 일요일 표시 금지
];

export default function ShiftCalendarPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <div style={{ minHeight: "100vh", padding: "40px 20px", display: "flex", justifyContent: "center" }}>
      <div style={{
        width: "100%", maxWidth: 420, padding: 20, borderRadius: 20,
        background: "rgba(255,255,255,0.9)", border: "1px solid rgba(25,25,112,0.10)",
        boxShadow: "0 1px 0 rgba(255,255,255,0.6) inset, 0 8px 32px rgba(25,25,112,0.06)",
        alignSelf: "flex-start",
      }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", marginBottom: 12 }}>근무 캘린더 (미리보기)</div>
        <OwnerScheduleCalendar
          ko
          ownerId={null}
          members={MEMBERS}
          rules={RULES}
          previewLeaves={[
            // 승인 연차(김서연 7/13) vs 승인 대기(박준호 7/14) — 구분 표시 검증용
            { member_user_id: "m1", start_date: "2026-07-13", end_date: "2026-07-13", status: "approved" },
            { member_user_id: "m2", start_date: "2026-07-14", end_date: "2026-07-14", status: "pending" },
          ]}
        />
      </div>
    </div>
  );
}
