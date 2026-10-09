"""
Modul pro lemmatizaci české morfologie a odstraňování stop-slov.
Podporuje nástroj MorphoDiTa (ÚFAL MFF UK) s automatickým fallbackem pro vývoj.
"""
import os
import re
from typing import List, Set

CZECH_STOPWORDS: Set[str] = {
    "a", "aby", "aj", "ale", "ani", "aniz", "ano", "asi", "az", "bez", "bude", "budem",
    "budes", "by", "byl", "byla", "byli", "bylo", "byt", "ci", "clanek", "clanku",
    "co", "coz", "cz", "dalsi", "de", "do", "doba", "docela", "dost", "dva", "dvacet",
    "hodne", "i", "jak", "jake", "jako", "je", "jeho", "jej", "jeji", "jejich", "jen",
    "jeste", "jenz", "ji", "jina", "jine", "jiny", "jiz", "jsem", "jses", "jsme",
    "jsou", "jste", "k", "kam", "kazdy", "kde", "kdo", "kdy", "kdyz", "ke", "ktera",
    "ktere", "kteri", "kterou", "ktery", "ku", "ma", "mate", "me", "mezi", "mi", "mit",
    "mne", "mnoho", "mou", "mu", "muze", "my", "na", "nad", "nam", "napred", "nas",
    "nasi", "ne", "nebo", "necht", "nejsou", "nemate", "nemuzeme", "neni", "nez", "nic",
    "nove", "novy", "o", "od", "ode", "on", "ona", "oni", "ono", "ony", "osoby", "pak",
    "po", "pod", "podle", "pokud", "pouze", "prave", "pred", "pres", "pri", "pro",
    "proc", "proto", "protoze", "prvni", "pta", "s", "se", "si", "sice", "sve", "svych",
    "svym", "svymi", "ta", "tady", "tak", "take", "takhle", "taky", "tam", "tamhle",
    "tato", "tedy", "tema", "tento", "teto", "ti", "tim", "timto", "tipy", "to", "tohle",
    "toho", "tohoto", "tom", "tomto", "tomuto", "toto", "tu", "tuto", "tvuj", "ty",
    "tyto", "u", "urcite", "uz", "v", "vam", "vas", "vase", "ve", "vice", "vsak", "vsechen",
    "vsechno", "vsechny", "vsem", "vsichni", "vzhledem", "z", "za", "zda", "zde", "ze",
    "zpet", "zpravy", "prac", "prace", "praci", "cilem", "popis", "ramci", "oblasti"
}

class CzechTextProcessor:
    def __init__(self, model_path: str = None):
        self.morpho = None
        self.tokenizer = None
        
        # Pokus o načtení ÚFAL MorphoDiTa, pokud je nainstalován a model existuje
        if model_path and os.path.exists(model_path):
            try:
                import ufal.morphodita as ufal_m
                self.morpho = ufal_m.Tagger.load(model_path)
                if self.morpho:
                    self.tokenizer = self.morpho.newTokenizer()
            except Exception:
                self.morpho = None

    def clean_text(self, text: str) -> str:
        """Odstraní diakritiku/speciální znaky pro základní porovnání a normalizuje mezery"""
        if not text:
            return ""
        # Ponechá písmena a číslice, odstraní interpunkci
        text = re.sub(r"[^\w\s]", " ", text, flags=re.UNICODE)
        text = re.sub(r"\s+", " ", text).strip().lower()
        return text

    def tokenize(self, text: str) -> List[str]:
        cleaned = self.clean_text(text)
        return [word for word in cleaned.split() if len(word) > 2 and word not in CZECH_STOPWORDS]

    def lemmatize_word_fallback(self, word: str) -> str:
        """
        Heuristické zkrácení českých pádových koncovek (light stemmer) pro případ absence MorphoDiTa.
        Normalizuje základní flektivní tvary (např. aplikacemi -> aplikac, databázích -> databaz).
        """
        w = word.lower()
        # Odstranění běžných adjektivních a substantivních koncovek
        for suffix in ("ejšímu", "ejšího", "ejších", "ejšími", "ější", "ého", "ému", "ých", "ými", "emi", "ami", "ovi", "ích", "ách", "ích", "ovi", "ata", "ata", "ích", "ím", "em", "ům", "ou", "ie", "ce", "ek", "ka", "ku", "ky", "ek", "ka", "ku", "ky", "em", "am", "om", "y", "e", "u", "i", "a", "o"):
            if w.endswith(suffix) and len(w) - len(suffix) >= 3:
                w = w[:-len(suffix)]
                break
        return w

    def lemmatize(self, text: str) -> List[str]:
        """
        Převede text na seznam lemmatizovaných tokenů bez stop-slov.
        Používá MorphoDiTa pokud je dostupná, jinak deterministický heuristický fallback.
        """
        if not text:
            return []

        # Pokud máme načtený oficiální MorphoDiTa model:
        if self.morpho and self.tokenizer:
            try:
                import ufal.morphodita as ufal_m
                self.tokenizer.setText(text)
                forms = ufal_m.Forms()
                lemmas = ufal_m.TaggedLemmas()
                tokens = ufal_m.TokenRanges()
                result = []
                while self.tokenizer.nextSentence(forms, tokens):
                    self.morpho.tag(forms, lemmas)
                    for l in lemmas:
                        raw_lemma = l.lemma.split("-")[0].split("_")[0].lower()
                        clean_l = re.sub(r"[^\w]", "", raw_lemma)
                        if clean_l and len(clean_l) > 2 and clean_l not in CZECH_STOPWORDS:
                            result.append(clean_l)
                return result
            except Exception:
                pass # fallback

        # Fallback zpracování
        tokens = self.tokenize(text)
        return [self.lemmatize_word_fallback(t) for t in tokens if t not in CZECH_STOPWORDS]

    def get_lemmatized_set(self, text_or_list) -> Set[str]:
        if isinstance(text_or_list, list):
            text = " ".join(text_or_list)
        else:
            text = str(text_or_list)
        return set(self.lemmatize(text))

processor = CzechTextProcessor()
