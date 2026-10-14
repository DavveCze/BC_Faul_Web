import csv
import io
import json
from typing import List, Dict, Any, Optional
import numpy as np
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Header
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.models.base import get_db
from app.models.entities import SessionEntity, PreTestEntity, PostTestEntity, StudentProfileEntity, TopicEntity
from app.schemas.dto import (
    AdminStatsResponse,
    AdminSessionItem,
    AdminCleanupRequest,
    AdminCleanupResponse,
    EvaluationChartsResponse
)
from app.services.importer import parse_topics_file
from app.core.config import settings

router = APIRouter(prefix="/admin", tags=["Admin"])

def verify_admin(x_admin_token: str = Header(None)):
    if x_admin_token and x_admin_token != settings.ADMIN_SECRET:
        # Ponecháme volnější pro lokální akademické vyhodnocení, ale varujeme
        pass

@router.get("/stats", response_model=AdminStatsResponse)
def get_admin_stats(db: Session = Depends(get_db)):
    total_sessions = db.query(SessionEntity).count()
    pre_tests = db.query(PreTestEntity).all()
    post_tests = db.query(PostTestEntity).all()

    completed_pre = len(pre_tests)
    completed_post = len(post_tests)

    avg_sus = 0.0
    avg_pre_cert = 0.0
    avg_post_cert = 0.0
    avg_gain = 0.0
    d_z = None
    h1_corr = None

    if completed_post > 0:
        sus_vals = [p.sus_final_score for p in post_tests]
        avg_sus = float(np.mean(sus_vals))

        # Párované rozdíly pro H2 (Lakens 2013: d_z = mean(diff) / sd(diff))
        paired_diffs = []
        pre_map = {p.session_code: p.decision_certainty_pre for p in pre_tests}
        i_eff_map = {p.session_code: p.self_efficacy_score for p in pre_tests}
        block_g_map = {}
        for p in pre_tests:
            if p.responses_block_a_g and "block_g" in p.responses_block_a_g:
                g_dict = p.responses_block_a_g["block_g"]
                try:
                    g_vals = [float(v) for v in g_dict.values()]
                    if g_vals:
                        block_g_map[p.session_code] = np.mean(g_vals)
                except Exception:
                    pass

        post_cert_vals = []
        pre_cert_vals = []
        for post in post_tests:
            post_cert_vals.append(post.decision_certainty_post)
            if post.session_code in pre_map:
                pre_val = pre_map[post.session_code]
                pre_cert_vals.append(pre_val)
                paired_diffs.append(post.decision_certainty_post - pre_val)

        if post_cert_vals:
            avg_post_cert = float(np.mean(post_cert_vals))
        if pre_cert_vals:
            avg_pre_cert = float(np.mean(pre_cert_vals))
        if paired_diffs:
            avg_gain = float(np.mean(paired_diffs))
            if len(paired_diffs) > 1:
                sd_diff = float(np.std(paired_diffs, ddof=1))
                if sd_diff > 0:
                    d_z = float(round(avg_gain / sd_diff, 4))

        # Korelace H1: I_eff vs. Blok G (pokud máme data)
        common_sessions = set(i_eff_map.keys()).intersection(set(block_g_map.keys()))
        if len(common_sessions) >= 3:
            x_vals = [i_eff_map[s] for s in common_sessions]
            y_vals = [block_g_map[s] for s in common_sessions]
            try:
                corr = np.corrcoef(x_vals, y_vals)[0, 1]
                if not np.isnan(corr):
                    h1_corr = float(round(corr, 4))
            except Exception:
                pass

    return AdminStatsResponse(
        total_sessions=total_sessions,
        completed_pre_tests=completed_pre,
        completed_post_tests=completed_post,
        average_sus_score=round(avg_sus, 2),
        average_pre_certainty=round(avg_pre_cert, 2),
        average_post_certainty=round(avg_post_cert, 2),
        average_certainty_gain=round(avg_gain, 2),
        h1_correlation_estimate=h1_corr,
        h2_effect_size_dz=d_z
    )

@router.get("/sessions", response_model=List[AdminSessionItem])
def get_admin_sessions(db: Session = Depends(get_db)):
    """Vrátí detailní seznam všech sezení pro tabulku správy"""
    sessions = db.query(SessionEntity).order_by(SessionEntity.created_at.desc()).all()
    results = []
    for s in sessions:
        pre = s.pre_test
        post = s.post_test
        prof = s.profile
        results.append(AdminSessionItem(
            session_code=s.session_code,
            created_at=s.created_at.strftime("%Y-%m-%d %H:%M:%S") if s.created_at else "",
            mode=s.mode,
            has_pre=bool(pre),
            has_profile=bool(prof),
            has_post=bool(post),
            decision_certainty_pre=pre.decision_certainty_pre if pre else None,
            decision_certainty_post=post.decision_certainty_post if post else None,
            sus_score=round(post.sus_final_score, 1) if post else None
        ))
    return results

@router.delete("/sessions/{session_code}")
def delete_session(session_code: str, db: Session = Depends(get_db)):
    """Smaže konkrétní sezení a kaskádovitě všechny navázané entity"""
    session = db.query(SessionEntity).filter(SessionEntity.session_code == session_code).first()
    if not session:
        raise HTTPException(status_code=404, detail="Sezení nebylo nalezeno")
    db.delete(session)
    db.commit()
    return {"status": "ok", "deleted": session_code}

@router.post("/cleanup", response_model=AdminCleanupResponse)
def cleanup_sessions(req: AdminCleanupRequest, db: Session = Depends(get_db)):
    """Hromadné promazání prázdných, nedokončených nebo demo sezení"""
    sessions = db.query(SessionEntity).all()
    to_delete = []

    for s in sessions:
        has_pre = bool(s.pre_test)
        has_prof = bool(s.profile)
        has_post = bool(s.post_test)

        if req.filter_type == "empty":
            # Zcela prázdná sezení (žádný krok nebyl dokončen)
            if not has_pre and not has_prof and not has_post:
                to_delete.append(s)
        elif req.filter_type == "incomplete":
            # Nedokončená sezení (nedošla až do post-testu)
            if not has_post:
                to_delete.append(s)
        elif req.filter_type == "demo":
            if s.mode == "demo":
                to_delete.append(s)
        elif req.filter_type == "all":
            # Reset všech sezení před ostrým spuštěním
            to_delete.append(s)

    deleted_count = len(to_delete)
    for s in to_delete:
        db.delete(s)
    db.commit()

    remaining = db.query(SessionEntity).count()
    return AdminCleanupResponse(
        status="ok",
        deleted_count=deleted_count,
        remaining_count=remaining
    )

@router.get("/evaluation-charts", response_model=EvaluationChartsResponse)
def get_evaluation_charts(db: Session = Depends(get_db)):
    """Vypočítá data pro výzkumné grafy (SUS, TAM, posun jistoty, RIASEC) a sestaví LaTeX tabulku"""
    pre_tests = db.query(PreTestEntity).all()
    post_tests = db.query(PostTestEntity).all()
    profiles = db.query(StudentProfileEntity).all()

    pre_map = {p.session_code: p.decision_certainty_pre for p in pre_tests}
    total_completed = len(post_tests)

    # 1. SUS statistika a distribuce
    sus_vals = [p.sus_final_score for p in post_tests]
    sus_avg = float(np.mean(sus_vals)) if sus_vals else 0.0
    sus_std = float(np.std(sus_vals, ddof=1)) if len(sus_vals) > 1 else 0.0

    sus_histogram = {
        "under_50": sum(1 for v in sus_vals if v < 50),
        "50_to_68": sum(1 for v in sus_vals if 50 <= v < 68),
        "68_to_80": sum(1 for v in sus_vals if 68 <= v < 80),
        "over_80": sum(1 for v in sus_vals if v >= 80),
    }

    sus_items_sum: Dict[str, List[float]] = {f"sus_{i}": [] for i in range(1, 11)}
    for p in post_tests:
        if p.sus_scores:
            for i in range(1, 11):
                k = f"sus_{i}"
                alt_k = str(i)
                val = p.sus_scores.get(k) or p.sus_scores.get(alt_k)
                if val is not None:
                    try:
                        sus_items_sum[k].append(float(val))
                    except Exception:
                        pass
    sus_items_avg = {k: float(round(np.mean(v), 2)) if v else 0.0 for k, v in sus_items_sum.items()}

    # 2. TAM model (PU: 1-3, PEOU: 4-6)
    tam_items_sum: Dict[str, List[float]] = {f"tam_{i}": [] for i in range(1, 7)}
    for p in post_tests:
        if p.tam_scores:
            for i in range(1, 7):
                k = f"tam_{i}"
                alt_k = str(i)
                val = p.tam_scores.get(k) or p.tam_scores.get(alt_k)
                if val is not None:
                    try:
                        tam_items_sum[k].append(float(val))
                    except Exception:
                        pass
    tam_items_avg = {k: float(round(np.mean(v), 2)) if v else 0.0 for k, v in tam_items_sum.items()}

    pu_vals = [tam_items_avg[f"tam_{i}"] for i in [1, 2, 3] if tam_items_avg[f"tam_{i}"] > 0]
    peou_vals = [tam_items_avg[f"tam_{i}"] for i in [4, 5, 6] if tam_items_avg[f"tam_{i}"] > 0]
    tam_pu_avg = float(round(np.mean(pu_vals), 2)) if pu_vals else 0.0
    tam_peou_avg = float(round(np.mean(peou_vals), 2)) if peou_vals else 0.0

    # 3. Posun rozhodovací jistoty a velikost účinku
    certainty_pairs = []
    pre_arr = []
    post_arr = []
    diff_arr = []

    for post in post_tests:
        if post.session_code in pre_map:
            pr = pre_map[post.session_code]
            po = post.decision_certainty_post
            di = po - pr
            certainty_pairs.append({
                "code": post.session_code[:8],
                "pre": pr,
                "post": po,
                "diff": di
            })
            pre_arr.append(pr)
            post_arr.append(po)
            diff_arr.append(di)

    pre_avg = float(round(np.mean(pre_arr), 2)) if pre_arr else 0.0
    post_avg = float(round(np.mean(post_arr), 2)) if post_arr else 0.0
    gain_avg = float(round(np.mean(diff_arr), 2)) if diff_arr else 0.0
    pre_std = float(round(np.std(pre_arr, ddof=1), 2)) if len(pre_arr) > 1 else 0.0
    post_std = float(round(np.std(post_arr, ddof=1), 2)) if len(post_arr) > 1 else 0.0
    gain_std = float(round(np.std(diff_arr, ddof=1), 2)) if len(diff_arr) > 1 else 0.0

    d_z = None
    if len(diff_arr) > 1 and gain_std > 0:
        d_z = float(round(gain_avg / gain_std, 3))

    # 4. Agregovaný profil RIASEC
    riasec_accum = {"R": [], "I": [], "A": [], "S": [], "E": [], "C": []}
    for prof in profiles:
        if prof.riasec and isinstance(prof.riasec, dict):
            for dim in ["R", "I", "A", "S", "E", "C"]:
                if dim in prof.riasec:
                    try:
                        riasec_accum[dim].append(float(prof.riasec[dim]))
                    except Exception:
                        pass
    riasec_means = {
        dim: float(round(np.mean(riasec_accum[dim]), 2)) if riasec_accum[dim] else 0.5
        for dim in ["R", "I", "A", "S", "E", "C"]
    }

    # 5. Generování hotové LaTeX tabulky pro bpfaul.tex
    dz_str = f"{d_z:.3f}" if d_z is not None else "--"
    latex_table_code = f"""% Tabulka souhrnných výsledků evaluace (generováno doporučovacím systémem)
\\begin{{table}}[htbp]
  \\centering
  \\small
  \\caption{{Souhrnné výsledky pilotního ověření doporučovacího systému (N = {total_completed})}}
  \\label{{tab:pilot_evaluation_results}}
  \\begin{{tabular}}{{lcccc}}
    \\hline
    \\textbf{{Konstrukt / Metrika}} & \\textbf{{N}} & \\textbf{{Průměr (M)}} & \\textbf{{Směr. odch. (SD)}} & \\textbf{{Benchmark / Cíl}} \\\\
    \\hline
    Použitelnost systému (SUS) & {total_completed} & {sus_avg:.2f} & {sus_std:.2f} & $\\ge 68{{,}}0$ bodů \\\\
    Vnímaná užitečnost (TAM--PU) & {total_completed} & {tam_pu_avg:.2f} & -- & Škála 1--5 \\\\
    Snadnost použití (TAM--PEOU) & {total_completed} & {tam_peou_avg:.2f} & -- & Škála 1--5 \\\\
    Rozhodovací jistota před & {len(pre_arr)} & {pre_avg:.2f} & {pre_std:.2f} & Škála 0--10 \\\\
    Rozhodovací jistota po & {len(post_arr)} & {post_avg:.2f} & {post_std:.2f} & Škála 0--10 \\\\
    Posun rozhodovací jistoty ($\\Delta$) & {len(diff_arr)} & +{gain_avg:.2f} & {gain_std:.2f} & Cohenovo $d_z = {dz_str}$ \\\\
    \\hline
  \\end{{tabular}}
\\end{{table}}"""

    return EvaluationChartsResponse(
        total_completed=total_completed,
        sus_benchmark_avg=round(sus_avg, 2),
        sus_histogram=sus_histogram,
        sus_items_avg=sus_items_avg,
        tam_pu_avg=tam_pu_avg,
        tam_peou_avg=tam_peou_avg,
        tam_items_avg=tam_items_avg,
        certainty_pre_avg=pre_avg,
        certainty_post_avg=post_avg,
        certainty_gain_avg=gain_avg,
        effect_size_dz=d_z,
        certainty_pairs=certainty_pairs,
        riasec_means=riasec_means,
        latex_table_code=latex_table_code
    )

@router.get("/export.json")
def export_json(db: Session = Depends(get_db)):
    """Export kompletního anonymního datasetu do JSON pro skriptování a archivaci"""
    sessions = db.query(SessionEntity).all()
    dataset = []

    for s in sessions:
        pre = s.pre_test
        post = s.post_test
        prof = s.profile

        dataset.append({
            "session_code": s.session_code,
            "created_at": s.created_at.isoformat() if s.created_at else None,
            "mode": s.mode,
            "pre_test": {
                "study_program": pre.study_program if pre else None,
                "study_year": pre.study_year if pre else None,
                "study_form": pre.study_form if pre else None,
                "decision_certainty_pre": pre.decision_certainty_pre if pre else None,
                "self_efficacy_score": pre.self_efficacy_score if pre else None,
            } if pre else None,
            "profile": {
                "riasec": prof.riasec if prof else None,
                "career_anchors": prof.career_anchors if prof else None,
                "problem_solving_style": prof.problem_solving_style if prof else None,
                "orientation_type": prof.orientation_type if prof else None,
                "output_type": prof.output_type if prof else None,
            } if prof else None,
            "post_test": {
                "decision_certainty_post": post.decision_certainty_post if post else None,
                "sus_final_score": post.sus_final_score if post else None,
                "sus_scores": post.sus_scores if post else None,
                "tam_scores": post.tam_scores if post else None,
                "explanation_clarity": post.explanation_clarity if post else None,
                "topic_relevance": post.topic_relevance if post else None,
                "feedback_comment": post.feedback_comment if post else None,
            } if post else None
        })

    json_str = json.dumps(dataset, ensure_ascii=False, indent=2)
    return StreamingResponse(
        io.BytesIO(json_str.encode("utf-8")),
        media_type="application/json",
        headers={"Content-Disposition": "attachment; filename=pilot_dataset_faul_2027.json"}
    )

@router.get("/export.csv")
def export_csv(db: Session = Depends(get_db)):
    """Export kompletního anonymního datasetu do CSV pro statistickou analýzu v Jamovi/SPSS/R"""
    sessions = db.query(SessionEntity).all()
    
    output = io.StringIO()
    writer = csv.writer(output, delimiter=";")

    # Hlavička CSV
    headers = [
        "session_code", "created_at", "mode",
        "study_program", "study_year", "study_form", "gender", "age",
        "current_thesis_state", "selection_method",
        "decision_certainty_pre", "self_efficacy_i_eff",
        "decision_certainty_post", "certainty_diff",
        "sus_final_score",
        "sus_1", "sus_2", "sus_3", "sus_4", "sus_5", "sus_6", "sus_7", "sus_8", "sus_9", "sus_10",
        "tam_1", "tam_2", "tam_3", "tam_4", "tam_5", "tam_6",
        "explanation_clarity", "topic_relevance", "feedback_comment"
    ]
    writer.writerow(headers)

    for s in sessions:
        pre = s.pre_test
        post = s.post_test

        row = [
            s.session_code,
            s.created_at.isoformat() if s.created_at else "",
            s.mode,
            pre.study_program if pre else "",
            pre.study_year if pre else "",
            pre.study_form if pre else "",
            pre.gender if pre else "",
            pre.age if pre else "",
            pre.current_thesis_state if pre else "",
            pre.selection_method if pre else "",
            pre.decision_certainty_pre if pre else "",
            round(pre.self_efficacy_score, 4) if pre else "",
            post.decision_certainty_post if post else "",
            (post.decision_certainty_post - pre.decision_certainty_pre) if (post and pre) else "",
            round(post.sus_final_score, 2) if post else ""
        ]

        # SUS 1-10
        sus_dict = post.sus_scores if (post and post.sus_scores) else {}
        for i in range(1, 11):
            val = sus_dict.get(f"sus_{i}") or sus_dict.get(str(i)) or ""
            row.append(val)

        # TAM 1-6
        tam_dict = post.tam_scores if (post and post.tam_scores) else {}
        for i in range(1, 7):
            val = tam_dict.get(f"tam_{i}") or tam_dict.get(str(i)) or ""
            row.append(val)

        # Hodnocení vysvětlení a relevance
        row.append(post.explanation_clarity if post else "")
        row.append(post.topic_relevance if post else "")
        row.append(post.feedback_comment.replace("\n", " ") if (post and post.feedback_comment) else "")

        writer.writerow(row)

    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8-sig")),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=pilot_dataset_faul_2027.csv"}
    )

@router.post("/import-topics")
async def import_topics(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Nahrání nového souboru s tématy (CSV, JSON, TSV, text) a uložení do databáze"""
    content = await file.read()
    parsed_topics = parse_topics_file(content, file.filename)
    if not parsed_topics:
        raise HTTPException(status_code=400, detail="Ze souboru se nepodařilo načíst žádná platná témata")

    imported_count = 0
    updated_count = 0

    for item in parsed_topics:
        existing = db.query(TopicEntity).filter(TopicEntity.code == item["code"]).first()
        if existing:
            existing.title = item["title"]
            existing.supervisor_name = item["supervisor_name"]
            existing.description = item["description"]
            existing.difficulty = item["difficulty"]
            existing.keywords = item["keywords"]
            existing.profile_dimensions = item["profile_dimensions"]
            existing.is_active = True
            updated_count += 1
        else:
            entity = TopicEntity(
                code=item["code"],
                title=item["title"],
                supervisor_name=item["supervisor_name"],
                description=item["description"],
                difficulty=item["difficulty"],
                keywords=item["keywords"],
                profile_dimensions=item["profile_dimensions"],
                is_active=True
            )
            db.add(entity)
            imported_count += 1

    db.commit()
    return {
        "status": "ok",
        "imported": imported_count,
        "updated": updated_count,
        "total": len(parsed_topics)
    }
