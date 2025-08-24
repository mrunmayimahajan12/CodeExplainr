"use client";
import React from "react";

export function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-w-0 overflow-hidden rounded-2xl bg-slate-900/60 border border-white/10 p-4 shadow-inner">
      {children}
    </div>
  );
}

export function Prose({ children }: { children: React.ReactNode}) {
  return (
    <div className="prose prose-invert max-w-none break-words
                    max-h-[420px] overflow-auto
                    prose-pre:bg-slate-800/80 prose-pre:rounded-lg prose-pre:overflow-x-auto
                    text-sm">
      {children}
    </div> 
  );
}

export function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-sm font-medium text-slate-200 mb-1">{children}</div>;
}

export function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 border border-white/10">
      {children}
    </span>
  );
}

export function Select({
  value,
  onChange,
  children,
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full bg-slate-800/60 border border-white/10 rounded px-3 py-2 text-sm ${className}`}
    >
      {children}
    </select>
  );
}

export function Tabs({
  value,
  onChange,
}: {
  value: "explain" | "convert" | "analyze";
  onChange: (val: "explain" | "convert" | "analyze") => void;
}) {
  const items: { key: "explain" | "convert" | "analyze"; label: string }[] = [
    { key: "explain", label: "Explain" },
    { key: "convert", label: "Convert" },
    { key: "analyze", label: "Analyze" },
  ];
  return (
    <div className="inline-flex p-1 rounded-xl bg-slate-800/60 border border-white/10">
      {items.map((it) => (
        <button
          key={it.key}
          onClick={() => onChange(it.key)}
          className={`px-3 py-1.5 text-sm rounded-lg transition ${
            value === it.key
              ? "bg-sky-500 text-white shadow"
              : "text-slate-300 hover:text-white"
          }`}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}

export function targetLanguageToExt(lang: string) {
  switch (lang) {
    case "python":
      return "py";
    case "javascript":
      return "js";
    case "cpp":
      return "cpp";
    case "java":
      return "java";
    default:
      return "txt";
  }
}
