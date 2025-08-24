"use client";
import Editor from "@monaco-editor/react";

export default function EditorPanel({
  code,
  setCode,
  language,
  loading,
}: {
  code: string;
  setCode: (v: string) => void;
  language: string;
  loading: boolean;
}) {
  return (
    <div className="rounded-xl overflow-hidden ring-1 ring-white/10">
      <Editor
        height="520px"
        defaultLanguage={language}
        language={language}
        value={code}
        onChange={(v) => setCode(v || "")}
        theme="vs-dark"
        options={{
          readOnly: loading,
          minimap: { enabled: false },
          fontSize: 14,
          padding: { top: 10, bottom: 10 },
          scrollBeyondLastLine: false,
        }}
      />
    </div>
  );
}
