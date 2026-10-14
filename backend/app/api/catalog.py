from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.models.base import get_db
from app.models.entities import TopicEntity, CourseEntity

router = APIRouter(tags=["Catalog"])

@router.get("/topics")
def list_topics(db: Session = Depends(get_db)):
    topics = db.query(TopicEntity).filter(TopicEntity.is_active == True).all()
    return [{
        "id": t.id,
        "code": t.code,
        "title": t.title,
        "supervisor_name": t.supervisor_name,
        "description": t.description,
        "difficulty": t.difficulty,
        "keywords": [k.strip() for k in (t.keywords or "").split(",") if k.strip()],
        "profile_dimensions": t.profile_dimensions
    } for t in topics]

@router.get("/courses")
def list_courses(db: Session = Depends(get_db)):
    courses = db.query(CourseEntity).all()
    return [{
        "id": c.id,
        "code": c.code,
        "name": c.name,
        "syllabus_text": c.syllabus_text,
        "credits": c.credits
    } for c in courses]
