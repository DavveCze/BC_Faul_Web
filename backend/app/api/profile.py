from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.models.base import get_db
from app.models.entities import SessionEntity, StudentProfileEntity
from app.schemas.dto import StudentProfileCreate, ParseStagTextRequest
from app.services.stag_parser import parse_stag_pdf, parse_stag_text

router = APIRouter(prefix="/profile", tags=["Profile"])

@router.post("/upload-stag")
async def upload_stag_file(file: UploadFile = File(...)):
    """
    Nahraje a zanalyzuje export ze STAGu (PDF nebo textový výpis).
    """
    try:
        content = await file.read()
        filename_lower = (file.filename or "").lower()
        
        if filename_lower.endswith(".pdf") or file.content_type == "application/pdf":
            parsed = parse_stag_pdf(content)
        else:
            text = content.decode("utf-8", errors="replace")
            parsed = parse_stag_text(text)

        return parsed
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Chyba při čtení exportu STAG: {str(e)}")

@router.post("/parse-stag-text")
def parse_stag_text_endpoint(req: ParseStagTextRequest):
    """
    Naparsuje zkopírovaný text z tabulky IS/STAG portálu.
    """
    try:
        return parse_stag_text(req.raw_text)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Chyba při parsování textu STAG: {str(e)}")

@router.post("")
def save_profile(req: StudentProfileCreate, db: Session = Depends(get_db)):
    session = db.query(SessionEntity).filter(SessionEntity.session_code == req.session_code).first()
    if not session:
        raise HTTPException(status_code=404, detail="Sezení s tímto kódem neexistuje")

    existing = db.query(StudentProfileEntity).filter(StudentProfileEntity.session_code == req.session_code).first()
    
    courses_data = [c.dict() for c in req.completed_courses] if req.completed_courses else []

    if existing:
        existing.riasec = req.riasec
        existing.career_anchors = req.career_anchors
        existing.problem_solving_style = req.problem_solving_style
        existing.orientation_type = req.orientation_type
        existing.output_type = req.output_type
        existing.supervision_preference = req.supervision_preference
        existing.completed_courses = courses_data
        existing.hobby_keywords = req.hobby_keywords or []
    else:
        entity = StudentProfileEntity(
            session_code=req.session_code,
            riasec=req.riasec,
            career_anchors=req.career_anchors,
            problem_solving_style=req.problem_solving_style,
            orientation_type=req.orientation_type,
            output_type=req.output_type,
            supervision_preference=req.supervision_preference,
            completed_courses=courses_data,
            hobby_keywords=req.hobby_keywords or []
        )
        db.add(entity)

    db.commit()
    return {"status": "ok", "session_code": req.session_code}
