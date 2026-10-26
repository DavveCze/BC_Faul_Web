"""
Parser průběhu studia ze systému IS/STAG (Ostravská univerzita a další VŠ).
Podporuje přímé načtení z PDF (pypdf) i vložení zkopírovaného textu z portálu STAG.
"""
import io
import re
from typing import Dict, Any, List, Optional
import pypdf

# Regex pro řádek předmětu v tabulce STAG (PDF i kopírovaný text):
# Akad. rok | Zkratka | Název | Sem. | Kr. | Hod. dotace | St. | Zn.Typ zk. | ...
STAG_COURSE_REGEX = re.compile(
    r'(?:(\d\d/\d\d)\s+)?'             # 1: Akad. rok (např. 24/25)
    r'([A-Z0-9]{3}/[0-9A-Z]{4,7})\s+'  # 2: Zkratka katedra/kód (např. KIP/7ALG1, KPE/6OBEC)
    r'(.+?)\s+'                         # 3: Název předmětu
    r'(ZS|LS)\s+'                      # 4: Semestr
    r'(\d+)\s+'                         # 5: Počet kreditů
    r'(?:\S+\s+)?'                     # Hodinová dotace (např. 2+3+0, 13H+13H+0)
    r'([ABC])\s+'                      # 6: Statut (A=povinný, B=povinně volitelný, C=výběrový)
    r'([A-FS4])\s*(Zk|Zp|Ko)'          # 7: Známka (A-F, S=splněno), 8: Typ (Zk, Zp, Ko)
)

# Záložní regex pro zjednodušený formát (např. ruční zápis kód + známka)
SIMPLE_COURSE_REGEX = re.compile(
    r'([A-Z0-9]{3}/[0-9A-Z]{4,7})\s+([A-FS4])\b'
)

def parse_stag_pdf(pdf_bytes: bytes) -> Dict[str, Any]:
    """
    Extrahuje text z PDF vygenerovaného z IS/STAG a naparsuje absolvované předměty.
    """
    stream = io.BytesIO(pdf_bytes)
    reader = pypdf.PdfReader(stream)
    
    pages_text = []
    for page in reader.pages:
        extracted = page.extract_text()
        if extracted:
            pages_text.append(extracted)
            
    full_text = "\n".join(pages_text)
    return parse_stag_text(full_text)

def parse_stag_text(text: str) -> Dict[str, Any]:
    """
    Parsuje strukturovaný nebo zkopírovaný text z IS/STAG.
    """
    study_info = extract_study_info(text)
    courses = []
    seen_codes = set()

    for match in STAG_COURSE_REGEX.finditer(text):
        year, code, name, sem, credits, statut, grade, exam_type = match.groups()
        clean_code = code.strip()
        clean_name = name.strip()
        clean_grade = "S" if grade == "S" else grade.upper()
        is_passed = clean_grade not in ["F", "4"]

        courses.append({
            "code": clean_code,
            "name": clean_name,
            "year": year or "",
            "semester": sem,
            "credits": int(credits),
            "statut": statut,
            "grade": clean_grade,
            "exam_type": exam_type,
            "is_passed": is_passed
        })
        seen_codes.add(clean_code)

    # Pokud plný formát nic nenašel, zkusíme záložní jednoduchý regex
    if not courses:
        for match in SIMPLE_COURSE_REGEX.finditer(text):
            code, grade = match.groups()
            clean_code = code.strip()
            if clean_code not in seen_codes:
                clean_grade = "S" if grade == "S" else grade.upper()
                courses.append({
                    "code": clean_code,
                    "name": clean_code,
                    "year": "",
                    "semester": "",
                    "credits": 0,
                    "statut": "A",
                    "grade": clean_grade,
                    "exam_type": "Zk",
                    "is_passed": clean_grade not in ["F", "4"]
                })
                seen_codes.add(clean_code)

    # Souhrnné statistiky
    kip_count = sum(1 for c in courses if c["code"].startswith("KIP/"))
    passed_count = sum(1 for c in courses if c["is_passed"])
    total_credits = sum(c["credits"] for c in courses if c["is_passed"])

    return {
        "study": study_info,
        "summary": {
            "total_courses": len(courses),
            "passed_courses": passed_count,
            "total_credits": total_credits,
            "kip_courses_count": kip_count
        },
        "courses": courses
    }

def extract_study_info(text: str) -> Dict[str, Optional[str]]:
    """
    Extrahuje výhradně anonymní metadata o studijním programu a formě studia.
    Striktně ignoruje a neukládá žádné osobní údaje (jméno, příjmení, rodné či osobní číslo).
    """
    study_info = {
        "program": None,
        "study_form": None
    }

    # Hledání oboru a formy (např. 2024/25 In-PsyBc B Prezenční)
    prog_match = re.search(r'(\d{4}/\d{2})\s+([A-Za-z0-9\-]+)\s+([BM])\s+(Prezenční|Kombinovaná)', text)
    if prog_match:
        study_info["program"] = prog_match.group(2)
        study_info["study_form"] = prog_match.group(4)

    return study_info
