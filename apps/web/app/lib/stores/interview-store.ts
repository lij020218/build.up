import { create } from "zustand";
import { persist } from "zustand/middleware";

// ─── Types ───

/**
 * 단골/잠재고객 인터뷰 노트.
 *
 * 일반 업종(음식점·카페·뷰티 등) 사장님이 단골/이탈/신규/잠재 고객과 대화한 결과를 누적 기록.
 * Mom Test 원칙 (Rob Fitzpatrick) — 의견이 아닌 과거 행동을 묻기.
 *
 * AI 백엔드:
 *   - /api/ai/interview          → 인터뷰 가이드 질문 자동 생성 (interview/generate.ts)
 *   - /api/ai/interview/analyze  → 누적 노트 패턴 분석 (interview/analyze.ts)
 */
export type CustomerInterviewType = "regular" | "lapsed" | "new" | "potential";
//   regular   = 단골 (재방문 5회+)
//   lapsed    = 이탈 단골 (한동안 안 옴)
//   new       = 신규 (첫 방문)
//   potential = 잠재 (아직 방문 X, 길거리·SNS 인터뷰 등)

export type CustomerInterview = {
  id: string;
  date: string;            // ISO 날짜 (YYYY-MM-DD)
  type: CustomerInterviewType;
  customerName?: string;   // 손님 이름 (선택)
  notes: string;           // 인터뷰 내용 자유 텍스트
  /** AI 분석 결과 (한 인터뷰당 1회 생성, 패턴 분석은 누적 분석에서 별도) */
  aiInsight?: string;
  aiInsightAt?: string;
};

/** 누적 패턴 분석 결과 (전체 인터뷰 묶어서 1회 호출) */
export type InterviewPatternAnalysis = {
  generatedAt: string;
  interviewCount: number;       // 분석 시점 누적 인터뷰 수
  topPainPoints: string[];      // 자주 언급되는 페인 포인트 3-5개
  topMotivations: string[];     // 재방문 동기 3-5개
  segments: string[];           // 발견된 고객 세그먼트
  recommendations: string[];    // 사장님이 취할 액션 3-5개
};

type InterviewState = {
  customerInterviews: CustomerInterview[];
  patternAnalysis: InterviewPatternAnalysis | null;

  /** AI 인터뷰 가이드 입력 폼 (가장 최근 입력값 — 새로고침 후 유지) */
  guideTopic: string;        // "왜 우리 가게에 자주 오시나요" 같은 주제
  guideTargetType: CustomerInterviewType;
  generatedScript: string[]; // AI 생성된 질문 5-7개
};

type InterviewActions = {
  addInterview: (i: Omit<CustomerInterview, "id" | "date"> & { date?: string }) => void;
  updateInterview: (id: string, patch: Partial<CustomerInterview>) => void;
  removeInterview: (id: string) => void;
  /** Supabase 동기화에서 통째로 복원 시 사용 */
  setCustomerInterviews: (v: CustomerInterview[]) => void;
  setPatternAnalysis: (v: InterviewPatternAnalysis | null) => void;
  setGuideTopic: (v: string) => void;
  setGuideTargetType: (v: CustomerInterviewType) => void;
  setGeneratedScript: (v: string[]) => void;
  resetAll: () => void;
};

const initialState: InterviewState = {
  customerInterviews: [],
  patternAnalysis: null,
  guideTopic: "",
  guideTargetType: "regular",
  generatedScript: [],
};

export const useInterviewStore = create<InterviewState & InterviewActions>()(
  persist(
    (set) => ({
      ...initialState,
      addInterview: (input) =>
        set((s) => ({
          customerInterviews: [
            {
              id: `iv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              date: input.date ?? new Date().toISOString().slice(0, 10),
              ...input,
            },
            ...s.customerInterviews,
          ],
        })),
      updateInterview: (id, patch) =>
        set((s) => ({
          customerInterviews: s.customerInterviews.map((iv) =>
            iv.id === id ? { ...iv, ...patch } : iv
          ),
        })),
      removeInterview: (id) =>
        set((s) => ({
          customerInterviews: s.customerInterviews.filter((iv) => iv.id !== id),
        })),
      setCustomerInterviews: (v) => set({ customerInterviews: v }),
      setPatternAnalysis: (v) => set({ patternAnalysis: v }),
      setGuideTopic: (v) => set({ guideTopic: v }),
      setGuideTargetType: (v) => set({ guideTargetType: v }),
      setGeneratedScript: (v) => set({ generatedScript: v }),
      resetAll: () => set(initialState),
    }),
    {
      name: "buildup-customer-interviews",
      version: 1,
    }
  )
);
