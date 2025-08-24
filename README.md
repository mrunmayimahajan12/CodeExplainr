# CodeExplainr

Small Next.js + FastAPI app that can **explain**, **analyze**, and **convert** code using a local LLM via Ollama.

## Requirements
- Node 18+
- Python 3.10+
- Ollama running on `http://127.0.0.1:11434`
- A model pulled (e.g. `codellama` or `codellama:7b-instruct-q4_0`)

```bash
ollama pull codellama

Backend (FastAPI)

cd backend
python -m venv .venv
# Windows: . .venv/Scripts/activate
pip install -r requirements.txt

Create backend/.env:
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=codellama

Run:
uvicorn main:app --reload --port 8000


Frontend (Next.js)
npm install
npm run dev
# opens http://localhost:3000 (may switch to 3001 if 3000 is busy)

Notes

Keep one Ollama server running (service or ollama serve, not both).

If the browser blocks requests, add your dev URL to FRONTEND_ORIGINS and restart the backend.

If Ollama throws a 500 about CUDA/“unable to allocate”, free some RAM or use the 7b-instruct-q4_0 tag.

