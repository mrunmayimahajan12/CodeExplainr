"use client";
import { Badge, Card } from "./UIPrimitives";

type AnalysisJSON = {
  time: { best: string; average: string; worst: string };
  space: { best: string; average: string; worst: string };
  bottlenecks: string[];
  optimizations: { title: string; idea: string; tradeoffs: string }[];
};

export default function AnalysisTable({ analysis }: { analysis: AnalysisJSON }) {
  return (
    <div className="mt-4">
      <h3 className="font-semibold mb-2">Complexity Summary</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <MetricCard title="Time" data={analysis.time} />
        <MetricCard title="Space" data={analysis.space} />
      </div>

      {!!analysis.bottlenecks?.length && (
        <>
          <h4 className="mt-4 font-semibold">Bottlenecks</h4>
          <ul className="list-disc pl-6 text-sm text-slate-300">
            {analysis.bottlenecks.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        </>
      )}

      {!!analysis.optimizations?.length && (
        <>
          <h4 className="mt-4 font-semibold">Optimizations</h4>
          <ul className="space-y-2">
            {analysis.optimizations.map((o, i) => (
              <li key={i} className="rounded border border-white/10 p-3">
                <div className="font-medium">{o.title}</div>
                <div className="text-sm text-slate-300">{o.idea}</div>
                <div className="text-xs text-slate-400 mt-1">
                  <span className="font-semibold">Trade‑offs:</span> {o.tradeoffs}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function MetricCard({ title, data }: { title: string; data: any }) {
  return (
    <Card>
      <div className="text-sm font-semibold mb-2">{title}</div>
      <div className="space-x-2">
        <Badge>Best: {data?.best ?? "—"}</Badge>
        <Badge>Avg: {data?.average ?? "—"}</Badge>
        <Badge>Worst: {data?.worst ?? "—"}</Badge>
      </div>
    </Card>
  );
}
