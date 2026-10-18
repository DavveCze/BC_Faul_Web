export interface TopicItem {
  id: number;
  code: string;
  title: string;
  supervisor_name: string;
  description: string;
  difficulty: number;
  keywords: string[];
  profile_dimensions: Record<string, any>;
}

export interface CourseItem {
  id: number;
  code: string;
  name: string;
  syllabus_text: string;
  credits: number;
}

export interface CompletedCourseInput {
  code: string;
  grade: string;
  name?: string;
  credits?: number;
  statut?: string;
  exam_type?: string;
  is_passed?: boolean;
}

export interface ParsedStagCourse {
  code: string;
  name: string;
  year?: string;
  semester?: string;
  credits: number;
  statut: string;
  grade: string;
  exam_type?: string;
  is_passed: boolean;
}

export interface StagParseResult {
  study?: {
    program: string | null;
    study_form: string | null;
  };
  summary: {
    total_courses: number;
    passed_courses: number;
    total_credits: number;
    kip_courses_count: number;
  };
  courses: ParsedStagCourse[];
}

export interface StudentProfileData {
  riasec: {
    R: number;
    I: number;
    A: number;
    S: number;
    E: number;
    C: number;
  };
  career_anchors: Record<string, number>;
  problem_solving_style: number; // 0-1
  orientation_type: number; // 0-1
  output_type: number; // 0-1
  supervision_preference: number; // 0-1
  completed_courses?: CompletedCourseInput[];
  hobby_keywords?: string[];
}

export interface RecommendationResult {
  topic_id: number;
  code: string;
  title: string;
  supervisor_name: string;
  description: string;
  difficulty: number;
  keywords: string[];
  total_score: number;
  s_exp: number;
  s_cont: number;
  s_kw: number;
  contrib_exp: number;
  contrib_cont: number;
  contrib_kw: number;
  matched_keywords: string[];
  explanation_text: string;
}

export interface RecommendationsResponse {
  session_code: string;
  alpha: number;
  beta: number;
  gamma: number;
  recommendations: RecommendationResult[];
}

export interface PreTestData {
  session_code: string;
  study_program: string;
  study_year: string;
  study_form: string;
  gender: string;
  age?: number;
  current_thesis_state: string;
  selection_method: string;
  decision_certainty_pre: number;
  self_efficacy_score: number;
  responses_block_a_g?: Record<string, any>;
}

export interface PostTestData {
  session_code: string;
  decision_certainty_post: number;
  sus_scores: Record<string, number>;
  tam_scores: Record<string, number>;
  explanation_clarity: number;
  topic_relevance: number;
  feedback_comment?: string;
}

export interface AdminStatsData {
  total_sessions: number;
  completed_pre_tests: number;
  completed_post_tests: number;
  average_sus_score: number;
  average_pre_certainty: number;
  average_post_certainty: number;
  average_certainty_gain: number;
  h1_correlation_estimate: number | null;
  h2_effect_size_dz: number | null;
}

export interface AdminSessionItem {
  session_code: string;
  created_at: string;
  mode: string;
  has_pre: boolean;
  has_profile: boolean;
  has_post: boolean;
  decision_certainty_pre: number | null;
  decision_certainty_post: number | null;
  sus_score: number | null;
}

export interface EvaluationChartsData {
  total_completed: number;
  sus_benchmark_avg: number;
  sus_histogram: {
    under_50: number;
    '50_to_68': number;
    '68_to_80': number;
    over_80: number;
  };
  sus_items_avg: Record<string, number>;
  tam_pu_avg: number;
  tam_peou_avg: number;
  tam_items_avg: Record<string, number>;
  certainty_pre_avg: number;
  certainty_post_avg: number;
  certainty_gain_avg: number;
  effect_size_dz: number | null;
  certainty_pairs: Array<{
    code: string;
    pre: number;
    post: number;
    diff: number;
  }>;
  riasec_means: Record<string, number>;
  latex_table_code: string;
}
