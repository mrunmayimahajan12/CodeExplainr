# backend/analysis_utils.py
from __future__ import annotations
import json, re
from typing import Any, Dict, Optional

RE_DICT_LITERAL   = re.compile(r"\b\w+\s*=\s*\{\}")
RE_INDEX_ACCESS   = re.compile(r"\b\w+\s*\[")
RE_RETURN_CALL    = re.compile(r"\breturn\s+[A-Za-z_]\w*\(")

ANALYZE_OPTIONS: Dict[str, Any] = {
    # "temperature": 0.1, "top_k": 20, "top_p": 0.9,
    # "repeat_penalty": 1.1, "seed": 7, "num_predict": 320
    "temperature": 0.2,
    "top_p": 0.9,
    "num_ctx": 512,      # smaller context → less KV cache in VRAM
    "num_predict": 256   # enough to fill the JSON cleanly
}


ANALYZE_OPTIONS_TINY = {
    "temperature": 0.2,
    "top_p": 0.9,
    "num_ctx": 256,      # even smaller context
    "num_predict": 160
}

# ---------- pattern detection ----------

def _uses_sliding_window(code: str) -> bool:
    cl = code.lower()
    return ("enumerate(" in cl or "for " in cl and (" i " in cl or " j " in cl)) and ("in set" in cl or " in d" in cl or " in dict" in cl or "[" in cl and "]" in cl)

def _uses_hashmap(code: str) -> bool:
    cl = code.lower()
    return any([
        "dict(" in cl,
        RE_DICT_LITERAL.search(cl) is not None,
        RE_INDEX_ACCESS.search(cl) is not None,
    ])

def _uses_recursion(code: str) -> bool:
    cl = code.lower()
    return ("def " in cl) and (RE_RETURN_CALL.search(cl) is not None)

def _looks_like_median_partition(code: str) -> bool:
    cl = code.lower()
    return ("findkth" in cl or "k //" in cl) and ("mid" in cl or "k//2" in cl)

def _uses_bfs_or_dfs_grid(code: str) -> bool:
    cl = code.lower()
    return ("queue" in cl or "deque(" in cl or "bfs" in cl or "dfs" in cl) and ("grid" in cl or "[i][j]" in cl or "rows" in cl or "cols" in cl)

# def pattern_hints_from_code(code: str) -> str:
#     hints = []
#     if _uses_sliding_window(code):
#         hints.append("- Sliding window over array/string ⇒ time O(n); space O(min(n, σ)) due to set/map of in-window items.")
#     if _looks_like_median_partition(code):
#         hints.append("- k-th selection / binary partition ⇒ time O(log(m+n)) or O(log(min(m,n))); recursion implies O(log(...)) call-stack unless iterative.")
#     if _uses_bfs_or_dfs_grid(code):
#         hints.append("- Grid/graph traversal ⇒ time O(V+E) ~ O(MN) for grid; space up to O(MN) (frontier/visited).")
#     if _uses_recursion(code) and not _looks_like_median_partition(code):
#         hints.append("- Recursion adds stack usage; include '(call stack)' in space unless tail-recursive/iterative.")
#     # If nothing detected, still provide a generic n/m guideline
#     if not hints:
#         hints.append("- Use symbols n, m, e, σ as needed; prefer dominant term; avoid placeholders.")
#     return "\n".join(hints)

# ---------- parsing & normalization ----------

def parse_first_json(s: str) -> Optional[Dict[str, Any]]:
    dec = json.JSONDecoder()
    for m in re.finditer(r"\{", s):
        try:
            obj, _ = dec.raw_decode(s[m.start():])
            return obj
        except Exception:
            continue
    return None

def _normalize_analysis(a: Dict[str, Any]) -> Dict[str, Any]:
    out = {
        "time": {"best": "O(?)", "average": "O(?)", "worst": "O(?)"},
        "space": {"best": "O(?)", "average": "O(?)", "worst": "O(?)"},
        "bottlenecks": [],
        "optimizations": [],
    }
    t = a.get("time", {}) or {}
    same_t = t.get("overall") or t.get("total")
    out["time"]["best"] = t.get("best") or same_t or out["time"]["best"]
    out["time"]["average"] = t.get("average") or same_t or out["time"]["average"]
    out["time"]["worst"] = t.get("worst") or same_t or out["time"]["worst"]

    s = a.get("space", {}) or {}
    if {"best","average","worst"} <= set(s.keys()):
        out["space"] = {k: s[k] for k in ("best","average","worst")}
    else:
        same_s = s.get("total") or s.get("overall")
        aux = s.get("auxiliary")
        if same_s:
            out["space"] = {"best": same_s, "average": same_s, "worst": same_s}
        elif aux:
            out["space"] = {"best": aux, "average": aux, "worst": aux}
    out["bottlenecks"] = a.get("bottlenecks") or []
    out["optimizations"] = a.get("optimizations") or []
    return out

def _rank_complexity(s: str) -> int:
    if not isinstance(s, str): return 999
    x = s.lower().replace(" ", "")
    order = ["o(1)","θ(1)","Ω(1)","log","n","nlog","n^2","n^3","2^n","n!"]
    for i,k in enumerate(order):
        if k in x: return i
    return 500

def _enforce_monotonic_bounds(xyz: Dict[str, str]) -> Dict[str, str]:
    b,a,w = xyz.get("best","O(?)"), xyz.get("average","O(?)"), xyz.get("worst","O(?)")
    if _rank_complexity(a) < _rank_complexity(b): a = b
    if _rank_complexity(w) < _rank_complexity(a): w = a
    return {"best": b, "average": a, "worst": w}

def _annotate_space_k(analysis: Dict[str, Any]) -> Dict[str, Any]:
    sp = analysis.get("space") or {}
    def note(s: Any) -> Any:
        if isinstance(s, str) and "o(k" in s.lower() and "k =" not in s.lower():
            return s + " (k = #distinct items, ≤ min(n, σ))"
        return s
    for k in ("best","average","worst"):
        if k in sp: sp[k] = note(sp[k])
    analysis["space"] = sp
    return analysis

def _sanitize_optimizations(analysis: Dict[str, Any], code: str) -> Dict[str, Any]:
    text_code = code.lower()
    uses_hash = _uses_hashmap(code)
    uses_window = _uses_sliding_window(code)
    drop_if = []
    if uses_hash:   drop_if += ["hash map","hashmap","hash table","hashtable","dictionary","dict"]
    if uses_window: drop_if += ["sliding window","two pointer","two-pointer","two pointers"]
    cleaned = []
    for o in analysis.get("optimizations", []):
        text = (o.get("title","") + " " + o.get("idea","")).lower()
        if any(p in text for p in drop_if):
            continue
        cleaned.append(o)
    analysis["optimizations"] = cleaned
    return analysis

def _prune_generic_bottlenecks(analysis: Dict[str, Any]) -> Dict[str, Any]:
    generic = ("time complexity of the algorithm is o(", "because it involves iterating over", "it is linear because we traverse")
    kept = []
    for b in analysis.get("bottlenecks", []):
        bl = (b or "").lower()
        if any(s in bl for s in generic): continue
        kept.append(b)
    analysis["bottlenecks"] = kept
    return analysis

def postprocess_analysis(explanation: str, code: str) -> Optional[Dict[str, Any]]:
    a = parse_first_json(explanation)
    if not a: return None
    a = _normalize_analysis(a)
    a["time"]  = _enforce_monotonic_bounds(a["time"])
    a["space"] = _enforce_monotonic_bounds(a["space"])
    a = _annotate_space_k(a)
    a = _sanitize_optimizations(a, code)
    a = _prune_generic_bottlenecks(a)
    return a
