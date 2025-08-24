"use client";
import { DiffEditor } from "@monaco-editor/react";
import { Card } from "./UIPrimitives";

type Lang = "python" | "javascript" | "cpp" | "java";

export default function DiffView({
  original,
  translated,
  sourceLang,
  targetLang,
}: {
  original: string;
  translated: string;
  sourceLang?: Lang;
  targetLang?: Lang;
}) {
  const L: Record<string, string> = {
    python: "python",
    javascript: "javascript",
    cpp: "cpp",
    java: "java",
  };

  return (
    <Card>
      <h3 className="font-semibold mb-2">
        Diff ({sourceLang ?? "source"} → {targetLang ?? "target"})
      </h3>
      <div className="h-[420px] rounded overflow-hidden ring-1 ring-white/10">
        <DiffEditor
          theme="vs-dark"
          original={original}
          modified={translated}
          language={targetLang ? L[targetLang] : undefined}
          options={{
            readOnly: true,
            renderSideBySide: true,
            minimap: { enabled: false },
            renderOverviewRuler: false,
            scrollBeyondLastLine: false,
            fontSize: 13,
          }}
        />
      </div>
    </Card>
  );
}
