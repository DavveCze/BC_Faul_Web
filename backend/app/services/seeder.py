"""
Inicializace databáze a naplnění seed daty KIP PřF OU.
"""
import os
import json
from sqlalchemy.orm import Session
from app.models.base import engine, Base
from app.models.entities import TopicEntity, CourseEntity
from app.core.config import settings
from app.services.importer import parse_topics_file

def init_db(db: Session):
    # Vytvoření všech tabulek
    Base.metadata.create_all(bind=engine)

    # 1. Kontrola a naplnění témat
    if db.query(TopicEntity).count() == 0:
        topics_seed_path = os.path.join(settings.SEEDS_DIR, "topics.json")
        if os.path.exists(topics_seed_path):
            with open(topics_seed_path, "r", encoding="utf-8") as f:
                topics_data = json.load(f)
                for t in topics_data:
                    entity = TopicEntity(
                        code=t["code"],
                        title=t["title"],
                        supervisor_name=t["supervisor_name"],
                        description=t["description"],
                        difficulty=float(t["difficulty"]),
                        keywords=t.get("keywords", ""),
                        profile_dimensions=t["profile_dimensions"],
                        is_active=t.get("is_active", True)
                    )
                    db.add(entity)
                db.commit()

    # 2. Kontrola a naplnění kurzů
    if db.query(CourseEntity).count() == 0:
        courses_seed_path = os.path.join(settings.SEEDS_DIR, "courses.json")
        if os.path.exists(courses_seed_path):
            with open(courses_seed_path, "r", encoding="utf-8") as f:
                courses_data = json.load(f)
                for c in courses_data:
                    entity = CourseEntity(
                        code=c["code"],
                        name=c["name"],
                        syllabus_text=c["syllabus_text"],
                        credits=int(c.get("credits", 5))
                    )
                    db.add(entity)
                db.commit()

    # 3. Kontrola složky data/import/ pro automatické nahrání externích souborů
    if os.path.exists(settings.IMPORT_DIR):
        for fname in os.listdir(settings.IMPORT_DIR):
            fpath = os.path.join(settings.IMPORT_DIR, fname)
            if os.path.isfile(fpath) and not fname.startswith("."):
                try:
                    with open(fpath, "rb") as f:
                        imported_topics = parse_topics_file(f.read(), fname)
                        for it in imported_topics:
                            existing = db.query(TopicEntity).filter(TopicEntity.code == it["code"]).first()
                            if not existing:
                                entity = TopicEntity(
                                    code=it["code"],
                                    title=it["title"],
                                    supervisor_name=it["supervisor_name"],
                                    description=it["description"],
                                    difficulty=float(it["difficulty"]),
                                    keywords=it.get("keywords", ""),
                                    profile_dimensions=it["profile_dimensions"],
                                    is_active=it.get("is_active", True)
                                )
                                db.add(entity)
                        db.commit()
                except Exception as e:
                    print(f"Chyba při importu souboru {fname}: {e}")
