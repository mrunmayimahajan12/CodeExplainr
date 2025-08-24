from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import os, json, requests, traceback

from ollama_utils import get_ollama_response, MODEL as DEFAULT_MODEL

FRONTEND_ORIGINS = os.getenv("FRONTEND_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",")
OLLAMA_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
MODEL = os.getenv("OLLAMA_MODEL", DEFAULT_MODEL)  


ANALYZE_OPTIONS = {
    "temperature": 0.2,
    "top_p": 0.9,
    "num_ctx": 512,     
    "num_predict": 256, 
}


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CodeInput(BaseModel):
    code: str
    language: str
    mode: str                   # 'explain' | 'translate' | 'analyze'
    target_language: str | None = None
    tone: str | None = None
    model: str | None = None


def build_prompt(req: CodeInput) -> str:
    if req.mode == "explain":
        return f"""
            You are a helpful programming assistant.
            Explain the following {req.language} code in a beginner-friendly, line-by-line way. 
            Use numbered steps and avoid jargon where possible.

            Code:
            {req.code}
            """
    elif req.mode == "translate":
        if not req.target_language:
            raise HTTPException(status_code=400, detail="Target language is required for translation.")
        return f"""
            You are a precise programming code converter.

            Convert the following code from {req.language} to {req.target_language}:
            - Preserve logic, structure, and intent.
            - Ensure all syntax is valid in the target language.
            - Avoid using constructs that do not exist in the target language (e.g., no zip() in C++).
            - Translate comments as well.
            - Do not add any explanation or extra comments beyond those in the original code.
            - If needed, simulate missing functionality using loops or standard constructs.
            After the code, briefly describe major translation adjustments or challenges (if any).

            Code:
            {req.code}
            """
    elif req.mode == "analyze":
        return f"""
            You are a precise static-analysis assistant for {req.language} code.

            Return ONE JSON object ONLY (no prose/markdown/fences):
            {{
            "time":   {{"best":"O(...)", "average":"O(...)", "worst":"O(...)" }},
            "space":  {{"best":"O(...)", "average":"O(...)", "worst":"O(...)" }},
            "bottlenecks": ["short, specific items"],
            "optimizations": [{{ "title":"...", "idea":"...", "tradeoffs":"..." }}]
            }}

            Rules:
            - Define symbols inline where used (e.g., "O(k) (k = #distinct chars, ≤ min(n, σ))").
            - Use keys exactly "best","average","worst"; if identical, repeat the bound.
            - No placeholders like "O(?)" or "...".
            - Report TOTAL space (includes outputs). Never claim O(1) if a result grows with input.
            - If recursive, include "(call stack)" in space; if iterative and no growing structure, space is O(1).
            - Do NOT propose an optimization already present in the code.
            - Prefer the dominant term; avoid additive mixes unless truly sequential phases exist.

            Code:
            {req.code}
            """
    else:
        raise HTTPException(status_code=400, detail="Invalid mode")


@app.get("/health")
def health():
    return {"ok": True}

@app.get("/models")
def list_models():
    try:
        r = requests.get(f"{OLLAMA_URL}/api/tags", timeout=10)
        r.raise_for_status()
        tags = r.json().get("models", [])
        models = [m.get("name") for m in tags if m.get("name")]
        return {"models": models}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch models: {e}")


def parse_first_json(s: str):
    try:
        dec = json.JSONDecoder()
        for i, ch in enumerate(s):
            if ch == "{":
                try:
                    obj, _ = dec.raw_decode(s[i:])
                    return obj
                except Exception:
                    continue
    except Exception:
        pass
    return None

@app.post("/explain")
async def handle_code_request(request: CodeInput):
    try:
        prompt = build_prompt(request)
        chosen_model = request.model or MODEL

        if request.mode == "analyze":
            explanation = get_ollama_response(prompt, chosen_model, ANALYZE_OPTIONS)
            analysis = parse_first_json(explanation)
        else:
            explanation = get_ollama_response(prompt, chosen_model)
            analysis = None

        # Always return something texty to the UI
        if not (explanation or "").strip():
            explanation = "—"

        return {"explanation": explanation, "analysis": analysis}
    except Exception as e:
        print("❌ Backend Error:\n", traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))



@app.post("/explain/stream")
async def handle_code_stream(request: CodeInput):
    try:
        prompt = build_prompt(request)
        chosen_model = request.model or MODEL

        def gen():
            with requests.post(
                f"{OLLAMA_URL}/api/generate",
                json={"model": chosen_model, "prompt": prompt, "stream": True},
                stream=True,
                timeout=None,
            ) as r:
                r.raise_for_status()
                for line in r.iter_lines(decode_unicode=True):
                    if not line:
                        continue
                    
                    try:
                        chunk = json.loads(line).get("response", "")
                        if chunk:
                            yield chunk
                    except Exception:
                         yield line

        return StreamingResponse(gen(), media_type="text/plain")
    except Exception as e:
        print("❌ Stream Error:\n", traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

