from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field

# --- Session ---
class SessionInitRequest(BaseModel):
    mode: str = Field(default="pilot", description="pilot nebo demo")

class SessionInitResponse(BaseModel):
    session_code: str
    mode: str

# --- Pre-Test ---
class PreTestCreate(BaseModel):
    session_code: str
    study_program: Optional[str] = None
    study_year: Optional[str] = None
    study_form: Optional[str] = None
    gender: Optional[str] = None
    age: Optional[int] = None
    current_thesis_state: Optional[str] = None
    selection_method: Optional[str] = None
    decision_certainty_pre: int = Field(..., ge=0, le=10, description="Rozhodovací jistota před použitím (0-10)")
    self_efficacy_score: float = Field(default=0.5, ge=0.0, le=1.0, description="I_eff v intervalu [0, 1]")
    responses_block_a_g: Optional[Dict[str, Any]] = None

class PreTestResponse(BaseModel):
    status: str
    session_code: str
    self_efficacy_score: float

# --- Student Profile ---
class CompletedCourseItem(BaseModel):
    code: str
    grade: str # A, B, C, D, E, S, F
    name: Optional[str] = None
    credits: Optional[int] = None
    statut: Optional[str] = None
    exam_type: Optional[str] = None
    semester: Optional[str] = None
    year: Optional[str] = None
    is_passed: Optional[bool] = None

class ParseStagTextRequest(BaseModel):
    raw_text: str

class StudentProfileCreate(BaseModel):
    session_code: str
    # RIASEC dimenze (0.0 až 1.0)
    riasec: Dict[str, float] = Field(..., description="Klíče: R, I, A, S, E, C s hodnotami [0, 1]")
    # Scheinovy kotvy
    career_anchors: Dict[str, float] = Field(..., description="Kotvy např. TF (technicko-funkční), GM (manažerská), AU (autonomie)...")
    problem_solving_style: float = Field(0.5, ge=0.0, le=1.0, description="0=adaptivní, 1=inovativní")
    orientation_type: float = Field(0.5, ge=0.0, le=1.0, description="0=sociální/didaktická, 1=datově-technická")
    output_type: float = Field(0.5, ge=0.0, le=1.0, description="0=teoretická/analytická, 1=softwarový artefakt")
    supervision_preference: float = Field(0.5, ge=0.0, le=1.0, description="0=intenzivní vedení, 1=samostatnost")
    completed_courses: Optional[List[CompletedCourseItem]] = None
    hobby_keywords: Optional[List[str]] = None

# --- Recommendations ---
class RecommendationRequest(BaseModel):
    session_code: str
    top_k: int = Field(default=5, ge=3, le=5, description="Počet doporučených témat (3 až 5)")
    custom_alpha: Optional[float] = None
    custom_beta: Optional[float] = None
    custom_gamma: Optional[float] = None

class TopicRecommendationItem(BaseModel):
    topic_id: int
    code: str
    title: str
    supervisor_name: str
    description: str
    difficulty: float
    keywords: List[str]
    # Výsledná a dílčí skóre
    total_score: float
    s_exp: float
    s_cont: float
    s_kw: float
    # Vážené příspěvky pro vysvětlení
    contrib_exp: float
    contrib_cont: float
    contrib_kw: float
    # Šablonové zdůvodnění
    matched_keywords: List[str]
    explanation_text: str

class RecommendationResponse(BaseModel):
    session_code: str
    alpha: float
    beta: float
    gamma: float
    recommendations: List[TopicRecommendationItem]

# --- Post-Test ---
class PostTestCreate(BaseModel):
    session_code: str
    decision_certainty_post: int = Field(..., ge=0, le=10, description="Rozhodovací jistota po použití (0-10)")
    sus_scores: Dict[str, int] = Field(..., description="10 položek SUS škály s hodnotami 1-5")
    tam_scores: Dict[str, int] = Field(..., description="6 položek vnímané užitečnosti TAM s hodnotami 1-5")
    explanation_clarity: int = Field(..., ge=1, le=5, description="1=zcela nesrozumitelné, 5=zcela srozumitelné")
    topic_relevance: int = Field(..., ge=1, le=5, description="1=zcela nerelevantní, 5=velmi relevantní")
    feedback_comment: Optional[str] = None

class PostTestResponse(BaseModel):
    status: str
    session_code: str
    sus_final_score: float
    certainty_difference: int # post - pre posun

# --- Admin Stats & Management ---
class AdminSessionItem(BaseModel):
    session_code: str
    created_at: str
    mode: str
    has_pre: bool
    has_profile: bool
    has_post: bool
    decision_certainty_pre: Optional[int] = None
    decision_certainty_post: Optional[int] = None
    sus_score: Optional[float] = None

class AdminCleanupRequest(BaseModel):
    filter_type: str = Field(..., description="'empty', 'incomplete', 'demo' nebo 'all'")

class AdminCleanupResponse(BaseModel):
    status: str
    deleted_count: int
    remaining_count: int

class EvaluationChartsResponse(BaseModel):
    total_completed: int
    sus_benchmark_avg: float
    sus_histogram: Dict[str, int]
    sus_items_avg: Dict[str, float]
    tam_pu_avg: float
    tam_peou_avg: float
    tam_items_avg: Dict[str, float]
    certainty_pre_avg: float
    certainty_post_avg: float
    certainty_gain_avg: float
    effect_size_dz: Optional[float] = None
    certainty_pairs: List[Dict[str, Any]]
    riasec_means: Dict[str, float]
    latex_table_code: str

class AdminStatsResponse(BaseModel):
    total_sessions: int
    completed_pre_tests: int
    completed_post_tests: int
    average_sus_score: float
    average_pre_certainty: float
    average_post_certainty: float
    average_certainty_gain: float
    h1_correlation_estimate: Optional[float] = None
    h2_effect_size_dz: Optional[float] = None
