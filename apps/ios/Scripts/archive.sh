#!/bin/bash
#
# archive.sh — App Store 제출용 아카이브 + .ipa 내보내기.
#
#   cd apps/ios && ./Scripts/archive.sh
#
# 선행 조건 (하나라도 없으면 아래에서 이유를 말하고 멈춘다 — 조용히 실패하지 않는다):
#   · Apple Developer Program 멤버십 (연 $99)
#   · .env.local 에 APPLE_TEAM_ID=XXXXXXXXXX → ./Scripts/generate-xcconfig.sh 재실행
#   · Xcode 에 Apple 계정 로그인 (Xcode ▸ Settings ▸ Accounts) — 자동 서명이 인증서를 받아온다
#   · Apple Developer 포털의 App ID(com.foundone.mobile)에 Sign in with Apple + Push 활성
#
# 산출물: build/export/FoundOne.ipa
# 업로드: Xcode ▸ Window ▸ Organizer ▸ Distribute App  (첫 제출은 GUI 권장)
#         또는 Transporter.app 에 .ipa 드래그
#
set -euo pipefail

IOS_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$IOS_ROOT"

XCCONFIG="Config/Build.xcconfig"
ARCHIVE="build/FoundOne.xcarchive"
EXPORT_DIR="build/export"

# ── 선행 조건 검사 ───────────────────────────────────────────────
[ -f "$XCCONFIG" ] || { echo "❌ $XCCONFIG 없음 → ./Scripts/generate-xcconfig.sh 먼저 실행"; exit 1; }

TEAM_ID=$(grep -E "^DEVELOPMENT_TEAM" "$XCCONFIG" | sed -E 's/^DEVELOPMENT_TEAM[[:space:]]*=[[:space:]]*//' | tr -d ' ')
if [ -z "$TEAM_ID" ]; then
  cat <<'MSG'
❌ DEVELOPMENT_TEAM 이 비어 있습니다 — 이 상태로는 아카이브가 불가능합니다.

  1) https://developer.apple.com/account → Membership 에서 Team ID (10자) 확인
  2) apps/web/.env.local 에 한 줄 추가:   APPLE_TEAM_ID=XXXXXXXXXX
  3) cd apps/ios && ./Scripts/generate-xcconfig.sh
  4) 다시 이 스크립트 실행
MSG
  exit 1
fi
echo "✅ Team ID: $TEAM_ID"

BUILD_NUM=$(grep -E "^CURRENT_PROJECT_VERSION" "$XCCONFIG" | sed -E 's/.*=[[:space:]]*//' | tr -d ' ')
VERSION=$(grep -E "^MARKETING_VERSION" "$XCCONFIG" | sed -E 's/.*=[[:space:]]*//' | tr -d ' ')
echo "📦 버전 $VERSION (빌드 $BUILD_NUM)"
echo "   ⚠️ 같은 빌드 번호는 App Store Connect 가 두 번 받지 않습니다."
echo "      재업로드 시 .env.local 의 IOS_BUILD_NUMBER 를 올리고 xcconfig 재생성하세요."

# 프로젝트를 project.yml 기준으로 최신화 (설정 드리프트 방지)
command -v xcodegen >/dev/null || { echo "❌ xcodegen 없음 → brew install xcodegen"; exit 1; }
xcodegen generate --quiet

rm -rf "$ARCHIVE" "$EXPORT_DIR"

# ── 아카이브 ────────────────────────────────────────────────────
echo "🔨 아카이브 중… (몇 분 걸립니다)"
xcodebuild archive \
  -project FoundOne.xcodeproj \
  -scheme FoundOne \
  -configuration Release \
  -destination 'generic/platform=iOS' \
  -archivePath "$ARCHIVE" \
  -allowProvisioningUpdates \
  DEVELOPMENT_TEAM="$TEAM_ID"

# ── ExportOptions 생성 (Team ID 를 커밋된 파일에 박지 않는다) ────
EXPORT_PLIST="build/ExportOptions.plist"
cat > "$EXPORT_PLIST" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key><string>app-store-connect</string>
    <key>teamID</key><string>$TEAM_ID</string>
    <key>signingStyle</key><string>automatic</string>
    <key>uploadSymbols</key><true/>
    <key>destination</key><string>export</string>
</dict>
</plist>
PLIST

echo "📤 .ipa 내보내는 중…"
xcodebuild -exportArchive \
  -archivePath "$ARCHIVE" \
  -exportPath "$EXPORT_DIR" \
  -exportOptionsPlist "$EXPORT_PLIST" \
  -allowProvisioningUpdates

echo
echo "✅ 완료: $IOS_ROOT/$EXPORT_DIR/FoundOne.ipa"
echo "   업로드 → Xcode ▸ Window ▸ Organizer ▸ Distribute App"
echo "           또는 Transporter.app 에 .ipa 드래그"
