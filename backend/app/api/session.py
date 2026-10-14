import random
import string
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models.base import get_db
from app.models.entities import SessionEntity
from app.schemas.dto import SessionInitRequest, SessionInitResponse

router = APIRouter(prefix="/session", tags=["Session"])

def generate_session_code() -> str:
    letters = ''.join(random.choices(string.ascii_uppercase, k=3))
    digits = ''.join(random.choices(string.digits, k=4))
    return f"STU-{letters}{digits}"

@router.post("/init", response_model=SessionInitResponse)
def init_session(req: SessionInitRequest, db: Session = Depends(get_db)):
    # Generování unikátního pseudonymního kódu dle Sekce 6.3 bpfaul.tex
    for _ in range(10):
        code = generate_session_code()
        if not db.query(SessionEntity).filter(SessionEntity.session_code == code).first():
            entity = SessionEntity(session_code=code, mode=req.mode)
            db.add(entity)
            db.commit()
            return SessionInitResponse(session_code=code, mode=req.mode)
    raise HTTPException(status_code=500, detail="Nepodařilo se vygenerovat unikátní kód sezení")
