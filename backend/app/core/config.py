from pathlib import Path
import torch

BASE_DIR   = Path(__file__).resolve().parent.parent.parent   # backend/
MODELS_DIR = (BASE_DIR.parent / "models").resolve()
LOGS_DIR   = (BASE_DIR.parent / "logs").resolve()
LOGS_DIR.mkdir(parents=True, exist_ok=True)

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

CORS_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
]
