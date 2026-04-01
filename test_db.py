import os
from pathlib import Path
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load the backend .env (uses localhost — correct for running outside Docker)
load_dotenv(Path(__file__).parent / "backend" / ".env")

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(DATABASE_URL)

try:
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))
        print("✅ Connected:", result.fetchone())
except Exception as e:
    print("❌ Error:", e)