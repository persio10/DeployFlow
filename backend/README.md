# DeployFlow Fleet Backend

This is the FastAPI backend for DeployFlow Fleet.

## Getting Started

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # or .venv\\Scripts\\activate on Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
