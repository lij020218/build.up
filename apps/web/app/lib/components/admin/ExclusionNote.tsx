"use client";

/**
 * 내부 계정 제외 고지 (2026-08-03).
 *  통계에서 계정을 빼면서 말하지 않으면, 나중에 숫자가 안 맞을 때 "왜 적지?" 가 남는다.
 *  세 화면(개요·활동·사용량)이 같은 문구로 같은 사실을 말하게 하는 단일 컴포넌트.
 */
import { useState } from "react";
import { MUTED } from "./ui";

export function ExclusionNote({ count, rules }: { count?: number; rules?: string[] }) {
  const [open, setOpen] = useState(false);
  if (!count || count <= 0) return null;
  return (
    <div style={{ fontSize: 11.5, color: MUTED, lineHeight: 1.65 }}>
      내부 계정 <strong>{count}개</strong>는 아래 모든 집계에서 제외했습니다 — 운영자·사장님 본인·직원·테스트
      계정의 사용이 실사용자 통계를 부풀리지 않도록.
      {rules && rules.length > 0 && (
        <>
          {" "}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            style={{ background: "none", border: "none", padding: 0, color: MUTED, textDecoration: "underline", cursor: "pointer", font: "inherit" }}
          >
            {open ? "기준 접기" : "제외 기준 보기"}
          </button>
          {open && (
            <ul style={{ margin: "6px 0 0", paddingLeft: 16 }}>
              {rules.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
