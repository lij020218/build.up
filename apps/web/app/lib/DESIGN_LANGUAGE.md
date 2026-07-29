# Found.One 웹 디자인 언어 (실측 SSOT — 2026-07-28)

새 화면을 만들 때 이 규격과 다르면 "우리 서비스 같지 않다"가 된다.
아래 값은 감이 아니라 실제 화면(surface 헤더·대시보드 카드·styles.ts·globals.css)에서 추출한 것.

## 1. 캔버스·색

| 토큰 | 값 | 출처 |
|---|---|---|
| 배경 | `--bg: #f7f6f3` (웜 아이보리) + 라벤더 미스트 그라디언트 | globals.css |
| 본문 | `--text: #111111` / 제목은 `#0f172a` | globals.css·surface h1 |
| 보조 | `--muted: #5b616e` | globals.css |
| 액센트 | `--primary: #1d3557` (네이비) · 포인트 `#191970` (딥 미드나잇) | globals.css·styles.ts |
| 금지 | 신호등 컬러 남용 (위험 표시만 절제된 `#b64c4c`) | 디자인 원칙 |

## 2. 서피스 헤더 공통 패턴 (마케팅·세금·재무·오퍼링 4-surface 공통)

```
eyebrow: 11px / 700 / #191970 / opacity .65 / letterSpacing 0.12em / UPPERCASE (영문)
h1:      26px / 750 / letterSpacing -0.025em / #0f172a   ← 고정 26px. clamp·vw 스케일 금지
sub:     13.5~14px / --muted
```

## 3. 카드 셸 (대시보드·서피스 공통)

```
background:   rgba(255,255,255,0.9) 또는 라벤더 미묘 그라디언트(#F7F8FE→#E5E8F7)
border:       1px solid rgba(25,25,112,0.10)  ← 네이비 틴트. 순수 검정 보더 지양
borderRadius: 20~24
boxShadow:    0 1px 0 rgba(255,255,255,0.6) inset, 0 8px 32px rgba(25,25,112,0.06)
```
- 글래스모피즘(backdropFilter)은 **게이트 화면(auth 모달) 전용** — 앱 내부 카드에 쓰지 않는다.

## 4. 마이크로 레이블 (카드 안 소제목)

```
10~11px / 650~700 / UPPERCASE / letterSpacing 0.06~0.14em / muted 또는 #191970+opacity
```

## 5. 버튼·칩

```
primary 버튼: linear-gradient(180deg, #1d2b7a 0%, #0d0d4d 100%) / radius 14 /
              glow 0 6px 18px rgba(25,25,112,0.28) + inset 하이라이트  (styles.primaryButton — 항상 재사용)
칩(미선택):   rgba(0,0,0,0.04) bg / --muted
칩(선택):     rgba(29,53,87,0.07) bg + 1.5px rgba(29,53,87,0.3) border / --primary / 600
```

## 6. 원칙 (기존 메모리와 연결)

- Apple-미니멀: 여백·타이포 위계 중심, 장식 최소
- 밀도: 홈 첫 화면 = 카드 여러 장 동시 (히어로 독점 금지)
- pill·칩은 자연 폭 flow — 균등폭 그리드 금지 (줄꺾임)
- 강조는 화면당 하나 (예: 진단 화면의 네이비 카드 1장)
