"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import { useDashboardCtx } from "../../../contexts/DashboardContext";
import { KeyActionHero } from "../shared/StageActionHero";
import type { LucideIcon } from "lucide-react";
import {
  Layers, Lightbulb, VolumeX, Shield, Zap, Droplets, Wind, Gem,
  Paintbrush, Leaf, Scan, Lock, Plug, Grid3X3, DoorOpen, Sun, Film,
  PanelLeft, Table2, Box, Frame, Trees, Thermometer, Flame, Package,
  Factory, Coffee, Compass, Home, Beer, Wine, Sprout, Sparkles,
  Flower2, Crown, Heart, Dumbbell, Waves, BookOpen, Palette, Award,
  Star, Scissors, AlignLeft, Megaphone, Store, Cpu, RefreshCw,
  Maximize2, MapPin, Monitor, Smile, Building2, LayoutGrid,
  Bike, Wifi, Camera, Users, Globe,
} from "lucide-react";
import { supabase } from "../../../../../lib/supabase";
import { SUB_INDUSTRY_INTERIOR_DATA } from "./sub-industry-interior-data";
import { SUB_INDUSTRY_INTERIOR_2026 } from "./sub-industry-interior-2026";
import { FRANCHISE_INTERIOR_DATA } from "./franchise-interior-data";
import { getFranchiseBrandById } from "@foundone/shared";
import { StageWrapup } from "../shared/StageWrapup";

export function ConstructionSetupStage() {
  const d = useDashboardCtx();
  const {
    language, industryCategoryId, selectedIndustryId,
    startupType, selectedFranchiseBrandId,
    selectedInteriorConcept, setSelectedInteriorConcept,
    contractors, contractorsLoading, contractorsRetryKey, setContractorsRetryKey,
    preferredRegion,
  } = d;

  const [interiorGuidesData, setInteriorGuidesData] = useState<{ materials: Array<{ id: string; guideType: string; nameKo: string; nameEn?: string; descriptionKo: string; descriptionEn?: string; iconName?: string; tags: string[]; pros?: string[]; cons?: string[]; costRangeKo?: string; costRangeEn?: string; trendSource?: string; priority: number }>; concepts: Array<{ id: string; guideType: string; nameKo: string; nameEn?: string; descriptionKo: string; descriptionEn?: string; iconName?: string; tags: string[]; pros?: string[]; cons?: string[]; costRangeKo?: string; costRangeEn?: string; trendSource?: string; priority: number }> } | null>(null);
  const [interiorGuidesLoaded, setInteriorGuidesLoaded] = useState(false);

                  // Supabase 인테리어 가이드 로딩 (세부 업종별)
                  // 업종 변경 시 리로드를 위해 categoryId를 키로 사용
                  const loadDbGuides = async () => {
                    try {
                      const { loadInteriorGuides } = await import("@foundone/shared");
                      const result = await loadInteriorGuides(supabase, industryCategoryId, selectedIndustryId);
                      if (result.materials.length > 0 || result.concepts.length > 0) {
                        setInteriorGuidesData(result);
                      } else {
                        setInteriorGuidesData(null); // Supabase에 데이터 없으면 null → 하드코딩 폴백
                      }
                    } catch {
                      setInteriorGuidesData(null);
                    }
                    setInteriorGuidesLoaded(true);
                  };
                  if (!interiorGuidesLoaded) void loadDbGuides();

                  // 업종별 자재·컨셉 데이터 (하드코딩 폴백)
                  type MaterialItem = { icon: LucideIcon; name: string; desc: string };
                  type ConceptItem = { id: string; icon: LucideIcon; name: string; desc: string; tags: string[] };
                  type CategoryData = { materials: MaterialItem[]; concepts: ConceptItem[]; contractorKeyword: string };

                  const categoryDataMap: Record<string, CategoryData> = {
                    "cafe-dessert": {
                      materials: [
                        { icon: Layers, name: "시멘트 질감 마감재 (마이크로토핑)", desc: "노출 콘크리트 느낌 셀프 시공 가능 — 인더스트리얼·모던 감성 모두 사용" },
                        { icon: PanelLeft, name: "오픈형 원목 선반 + 철제 브래킷", desc: "원두·컵·소품 디스플레이. FSC 인증 목재 권장 (2025 친환경 트렌드)" },
                        { icon: Gem, name: "세라믹/엔지니어드 스톤 상판", desc: "카운터 상판 — 석영 90%+ 프리미엄 마감재. 열·스크래치·오염 내성 최고" },
                        { icon: Lightbulb, name: "LED 레일 조명 (2700~3000K 전구색)", desc: "카운터·선반 강조. 색온도가 음식·음료 색감 결정 — 전구색 필수" },
                        { icon: VolumeX, name: "방음·단열 복합 패널", desc: "주거 혼합 상권 야간 영업 민원 방지. 내장 흡음재 + 마감 압축재 이중 구조" },
                        { icon: Grid3X3, name: "미끄럼 방지 논슬립 타일/에폭시", desc: "카페 물기 특성상 필수. 논슬립 타일 또는 에폭시 코팅 — 정사각 600각 강마루도 트렌드" },
                      ],
                      concepts: [
                        { id: "industrial", icon: Factory, name: "미니멀 인더스트리얼", desc: "노출 콘크리트·철제 구조·원목 믹스매치. 강철+알루미늄+원목 상판 조합이 핵심", tags: ["20-30대 남성", "SNS 바이럴", "넓은 공간"] },
                        { id: "natural", icon: Leaf, name: "내추럴 빈티지 우드", desc: "FSC 원목·라탄·린넨·식물. 2025 바이오필릭 트렌드 — 심리 안정 효과, 재방문율 높음", tags: ["여성 선호", "재방문율", "힐링·웰빙"] },
                        { id: "parisian", icon: Coffee, name: "파리지앵 비스트로", desc: "대리석 상판·황동 소품·파스텔 벽. 엔지니어드 스톤 대리석 패턴 활용. 포토존 강점", tags: ["디저트 특화", "SNS 포토존", "프리미엄"] },
                        { id: "scandi", icon: Compass, name: "모던 스칸디나비안", desc: "화이트+우드+패브릭+모카 무스 계열(Pantone 2025). 밝은 채광 극대화, 넓어 보이는 공간감", tags: ["패밀리 친화", "밝은 채광", "전 연령 무난"] },
                      ],
                      contractorKeyword: "카페 인테리어 전문",
                    },
                    "food": {
                      materials: [
                        { icon: Wind, name: "스테인리스 상업용 후드·배기 시스템", desc: "법적 의무 — 풍량 계산 선행 필요. 주방 폭 최소 1900mm 확보 후 설계" },
                        { icon: Grid3X3, name: "내열 세라믹 타일 (주방 벽·바닥)", desc: "기름때·고열 내성. 줄눈 방오 처리 필수 — 청소 난이도 결정 요인" },
                        { icon: Shield, name: "방화 석고보드 (주방 인접 벽)", desc: "소방법 의무 자재 — 소방 심사 전 반드시 확인. 두께·등급 구분 있음" },
                        { icon: Zap, name: "대용량 전기 배선·분전반", desc: "상업용 주방 장비 전용 분전반 선행 공사 필수. 인테리어 착수 전 전기 설계" },
                        { icon: Droplets, name: "에폭시 바닥재 (주방·홀 경계)", desc: "방수·물매 시공 필수. 하수구 위치 먼저 결정 — 청소 동선이 여기서 결정됨" },
                        { icon: VolumeX, name: "방음·흡음재 (홀)", desc: "조리 소음·냉방기 소음 차단. 야간 영업 민원 방지 — 다중 레이어 구조 권장" },
                      ],
                      concepts: [
                        { id: "modern-hanok", icon: Home, name: "모던 한옥 퓨전", desc: "한지·나무·석재 믹스. 전통과 현대 조화 — 외국인 관광객 많은 상권에서 차별화 강점", tags: ["외국인 친화", "30-50대", "관광지 상권"] },
                        { id: "casual-pocha", icon: Beer, name: "캐주얼 포차·분식", desc: "자연 목재·빈티지 간판·원색 포인트. 친근하고 활기찬 분위기 — 저녁·회식 수요 최강", tags: ["저녁·야간 강점", "회식 수요", "가성비"] },
                        { id: "izakaya", icon: Wine, name: "클린 이자카야", desc: "다크 우드+간접조명+줄 전구. 2025 MZ세대 외식 트렌드 1순위 — SNS 바이럴 용이", tags: ["20-30대", "SNS 바이럴", "야간 강점"] },
                        { id: "farm", icon: Sprout, name: "팜투테이블 내추럴", desc: "식물·내추럴 소재·따뜻한 조명. 건강·유기농 이미지 — 객단가 올리기에 유리한 포지셔닝", tags: ["건강 이미지", "여성 선호", "객단가 상승"] },
                      ],
                      contractorKeyword: "음식점 인테리어 전문",
                    },
                    "beauty": {
                      materials: [
                        { icon: Scan, name: "대형 경대 거울 + 간접조명", desc: "고객 만족도 직결 — 강화 안전유리 + 간접조명으로 입체감과 고급감 동시 연출" },
                        { icon: Droplets, name: "샴푸대 전용 수전·배관", desc: "미용 시설 전용 설비. 위치 변경이 어려우므로 시공 전 배관 계획 확정 필수" },
                        { icon: Grid3X3, name: "미끄럼 방지 타일 (샴푸 구역)", desc: "물기 잦은 공간 안전 필수. 600각 정사각 타일 + 방오 줄눈 처리" },
                        { icon: Paintbrush, name: "저VOC 페인트 + 인테리어 필름", desc: "화학약품 사용 공간 — 저VOC 필수. 필름 마감으로 벽면 패턴·질감 다양하게 표현 가능" },
                        { icon: VolumeX, name: "방음재 (드라이어·음악 소음)", desc: "드라이어 소음 등 고객 불편 최소화. 흡음 패널 또는 흡음 벽지 시공" },
                        { icon: Leaf, name: "대나무·코르크 등 친환경 자재", desc: "2025 뷰티샵 핵심 트렌드 — 천연 소재로 공기질 개선 + 브랜드 감성 차별화" },
                      ],
                      concepts: [
                        { id: "clean-modern", icon: Sparkles, name: "클린 모던 화이트", desc: "흰 벽+원목 선반+포인트 컬러. 웨인스코팅 기둥 마감으로 고급감 — 청결·신뢰 이미지 1위", tags: ["청결 이미지", "연령 무관", "신뢰감"] },
                        { id: "botanic", icon: Flower2, name: "내추럴 보타닉 살롱", desc: "식물+원목+간접조명. 2025 바이오필릭 트렌드 정점 — 프리미엄 힐링 살롱 포지셔닝", tags: ["프리미엄", "힐링", "여성 선호"] },
                        { id: "luxury-black", icon: Crown, name: "럭셔리 블랙 & 골드", desc: "다크 톤+황동+대리석 포인트. 고급 헤어샵 포지셔닝 — 객단가 상승·재방문 고객 확보", tags: ["고단가", "프리미엄", "강남·홍대"] },
                        { id: "mocha-pink", icon: Heart, name: "모카 무스 & 핑크 파스텔", desc: "2025 Pantone 모카 무스 계열 + 파스텔. 따뜻한 베이지·핑크 — 네일·스킨 샵 최강 컨셉", tags: ["네일·피부 특화", "SNS 포토존", "20-30대 여성"] },
                      ],
                      contractorKeyword: "미용실 헤어샵 인테리어",
                    },
                    "fitness": {
                      materials: [
                        { icon: Layers, name: "충격 흡수 고무 바닥재 (헬스장)", desc: "운동화 마모·소음·충격 흡수. 두께 10~20mm — 장비 무게별 등급 선택 필수" },
                        { icon: PanelLeft, name: "강화마루 + 바닥 단열필름 (스튜디오)", desc: "필라테스·요가 맨발 운동 — 강화마루가 내구성·고급감 최적. 단열로 겨울 냉기 차단" },
                        { icon: Maximize2, name: "전신 거울 (강화 안전유리)", desc: "동작 확인 필수 — 공간 여유 시 간접조명 추가로 입체감 연출. 좁은 공간은 벽 밀착 설치" },
                        { icon: VolumeX, name: "방음·흡음 다층 구조 자재", desc: "음악·운동 소음 차단. 내부는 고흡음율 자재, 마감은 얇고 단단한 압축재 조합이 정석" },
                        { icon: Wind, name: "에어 서큘레이터 + 환기 시스템", desc: "다수 사용자 땀 환기 필수. 환기량 부족은 가장 많은 불만 요인 — 설계 단계 반영 필수" },
                        { icon: DoorOpen, name: "스테인리스 파티션·로커 (탈의실)", desc: "내구성 + 위생 최우선 소재. 탈의실은 고객 만족도 직결 공간 — 투자 아끼지 말 것" },
                      ],
                      concepts: [
                        { id: "clean-sport", icon: Dumbbell, name: "클린 모던 스포티", desc: "흰 벽+밝은 조명+원목 포인트. 청결·건강 이미지 극대화 — 신규 회원 첫인상 결정", tags: ["청결 이미지", "전 연령", "밝은 공간"] },
                        { id: "industrial-sport", icon: Factory, name: "인더스트리얼 퍼포먼스", desc: "노출 콘크리트+철제+형광 포인트. 퍼포먼스·강도 이미지 강조 — 헬스장·크로스핏 최적", tags: ["남성 선호", "고강도 운동", "에너지"] },
                        { id: "healing-studio", icon: Waves, name: "힐링 내추럴 스튜디오", desc: "따뜻한 우드+식물+부드러운 간접조명. 심리 안정·웰니스 — 요가·필라테스·명상 전용 컨셉", tags: ["요가·필라테스", "여성 선호", "웰니스"] },
                        { id: "premium-pt", icon: Award, name: "하이엔드 프리미엄 PT", desc: "대리석 포인트+블랙+디자인 조명. 1:1 PT·소수 정예 — 고단가 포지셔닝, 신뢰감 극대화", tags: ["1:1 PT", "고단가", "강남·서래마을"] },
                      ],
                      contractorKeyword: "피트니스 스튜디오 인테리어",
                    },
                    "education": {
                      materials: [
                        { icon: Shield, name: "방염 인증 마감재 (벽지·천장재)", desc: "다중이용시설 법규 의무 — 불특정 다수 이용 공간 모두 방염 필수. 미준수 시 영업 정지" },
                        { icon: DoorOpen, name: "방음 도어 (간살+유리 조합)", desc: "수업 중 외부 소음 차단. 간살에 유리 부착으로 방음+채광 동시 확보 — 2025 트렌드" },
                        { icon: Lightbulb, name: "기능성 조명 (4000K 주백색)", desc: "학습 집중력 최적 색온도. 어두운 조명·눈부심 모두 집중력 저하 원인 — 조도 계산 필수" },
                        { icon: Paintbrush, name: "단색 계열 저채도 페인트 + 포인트 벽면", desc: "집중력 향상 환경 — 벽 한 면에만 포인트 컬러 적용하는 것이 현재 학원 인테리어 정석" },
                        { icon: VolumeX, name: "방음재·흡음재 (강의실)", desc: "집중력에 방음이 가장 큰 영향. 다층 구조 흡음 패널 + 방음 도어 조합 권장" },
                        { icon: Layers, name: "내마모 LVT·강마루 바닥재", desc: "의자 끌기 소음·마모 내성. 학생 다수 이용 → 내구성 최우선, 청소 용이성 고려" },
                      ],
                      concepts: [
                        { id: "clean-academic", icon: BookOpen, name: "클린 아카데믹", desc: "화이트+그레이 계열+집중력 최적화 조명. 학부모 신뢰감·청결 이미지 1위 컨셉", tags: ["학부모 신뢰", "집중력 최적화", "입시 학원"] },
                        { id: "creative-studio", icon: Palette, name: "모던 창의 스튜디오", desc: "컬러 포인트 벽면+오픈 수납+밝은 조명. 예체능·코딩·창의 학원 — 활기찬 분위기", tags: ["예체능·코딩", "창의적 환경", "어린이"] },
                        { id: "premium-private", icon: Award, name: "프리미엄 소수정예", desc: "원목+고급 조명+독립 공간 설계. 1:1 과외·소규모 클래스 — 고단가 포지셔닝 필수 컨셉", tags: ["소수 정예", "고단가", "강남·대치"] },
                        { id: "kids-bright", icon: Star, name: "활기찬 키즈 클래스", desc: "밝은 안전 컬러+라운드 가구+내구성 자재. 어린이 대상 학원 — 안전·위생 최우선", tags: ["어린이 대상", "안전 자재", "학부모 만족"] },
                      ],
                      contractorKeyword: "학원 교육시설 인테리어",
                    },
                    "pet": {
                      materials: [
                        { icon: Grid3X3, name: "항균·미끄럼 방지 세라믹 타일", desc: "동물 발 보호 + 위생 청소 용이. 배뇨 실수 스며들지 않는 무공극 타일 필수" },
                        { icon: Layers, name: "고탄성 쿠션 바닥재 (운동·대기 구역)", desc: "높은 곳 착지 충격 흡수 → 관절 보호. 2중 쿠션층 기준 두께 8mm 이상 권장" },
                        { icon: Shield, name: "방수·항균 벽 마감재", desc: "배변·물 튀김 대응. 타이벡·천연 펄프 계열 친환경 항균 마감재 — 2025 펫 인테리어 핵심" },
                        { icon: Droplets, name: "스테인리스 그루밍 테이블·배수 시스템", desc: "목욕·그루밍 전용 배수 설계 — 위치 변경 어려움. 배수구 경사도(물매) 사전 계획 필수" },
                        { icon: Scan, name: "강화 유리 케이지·전시 구역", desc: "동물 분리·위생 관리. 강화 안전유리로 고객이 안쪽을 볼 수 있어 구매 전환율 상승" },
                        { icon: Wind, name: "환기·탈취 시스템 (필수 설비)", desc: "동물 냄새 제거가 고객 재방문 결정 요인 1위. 설계 단계에서 환기 용량 반드시 계산" },
                      ],
                      concepts: [
                        { id: "clean-white", icon: Sparkles, name: "클린 화이트 + 파스텔", desc: "흰 벽+파스텔 포인트. 위생·청결 이미지 극대화 — 보호자 신뢰감 가장 높은 컨셉", tags: ["청결 신뢰", "보호자 만족", "전 연령"] },
                        { id: "natural-wood", icon: Trees, name: "내추럴 원목 펫샵", desc: "원목+베이지+따뜻한 조명. 동물 친화적 분위기 — 중·고가 포지셔닝, 반려동물 가족 감성", tags: ["중·고가", "감성 소비", "재방문율"] },
                        { id: "pop-colorful", icon: Palette, name: "팝아트 컬러풀", desc: "밝은 원색+귀여운 그래픽. 접근성·바이럴 마케팅 강점 — 어린 자녀 동반 가족 어필", tags: ["접근성", "SNS 바이럴", "가족 고객"] },
                        { id: "premium-grooming", icon: Scissors, name: "미니멀 프리미엄 그루밍", desc: "블랙+화이트+황동 포인트. 고급 그루밍 살롱 포지셔닝 — 펫 미용 전문관 차별화", tags: ["고단가", "프리미엄 그루밍", "강남·성수"] },
                      ],
                      contractorKeyword: "펫샵 동물병원 인테리어",
                    },
                    "retail": {
                      materials: [
                        { icon: Grid3X3, name: "정사각 타일형 강마루 (600각)", desc: "2024-2025 리테일 바닥 메가 트렌드 — 타일 질감+내구성+청소 편의 삼박자" },
                        { icon: Film, name: "인테리어 필름 (벽면·집기 마감)", desc: "무몰딩 마감 트렌드 — 내오염성·내구성 뛰어남. 다양한 패턴·질감으로 브랜드 감성 구현" },
                        { icon: AlignLeft, name: "이동식 진열 시스템 (슬롯월·행거)", desc: "트렌드·시즌 변화에 따른 레이아웃 변경 필수. 고정 진열대 최소화가 현재 리테일 정석" },
                        { icon: Lightbulb, name: "스팟 LED + 레일 조명 시스템", desc: "상품 강조 조명 — 색연색지수(CRI) 90 이상 권장. 상품 색감 왜곡 최소화" },
                        { icon: Scan, name: "강화 유리 쇼케이스·진열장", desc: "고가 상품·뷰티·액세서리 진열 필수. 잠금 기능+LED 내장형이 현재 표준" },
                        { icon: Shield, name: "방염 벽지·마감재", desc: "다중이용시설 법규 — 연면적 관계없이 상업 매장은 방염 자재 적용 권장" },
                      ],
                      concepts: [
                        { id: "editorial", icon: Store, name: "에디토리얼 미니멀", desc: "화이트+그레이+중성 톤. 상품이 주인공 — 공간 비움으로 브랜드 밀도 극대화", tags: ["상품 강조", "브랜드 신뢰", "라이프스타일"] },
                        { id: "warm-natural", icon: Home, name: "웜톤 내추럴", desc: "원목+베이지+모카 무스(Pantone 2025). 친근하고 따뜻한 분위기 — 전 연령 재방문율", tags: ["전 연령", "재방문율", "동네 매장"] },
                        { id: "bold-brand", icon: Megaphone, name: "볼드 브랜딩 컬러", desc: "시그니처 컬러 포인트+강한 사이니지. 골목 가시성 확보 — SNS 바이럴+브랜드 각인", tags: ["브랜드 구축", "SNS", "독립 매장"] },
                        { id: "experience", icon: LayoutGrid, name: "체험형 쇼룸 (Shop-in-Shop)", desc: "매장 내 체험 존+전시 공간 구분. 2025 오프라인 리테일 1순위 트렌드 — 구매 전환율 상승", tags: ["체험 마케팅", "전환율 상승", "대형 매장"] },
                      ],
                      contractorKeyword: "소매점 리테일 매장 인테리어",
                    },
                    "living-service": {
                      materials: [
                        { icon: Droplets, name: "내수·방수 PVC·에폭시 바닥재", desc: "세탁기 진동·물기·세제 내성 필수. 물매 시공(경사도)으로 배수 원활하게" },
                        { icon: Table2, name: "스테인리스 카운터·작업대", desc: "세탁물·소품 처리 위생 관리. 내식성·내오염성 최강 소재 — 의류 오염 전이 방지" },
                        { icon: Shield, name: "방염 마감재 (벽·천장)", desc: "다중이용시설 법규 의무. 세탁 화학품 인화성 고려 — 방염 인증 필수" },
                        { icon: Lightbulb, name: "절전형 LED 조명 (5000K 주광색)", desc: "장시간 영업 전기료 절감 핵심. 작업 공간은 밝은 주광색 — 세탁물 색감 확인 용이" },
                        { icon: Wind, name: "환기 시스템 (세탁 화학품 배기)", desc: "세탁 용제 환기 필수 — 실내 공기질이 고객 체류 시간 결정. 배기 용량 사전 계산" },
                        { icon: Film, name: "내구성 인테리어 필름 (집기 마감)", desc: "잦은 접촉·세탁 용제 내성. 내오염성 필름으로 집기 수명 연장 + 청결 이미지 유지" },
                      ],
                      concepts: [
                        { id: "clean-tech", icon: Cpu, name: "클린 테크 화이트", desc: "흰 벽+스테인리스+그린·블루 포인트. 위생·기술력 이미지 — 고객 신뢰 가장 높은 컨셉", tags: ["위생 신뢰", "청결 이미지", "전 연령"] },
                        { id: "natural-laundry", icon: Leaf, name: "내추럴 라운드리", desc: "원목+화이트+식물. 친근하고 깔끔한 동네 세탁소 감성 — 커뮤니티 기반 재방문 유도", tags: ["동네 친화", "재방문", "패밀리"] },
                        { id: "modern-minimal", icon: Box, name: "모던 미니멀 그레이", desc: "회색 계열+깔끔한 동선+사이니지. 도심 편의형 프리미엄 세탁 — 직장인 고객 어필", tags: ["직장인", "도심 상권", "프리미엄"] },
                        { id: "local-brand", icon: Store, name: "로컬 브랜딩 강화", desc: "시그니처 컬러+강한 외부 사이니지. 골목 랜드마크화 — 구전·SNS 바이럴로 고객 확장", tags: ["랜드마크", "SNS 바이럴", "골목 상권"] },
                      ],
                      contractorKeyword: "생활서비스 상가 인테리어",
                    },
                    "space": {
                      materials: [
                        { icon: Shield, name: "방염 마감재 (벽지·천장재)", desc: "다중이용시설 필수 — 연면적 1000㎡ 이상은 불연·방염 의무. 사전 소방 확인 필수" },
                        { icon: DoorOpen, name: "방음 도어 (간살+유리문)", desc: "개별 룸 방음 핵심 자재. 유리 부착으로 방음+채광 확보 — 2025 스터디카페 표준" },
                        { icon: VolumeX, name: "흡음 패널 (룸 내부)", desc: "룸 내 에코·울림 차단. 내장 고흡음 + 마감 압축재 조합. 집중력 유지에 직결" },
                        { icon: PanelLeft, name: "우드 템바보드 벽장재", desc: "따뜻하고 감각적인 분위기 — 2024-2025 스터디카페 트렌드 벽장재 1위" },
                        { icon: Lightbulb, name: "개별 룸 독립 조명 (온오프 각각)", desc: "개인화 환경 — 룸별 밝기 조절 가능해야 고객 만족도 상승. 4000K 주백색 기본" },
                        { icon: Plug, name: "멀티탭·USB 충전 인프라", desc: "각 좌석 전원 공급 필수. 콘센트 위치가 좌석 만족도 결정 — 설계 단계 확정 필요" },
                      ],
                      concepts: [
                        { id: "modern-study", icon: BookOpen, name: "모던 스터디 (네이비+화이트)", desc: "차분한 네이비·화이트 혼합+원목. 집중력 1순위 컬러 조합 — 스터디카페 최다 선택 컨셉", tags: ["집중력 최강", "수험생", "장시간 체류"] },
                        { id: "cafe-study", icon: Coffee, name: "카페 감성 스터디", desc: "원목+무드 조명+식물+템바보드. 분위기 좋은 스터디 공간 — SNS 바이럴로 신규 고객 유입", tags: ["SNS 바이럴", "감성 소비", "장시간 체류"] },
                        { id: "premium-seminar", icon: Monitor, name: "프리미엄 세미나룸", desc: "대리석 포인트+블랙+화이트보드·스크린. 기업 교육·스터디그룹 — 시간당 단가 높음", tags: ["기업 고객", "고단가", "세미나"] },
                        { id: "healing-study", icon: Leaf, name: "힐링 내추럴", desc: "베이지+원목+식물+부드러운 조명. 스트레스 없는 공부 환경 — 장시간 체류율 가장 높음", tags: ["힐링", "장시간 체류", "20-30대"] },
                      ],
                      contractorKeyword: "스터디카페 공간 인테리어",
                    },
                    "online-digital": {
                      materials: [
                        { icon: Monitor, name: "노트북 (업무용)", desc: "일반 사무: LG gram·삼성 갤럭시북 (90~160만). 디자인: MacBook Pro M4 (250~500만). 개발: ThinkPad T (120~200만)" },
                        { icon: Maximize2, name: "모니터 (듀얼 추천)", desc: "삼성 S27 FHD (20~40만), LG 울트라와이드 34\" (40~60만). 디자인: Dell UltraSharp 4K (60~80만)" },
                        { icon: Table2, name: "사무 데스크", desc: "데스커 15~50만 (소규모 최적), 이케아 5~30만 (초기 가성비), 퍼시스 30~150만 (법인)" },
                        { icon: Gem, name: "인체공학 의자", desc: "시디즈 T50 (50~70만), 듀오백 D-ZERO (10~15만 가성비), 허먼밀러 에어론 (150~220만 프리미엄)" },
                        { icon: Wifi, name: "네트워크 장비", desc: "ipTIME 기업용 공유기 (5~15만), 시놀로지 NAS (30~80만). 안정적 인터넷이 운영 핵심" },
                        { icon: Box, name: "포장·물류 장비", desc: "라벨프린터 BIXOLON (15~40만), 포장재 박스코리아·올패키징몰. 풀필먼트: 쿠팡 로켓그로스·품고" },
                      ],
                      concepts: [
                        { id: "minimal-home", icon: Home, name: "미니멀 홈오피스", desc: "데스커+이케아 조합. 최소 비용으로 쾌적한 작업 환경 — 1인 이커머스 최적", tags: ["1인 운영", "최저 비용", "홈오피스"] },
                        { id: "shared-office", icon: Users, name: "공유오피스 활용", desc: "패스트파이브·위워크·스파크플러스. 초기 보증금 부담 없이 시작 — 네트워크 효과 보너스", tags: ["보증금 절약", "네트워킹", "2~5인 팀"] },
                        { id: "studio-setup", icon: Camera, name: "촬영 스튜디오 겸용", desc: "조명+배경지+삼각대 세팅. 상품 촬영이 매출 직결 — 자체 스튜디오로 외주비 절약", tags: ["상품 촬영", "SNS 콘텐츠", "브랜드 구축"] },
                        { id: "warehouse-office", icon: Package, name: "소형 창고+사무 겸용", desc: "재고 보관+포장+사무를 한 공간에. 임대료 절약 — 월 50~100만원대 소형 창고 활용", tags: ["재고 관리", "물류 효율", "성장기"] },
                      ],
                      contractorKeyword: "사무실 인테리어 소형",
                    },
                    "startup-tech": {
                      materials: [
                        { icon: Monitor, name: "개발용 노트북", desc: "MacBook Pro M4 Pro (280~350만, ARM 네이티브), ThinkPad T (120~200만, 리눅스 최적), Dell XPS (150~250만)" },
                        { icon: Maximize2, name: "외장 모니터 (듀얼/울트라와이드)", desc: "LG 울트라와이드 34\" (40~60만) 개발자 필수. 디자인: Dell UltraSharp 4K. BenQ PD2706U (60~80만)" },
                        { icon: Table2, name: "사무 가구 (데스크·의자)", desc: "퍼시스/코아스 (법인 대량), 데스커 (소규모), 시디즈 T80 (80~120만), 허먼밀러 에어론 (150~220만)" },
                        { icon: Wifi, name: "서버·네트워크·클라우드", desc: "AWS/GCP/Vercel 클라우드. ipTIME 기업공유기. 시놀로지 NAS. 기가비트 인터넷 필수" },
                        { icon: Lightbulb, name: "회의실 장비", desc: "LG 시네빔 프로젝터 (50~150만), 삼성 Flip 전자칠판 (300~500만), 로지텍 Rally 화상회의 (100~200만)" },
                        { icon: Cpu, name: "SaaS 구독 스택", desc: "Notion·Slack·Figma·GitHub·Linear·Vercel. 월 인당 5~15만원. Adobe CC 디자인팀 월 6만~" },
                      ],
                      concepts: [
                        { id: "garage-mvp", icon: Zap, name: "개러지 MVP 모드", desc: "최소 장비+공유오피스. 검증 전까지 고정비 최소화 — 시드 전 스타트업 정석", tags: ["시드 전", "최소 비용", "빠른 검증"] },
                        { id: "modern-office", icon: Cpu, name: "모던 테크 오피스", desc: "코아스 시스템가구+허먼밀러 의자+대형 모니터. IT기업 표준 환경 — 채용 경쟁력", tags: ["채용 경쟁력", "5~15인", "시리즈A+"] },
                        { id: "hybrid-remote", icon: Globe, name: "하이브리드 리모트", desc: "핵심 장비만 사무실 + 재택 장비 지원. Notion·Slack·Zoom 기반 — 고정비 대폭 절감", tags: ["리모트", "고정비 절감", "글로벌 팀"] },
                        { id: "design-studio", icon: Palette, name: "크리에이티브 스튜디오", desc: "iMac 24\"+듀얼모니터+Adobe CC. 디자인·영상 중심 스타트업 — 컬러 정확도 필수", tags: ["디자인 중심", "영상 제작", "크리에이티브"] },
                      ],
                      contractorKeyword: "IT 스타트업 사무실 인테리어",
                    },
                  };

                  const catData = categoryDataMap[industryCategoryId] ?? categoryDataMap["food"];
                  // Supabase 데이터가 있으면 우선 사용, 없으면 하드코딩 폴백
                  const iconMap: Record<string, LucideIcon> = {
                    Layers, Lightbulb, Factory, Wind, Package, Shield, Droplets, Palette, Monitor, Leaf, Zap,
                    Globe, Star, Home, Heart, Sparkles, PanelLeft, Table2, Box, Frame, Lock, Plug,
                    Grid3X3, DoorOpen, Sun, Film, Compass, Beer, Wine, Sprout, Flower2, Crown,
                    Dumbbell, Waves, BookOpen, Award, Scissors, AlignLeft, Megaphone, Store,
                    Cpu, RefreshCw, Maximize2, MapPin, Smile, Building2, LayoutGrid, Bike, Wifi, Camera, Users,
                    Scan, VolumeX, Coffee, Gem, Paintbrush, Thermometer, Flame,
                    Trees: Leaf, Diamond: Gem, GlassWater: Droplets, ScanFace: Scan, Armchair: Home,
                    Footprints: Bike, Maximize: Maximize2, MonitorUp: Monitor, ShieldOff: Shield,
                    Code: Cpu, Eye: Scan, UtensilsCrossed: Coffee, ChefHat: Award, Minimize: Layers,
                    TreePine: Leaf, PaintBucket: Paintbrush,
                  };
                  const dbMaterials = interiorGuidesData?.materials?.map((m) => ({
                    icon: iconMap[m.iconName ?? ""] ?? Layers,
                    name: language === "ko" ? m.nameKo : (m.nameEn ?? m.nameKo),
                    desc: language === "ko" ? m.descriptionKo : (m.descriptionEn ?? m.descriptionKo),
                  })) ?? [];
                  const dbConcepts = interiorGuidesData?.concepts?.map((c) => ({
                    id: c.id,
                    icon: iconMap[c.iconName ?? ""] ?? Layers,
                    name: language === "ko" ? c.nameKo : (c.nameEn ?? c.nameKo),
                    desc: language === "ko" ? c.descriptionKo : (c.descriptionEn ?? c.descriptionKo),
                    tags: c.tags,
                  })) ?? [];

                  // sub-industry 매핑 — Supabase 폴백 시 SUB_INDUSTRY_INTERIOR_DATA 우선 사용.
                  //  hardcoded category 데이터로 떨어지기 전에 sub-industry 별 정밀 데이터를 먼저 시도.
                  const subData = selectedIndustryId ? SUB_INDUSTRY_INTERIOR_DATA[selectedIndustryId] : undefined;
                  const subMaterials: MaterialItem[] = subData
                    ? subData.materials.map((m) => ({
                        icon: iconMap[m.iconName] ?? Layers,
                        name: m.nameKo,
                        desc: m.descriptionKo,
                      }))
                    : [];
                  const subConcepts: ConceptItem[] = subData
                    ? subData.concepts.map((c) => ({
                        id: c.id,
                        icon: iconMap[c.iconName] ?? Layers,
                        name: c.nameKo,
                        desc: c.descriptionKo,
                        tags: c.tags,
                      }))
                    : [];

                  const materials =
                    dbMaterials.length > 0 ? dbMaterials :
                    subMaterials.length > 0 ? subMaterials :
                    catData.materials;
                  const concepts =
                    dbConcepts.length > 0 ? dbConcepts :
                    subConcepts.length > 0 ? subConcepts :
                    catData.concepts;
                  const contractorKeyword = subData?.contractorKeyword ?? catData.contractorKeyword;
                  const regionLabel = preferredRegion ?? (language === "ko" ? "선택한 상권" : "your area");

                  // 프랜차이즈 본사 공급 인테리어 데이터 (있으면 우선 노출)
                  const franchiseData = startupType === "franchise" && selectedFranchiseBrandId
                    ? FRANCHISE_INTERIOR_DATA[selectedFranchiseBrandId]
                    : undefined;

                  return (
                    <>
                      <KeyActionHero
                        ko={language === "ko"}
                        action={{
                          title: language === "ko"
                            ? "공사 중에 소방필증·보건증 병행 신청 — 시공 후엔 영업까지 14일 더 걸린다"
                            : "Apply for fire & health certs during construction — doing it after adds 14 days to opening",
                          detail: language === "ko"
                            ? "인테리어 컨셉 → 견적 2곳 비교 → 설계 확정 → 시공 → 최종 점검. 소방·보건은 공사 시작 시점에 동시 신청해야 오픈 일정이 안 밀린다."
                            : "Concept → compare 2 quotes → finalize design → build → final check. File fire and health applications at construction start so the opening date doesn't slip.",
                        }}
                      />
                      {/* ── 프랜차이즈 본사 공급 패키지 (선택 시 우선 노출) ── */}
                      {franchiseData ? (() => {
                        const flexLabel = language === "ko"
                          ? (franchiseData.flexibility === "strict" ? "본사 지정 (자율도 낮음)" : franchiseData.flexibility === "moderate" ? "본사 표준 (일부 자율)" : "본사 가이드 (점주 자율)")
                          : (franchiseData.flexibility === "strict" ? "HQ-mandated (low flex)" : franchiseData.flexibility === "moderate" ? "HQ standard (partial flex)" : "HQ guideline (owner flex)");
                        const flexColor = franchiseData.flexibility === "strict" ? "#b64c4c" : franchiseData.flexibility === "moderate" ? "#191970" : "#1d3557";
                        return (
                          <div style={{ marginBottom: "28px" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px", flexWrap: "wrap" as const, gap: "8px" }}>
                              <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "15px", fontWeight: 600, color: "var(--text)", letterSpacing: "-0.02em" }}>
                                <Building2 size={17} strokeWidth={1.8} style={{ color: "#191970" }} />
                                {language === "ko" ? "본사 공급 패키지" : "HQ-Supplied Package"}
                              </span>
                              <span style={{
                                fontSize: "11px",
                                fontWeight: 700,
                                padding: "3px 10px",
                                borderRadius: "999px",
                                background: `${flexColor}15`,
                                color: flexColor,
                                letterSpacing: "0.02em",
                              }}>
                                {flexLabel}
                              </span>
                            </div>

                            {/* 본사 공급 자재 / 집기 */}
                            <div style={{
                              background: "white",
                              borderRadius: "20px",
                              overflow: "hidden",
                              boxShadow: "0 2px 16px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04)",
                              marginBottom: "12px",
                            }}>
                              {franchiseData.hqSuppliedItems.map((item, i) => {
                                const Icon = iconMap[item.iconName] ?? Layers;
                                return (
                                  <div key={item.nameKo}>
                                    {i > 0 && <div style={{ height: "0.5px", background: "rgba(0,0,0,0.08)", marginLeft: "68px" }} />}
                                    <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "13px 18px" }}>
                                      <div style={{
                                        width: "38px", height: "38px", borderRadius: "10px",
                                        background: "rgba(25,25,112,0.08)",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        flexShrink: 0, color: "rgb(25,25,112)",
                                      }}>
                                        <Icon size={18} strokeWidth={1.5} />
                                      </div>
                                      <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: "14px", fontWeight: 590, color: "var(--text)", letterSpacing: "-0.3px", marginBottom: "2px" }}>
                                          {item.nameKo}
                                        </div>
                                        <div style={{ fontSize: "12.5px", color: "rgba(0,0,0,0.55)", lineHeight: 1.45 }}>
                                          {item.descriptionKo}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* 표준 인테리어 컨셉 */}
                            {(() => {
                              const ConceptIcon = iconMap[franchiseData.standardConcept.iconName] ?? Layers;
                              return (
                                <div style={{
                                  background: "linear-gradient(180deg, rgba(25,25,112,0.04) 0%, rgba(255,255,255,0.96) 100%)",
                                  border: "1px solid rgba(25,25,112,0.16)",
                                  borderRadius: "20px",
                                  padding: "20px 22px",
                                  marginBottom: "12px",
                                }}>
                                  <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
                                    <div style={{
                                      width: "44px", height: "44px", borderRadius: "12px",
                                      background: "rgba(25,25,112,0.12)",
                                      display: "flex", alignItems: "center", justifyContent: "center",
                                      flexShrink: 0, color: "rgb(25,25,112)",
                                    }}>
                                      <ConceptIcon size={22} strokeWidth={1.6} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                      <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.06em", color: "rgb(25,25,112)", textTransform: "uppercase" as const, marginBottom: "4px" }}>
                                        {language === "ko" ? "표준 인테리어 컨셉" : "Standard Concept"}
                                      </div>
                                      <div style={{ fontSize: "16px", fontWeight: 660, color: "var(--text)", letterSpacing: "-0.02em", marginBottom: "6px" }}>
                                        {franchiseData.standardConcept.nameKo}
                                      </div>
                                      <div style={{ fontSize: "13.5px", lineHeight: 1.55, color: "rgba(0,0,0,0.65)", marginBottom: "8px" }}>
                                        {franchiseData.standardConcept.descriptionKo}
                                      </div>
                                      <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "11.5px", color: "rgba(25,25,112,0.85)", fontWeight: 600 }}>
                                        <span>•</span>
                                        <span>{language === "ko" ? "시그니처 컬러:" : "Signature:"}</span>
                                        <span>{franchiseData.standardConcept.signatureColors}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}

                            {/* 추정 비용 + 주의사항 */}
                            {(franchiseData.estimatedInteriorCostWon || franchiseData.notes.length > 0) && (
                              <div style={{
                                background: "white",
                                borderRadius: "16px",
                                padding: "16px 20px",
                                boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                                border: "1px solid rgba(0,0,0,0.06)",
                              }}>
                                {franchiseData.estimatedInteriorCostWon ? (
                                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: franchiseData.notes.length > 0 ? "12px" : 0, paddingBottom: franchiseData.notes.length > 0 ? "12px" : 0, borderBottom: franchiseData.notes.length > 0 ? "0.5px solid rgba(0,0,0,0.08)" : "none" }}>
                                    <span style={{ fontSize: "12.5px", color: "rgba(0,0,0,0.5)", fontWeight: 500 }}>
                                      {language === "ko" ? "인테리어·집기 추정 비용" : "Estimated interior+FF&E"}
                                    </span>
                                    <span style={{ fontSize: "15px", fontWeight: 680, color: "var(--text)", fontVariantNumeric: "tabular-nums" }}>
                                      약 {franchiseData.estimatedInteriorCostWon.toLocaleString()}만원
                                    </span>
                                  </div>
                                ) : null}
                                {franchiseData.notes.map((note, i) => (
                                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginBottom: i < franchiseData.notes.length - 1 ? "6px" : 0 }}>
                                    <span style={{ flexShrink: 0, color: "rgb(25,25,112)", fontSize: "12px", marginTop: "2px" }}>▸</span>
                                    <span style={{ fontSize: "12.5px", color: "rgba(0,0,0,0.6)", lineHeight: 1.55 }}>{note}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })() : null}

                      {/* ── 자재 추천 ── */}
                      {(() => {
                        // Apple iOS system color palette — 6색 순환
                        const iconColors = [
                          { bg: "rgba(59,92,140,0.1)",   fg: "rgb(59,92,140)"   }, // blue
                          { bg: "rgba(29,53,87,0.1)",   fg: "rgb(29,53,87)"   }, // green
                          { bg: "rgba(255,149,0,0.1)",   fg: "rgb(210,120,0)"   }, // orange
                          { bg: "rgba(88,86,214,0.12)",  fg: "rgb(88,86,214)"   }, // indigo
                          { bg: "rgba(90,200,250,0.14)", fg: "rgb(0,160,210)"   }, // teal
                          { bg: "rgba(255,45,85,0.1)",   fg: "rgb(220,40,75)"   }, // pink
                        ];
                        return (
                          <div style={{ marginBottom: "28px" }}>
                            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "8px" }}>
                              <span style={{ fontSize: "15px", fontWeight: 600, color: "var(--text)", letterSpacing: "-0.02em" }}>
                                {language === "ko" ? "마감재 · 설비 · 매장 가구" : "Finishes · Fixtures · Store Furniture"}
                              </span>
                              <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                                {language === "ko" ? `${materials.length}가지` : `${materials.length} items`}
                              </span>
                            </div>
                            {/* ── 단계 분리 안내 (인테리어 vs 공급처·장비) ── */}
                            <div style={{
                              fontSize: "12.5px",
                              color: "rgba(180,100,0,0.85)",
                              lineHeight: 1.55,
                              padding: "10px 14px",
                              borderRadius: "12px",
                              background: "rgba(255,149,0,0.08)",
                              marginBottom: "12px",
                            }}>
                              {language === "ko"
                                ? "💡 이 단계는 건물에 부착·고정되는 마감재(타일·페인트), 건축 설비(후드·배관·전기), 매장 가구(카운터·진열대·거울)만 다룹니다. 운영 장비(커피머신·오븐·POS·기계류)는 다음 단계 「공급처 및 장비 확정」에서 결정합니다."
                                : "💡 This stage covers only finishes (tiles, paint), fixtures (hood, plumbing, electrical), and store furniture (counter, displays, mirrors). Operating equipment (coffee machines, ovens, POS, machinery) is handled in the next stage 'Supply & Equipment'."}
                            </div>
                            {/* 단일 컨테이너 카드 — Apple grouped list 스타일 */}
                            <div style={{
                              background: "white",
                              borderRadius: "20px",
                              overflow: "hidden",
                              boxShadow: "0 2px 16px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04)",
                            }}>
                              {materials.map((m, i) => {
                                const color = iconColors[i % iconColors.length];
                                return (
                                  <div key={m.name}>
                                    {i > 0 && (
                                      /* inset hairline divider — 아이콘 오른쪽에서 시작 */
                                      <div style={{
                                        height: "0.5px",
                                        background: "rgba(0,0,0,0.08)",
                                        marginLeft: "68px",
                                      }} />
                                    )}
                                    <div style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "14px",
                                      padding: "13px 18px",
                                    }}>
                                      {/* 시멘틱 컬러 아이콘 배지 */}
                                      <div style={{
                                        width: "38px",
                                        height: "38px",
                                        borderRadius: "10px",
                                        background: color.bg,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        flexShrink: 0,
                                        color: color.fg,
                                      }}>
                                        <m.icon size={18} strokeWidth={1.5} />
                                      </div>
                                      <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: "14px", fontWeight: 590, color: "var(--text)", letterSpacing: "-0.3px", marginBottom: "2px" }}>
                                          {m.name}
                                        </div>
                                        <div style={{ fontSize: "12.5px", color: "rgba(0,0,0,0.45)", lineHeight: 1.45 }}>
                                          {m.desc}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}

                      {/* ── 공간 디자인 컨셉 ── */}
                      {(() => {
                        // Apple 시스템 컬러 — 컨셉 카드용
                        const conceptColors = [
                          { bg: "rgba(59,92,140,0.1)",   fg: "rgb(59,92,140)"   }, // blue
                          { bg: "rgba(29,53,87,0.1)",   fg: "rgb(29,53,87)"   }, // green
                          { bg: "rgba(255,149,0,0.1)",   fg: "rgb(210,120,0)"   }, // orange
                          { bg: "rgba(88,86,214,0.12)",  fg: "rgb(88,86,214)"   }, // indigo
                        ];
                        return (
                          <div style={{ marginBottom: "28px" }}>
                            <div style={{ marginBottom: "6px" }}>
                              <span style={{ fontSize: "15px", fontWeight: 600, color: "var(--text)", letterSpacing: "-0.02em" }}>
                                {language === "ko" ? "공간 디자인 컨셉" : "Design Concept"}
                              </span>
                            </div>
                            <div style={{ fontSize: "13px", color: "rgba(0,0,0,0.4)", marginBottom: "14px", lineHeight: 1.5 }}>
                              {language === "ko" ? "방향을 선택해두면 업체 미팅 때 기준점이 됩니다." : "Choose a direction to guide contractor meetings."}
                            </div>

                            {/* 2열 그리드 */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                              {concepts.map((c, i) => {
                                const picked = selectedInteriorConcept === c.id;
                                const color = conceptColors[i % conceptColors.length];
                                return (
                                  <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => setSelectedInteriorConcept(picked ? null : c.id)}
                                    style={{
                                      display: "flex",
                                      flexDirection: "column",
                                      alignItems: "flex-start",
                                      padding: "16px",
                                      borderRadius: "20px",
                                      border: "none",
                                      outline: picked ? "2.5px solid var(--primary)" : "none",
                                      background: picked ? "white" : "white",
                                      textAlign: "left",
                                      cursor: "pointer",
                                      boxShadow: picked
                                        ? "0 4px 20px rgba(0,0,0,0.1)"
                                        : "0 2px 12px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.04)",
                                      transition: "box-shadow 0.18s ease, outline 0.18s ease",
                                      position: "relative",
                                    }}
                                  >
                                    {/* 아이콘 배지 (상단) */}
                                    <div style={{
                                      width: "48px",
                                      height: "48px",
                                      borderRadius: "14px",
                                      background: picked
                                        ? color.bg.replace("0.1", "0.18").replace("0.12", "0.2")
                                        : color.bg,
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      marginBottom: "12px",
                                      color: color.fg,
                                      transition: "background 0.18s ease",
                                    }}>
                                      <c.icon size={22} strokeWidth={1.5} />
                                    </div>

                                    {/* 제목 */}
                                    <div style={{
                                      fontSize: "13.5px",
                                      fontWeight: 640,
                                      color: "var(--text)",
                                      letterSpacing: "-0.3px",
                                      marginBottom: "5px",
                                      lineHeight: 1.3,
                                    }}>
                                      {c.name}
                                    </div>

                                    {/* 설명 */}
                                    <div style={{
                                      fontSize: "12px",
                                      color: "rgba(0,0,0,0.42)",
                                      lineHeight: 1.5,
                                      marginBottom: "10px",
                                      flex: 1,
                                    }}>
                                      {c.desc}
                                    </div>

                                    {/* 태그 */}
                                    <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                                      {c.tags.slice(0, 2).map((t) => (
                                        <span key={t} style={{
                                          fontSize: "10.5px",
                                          fontWeight: 500,
                                          padding: "2px 8px",
                                          borderRadius: "100px",
                                          background: picked
                                            ? color.bg.replace("0.1", "0.14").replace("0.12", "0.16")
                                            : "rgba(0,0,0,0.05)",
                                          color: picked ? color.fg : "rgba(0,0,0,0.4)",
                                          transition: "background 0.18s ease, color 0.18s ease",
                                        }}>{t}</span>
                                      ))}
                                    </div>

                                    {/* 선택됐을 때 우측 상단 체크 */}
                                    {picked && (
                                      <div style={{
                                        position: "absolute",
                                        top: "14px",
                                        right: "14px",
                                        width: "20px",
                                        height: "20px",
                                        borderRadius: "50%",
                                        background: "var(--primary)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                      }}>
                                        <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                                          <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                      </div>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}

                      {/* ── 2026 트렌드 · 추천 가구/브랜드 · 특화 업체 ── */}
                      {(() => {
                        const i2026 = selectedIndustryId ? SUB_INDUSTRY_INTERIOR_2026[selectedIndustryId] : undefined;
                        if (!i2026) return null;
                        const yearColors = [
                          { bg: "rgba(59,92,140,0.1)",   fg: "rgb(59,92,140)"   },
                          { bg: "rgba(29,53,87,0.1)",   fg: "rgb(29,53,87)"   },
                          { bg: "rgba(255,149,0,0.1)",   fg: "rgb(210,120,0)"   },
                          { bg: "rgba(88,86,214,0.12)",  fg: "rgb(88,86,214)"   },
                          { bg: "rgba(90,200,250,0.14)", fg: "rgb(0,160,210)"   },
                          { bg: "rgba(255,45,85,0.1)",   fg: "rgb(220,40,75)"   },
                        ];
                        const sectionTitle: CSSProperties = { fontSize: "15px", fontWeight: 600, color: "var(--text)", letterSpacing: "-0.02em" };
                        const card: CSSProperties = { background: "white", borderRadius: "20px", overflow: "hidden", boxShadow: "0 2px 16px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04)" };
                        const hairline = (i: number) => i > 0 ? <div style={{ height: "0.5px", background: "rgba(0,0,0,0.08)", marginLeft: "18px" }} /> : null;
                        return (
                          <div style={{ marginBottom: "28px" }}>
                            <div style={{ marginBottom: "6px" }}>
                              <span style={sectionTitle}>
                                {language === "ko" ? "2026 트렌드 · 추천 가구 · 특화 업체" : "2026 Trends · Furniture · Specialists"}
                              </span>
                            </div>
                            <div style={{ fontSize: "12.5px", color: "rgba(180,100,0,0.85)", lineHeight: 1.55, padding: "10px 14px", borderRadius: "12px", background: "rgba(255,149,0,0.08)", marginBottom: "14px" }}>
                              {language === "ko"
                                ? "💡 광고가 아닌 참고용 자료입니다. 브랜드·업체·가격은 시점에 따라 변하니 발주·계약 전 직접 검증하세요. 프랜차이즈는 본사 표준 사양이 우선입니다."
                                : "💡 Reference only, not advertising. Brands, firms and prices change over time — verify directly before ordering or signing. For franchises, HQ standard specs take priority."}
                            </div>

                            {/* 2026 컬러 + 트렌드 */}
                            <div style={{ ...card, marginBottom: "12px" }}>
                              {i2026.colorTrend2026 && (
                                <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", padding: "14px 18px" }}>
                                  <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: yearColors[3].bg, color: yearColors[3].fg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                    <Palette size={18} strokeWidth={1.5} />
                                  </div>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: "11px", fontWeight: 600, color: yearColors[3].fg, letterSpacing: "0.02em", marginBottom: "2px" }}>
                                      {language === "ko" ? "2026 컬러 트렌드" : "2026 Color Trend"}
                                    </div>
                                    <div style={{ fontSize: "14px", fontWeight: 590, color: "var(--text)", letterSpacing: "-0.3px", marginBottom: "3px" }}>{i2026.colorTrend2026.nameKo}</div>
                                    <div style={{ fontSize: "12.5px", color: "rgba(0,0,0,0.5)", lineHeight: 1.5 }}>{i2026.colorTrend2026.descKo}</div>
                                    <div style={{ fontSize: "11px", color: "rgba(0,0,0,0.32)", marginTop: "4px" }}>출처 · {i2026.colorTrend2026.sourceKo}</div>
                                  </div>
                                </div>
                              )}
                              {i2026.trends2026.map((t, i) => {
                                const color = yearColors[(i + 4) % yearColors.length];
                                return (
                                  <div key={t.titleKo}>
                                    {(i > 0 || i2026.colorTrend2026) && <div style={{ height: "0.5px", background: "rgba(0,0,0,0.08)", marginLeft: "68px" }} />}
                                    <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", padding: "13px 18px" }}>
                                      <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: color.bg, color: color.fg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                        <Sparkles size={18} strokeWidth={1.5} />
                                      </div>
                                      <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: "14px", fontWeight: 590, color: "var(--text)", letterSpacing: "-0.3px", marginBottom: "2px" }}>{t.titleKo}</div>
                                        <div style={{ fontSize: "12.5px", color: "rgba(0,0,0,0.5)", lineHeight: 1.5 }}>{t.descKo}</div>
                                        <div style={{ fontSize: "11px", color: "rgba(0,0,0,0.32)", marginTop: "4px" }}>출처 · {t.sourceKo}</div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* 추천 가구 · 용품 */}
                            {i2026.furniture.length > 0 && (
                              <>
                                <div style={{ fontSize: "13px", fontWeight: 600, color: "rgba(0,0,0,0.55)", margin: "16px 2px 8px" }}>
                                  {language === "ko" ? "추천 가구 · 용품" : "Recommended Furniture"}
                                </div>
                                <div style={{ ...card, marginBottom: "12px" }}>
                                  {i2026.furniture.map((f, i) => (
                                    <div key={f.itemKo}>
                                      {hairline(i)}
                                      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", padding: "12px 18px" }}>
                                        <Box size={16} strokeWidth={1.6} style={{ color: "rgba(0,0,0,0.32)", flexShrink: 0, marginTop: "2px" }} />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                          <div style={{ fontSize: "13.5px", fontWeight: 580, color: "var(--text)", letterSpacing: "-0.2px", marginBottom: "2px" }}>{f.itemKo}</div>
                                          <div style={{ fontSize: "12.5px", color: "rgba(0,0,0,0.45)", lineHeight: 1.45 }}>{f.descKo}</div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </>
                            )}

                            {/* 추천 가구 브랜드 */}
                            {i2026.furnitureBrands.length > 0 && (
                              <>
                                <div style={{ fontSize: "13px", fontWeight: 600, color: "rgba(0,0,0,0.55)", margin: "16px 2px 8px" }}>
                                  {language === "ko" ? "추천 가구 · 집기 브랜드" : "Furniture Brands"}
                                </div>
                                <div style={{ ...card, marginBottom: "12px" }}>
                                  {i2026.furnitureBrands.map((b, i) => (
                                    <div key={b.nameKo}>
                                      {hairline(i)}
                                      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", padding: "12px 18px" }}>
                                        <Store size={16} strokeWidth={1.6} style={{ color: "rgb(29,53,87)", flexShrink: 0, marginTop: "2px" }} />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                          <div style={{ fontSize: "13.5px", fontWeight: 580, color: "var(--text)", letterSpacing: "-0.2px", marginBottom: "2px" }}>{b.nameKo}</div>
                                          <div style={{ fontSize: "12.5px", color: "rgba(0,0,0,0.45)", lineHeight: 1.45 }}>{b.noteKo}</div>
                                          {b.sourceKo && <div style={{ fontSize: "11px", color: "rgba(0,0,0,0.3)", marginTop: "3px" }}>{b.sourceKo}</div>}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </>
                            )}

                            {/* 업종 특화 인테리어 업체 */}
                            {i2026.specialistFirms && i2026.specialistFirms.length > 0 && (
                              <>
                                <div style={{ fontSize: "13px", fontWeight: 600, color: "rgba(0,0,0,0.55)", margin: "16px 2px 8px" }}>
                                  {language === "ko" ? "업종 특화 인테리어 업체 · 플랫폼" : "Specialist Firms · Platforms"}
                                </div>
                                <div style={{ ...card }}>
                                  {i2026.specialistFirms.map((s, i) => (
                                    <div key={s.nameKo}>
                                      {hairline(i)}
                                      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", padding: "12px 18px" }}>
                                        <Building2 size={16} strokeWidth={1.6} style={{ color: "rgb(88,86,214)", flexShrink: 0, marginTop: "2px" }} />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                          <div style={{ display: "flex", alignItems: "baseline", gap: "8px", flexWrap: "wrap", marginBottom: "2px" }}>
                                            <span style={{ fontSize: "13.5px", fontWeight: 580, color: "var(--text)", letterSpacing: "-0.2px" }}>{s.nameKo}</span>
                                            <span style={{ fontSize: "11px", color: "rgb(88,86,214)", background: "rgba(88,86,214,0.1)", borderRadius: "6px", padding: "1px 6px" }}>{s.typeKo}</span>
                                          </div>
                                          <div style={{ fontSize: "12.5px", color: "rgba(0,0,0,0.45)", lineHeight: 1.45 }}>{s.noteKo}</div>
                                          {s.sourceKo && <div style={{ fontSize: "11px", color: "rgba(0,0,0,0.3)", marginTop: "3px" }}>{s.sourceKo}</div>}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </>
                            )}

                            {/* caveat */}
                            <div style={{ fontSize: "11.5px", color: "rgba(0,0,0,0.38)", lineHeight: 1.5, marginTop: "10px", padding: "0 2px" }}>
                              {i2026.caveatKo}
                            </div>
                          </div>
                        );
                      })()}

                      {/* ── 인테리어 업체 추천 ── */}
                      {/* 본사 지정 시공(strict) 프랜차이즈 → 업체 검색 대신 본사 문의 안내 */}
                      {franchiseData?.flexibility === "strict" ? (() => {
                        const brand = selectedFranchiseBrandId ? getFranchiseBrandById(selectedFranchiseBrandId) : undefined;
                        const brandName = brand ? brand.name[language] : (language === "ko" ? "본사" : "the franchise HQ");
                        return (
                          <div style={{ marginBottom: "24px" }}>
                            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "14px" }}>
                              <span style={{ fontSize: "15px", fontWeight: 600, color: "var(--text)", letterSpacing: "-0.01em" }}>
                                {language === "ko" ? "인테리어 업체" : "Interior Contractor"}
                              </span>
                              <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                                {language === "ko" ? "본사 지정" : "HQ-mandated"}
                              </span>
                            </div>
                            <div style={{
                              background: "linear-gradient(180deg, #f7f9fc 0%, #ffffff 100%)",
                              border: "1px solid rgba(25,25,112,0.10)",
                              borderRadius: "20px",
                              padding: "22px 20px",
                              boxShadow: "0 2px 16px rgba(0,0,0,0.05), 0 1px 4px rgba(0,0,0,0.03)",
                              display: "flex",
                              gap: "14px",
                              alignItems: "flex-start",
                            }}>
                              <div style={{
                                width: "40px",
                                height: "40px",
                                borderRadius: "12px",
                                background: "rgba(25,25,112,0.08)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                                color: "#191970",
                              }}>
                                <Building2 size={20} strokeWidth={1.8} />
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: "14.5px", fontWeight: 600, color: "var(--text)", letterSpacing: "-0.01em", marginBottom: "6px" }}>
                                  {language === "ko"
                                    ? `${brandName} 본사가 지정 업체로 시공합니다`
                                    : `${brandName} HQ uses its mandated contractor`}
                                </div>
                                <div style={{ fontSize: "13px", color: "rgba(0,0,0,0.55)", lineHeight: 1.55, marginBottom: "10px" }}>
                                  {language === "ko"
                                    ? "외부 업체 견적·시공이 불가능합니다. 도면·자재·집기 모두 본사가 일괄 공급하므로, 시공 일정·비용 분담은 본사 가맹 담당자와 직접 협의하세요."
                                    : "External contractors are not allowed. All drawings, materials and equipment are supplied by HQ. Discuss timing and cost-sharing with your HQ franchise manager."}
                                </div>
                                <div style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "6px",
                                  fontSize: "12.5px",
                                  fontWeight: 600,
                                  padding: "7px 14px",
                                  borderRadius: "100px",
                                  background: "rgba(25,25,112,0.08)",
                                  color: "#191970",
                                  letterSpacing: "-0.01em",
                                }}>
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 .01h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
                                  </svg>
                                  {language === "ko" ? "본사 가맹 담당자에게 문의" : "Contact HQ franchise manager"}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })() : (
                      <div style={{ marginBottom: "24px" }}>
                        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "14px" }}>
                          <span style={{ fontSize: "15px", fontWeight: 600, color: "var(--text)", letterSpacing: "-0.01em" }}>
                            {language === "ko" ? `${regionLabel} 인테리어 업체` : "Local Contractors"}
                          </span>
                          {contractors.length > 0 && (
                            <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                              {language === "ko" ? "AI 웹 검색 기반" : "via AI search"}
                            </span>
                          )}
                        </div>

                        {contractorsLoading ? (
                          /* 로딩 — Apple shimmer 스켈레톤 */
                          <div style={{
                            background: "white",
                            borderRadius: "20px",
                            overflow: "hidden",
                            boxShadow: "0 2px 16px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04)",
                          }}>
                            {[0, 1, 2].map((i) => (
                              <div key={i}>
                                {i > 0 && <div style={{ height: "0.5px", background: "rgba(0,0,0,0.07)", marginLeft: "68px" }} />}
                                <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "14px 18px" }}>
                                  <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "rgba(0,0,0,0.05)", flexShrink: 0 }} />
                                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "7px" }}>
                                    <div style={{ height: "13px", width: "50%", borderRadius: "6px", background: "rgba(0,0,0,0.05)" }} />
                                    <div style={{ height: "11px", width: "80%", borderRadius: "6px", background: "rgba(0,0,0,0.04)" }} />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : contractors.length > 0 ? (
                          /* 업체 목록 — Apple grouped list */
                          <div style={{
                            background: "white",
                            borderRadius: "20px",
                            overflow: "hidden",
                            boxShadow: "0 2px 16px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04)",
                          }}>
                            {contractors.map((c, i) => (
                              <div key={c.id}>
                                {i > 0 && <div style={{ height: "0.5px", background: "rgba(0,0,0,0.08)", marginLeft: "68px" }} />}
                                <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "13px 18px" }}>

                                  {/* 순위 배지 — Apple blue tint */}
                                  <div style={{
                                    width: "38px",
                                    height: "38px",
                                    borderRadius: "10px",
                                    background: "rgba(59,92,140,0.1)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                    fontSize: "15px",
                                    fontWeight: 700,
                                    color: "rgb(59,92,140)",
                                    letterSpacing: "-0.5px",
                                  }}>
                                    {i + 1}
                                  </div>

                                  {/* 텍스트 */}
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: "14px", fontWeight: 590, color: "var(--text)", letterSpacing: "-0.3px", marginBottom: "2px" }}>
                                      {c.name}
                                    </div>
                                    {c.description && (
                                      <div style={{ fontSize: "12px", color: "rgba(0,0,0,0.45)", lineHeight: 1.45, marginBottom: "2px" }}>
                                        {c.description}
                                      </div>
                                    )}
                                    {c.address && (
                                      <div style={{ fontSize: "11.5px", color: "rgba(0,0,0,0.28)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {c.address}
                                      </div>
                                    )}
                                  </div>

                                  {/* 액션 버튼 — 전화 / 지도 */}
                                  <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                                    {c.phone && (
                                      <a
                                        href={`tel:${c.phone}`}
                                        style={{
                                          width: "32px",
                                          height: "32px",
                                          borderRadius: "50%",
                                          background: "rgba(59,92,140,0.1)",
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          color: "rgb(59,92,140)",
                                        }}
                                      >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                          <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 .01h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
                                        </svg>
                                      </a>
                                    )}
                                    {c.mapUrl ? (
                                      <a
                                        href={c.mapUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                          width: "32px",
                                          height: "32px",
                                          borderRadius: "50%",
                                          background: "rgba(29,53,87,0.1)",
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          color: "rgb(29,53,87)",
                                        }}
                                      >
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                                        </svg>
                                      </a>
                                    ) : (
                                      <div style={{
                                        width: "32px",
                                        height: "32px",
                                        borderRadius: "50%",
                                        background: "rgba(0,0,0,0.04)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color: "rgba(0,0,0,0.2)",
                                      }}>
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                                        </svg>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : preferredRegion ? (
                          /* 결과 없음 → 재시도 */
                          <div style={{
                            background: "white",
                            borderRadius: "20px",
                            padding: "28px 20px",
                            boxShadow: "0 2px 16px rgba(0,0,0,0.07)",
                            textAlign: "center",
                          }}>
                            <div style={{ fontSize: "13px", color: "rgba(0,0,0,0.4)", marginBottom: "16px" }}>
                              {language === "ko" ? "업체 정보를 불러오지 못했어요." : "Couldn't load contractor info."}
                            </div>
                            <button
                              type="button"
                              onClick={() => setContractorsRetryKey((k) => k + 1)}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                fontSize: "13px",
                                fontWeight: 600,
                                padding: "9px 20px",
                                borderRadius: "100px",
                                background: "rgba(59,92,140,0.1)",
                                color: "rgb(59,92,140)",
                                border: "none",
                                cursor: "pointer",
                              }}
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>
                              </svg>
                              {language === "ko" ? "다시 검색" : "Retry"}
                            </button>
                          </div>
                        ) : (
                          /* 상권 미설정 */
                          <div style={{
                            background: "white",
                            borderRadius: "20px",
                            padding: "28px 20px",
                            boxShadow: "0 2px 16px rgba(0,0,0,0.07)",
                            textAlign: "center",
                          }}>
                            <div style={{ fontSize: "13px", color: "rgba(0,0,0,0.4)", lineHeight: 1.6 }}>
                              {language === "ko" ? "상권을 설정하면 근처 업체를 자동으로 찾아드려요." : "Set your area to find nearby contractors."}
                            </div>
                          </div>
                        )}

                        {/* 견적 팁 — Apple inline info style */}
                        <div style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "8px",
                          padding: "12px 14px",
                          borderRadius: "12px",
                          background: "rgba(59,92,140,0.06)",
                          marginTop: "10px",
                        }}>
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: "1px" }}>
                            <circle cx="7" cy="7" r="6" stroke="rgb(59,92,140)" strokeWidth="1.4"/>
                            <path d="M7 6v4M7 4.5v.5" stroke="rgb(59,92,140)" strokeWidth="1.4" strokeLinecap="round"/>
                          </svg>
                          <span style={{ fontSize: "12.5px", color: "rgba(0,80,200,0.75)", lineHeight: 1.5 }}>
                            {language === "ko"
                              ? "최소 2~3곳 견적을 비교하고, 견적서에 자재 사양·브랜드·규격이 명시됐는지 확인하세요."
                              : "Compare 2–3 quotes and verify material brand, grade, and dimensions are specified."}
                          </span>
                        </div>
                      </div>
                      )}

                      <StageWrapup
                        ko={language === "ko"}
                        nextStageLabelKo="공급처·장비 발주"
                        doneItemsKo={[
                          { label: "1. 인테리어 컨셉 확정", detail: "업종·프랜차이즈 데이터 기반 자재·컨셉 후보 비교 후 1안 결정" },
                          { label: "2. 시공업체 견적 요청", detail: "지역·키워드 매칭 시공업체 2~3곳에 동시 견적 요청" },
                          { label: "3. 자재·등급 명시", detail: "견적서에 자재 브랜드·등급·규격·면적 4항목 모두 명시 확인" },
                          { label: "4. 일정·계약 확정", detail: "착공·중간점검·완공 3단계 일정 + 하자보증 1년 명문화" },
                        ]}
                        verifyItemsKo={[
                          "소방·전기·가스 사전 신고 확인 — 다중이용시설은 소방시설완비증명서·전기안전점검·가스공급 3종 미준수 시 영업불가",
                          "방염 처리 의무 — 휴게/일반음식점·노래방·미용실 등 다중이용시설은 벽지·천장재 방염필증 필수 (위반 시 영업정지)",
                          "공사대금 — 30% 계약·40% 중간·30% 잔금 분할 + 하자보증 1년 계약서 명문화 (사진·영상 보관)",
                          "공사 중 추가공사 단가 — 평당 단가 사전 합의 없이 진행 시 마감 시 분쟁 1순위 원인",
                          "임대인 원상복구 의무 — 인테리어 잔존물 처리 비용·기준 사전 합의 (계약서 또는 사진 기록)",
                          "전기 용량·하수 용량 — 식음료·미용·헬스 등 사용량이 큰 업종은 사전 증설 신청 필수 (한전 평균 2~4주)",
                        ]}
                        nextSummaryKo="인테리어 컨셉·견적·자재 확정 → 공급처·장비 발주 단계로 진입"
                      />
                    </>
                  );

}
