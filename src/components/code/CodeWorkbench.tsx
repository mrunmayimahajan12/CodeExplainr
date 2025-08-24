"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Download, Copy, RefreshCw } from "lucide-react";
import { Card, Label, Select, Tabs, targetLanguageToExt } from "./UIPrimitives";
import EditorPanel from "./EditorPanel";
import OutputPanel from "./OutputPanel";

type Lang = "python" | "javascript" | "cpp" | "java";

type AnalysisJSON = {
  time: { best: string; average: string; worst: string };
  space: { best: string; average: string; worst: string };
  bottlenecks: string[];
  optimizations: { title: string; idea: string; tradeoffs: string }[];
} | null;

const API = "http://localhost:8000";

export default function CodeWorkbench() {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState<Lang>("python");
  const [targetLanguage, setTargetLanguage] = useState<Lang>("java");
  const [tone, setTone] = useState("Beginner");
  const [action, setAction] = useState<"explain" | "convert" | "analyze">("explain");

  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [model, setModel] = useState("codellama");
  const [models, setModels] = useState<string[]>([]);
  const [copyPressed, setCopyPressed] = useState(false);


  const [output, setOutput] = useState("");
  const [analysis, setAnalysis] = useState<AnalysisJSON>(null);

  useEffect(() => {
    fetch(`${API}/models`)
      .then((r) => r.json())
      .then((d) => setModels(d.models || []))
      .catch(() => setModels(["codellama"]));
  }, []);

  function buildPayload() {
    const payload: any = {
      code,
      language,
      mode: action === "convert" ? "translate" : action,
      tone: action !== "convert" ? tone : undefined,
      target_language: action === "convert" ? targetLanguage : undefined,
      model,
    };
    return payload;
  }

  async function handleSubmit() {
  if (!code.trim()) return;
  setLoading(true);
  setOutput("");
  setAnalysis(null);

  const payload = buildPayload();

  
  const useStreaming = streaming && action !== "analyze";

  if (useStreaming) {
    const res = await fetch(`${API}/explain/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const reader = res.body?.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { value, done } = await reader!.read();
      if (done) break;
      setOutput((prev) => prev + decoder.decode(value));
    }
    setLoading(false);
  } else {
    try {
      const res = await fetch(`${API}/explain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setOutput(data.explanation || "❌ No explanation returned.");
      if (action === "analyze") setAnalysis(data.analysis || null); // <- enables AnalysisTable
    } catch (e) {
      setOutput("❌ Error: Could not fetch response.");
    } finally {
      setLoading(false);
    }
  }
}


  async function handleCopy() {
    setCopyPressed(true);
    await navigator.clipboard.writeText(output || "");
    setTimeout(() => setCopyPressed(false), 150);
  }

  function handleDownload() {
    const blob = new Blob([output || ""], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const ext = action === "convert" ? targetLanguageToExt(targetLanguage) : "md";
    a.href = url;
    a.download = `codeexplainr-output.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const translatedCode = useMemo(() => {
    if (action !== "convert") return "";
    const match = output.match(/```[a-zA-Z0-9]*\n([\s\S]*?)```/);
    return match ? match[1].trim() : output.trim();
  }, [output, action]);

  return (
    <div className="p-4 md:p-6">
      {/* Header row: tabs, model, stream, run/clear */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Tabs value={action} onChange={(v) => setAction(v)} />
          <div className="hidden md:block h-6 w-px bg-white/10" />
          <Select
            value={model}
            onChange={setModel}
            className="w-auto"
          >
            {models.length ? (
              models.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))
            ) : (
              <option>codellama</option>
            )}
          </Select>

          <label className="inline-flex items-center gap-2 text-sm ml-2">
            <input
              type="checkbox"
              className="accent-sky-400"
              checked={streaming}
              onChange={(e) => setStreaming(e.target.checked)}
            />
            Stream
          </label>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleSubmit}
            disabled={loading || !code.trim()}
            className="transition-all active:scale-95 active:bg-sky-100 active:border-sky-400 active:shadow-inner"
            >
            {loading ? (
                <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
                </>
            ) : (
                "Run"
            )}
          </Button>
          <Button
            variant="secondary"
            onClick={() => setOutput("")}
            disabled={loading}
            className="transition-all active:scale-95 active:bg-sky-100 active:border-sky-400 active:shadow-inner"
            >
            <RefreshCw className="mr-2 h-4 w-4" /> Clear
          </Button>
        </div>
      </div>

      {/* Editor + side controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <EditorPanel code={code} setCode={setCode} language={language} loading={loading} />
        </div>

        <aside className="space-y-3">
          <Label>Source language</Label>
          <Select value={language} onChange={(v) => setLanguage(v as Lang)}>
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
            <option value="cpp">C++</option>
            <option value="java">Java</option>
          </Select>

          {action !== "convert" && (
            <>
              <Label>Explanation tone</Label>
              <Select value={tone} onChange={setTone}>
                <option value="Beginner">Beginner</option>
                <option value="Interview">Interview Prep</option>
                <option value="Instructor">Instructor</option>
              </Select>
            </>
          )}

          {action === "convert" && (
            <>
              <Label>Target language</Label>
              <Select value={targetLanguage} onChange={(v) => setTargetLanguage(v as Lang)}>
                <option value="python">Python</option>
                <option value="javascript">JavaScript</option>
                <option value="cpp">C++</option>
                <option value="java">Java</option>
              </Select>
            </>
          )}

          <div className="pt-2 flex gap-2">
            <Button
                variant="outline"
                className="text-sky-400 transition-all active:scale-95 active:bg-sky-100 active:border-sky-400 active:shadow-inner"
                onClick={handleCopy}
                disabled={!output}
            >
                <Copy className="mr-2 h-4 w-4" /> Copy
            </Button>
            <Button
                variant="outline"
                className="text-sky-400"
                onClick={handleDownload}
                disabled={!output}
            >
                <Download className="mr-2 h-4 w-4" /> Download
            </Button>
          </div>
        </aside>
      </div>

      {/* Output */}
      <section className="mt-6">
        <Label>Output</Label>
        <OutputPanel
          action={action}
          output={output}
          translatedCode={translatedCode}
          analysis={analysis}
          loading={loading}
          originalCode={code}          
          sourceLang={language}        
          targetLang={targetLanguage}
        />
      </section>
    </div>
  );
}




