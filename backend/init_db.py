import os
import sys

# Ensure the app module can be imported
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.postgres import engine, Base
import app.models  # Registers all SQLAlchemy models with Base

def init_db():
    print("Creating database tables...")
    try:
        Base.metadata.create_all(bind=engine)
        print("Successfully created all database tables!")
    except Exception as e:
        print(f"Error creating tables: {e}")

if __name__ == "__main__":
    init_db()
