import pytest
from app.services.scorer import RecommenderEngine
from app.services.lemmatizer import processor

def test_lemmatizer():
    text = "Student navrhuje moderní webové rozhraní pro analýzu databází a aplikací."
    lemmas = processor.lemmatize(text)
    assert len(lemmas) > 0
    assert "webov" in [l[:5] for l in lemmas]

def test_recommender_scoring():
    topics = [
        {
            "id": 1,
            "code": "KIP-01",
            "title": "Vývoj webové aplikace",
            "supervisor_name": "Vedoucí 1",
            "description": "Práce se zaměřuje na moderní frontend v Reactu a REST API.",
            "difficulty": 0.5,
            "keywords": "react, web, api",
            "profile_dimensions": {
                "riasec": {"R": 0.5, "I": 0.8, "A": 0.6, "S": 0.4, "E": 0.4, "C": 0.7},
                "career_anchors": {"TF": 0.9},
                "problem_solving_style": 0.7,
                "orientation_type": 0.8,
                "output_type": 0.9,
                "supervision_preference": 0.5
            }
        },
        {
            "id": 2,
            "code": "KIP-02",
            "title": "Analýza didaktických her",
            "supervisor_name": "Vedoucí 2",
            "description": "Zkoumání edukačních metod a výuky na školách.",
            "difficulty": 0.4,
            "keywords": "didaktika, skola, edukace",
            "profile_dimensions": {
                "riasec": {"R": 0.2, "I": 0.5, "A": 0.8, "S": 0.9, "E": 0.4, "C": 0.4},
                "career_anchors": {"SV": 0.9},
                "problem_solving_style": 0.5,
                "orientation_type": 0.2,
                "output_type": 0.3,
                "supervision_preference": 0.4
            }
        }
    ]

    courses = [
        {"code": "KIP/WEB", "name": "Web", "syllabus_text": "Tvorba webových aplikací v Reactu"}
    ]

    engine = RecommenderEngine(topics, courses)

    # Profil technického studenta preferujícího web
    profile = {
        "riasec": {"R": 0.5, "I": 0.85, "A": 0.5, "S": 0.3, "E": 0.4, "C": 0.7},
        "career_anchors": {"TF": 1.0},
        "problem_solving_style": 0.8,
        "orientation_type": 0.9,
        "output_type": 0.9,
        "supervision_preference": 0.5,
        "completed_courses": [{"code": "KIP/WEB", "grade": "A"}],
        "hobby_keywords": ["react", "web"]
    }

    alpha, beta, gamma, recs = engine.recommend(profile, self_efficacy=0.8, top_k=2)

    assert len(recs) == 2
    assert alpha == 0.5
    assert beta == 0.3
    assert gamma == 0.2
    # První téma musí být KIP-01 (web) s výrazně vyšším skóre
    assert recs[0]["code"] == "KIP-01"
    assert recs[0]["total_score"] > recs[1]["total_score"]
    assert len(recs[0]["matched_keywords"]) > 0
    assert "příspěvek" in recs[0]["explanation_text"].lower()
