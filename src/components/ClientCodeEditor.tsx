"use client";

import dynamic from "next/dynamic";

const CodeEditor = dynamic(() => import("@/components/CodeEditor"), {
  ssr: false,
  loading: () => (
    <div className="max-w-6xl mx-auto px-6 py-10 text-slate-300">
      Loading editor…
    </div>
  ),
});

export default function ClientCodeEditor() {
  return <CodeEditor />;
}
