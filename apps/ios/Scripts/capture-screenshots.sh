#!/bin/bash
#
# capture-screenshots.sh — App Store 제출용 스크린샷 자동 촬영.
#
#   cd apps/ios && ./Scripts/capture-screenshots.sh
#
# App Store Connect 는 2026 년 기준 **6.9인치 iPhone 한 세트만** 있으면 되고,
# 나머지 기기 크기는 Apple 이 자동으로 축소해 보여준다.
#   · 기기: iPhone 17 Pro Max (6.9") → 1320 × 2868 px, 세로
#   · 형식: sRGB PNG, 투명도 없음 (simctl 산출물이 이 조건을 만족)
#   · 개수: 최소 1장, 최대 10장 (3~5장 권장 — 첫 2장이 검색 결과에 노출)
#
# ⚠️ 데모 시나리오로 촬영한다 (BU_DEMO_* 는 Debug 빌드에서만 열리는 미리보기 경로).
#    화면 구성·기능은 실제와 동일하고 숫자만 샘플이다. 앱에 없는 기능을 지어내
#    찍으면 심사 지침 2.3.3 위반이니, 아래 목록에 없는 화면을 추가할 때 주의할 것.
#
set -euo pipefail

IOS_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$IOS_ROOT"

DEVICE_NAME="${DEVICE_NAME:-iPhone 17 Pro Max}"
BUNDLE_ID="com.foundone.mobile"
OUT="$IOS_ROOT/build/screenshots"
MODE="${MODE:-account}"
SCENARIO="${SCENARIO:-healthy}"
[ "$MODE" = "demo" ] && echo "⚠️  MODE=demo — 미리보기 배너가 찍힙니다. App Store 업로드용 아님."
[ "$MODE" = "account" ] && echo "ℹ️  MODE=account — 시뮬레이터에 **로그인이 되어 있어야** 실데이터가 찍힙니다."

UDID=$(xcrun simctl list devices available | grep -m1 "$DEVICE_NAME (" | sed -E 's/.*\(([0-9A-F-]{36})\).*/\1/')
[ -n "$UDID" ] || { echo "❌ '$DEVICE_NAME' 시뮬레이터가 없습니다 → Xcode ▸ Settings ▸ Components 에서 설치"; exit 1; }
echo "📱 $DEVICE_NAME ($UDID)"

mkdir -p "$OUT"
xcrun simctl boot "$UDID" 2>/dev/null || true
xcrun simctl bootstatus "$UDID" -b

# 상태바 고정 — 실제 시각·배터리가 찍히면 스크린샷 세트가 제각각으로 보인다
xcrun simctl status_bar "$UDID" override \
  --time "9:41" --batteryState charged --batteryLevel 100 \
  --cellularMode active --cellularBars 4 --wifiMode active --wifiBars 3

echo "🔨 빌드 중…"
xcodebuild build \
  -project FoundOne.xcodeproj -scheme FoundOne -configuration Debug \
  -destination "id=$UDID" -derivedDataPath build/DD-shots -quiet

APP="build/DD-shots/Build/Products/Debug-iphonesimulator/FoundOne.app"
[ -d "$APP" ] || { echo "❌ 빌드 산출물을 찾을 수 없습니다: $APP"; exit 1; }
xcrun simctl install "$UDID" "$APP"

# 촬영 목록: 파일명|탭|설명
SHOTS=(
  "01-home|home|홈 — 오늘 할 일 + 경영 브리핑"
  "02-roadmap|roadmap|창업 로드맵"
  "03-current|current|현재 단계 상세"
  "04-marketing|marketing|마케팅 — 미션·사례"
  "05-tax|tax|세금 — 신고 일정·세액공제"
)

for shot in "${SHOTS[@]}"; do
  IFS='|' read -r name tab desc <<< "$shot"
  echo "📸 $name — $desc"
  xcrun simctl terminate "$UDID" "$BUNDLE_ID" 2>/dev/null || true
  if [ "$MODE" = "demo" ]; then
    SIMCTL_CHILD_BU_DEMO_SCENARIO="$SCENARIO" \
    SIMCTL_CHILD_BU_DEMO_ALLOW=1 \
    SIMCTL_CHILD_BU_DEMO_TAB="$tab" \
      xcrun simctl launch "$UDID" "$BUNDLE_ID" >/dev/null
  else
    SIMCTL_CHILD_BU_DEMO_TAB="$tab" \
      xcrun simctl launch "$UDID" "$BUNDLE_ID" >/dev/null
  fi
  sleep 4   # 첫 렌더 + 애니메이션이 끝날 시간
  xcrun simctl io "$UDID" screenshot --type png "$OUT/$name.png"
done

xcrun simctl status_bar "$UDID" clear
xcrun simctl terminate "$UDID" "$BUNDLE_ID" 2>/dev/null || true

echo
echo "📐 크기 검증 (1320×2868 이어야 App Store 가 6.9인치로 받는다):"
for f in "$OUT"/*.png; do
  python3 - "$f" <<'PY'
import sys, struct
p = sys.argv[1]
d = open(p, "rb").read()
w, h = struct.unpack(">II", d[16:24])
ok = "✅" if (w, h) == (1320, 2868) else "⚠️"
print(f"  {ok} {p.split('/')[-1]}  {w}×{h}")
PY
done
echo
echo "✅ $OUT"
echo "   ⚠️ 업로드 전 사람 눈으로 한 장씩 확인:
      · 빨간 미리보기 배너가 보이면 → MODE=demo 로 찍힌 것. 로그인 후 다시.
      · 로그인 화면이 찍혔으면    → 시뮬레이터에서 로그인 후 다시.
      · 빈 카드(—·0원)·로딩 스켈레톤이 보이면 → 그 계정에 데이터가 없는 것."
