from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.models.base import Base

class SessionEntity(Base):
    __tablename__ = "sessions"

    session_code = Column(String(32), primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    mode = Column(String(16), default="pilot", nullable=False) # "pilot" nebo "demo"

    # Vazby
    pre_test = relationship("PreTestEntity", back_populates="session", uselist=False, cascade="all, delete-orphan")
    profile = relationship("StudentProfileEntity", back_populates="session", uselist=False, cascade="all, delete-orphan")
    recommendation_logs = relationship("RecommendationLogEntity", back_populates="session", cascade="all, delete-orphan")
    post_test = relationship("PostTestEntity", back_populates="session", uselist=False, cascade="all, delete-orphan")


class PreTestEntity(Base):
    __tablename__ = "pre_tests"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_code = Column(String(32), ForeignKey("sessions.session_code"), unique=True, nullable=False, index=True)
    
    # Demografické a kontextové položky (Část 1 dotazníku Přílohy A)
    study_program = Column(String(128), nullable=True)
    study_year = Column(String(64), nullable=True)
    study_form = Column(String(32), nullable=True) # Prezenční / Kombinovaná
    gender = Column(String(32), nullable=True)
    age = Column(Integer, nullable=True)
    current_thesis_state = Column(String(128), nullable=True)
    selection_method = Column(String(128), nullable=True)
    
    # Rozhodovací jistota před použitím (0-10)
    decision_certainty_pre = Column(Integer, nullable=False) # 0 až 10
    
    # Index výzkumné sebeúčinnosti I_eff z Bloku C (0-1)
    self_efficacy_score = Column(Float, nullable=False, default=0.5)
    
    # Kompletní odpovědi bloků A-G pro výzkumnou analýzu
    responses_block_a_g = Column(JSON, nullable=True)

    session = relationship("SessionEntity", back_populates="pre_test")


class StudentProfileEntity(Base):
    __tablename__ = "student_profiles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_code = Column(String(32), ForeignKey("sessions.session_code"), unique=True, nullable=False, index=True)
    
    # RIASEC (Realistic, Investigative, Artistic, Social, Enterprising, Conventional) v [0, 1]
    riasec = Column(JSON, nullable=False)
    
    # Scheinovy kariérní kotvy (vybrané 1-2 kotvy s normalizovanými vahami)
    career_anchors = Column(JSON, nullable=False)
    
    # Kognitivní styl a metodologie: adaptivní (0) vs. inovativní (1)
    problem_solving_style = Column(Float, nullable=False, default=0.5)
    
    # Orientace: sociálně-pedagogická (0) vs. datově-technická (1)
    orientation_type = Column(Float, nullable=False, default=0.5)
    
    # Typ výstupu práce: teoretická/analytická (0) vs. softwarový artefakt/aplikace (1)
    output_type = Column(Float, nullable=False, default=0.5)

    # Preference míry supervize: intenzivní vedení (0) vs. vysoká samostatnost (1)
    supervision_preference = Column(Float, nullable=False, default=0.5)
    
    # Volitelný modul 1: absolvované kurzy a známky [ {"code": "KIP/UPR1", "grade": "A"} ]
    completed_courses = Column(JSON, nullable=True)
    
    # Volitelný modul 2: klíčová slova mimostudijních zájmů ["web", "hry", "databáze"]
    hobby_keywords = Column(JSON, nullable=True)

    session = relationship("SessionEntity", back_populates="profile")


class TopicEntity(Base):
    __tablename__ = "topics"

    id = Column(Integer, primary_key=True, autoincrement=True)
    code = Column(String(32), unique=True, nullable=False, index=True) # např. "KIP-BP-01"
    title = Column(String(256), nullable=False)
    supervisor_name = Column(String(128), nullable=False)
    description = Column(Text, nullable=False)
    
    # Anotace profilových dimenzí t_{p,i} v [0, 1] (RIASEC, kotvy, styl, orientace, výstup, supervize)
    profile_dimensions = Column(JSON, nullable=False)
    
    # Metodologická náročnost tématu d_i v [0, 1] pro penalizaci
    difficulty = Column(Float, nullable=False, default=0.5)
    
    # Klíčová slova tématu a lemmatizovaný obsah
    keywords = Column(Text, nullable=True) # čárkami oddělená klíčová slova
    is_active = Column(Boolean, default=True, nullable=False)


class CourseEntity(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, autoincrement=True)
    code = Column(String(32), unique=True, nullable=False, index=True) # např. "KIP/UPR1"
    name = Column(String(128), nullable=False)
    syllabus_text = Column(Text, nullable=False)
    credits = Column(Integer, default=5, nullable=False)


class RecommendationLogEntity(Base):
    __tablename__ = "recommendation_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_code = Column(String(32), ForeignKey("sessions.session_code"), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Použité váhy
    alpha = Column(Float, nullable=False)
    beta = Column(Float, nullable=False)
    gamma = Column(Float, nullable=False)
    
    # Vypočtená doporučení (Top témat s rozpadem dílčích skóre a zdůvodněním)
    top_recommendations = Column(JSON, nullable=False)

    session = relationship("SessionEntity", back_populates="recommendation_logs")


class PostTestEntity(Base):
    __tablename__ = "post_tests"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_code = Column(String(32), ForeignKey("sessions.session_code"), unique=True, nullable=False, index=True)
    
    # Rozhodovací jistota po použití systému (0-10) pro párové testování H2
    decision_certainty_post = Column(Integer, nullable=False)
    
    # SUS škála (System Usability Scale) - 10 položek na pětibodové škále (1-5)
    sus_scores = Column(JSON, nullable=False)
    sus_final_score = Column(Float, nullable=False) # 0 až 100
    
    # TAM (Technology Acceptance Model) - 6 položek vnímané užitečnosti (1-5) dle Davis (1989)
    tam_scores = Column(JSON, nullable=False)
    
    # Srozumitelnost šablonového zdůvodnění (1-5)
    explanation_clarity = Column(Integer, nullable=False)
    
    # Celkové vnímané hodnocení relevance navržených témat (1-5)
    topic_relevance = Column(Integer, nullable=False)
    
    # Otevřená zpětná vazba a důvody spokojenosti/nespokojenosti
    feedback_comment = Column(Text, nullable=True)

    session = relationship("SessionEntity", back_populates="post_test")
