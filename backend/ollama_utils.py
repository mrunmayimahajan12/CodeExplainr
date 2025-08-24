import os
import requests
from dotenv import load_dotenv

load_dotenv()


import os, requests, json
from dotenv import load_dotenv

load_dotenv()
OLLAMA_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
MODEL = os.getenv("OLLAMA_MODEL", "codellama")

def _read_ollama_error(resp: requests.Response) -> str:
    try:
        data = resp.json()
        return data.get("error") or str(data)
    except Exception:
        return resp.text.strip()

def _extract_text(resp: requests.Response) -> str:
    try:
        data = resp.json()
        txt = (data.get("response") or data.get("message") or data.get("content") or "")
        return txt if isinstance(txt, str) and txt.strip() else json.dumps(data)
    except Exception:
        return resp.text

def get_ollama_response(prompt: str, model: str | None = None, options: dict | None = None) -> str:
    chosen = model or MODEL
    base = {"model": chosen, "prompt": prompt, "stream": False}

    # 1st attempt (with options if provided)
    payload = dict(base)
    if options:
        payload["options"] = options
    r = requests.post(f"{OLLAMA_URL}/api/generate", json=payload, timeout=90)
    if r.status_code < 400:
        return _extract_text(r)

    # Read error; retry once without options (common cause of 500s)
    detail = _read_ollama_error(r)
    if options:
        r2 = requests.post(f"{OLLAMA_URL}/api/generate", json=base, timeout=90)
        if r2.status_code < 400:
            return _extract_text(r2)
        detail = f"{detail} | {_read_ollama_error(r2)}"

    raise RuntimeError(f"Ollama {r.status_code}: {detail}")


