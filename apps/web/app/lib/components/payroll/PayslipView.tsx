"use client";

/**
 * PayslipView — 임금명세서 (2026-09-12). iOS PayslipSheet 의 웹 미러.
 *
 * 왜: 근로기준법 §48② — 임금을 줄 때마다 명세서를 **교부할 의무**가 있다(2021-11-19 시행).
 *  미교부·허위기재는 500만원 이하 과태료. 필수 기재사항:
 *   · 근로자 특정 정보 · 임금지급일 · 구성항목별 금액
 *   · 출근일수·시간에 따라 달라지는 항목의 **계산방법** (연장·야간·휴일은 **시간 수** 포함)
 *   · 공제 항목별 금액과 총액
 *
 * 계산은 @foundone/shared 의 calculatePayroll 결과를 그대로 그린다.
 * 확정값과 추정값을 화면에서 구분해 보여준다 — 추정을 확정처럼 보이게 하지 않는다.
 */

import { useState } from "react";
import type { PayrollResult, PayItem } from "@foundone/shared";
import { ListSection, ListRow } from "../ui/ListSection";

const won = (v: number) => `${v.toLocaleString("ko-KR")}원`;

function periodLabel(period: string): string {
  const [y, m] = period.split("-");
  return y && m ? `${y}년 ${Number(m)}월` : period;
}

/** 계산방법에 이미 시간이 적혀 있으면 "시간 수"를 또 붙이지 않는다(같은 말 두 번 금지). */
function methodLine(item: PayItem): string | undefined {
  if (!item.method) return undefined;
  if (item.hours == null || item.method.includes("시간")) return item.method;
  return `${item.method} · 시간 수 ${item.hours}시간`;
}

/** 카카오톡·문자로 그대로 보낼 수 있는 텍스트. */
export function payslipPlainText(args: {
  memberName: string; result: PayrollResult; paydayLabel?: string;
}): string {
  const { memberName, result, paydayLabel } = args;
  const lines: string[] = [
    `임금명세서 — ${periodLabel(result.period)}`,
    `성명: ${memberName}`,
  ];
  if (paydayLabel) lines.push(`임금지급일: ${paydayLabel}`);
  lines.push(`통상시급: ${won(result.ordinaryHourlyWage)}`, "", "[지급]");
  for (const e of result.earnings) {
    let l = `· ${e.label} ${won(e.amount)}`;
    if (e.method) l += `\n   ${e.method}`;
    if (e.hours != null) l += ` (시간 수 ${e.hours}시간)`;
    lines.push(l);
  }
  lines.push(`지급 총액 ${won(result.grossPay)}`, "", "[공제]");
  if (result.deductions.length === 0) lines.push("· 없음");
  else for (const d of result.deductions) {
    lines.push(`· ${d.label} ${won(d.amount)}` + (d.method ? `\n   ${d.method}` : ""));
  }
  lines.push(
    `공제 총액 ${won(result.deductionTotal)}`, "",
    `실지급액 ${won(result.netPay)}`, "",
    "※ 소득세·지방소득세는 추정입니다. 확정 금액은 국세청 홈택스 근로소득 간이세액표를 확인하세요.",
  );
  return lines.join("\n");
}

export function PayslipView({
  memberName,
  result,
  paydayLabel,
  /** 사업주 부담은 사장님 화면에만. 직원 화면에서는 숨긴다(명세서 기재사항이 아니다). */
  showEmployerBurden = true,
}: {
  memberName: string;
  result: PayrollResult;
  paydayLabel?: string;
  showEmployerBurden?: boolean;
}) {
  const [burdenOpen, setBurdenOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const violations = result.warnings.filter((w) => w.level === "violation");
  const checks = result.warnings.filter((w) => w.level === "check");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(payslipPlainText({ memberName, result, paydayLabel }));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // 클립보드 권한 거부 — 조용히 무시.
    }
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <ListSection title="지급 대상" actionLabel={copied ? "복사됨" : "복사"} onAction={() => void copy()}>
        <ListRow first label="성명" value={memberName} />
        <ListRow label="귀속 기간" value={periodLabel(result.period)} />
        {paydayLabel ? <ListRow label="임금지급일" value={paydayLabel} /> : null}
        <ListRow label="통상시급" value={won(result.ordinaryHourlyWage)} />
      </ListSection>

      {violations.length > 0 && (
        <ListSection title="바로잡아야 합니다">
          {violations.map((w, i) => (
            <ListRow key={w.message} first={i === 0} label={w.message} subtitle={w.law} />
          ))}
        </ListSection>
      )}

      {checks.length > 0 && (
        <ListSection title="확인할 것">
          {checks.map((w, i) => (
            <ListRow key={w.message} first={i === 0} label={w.message} subtitle={w.law} />
          ))}
        </ListSection>
      )}

      <ListSection title="지급">
        {result.earnings.map((e, i) => (
          <ListRow key={e.label} first={i === 0} label={e.label} value={won(e.amount)} subtitle={methodLine(e)} />
        ))}
        <ListRow label="지급 총액" value={won(result.grossPay)} />
      </ListSection>

      <ListSection title="공제" footer={result.deductions.length === 0 ? "공제 항목이 없습니다." : undefined}>
        {result.deductions.map((d, i) => (
          <ListRow key={d.label} first={i === 0} label={d.label} value={won(d.amount)} subtitle={d.method} />
        ))}
        <ListRow first={result.deductions.length === 0} label="공제 총액" value={won(result.deductionTotal)} />
      </ListSection>

      <ListSection
        title="실지급액"
        footer="이 금액을 직원에게 지급하고, 이 명세서를 함께 주세요(근로기준법 §48②)."
      >
        <ListRow first label="실지급액" value={won(result.netPay)} />
      </ListSection>

      {showEmployerBurden && (
        <ListSection
          title="사업주 부담"
          actionLabel={burdenOpen ? "접기" : "펼치기"}
          onAction={() => setBurdenOpen((v) => !v)}
          footer="명세서에는 들어가지 않습니다. 급여와 별도로 나가는 돈입니다."
        >
          {burdenOpen && result.employerBurden.map((b, i) => (
            <ListRow key={b.label} first={i === 0} label={b.label} value={won(b.amount)} subtitle={b.method} />
          ))}
          <ListRow first={!burdenOpen} label="사업주 부담 합계" value={won(result.employerBurdenTotal)} />
          <ListRow label="이 직원 월 총비용" value={won(result.totalEmployerCost)} />
          {result.severanceReserve > 0 && (
            <ListRow label="퇴직급여 월 적립 권장" value={won(result.severanceReserve)} />
          )}
        </ListSection>
      )}

      <ListSection
        title="이 숫자의 근거"
        footer="소득세는 국세청 홈택스의 근로소득 간이세액표가 법적 기준입니다. 확정 금액은 홈택스에서 조회해 주세요."
      >
        <ListRow
          first
          label="법정 계산식 그대로"
          value={`${result.confidence.exact.length}개 항목`}
          subtitle={result.confidence.exact.join(" · ")}
        />
        {result.confidence.estimated.map((e) => (
          <ListRow key={e.item} label={`추정 — ${e.item}`} subtitle={e.why} />
        ))}
      </ListSection>
    </div>
  );
}
