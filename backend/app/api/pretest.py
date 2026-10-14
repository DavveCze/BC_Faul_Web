from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models.base import get_db
from app.models.entities import SessionEntity, PreTestEntity
from app.schemas.dto import PreTestCreate, PreTestResponse

router = APIRouter(prefix="/pre-test", tags=["PreTest"])

def calculate_i_eff_from_block_c(block_c_dict: dict) -> float:
    """
    Vypočte index výzkumné sebeúčinnosti I_eff v intervalu [0, 1] z Bloku C dle Sekce 5.3 bpfaul.tex.
    Položky C1-C7 na pětibodové Likertově škále (1-5).
    Dvě položky jsou reverzní (překódování 6 - x).
    """
    if not block_c_dict:
        return 0.5
    values = []
    for key, val in block_c_dict.items():
        try:
            score = float(val)
            # Pokud je položka reverzní (např. C5 nebo C6 dle textu práce)
            if key in ["c5", "c6", "C5", "C6"]:
                score = 6.0 - score
            # Normalizace (x - 1) / 4 do intervalu [0, 1]
            norm_val = (score - 1.0) / 4.0
            values.append(max(0.0, min(1.0, norm_val)))
        except (ValueError, TypeError):
            continue
    return float(sum(values) / len(values)) if values else 0.5

@router.post("", response_model=PreTestResponse)
def submit_pre_test(req: PreTestCreate, db: Session = Depends(get_db)):
    session = db.query(SessionEntity).filter(SessionEntity.session_code == req.session_code).first()
    if not session:
        raise HTTPException(status_code=404, detail="Sezení s tímto kódem neexistuje")

    # Pokud v responses_block_a_g existuje blok C a nebyl explicitně zadán jiný I_eff
    final_i_eff = req.self_efficacy_score
    if req.responses_block_a_g and "block_c" in req.responses_block_a_g:
        final_i_eff = calculate_i_eff_from_block_c(req.responses_block_a_g["block_c"])

    existing = db.query(PreTestEntity).filter(PreTestEntity.session_code == req.session_code).first()
    if existing:
        existing.study_program = req.study_program
        existing.study_year = req.study_year
        existing.study_form = req.study_form
        existing.gender = req.gender
        existing.age = req.age
        existing.current_thesis_state = req.current_thesis_state
        existing.selection_method = req.selection_method
        existing.decision_certainty_pre = req.decision_certainty_pre
        existing.self_efficacy_score = final_i_eff
        existing.responses_block_a_g = req.responses_block_a_g
    else:
        entity = PreTestEntity(
            session_code=req.session_code,
            study_program=req.study_program,
            study_year=req.study_year,
            study_form=req.study_form,
            gender=req.gender,
            age=req.age,
            current_thesis_state=req.current_thesis_state,
            selection_method=req.selection_method,
            decision_certainty_pre=req.decision_certainty_pre,
            self_efficacy_score=final_i_eff,
            responses_block_a_g=req.responses_block_a_g
        )
        db.add(entity)

    db.commit()
    return PreTestResponse(
        status="ok",
        session_code=req.session_code,
        self_efficacy_score=round(final_i_eff, 4)
    )
