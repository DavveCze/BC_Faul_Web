"""
Konfigurace backendové aplikace FastAPI
"""
import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path

 #Kořen backendu a projektu
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent  # .../BC_Faul_Web/backend
ROOT_DIR = BACKEND_DIR.parent                               # .../BC_Faul_Web

# Automatické zajištění existence složky pro databázi
DB_DIR = BACKEND_DIR / "app" / "data"
DB_DIR.mkdir(parents=True, exist_ok=True)
DEFAULT_DB_PATH = f"sqlite:///{DB_DIR / 'recommender.db'}"

class Settings(BaseSettings):
    PROJECT_NAME: str = "Doporučovací systém závěrečných prací - PřF OU"
    API_V1_STR: str = "/api"
    DATABASE_URL: str = os.getenv("DATABASE_URL", DEFAULT_DB_PATH)
    IMPORT_DIR: str = str(ROOT_DIR / "data" / "import")
    SEEDS_DIR: str = str(ROOT_DIR / "data" / "seeds")
    
    # Výchozí váhy modelu
    DEFAULT_ALPHA: float = 0.5  # Psychologický profil S_exp
    DEFAULT_BETA: float = 0.3   # Obsahová podobnost sylabů S_cont
    DEFAULT_GAMMA: float = 0.2  # Shoda klíčových slov zájmů S_kw
    DEFAULT_LAMBDA: float = 0.25 # Síla penalizace náročnosti

    # Admin autorizace (jednoduchý klíč pro administrátorský export a správu)
    ADMIN_SECRET: str = os.getenv("ADMIN_SECRET", "kip-faul-bc-admin-2027")

    model_config = SettingsConfigDict(case_sensitive=True)

settings = Settings()
