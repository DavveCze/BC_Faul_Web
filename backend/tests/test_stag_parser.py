import os
import pytest
from app.services.stag_parser import parse_stag_pdf, parse_stag_text

def test_parse_stag_text_sample():
    sample_text = """
    Průběh studia
    R24398  FAUL David
    2024/25 In-PsyBc B Prezenční
    Přehled zápočtů a zkoušek:
    24/25 KIP/7ALG1 Základy algoritmizace ZS 5 2+3+0 A AZk 1 20.12.24 94
    24/25 KIP/7APOS Architektura počítačů a základy OS ZS 5 2+2+0 A CZk 1 07.01.25 79
    24/25 KIP/7UVDT Úvod do databází ZS 5 2+2+0 A SZp 1 12.01.25 100
    25/26 KPE/6OBEC Úvod do obecné psychologie ZS 5 1+0+1 A BZk 2 28.01.25 82
    25/26 KIP/7SWI1 Softwarové inženýrství 1 LS 4 2+2+0 A FZk 1 15.05.26 45
    """
    res = parse_stag_text(sample_text)
    # Ověření absolutní anonymizace – žádná jména ani osobní čísla
    assert "name" not in res["study"]
    assert "student_number" not in res["study"]
    assert "student" not in res
    assert res["study"]["program"] == "In-PsyBc"
    assert res["summary"]["total_courses"] == 5
    assert res["summary"]["passed_courses"] == 4  # 1 was F
    assert res["summary"]["kip_courses_count"] == 4
    
    courses_map = {c["code"]: c for c in res["courses"]}
    assert courses_map["KIP/7ALG1"]["grade"] == "A"
    assert courses_map["KIP/7ALG1"]["credits"] == 5
    assert courses_map["KIP/7APOS"]["grade"] == "C"
    assert courses_map["KIP/7UVDT"]["grade"] == "S"
    assert courses_map["KIP/7SWI1"]["grade"] == "F"
    assert courses_map["KIP/7SWI1"]["is_passed"] is False

def test_parse_real_pdf_if_present():
    if os.path.exists("prubeh_studia.pdf"):
        with open("prubeh_studia.pdf", "rb") as f:
            res = parse_stag_pdf(f.read())
        assert "student" not in res
        assert "name" not in res.get("study", {})
        assert res["summary"]["total_courses"] >= 40
        assert res["summary"]["kip_courses_count"] >= 20
