from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models.base import get_db
from app.models.entities import SessionEntity, StudentProfileEntity, PreTestEntity, TopicEntity, CourseEntity, RecommendationLogEntity
from app.schemas.dto import RecommendationRequest, RecommendationResponse, TopicRecommendationItem
from app.services.scorer import RecommenderEngine

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])

@router.post("", response_model=RecommendationResponse)
def get_recommendations(req: RecommendationRequest, db: Session = Depends(get_db)):
    session = db.query(SessionEntity).filter(SessionEntity.session_code == req.session_code).first()
    if not session:
        raise HTTPException(status_code=404, detail="Sezení s tímto kódem neexistuje")

    profile_entity = db.query(StudentProfileEntity).filter(StudentProfileEntity.session_code == req.session_code).first()
    if not profile_entity:
        raise HTTPException(status_code=400, detail="Profil studenta dosud nebyl uložen")

    pre_test = db.query(PreTestEntity).filter(PreTestEntity.session_code == req.session_code).first()
    self_efficacy = pre_test.self_efficacy_score if pre_test else 0.5

    # Načtení aktivních témat a kurzů z databáze
    topic_entities = db.query(TopicEntity).filter(TopicEntity.is_active == True).all()
    if not topic_entities:
        raise HTTPException(status_code=500, detail="V databázi nejsou žádná aktivní témata")

    topics_data = [{
        "id": t.id,
        "code": t.code,
        "title": t.title,
        "supervisor_name": t.supervisor_name,
        "description": t.description,
        "difficulty": t.difficulty,
        "keywords": t.keywords or "",
        "profile_dimensions": t.profile_dimensions
    } for t in topic_entities]

    course_entities = db.query(CourseEntity).all()
    courses_data = [{
        "code": c.code,
        "name": c.name,
        "syllabus_text": c.syllabus_text
    } for c in course_entities]

    engine = RecommenderEngine(topics=topics_data, courses=courses_data)

    student_profile_dict = {
        "riasec": profile_entity.riasec,
        "career_anchors": profile_entity.career_anchors,
        "problem_solving_style": profile_entity.problem_solving_style,
        "orientation_type": profile_entity.orientation_type,
        "output_type": profile_entity.output_type,
        "supervision_preference": profile_entity.supervision_preference,
        "completed_courses": profile_entity.completed_courses or [],
        "hobby_keywords": profile_entity.hobby_keywords or []
    }

    alpha, beta, gamma, top_results = engine.recommend(
        student_profile=student_profile_dict,
        self_efficacy=self_efficacy,
        top_k=req.top_k,
        custom_alpha=req.custom_alpha,
        custom_beta=req.custom_beta,
        custom_gamma=req.custom_gamma
    )

    # Uložení do RecommendationLogEntity
    log_entity = RecommendationLogEntity(
        session_code=req.session_code,
        alpha=alpha,
        beta=beta,
        gamma=gamma,
        top_recommendations=top_results
    )
    db.add(log_entity)
    db.commit()

    recommendation_items = [TopicRecommendationItem(**item) for item in top_results]

    return RecommendationResponse(
        session_code=req.session_code,
        alpha=round(alpha, 4),
        beta=round(beta, 4),
        gamma=round(gamma, 4),
        recommendations=recommendation_items
    )
