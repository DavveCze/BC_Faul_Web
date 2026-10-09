"""
Doporučovací jádro (Scoring & Recommendation Engine) dle Kapitoly 5 bpfaul.tex
Implementuje výpočet tří dílčích skóre (S_exp, S_cont, S_kw), dynamický přepočet vah,
penalizaci metodologické náročnosti a šablonové zdůvodnění.
"""
from typing import List, Dict, Tuple, Set, Optional, Any
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from app.services.lemmatizer import processor
from app.core.config import settings

GRADE_WEIGHTS = {
    "A": 1.0,
    "B": 0.9,
    "C": 0.8,
    "D": 0.7,
    "E": 0.6,
    "S": 0.95,
    "F": 0.0
}

DIMENSION_WEIGHTS = {
    # RIASEC (celkem 0.40)
    "R": 0.0667,
    "I": 0.0667,
    "A": 0.0667,
    "S": 0.0667,
    "E": 0.0667,
    "C": 0.0667,
    # Kariérní kotvy (0.15)
    "career_anchors": 0.15,
    # Kognitivní styl řešení problémů (0.15)
    "problem_solving_style": 0.15,
    # Orientace (0.10)
    "orientation_type": 0.10,
    # Typ výstupu (0.10)
    "output_type": 0.10,
    # Míra supervize (0.10)
    "supervision_preference": 0.10
}

class RecommenderEngine:
    def __init__(self, topics: List[Dict[str, Any]], courses: List[Dict[str, Any]]):
        self.topics = topics
        self.courses_by_code = {c["code"]: c for c in courses}
        self.tfidf_vectorizer = None
        self.topic_tfidf_matrix = None
        self._init_tfidf()

    def _init_tfidf(self):
        """Předpočítá TF-IDF matici pro popisy všech témat s českou lemmatizací"""
        if not self.topics:
            return

        corpus = []
        for t in self.topics:
            full_text = f"{t.get('title', '')} {t.get('description', '')} {t.get('keywords', '')}"
            lemmas = processor.lemmatize(full_text)
            corpus.append(" ".join(lemmas) if lemmas else "general")

        self.tfidf_vectorizer = TfidfVectorizer(max_features=1000)
        self.topic_tfidf_matrix = self.tfidf_vectorizer.fit_transform(corpus)

    def calculate_s_exp(
        self,
        student_profile: Dict[str, Any],
        topic: Dict[str, Any],
        self_efficacy: float,
        penalty_lambda: float = settings.DEFAULT_LAMBDA
    ) -> Tuple[float, Dict[str, float]]:
        """
        Vypočte S_exp: shodu psychologického profilu studenta a anotace tématu
        S_exp = sum(w_p * (1 - |u_p - t_{p,i}|)) * [1 - lambda * (1 - I_eff) * d_i]
        """
        t_dims = topic.get("profile_dimensions", {})
        diff_breakdown = {}
        weighted_sum = 0.0

        # 1. RIASEC
        s_riasec = student_profile.get("riasec", {})
        t_riasec = t_dims.get("riasec", {})
        for dim in ["R", "I", "A", "S", "E", "C"]:
            u_p = float(s_riasec.get(dim, 0.5))
            t_p = float(t_riasec.get(dim, 0.5))
            match_p = 1.0 - abs(u_p - t_p)
            w_p = DIMENSION_WEIGHTS[dim]
            weighted_sum += w_p * match_p
            diff_breakdown[f"riasec_{dim}"] = match_p

        # 2. Kariérní kotvy
        s_anchors = student_profile.get("career_anchors", {})
        t_anchors = t_dims.get("career_anchors", {})
        # Shoda kotev podle překryvu normalizovaných vah
        anchor_matches = []
        all_anchors = set(s_anchors.keys()).union(set(t_anchors.keys()))
        if all_anchors:
            for anc in all_anchors:
                u_a = float(s_anchors.get(anc, 0.0))
                t_a = float(t_anchors.get(anc, 0.0))
                anchor_matches.append(1.0 - abs(u_a - t_a))
            anchor_match_val = float(np.mean(anchor_matches))
        else:
            anchor_match_val = 0.5
        weighted_sum += DIMENSION_WEIGHTS["career_anchors"] * anchor_match_val
        diff_breakdown["career_anchors"] = anchor_match_val

        # 3. Kognitivní styl řešení problémů
        u_style = float(student_profile.get("problem_solving_style", 0.5))
        t_style = float(t_dims.get("problem_solving_style", 0.5))
        style_match = 1.0 - abs(u_style - t_style)
        weighted_sum += DIMENSION_WEIGHTS["problem_solving_style"] * style_match
        diff_breakdown["problem_solving_style"] = style_match

        # 4. Orientace (sociální vs. technická)
        u_orient = float(student_profile.get("orientation_type", 0.5))
        t_orient = float(t_dims.get("orientation_type", 0.5))
        orient_match = 1.0 - abs(u_orient - t_orient)
        weighted_sum += DIMENSION_WEIGHTS["orientation_type"] * orient_match
        diff_breakdown["orientation_type"] = orient_match

        # 5. Typ výstupu (teoretická vs. aplikace)
        u_out = float(student_profile.get("output_type", 0.5))
        t_out = float(t_dims.get("output_type", 0.5))
        out_match = 1.0 - abs(u_out - t_out)
        weighted_sum += DIMENSION_WEIGHTS["output_type"] * out_match
        diff_breakdown["output_type"] = out_match

        # 6. Míra supervize
        u_sup = float(student_profile.get("supervision_preference", 0.5))
        t_sup = float(t_dims.get("supervision_preference", 0.5))
        sup_match = 1.0 - abs(u_sup - t_sup)
        weighted_sum += DIMENSION_WEIGHTS["supervision_preference"] * sup_match
        diff_breakdown["supervision_preference"] = sup_match

        # 7. Penalizace náročnosti dle vzorce: factor = 1 - lambda * (1 - I_eff) * d_i
        d_i = float(topic.get("difficulty", 0.5))
        i_eff = max(0.0, min(1.0, float(self_efficacy)))
        penalty_factor = 1.0 - (penalty_lambda * (1.0 - i_eff) * d_i)
        penalty_factor = max(0.0, min(1.0, penalty_factor))

        s_exp_final = weighted_sum * penalty_factor
        s_exp_final = max(0.0, min(1.0, s_exp_final))
        return s_exp_final, diff_breakdown

    def calculate_s_cont(
        self,
        completed_courses: Optional[List[Dict[str, str]]],
        topic_idx: int
    ) -> float:
        """
        Vypočte S_cont: kosinovou podobnost TF-IDF vektoru sylabů kurzů studenta a anotace tématu
        """
        if not completed_courses or self.topic_tfidf_matrix is None:
            return 0.0

        # Sestavíme vážený text ze sylabů a názvů absolvovaných kurzů
        weighted_text_parts = []
        for c in completed_courses:
            code = c.get("code")
            grade = c.get("grade", "C")
            weight = GRADE_WEIGHTS.get(grade, 0.0)
            if weight > 0:
                syllabus = ""
                if code in self.courses_by_code:
                    syllabus = self.courses_by_code[code].get("syllabus_text", "")
                course_name = c.get("name", "")
                if not course_name and code in self.courses_by_code:
                    course_name = self.courses_by_code[code].get("name", "")
                
                full_course_text = f"{course_name} {syllabus}".strip()
                if full_course_text:
                    lemmas = processor.lemmatize(full_course_text)
                    if lemmas:
                        # Počet opakování dle váhy známky pro posílení termínů
                        repeat = max(1, int(round(weight * 3)))
                        weighted_text_parts.extend(lemmas * repeat)

        if not weighted_text_parts:
            return 0.0

        student_text = " ".join(weighted_text_parts)
        try:
            student_vector = self.tfidf_vectorizer.transform([student_text])
            topic_vector = self.topic_tfidf_matrix[topic_idx]
            sim = cosine_similarity(student_vector, topic_vector)[0][0]
            return float(max(0.0, min(1.0, sim)))
        except Exception:
            return 0.0

    def calculate_s_kw(
        self,
        hobby_keywords: Optional[List[str]],
        topic: Dict[str, Any]
    ) -> Tuple[float, List[str]]:
        """
        Vypočte S_kw = |K_u intersect K_i| / |K_u|
        """
        if not hobby_keywords:
            return 0.0, []

        k_u = set()
        for kw in hobby_keywords:
            lemmas = processor.lemmatize(kw)
            k_u.update(lemmas)

        if not k_u:
            return 0.0, []

        topic_full = f"{topic.get('title', '')} {topic.get('description', '')} {topic.get('keywords', '')}"
        k_i = processor.get_lemmatized_set(topic_full)

        intersection = k_u.intersection(k_i)
        score = len(intersection) / len(k_u)
        return float(max(0.0, min(1.0, score))), sorted(list(intersection))

    def resolve_weights(
        self,
        has_courses: bool,
        has_keywords: bool,
        custom_alpha: Optional[float] = None,
        custom_beta: Optional[float] = None,
        custom_gamma: Optional[float] = None
    ) -> Tuple[float, float, float]:
        """
        Dynamický přepočet vah dle přítomnosti volitelných modulů dle Sekce 5.3 bpfaul.tex
        """
        # Pokud uživatel v demo sandboxu zadal explicitní váhy
        if custom_alpha is not None and custom_beta is not None and custom_gamma is not None:
            total = custom_alpha + custom_beta + custom_gamma
            if total > 0:
                return custom_alpha / total, custom_beta / total, custom_gamma / total

        # Pravidla dle bpfaul.tex
        if not has_courses and not has_keywords:
            return 1.0, 0.0, 0.0
        elif has_courses and not has_keywords:
            # alpha = 0.5 / 0.8 = 0.625, beta = 0.3 / 0.8 = 0.375
            return 0.625, 0.375, 0.0
        elif not has_courses and has_keywords:
            # alpha = 0.5 / 0.7 = 0.714, gamma = 0.2 / 0.7 = 0.286
            return 0.5 / 0.7, 0.0, 0.2 / 0.7
        else:
            return settings.DEFAULT_ALPHA, settings.DEFAULT_BETA, settings.DEFAULT_GAMMA

    def generate_explanation(
        self,
        title: str,
        alpha: float, s_exp: float,
        beta: float, s_cont: float,
        gamma: float, s_kw: float,
        matched_kw: List[str],
        difficulty: float,
        self_efficacy: float
    ) -> str:
        """
        Vytvoří deterministické šablonové zdůvodnění (Sekce 5.4 bpfaul.tex).
        Nevytváří volné halucinace, ale transparentně popisuje příspěvky složek.
        """
        c_exp = alpha * s_exp
        c_cont = beta * s_cont
        c_kw = gamma * s_kw

        parts = []
        parts.append(
            f"Téma bylo doporučeno na základě shody psychologického profilu (příspěvek {c_exp:.2f} z celkového skóre)."
        )

        if c_cont > 0.05:
            parts.append(
                f"Obsahová návaznost na absolvované předměty a sylaby přispěla hodnotou {c_cont:.2f}."
            )

        if c_kw > 0.05:
            if matched_kw:
                kw_str = ", ".join(matched_kw[:4])
                parts.append(f"Zaznamenána shoda s vašimi zájmy ({c_kw:.2f}) v pojmech: {kw_str}.")
            else:
                parts.append(f"Zaznamenána shoda s vašimi zájmovými okruhy ({c_kw:.2f}).")

        if difficulty > 0.7 and self_efficacy >= 0.7:
            parts.append("Vyšší metodologická náročnost tématu odpovídá vaší vysoké deklarované sebeúčinnosti.")
        elif difficulty <= 0.4:
            parts.append("Metodologická náročnost tématu je příznivá a vhodná pro plynulé zpracování.")

        return " ".join(parts)

    def recommend(
        self,
        student_profile: Dict[str, Any],
        self_efficacy: float,
        top_k: int = 5,
        custom_alpha: Optional[float] = None,
        custom_beta: Optional[float] = None,
        custom_gamma: Optional[float] = None
    ) -> Tuple[float, float, float, List[Dict[str, Any]]]:
        """
        Vypočte finální pořadí a vrátí Top-k doporučení.
        """
        completed_courses = student_profile.get("completed_courses") or []
        hobby_keywords = student_profile.get("hobby_keywords") or []

        has_courses = len(completed_courses) > 0
        has_kw = len(hobby_keywords) > 0

        alpha, beta, gamma = self.resolve_weights(
            has_courses=has_courses,
            has_keywords=has_kw,
            custom_alpha=custom_alpha,
            custom_beta=custom_beta,
            custom_gamma=custom_gamma
        )

        scored_topics = []

        for idx, topic in enumerate(self.topics):
            # 1. S_exp
            s_exp, _ = self.calculate_s_exp(student_profile, topic, self_efficacy)
            # 2. S_cont
            s_cont = self.calculate_s_cont(completed_courses, idx)
            # 3. S_kw
            s_kw, matched_kw = self.calculate_s_kw(hobby_keywords, topic)

            # Celkové vážené skóre
            total_score = (alpha * s_exp) + (beta * s_cont) + (gamma * s_kw)
            total_score = float(max(0.0, min(1.0, total_score)))

            # Příspěvky
            contrib_exp = alpha * s_exp
            contrib_cont = beta * s_cont
            contrib_kw = gamma * s_kw

            explanation = self.generate_explanation(
                title=topic.get("title", ""),
                alpha=alpha, s_exp=s_exp,
                beta=beta, s_cont=s_cont,
                gamma=gamma, s_kw=s_kw,
                matched_kw=matched_kw,
                difficulty=topic.get("difficulty", 0.5),
                self_efficacy=self_efficacy
            )

            topic_kw_list = [k.strip() for k in topic.get("keywords", "").split(",") if k.strip()]

            scored_topics.append({
                "topic_id": topic.get("id", idx + 1),
                "code": topic.get("code", f"KIP-{idx+1}"),
                "title": topic.get("title", ""),
                "supervisor_name": topic.get("supervisor_name", ""),
                "description": topic.get("description", ""),
                "difficulty": float(topic.get("difficulty", 0.5)),
                "keywords": topic_kw_list,
                "total_score": round(total_score, 4),
                "s_exp": round(s_exp, 4),
                "s_cont": round(s_cont, 4),
                "s_kw": round(s_kw, 4),
                "contrib_exp": round(contrib_exp, 4),
                "contrib_cont": round(contrib_cont, 4),
                "contrib_kw": round(contrib_kw, 4),
                "matched_keywords": matched_kw,
                "explanation_text": explanation
            })

        # Řazení (tie-breaking):
        # 1. celkové skóre desc
        # 2. s_exp desc
        # 3. obtížnost asc
        # 4. abecední název asc
        scored_topics.sort(
            key=lambda x: (
                -x["total_score"],
                -x["s_exp"],
                x["difficulty"],
                x["title"].lower()
            )
        )

        top_topics = scored_topics[:max(3, min(5, top_k))]
        return alpha, beta, gamma, top_topics
