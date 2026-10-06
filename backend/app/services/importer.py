"""
Univerzální importér témat a kurzů KIP PřF OU.
Podporuje JSON, CSV, TSV i polo-strukturovaný textový formát z univerzitních exportů (např. STAG / IS).
"""
import os
import csv
import json
import io
from typing import List, Dict, Any, Tuple
from app.services.lemmatizer import processor

def parse_topics_file(content_bytes: bytes, filename: str) -> List[Dict[str, Any]]:
    """
    Detekuje formát a extrahuje témata z nahraného souboru (JSON, CSV, TSV nebo text).
    """
    text = content_bytes.decode("utf-8", errors="replace").strip()
    filename_lower = filename.lower()

    if filename_lower.endswith(".json") or text.startswith("[") or text.startswith("{"):
        try:
            data = json.loads(text)
            if isinstance(data, dict):
                # Např. {"topics": [...]}
                for key in ["topics", "data", "items"]:
                    if key in data and isinstance(data[key], list):
                        data = data[key]
                        break
                if isinstance(data, dict):
                    data = [data]
            return [normalize_topic_dict(item, idx + 1) for idx, item in enumerate(data) if isinstance(item, dict)]
        except Exception:
            pass

    # CSV / TSV detekce
    dialect = "excel"
    if "\t" in text.split("\n")[0]:
        dialect = "excel-tab"
    elif ";" in text.split("\n")[0]:
        csv.register_dialect('semicolon', delimiter=';')
        dialect = 'semicolon'

    try:
        reader = csv.DictReader(io.StringIO(text), dialect=dialect)
        rows = list(reader)
        if rows and len(rows[0]) > 1:
            return [normalize_csv_topic_row(row, idx + 1) for idx, row in enumerate(rows)]
    except Exception:
        pass

    # Fallback pro čistý text: bloky oddělené prázdným řádkem
    return parse_text_blocks(text)

def normalize_topic_dict(raw: Dict[str, Any], default_id: int) -> Dict[str, Any]:
    code = raw.get("code") or raw.get("kod") or f"KIP-BP-{default_id:02d}"
    title = raw.get("title") or raw.get("nazev") or raw.get("name") or "Bez názvu"
    supervisor = raw.get("supervisor_name") or raw.get("vedouci") or "KIP PřF OU"
    desc = raw.get("description") or raw.get("popis") or raw.get("anotace") or ""
    diff = float(raw.get("difficulty") or raw.get("narocnost") or 0.5)
    keywords = raw.get("keywords") or raw.get("klicova_slova") or ""
    if isinstance(keywords, list):
        keywords = ", ".join(keywords)

    dims = raw.get("profile_dimensions") or raw.get("profil") or {}
    if not isinstance(dims, dict):
        dims = {}

    # Zajištění výchozí struktury profilu
    riasec = dims.get("riasec", {})
    if not isinstance(riasec, dict):
        riasec = {}
    for d in ["R", "I", "A", "S", "E", "C"]:
        if d not in riasec:
            riasec[d] = 0.5
    dims["riasec"] = riasec

    return {
        "code": code,
        "title": title,
        "supervisor_name": supervisor,
        "description": desc,
        "difficulty": max(0.1, min(1.0, diff)),
        "keywords": keywords,
        "profile_dimensions": dims,
        "is_active": True
    }

def normalize_csv_topic_row(row: Dict[str, Any], default_id: int) -> Dict[str, Any]:
    # Hledáme klíče bez ohledu na velká/malá písmena
    row_lower = {k.strip().lower(): v for k, v in row.items() if k}
    
    code = row_lower.get("kod") or row_lower.get("code") or f"KIP-BP-{default_id:02d}"
    title = row_lower.get("nazev") or row_lower.get("title") or "Bez názvu"
    supervisor = row_lower.get("vedouci") or row_lower.get("supervisor") or "KIP PřF OU"
    desc = row_lower.get("popis") or row_lower.get("anotace") or row_lower.get("description") or ""
    
    diff_val = 0.5
    for diff_key in ["narocnost", "difficulty", "obtiznost"]:
        if diff_key in row_lower and row_lower[diff_key]:
            try:
                diff_val = float(row_lower[diff_key].replace(",", "."))
                break
            except ValueError:
                pass

    keywords = row_lower.get("klicova_slova") or row_lower.get("keywords") or ""

    # RIASEC hodnoty ze sloupců pokud existují (např. R, I, A, S, E, C)
    riasec = {}
    for letter in ["r", "i", "a", "s", "e", "c"]:
        val = 0.5
        if letter in row_lower and row_lower[letter]:
            try:
                val = float(row_lower[letter].replace(",", "."))
            except ValueError:
                val = 0.5
        riasec[letter.upper()] = val

    profile_dims = {
        "riasec": riasec,
        "career_anchors": {"TF": 0.5, "GM": 0.3},
        "problem_solving_style": 0.5,
        "orientation_type": 0.7,
        "output_type": 0.8,
        "supervision_preference": 0.5
    }

    return {
        "code": code,
        "title": title,
        "supervisor_name": supervisor,
        "description": desc,
        "difficulty": max(0.1, min(1.0, diff_val)),
        "keywords": keywords,
        "profile_dimensions": profile_dims,
        "is_active": True
    }

def parse_text_blocks(text: str) -> List[Dict[str, Any]]:
    """Převede volné bloky textu na témata"""
    blocks = [b.strip() for b in text.split("\n\n") if b.strip()]
    topics = []
    for idx, block in enumerate(blocks):
        lines = [line.strip() for line in block.split("\n") if line.strip()]
        if not lines:
            continue
        title = lines[0]
        desc = " ".join(lines[1:]) if len(lines) > 1 else title
        topics.append({
            "code": f"KIP-BP-{idx+1:02d}",
            "title": title,
            "supervisor_name": "KIP PřF OU",
            "description": desc,
            "difficulty": 0.5,
            "keywords": "",
            "profile_dimensions": {
                "riasec": {"R": 0.5, "I": 0.6, "A": 0.3, "S": 0.4, "E": 0.4, "C": 0.6},
                "career_anchors": {"TF": 0.6},
                "problem_solving_style": 0.5,
                "orientation_type": 0.8,
                "output_type": 0.8,
                "supervision_preference": 0.5
            },
            "is_active": True
        })
    return topics
