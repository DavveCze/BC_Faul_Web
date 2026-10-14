from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models.base import get_db
from app.models.entities import SessionEntity, PreTestEntity, PostTestEntity
from app.schemas.dto import PostTestCreate, PostTestResponse

router = APIRouter(prefix="/post-test", tags=["PostTest"])

def calculate_sus_score(sus_scores: dict) -> float:
    """
    Výpočet System Usability Scale (SUS) skóre v intervalu [0, 100] dle Brooke (1996).
    10 položek na pětibodové škále (1 až 5).
    Liché položky (1, 3, 5, 7, 9): skóre = hodnota - 1
    Sudé položky (2, 4, 6, 8, 10): skóre = 5 - hodnota
    Součet se vynásobí 2.5.
    """
    total = 0.0
    for i in range(1, 11):
        # Hledáme klíč jako "sus_1", "1", apod.
        val = sus_scores.get(f"sus_{i}") or sus_scores.get(str(i)) or 3
        val = int(val)
        val = max(1, min(5, val))
        if i % 2 == 1:
            total += (val - 1)
        else:
            total += (5 - val)
    return float(round(total * 2.5, 2))

@router.post("", response_model=PostTestResponse)
def submit_post_test(req: PostTestCreate, db: Session = Depends(get_db)):
    session = db.query(SessionEntity).filter(SessionEntity.session_code == req.session_code).first()
    if not session:
        raise HTTPException(status_code=404, detail="Sezení s tímto kódem neexistuje")

    pre_test = db.query(PreTestEntity).filter(PreTestEntity.session_code == req.session_code).first()
    pre_certainty = pre_test.decision_certainty_pre if pre_test else req.decision_certainty_post

    sus_final = calculate_sus_score(req.sus_scores)
    certainty_diff = req.decision_certainty_post - pre_certainty

    existing = db.query(PostTestEntity).filter(PostTestEntity.session_code == req.session_code).first()
    if existing:
        existing.decision_certainty_post = req.decision_certainty_post
        existing.sus_scores = req.sus_scores
        existing.sus_final_score = sus_final
        existing.tam_scores = req.tam_scores
        existing.explanation_clarity = req.explanation_clarity
        existing.topic_relevance = req.topic_relevance
        existing.feedback_comment = req.feedback_comment
    else:
        entity = PostTestEntity(
            session_code=req.session_code,
            decision_certainty_post=req.decision_certainty_post,
            sus_scores=req.sus_scores,
            sus_final_score=sus_final,
            tam_scores=req.tam_scores,
            explanation_clarity=req.explanation_clarity,
            topic_relevance=req.topic_relevance,
            feedback_comment=req.feedback_comment
        )
        db.add(entity)

    db.commit()

    return PostTestResponse(
        status="ok",
        session_code=req.session_code,
        sus_final_score=sus_final,
        certainty_difference=certainty_diff
    )
