#!/bin/bash
#
# generate-xcconfig.sh — apps/web/.env.local 의 키를 읽어 apps/ios/Config/Build.xcconfig 생성.
#
# 사용법:
#   cd apps/ios
#   ./Scripts/generate-xcconfig.sh
#
# 결과:
#   apps/ios/Config/Build.xcconfig (이미 있으면 덮어씀)
#
# ⚠️ Build.xcconfig 는 실제 키 포함 → .gitignore 에 등록되어 있어야 함.
#

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
IOS_ROOT="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(cd "$IOS_ROOT/../.." && pwd)"
ENV_FILE="$PROJECT_ROOT/apps/web/.env.local"
OUTPUT="$IOS_ROOT/Config/Build.xcconfig"

if [ ! -f "$ENV_FILE" ]; then
  echo "❌ $ENV_FILE 파일을 찾을 수 없습니다."
  exit 1
fi

# .env.local 에서 키 추출 (= 뒷부분만, 따옴표 제거)
get_env() {
  grep -E "^$1=" "$ENV_FILE" | sed -E "s/^$1=(.+)$/\1/" | tr -d '"' | tr -d "'" | head -1
}

SUPABASE_URL=$(get_env "NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_ANON_KEY=$(get_env "NEXT_PUBLIC_SUPABASE_ANON_KEY")
KAKAO_REST_KEY=$(get_env "KAKAO_REST_API_KEY")
KAKAO_JS_KEY=$(get_env "NEXT_PUBLIC_KAKAO_JS_KEY")

# Apple Developer Team ID — .env.local 의 APPLE_TEAM_ID 로 주입(아카이브 서명용).
#   없으면 빈값 → Xcode 에서 수동 선택 필요. 설정해두면 재생성해도 유지됨.
APPLE_TEAM_ID=$(get_env "APPLE_TEAM_ID")

# 버전 — .env.local 우선, 없으면 **기존 xcconfig 값을 보존**, 그것도 없으면 기본값.
#   ⚠️ 보존이 중요한 이유: App Store Connect 는 같은 빌드 번호를 두 번 받지 않는다.
#      재생성이 조용히 1 로 되돌리면, 다음 업로드가 "이미 존재하는 빌드" 로 거절된다.
prev_value() { [ -f "$OUTPUT" ] && grep -E "^$1[[:space:]]*=" "$OUTPUT" | sed -E "s/^$1[[:space:]]*=[[:space:]]*//" | tr -d ' ' | head -1; }

MARKETING_VERSION=$(get_env "IOS_MARKETING_VERSION")
[ -z "$MARKETING_VERSION" ] && MARKETING_VERSION=$(prev_value "MARKETING_VERSION")
[ -z "$MARKETING_VERSION" ] && MARKETING_VERSION="1.0.0"

BUILD_NUMBER=$(get_env "IOS_BUILD_NUMBER")
[ -z "$BUILD_NUMBER" ] && BUILD_NUMBER=$(prev_value "CURRENT_PROJECT_VERSION")
[ -z "$BUILD_NUMBER" ] && BUILD_NUMBER="1"

# Kakao Native App Key — 별도 키. .env.local 에 KAKAO_NATIVE_APP_KEY 가 없으면 placeholder.
KAKAO_NATIVE_KEY=$(get_env "KAKAO_NATIVE_APP_KEY")
if [ -z "$KAKAO_NATIVE_KEY" ]; then
  KAKAO_NATIVE_KEY="REPLACE_WITH_NATIVE_APP_KEY"
  NATIVE_KEY_WARNING="yes"
fi

# Validation
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
  echo "❌ Supabase 키가 누락됐어요. .env.local 의 NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY 확인."
  exit 1
fi

# Supabase URL 에서 https:// 떼고 // 형태로 다시 — Xcode .xcconfig 는 // 가 주석이라
# URL slash 를 그대로 못 씀. 변수에서 분리 처리.
# Xcode 트릭: // 앞에 $() 삽입 — 빈 변수 참조.
SUPABASE_URL_ESCAPED=$(echo "$SUPABASE_URL" | sed 's|//|/$()/|g')

# xcconfig 작성
cat > "$OUTPUT" <<EOF
// ─────────────────────────────────────────────────────────────────
// Build.xcconfig — auto-generated from apps/web/.env.local
// DO NOT commit (already in .gitignore).
//
// Regenerate: cd apps/ios && ./Scripts/generate-xcconfig.sh
// Generated:  $(date +"%Y-%m-%d %H:%M:%S")
// ─────────────────────────────────────────────────────────────────

// Supabase
// ⚠️ Xcode .xcconfig 는 // 가 주석 시작 문자 → URL slash 는 \$()/  로 분리.
SUPABASE_URL = ${SUPABASE_URL_ESCAPED}
SUPABASE_ANON_KEY = ${SUPABASE_ANON_KEY}

// Kakao
KAKAO_NATIVE_APP_KEY = ${KAKAO_NATIVE_KEY}
KAKAO_REST_API_KEY = ${KAKAO_REST_KEY}
KAKAO_JS_KEY = ${KAKAO_JS_KEY}

// URL Scheme (kakao{native_key})
KAKAO_URL_SCHEME = kakao\$(KAKAO_NATIVE_APP_KEY)

// Environment
BU_ENVIRONMENT = production

// Build settings
PRODUCT_BUNDLE_IDENTIFIER = com.foundone.mobile
MARKETING_VERSION = ${MARKETING_VERSION}
CURRENT_PROJECT_VERSION = ${BUILD_NUMBER}
DEVELOPMENT_TEAM = ${APPLE_TEAM_ID}
IPHONEOS_DEPLOYMENT_TARGET = 18.0

// App Group (Widget + Live Activity 공유)
APP_GROUP_IDENTIFIER = group.com.foundone.shared
EOF

echo "✅ Build.xcconfig 생성 완료: $OUTPUT"
echo ""
echo "📌 다음 단계:"
echo "  1. Xcode 에서 App target 생성 (Bundle ID: com.foundone.mobile)"
echo "  2. Project → Configurations → Debug/Release 모두 Build.xcconfig 연결"
echo "  3. Info.plist 의 키들은 \$(SUPABASE_URL) 등으로 참조"

if [ "$NATIVE_KEY_WARNING" = "yes" ]; then
  echo ""
  echo "⚠️  KAKAO_NATIVE_APP_KEY 가 .env.local 에 없습니다."
  echo "    - Kakao Developers (developers.kakao.com) 에서 같은 앱의 Native App Key 발급"
  echo "    - .env.local 에 KAKAO_NATIVE_APP_KEY=xxxxx 추가 후 본 스크립트 재실행"
  echo "    - 또는 Config/Build.xcconfig 직접 편집"
fi
