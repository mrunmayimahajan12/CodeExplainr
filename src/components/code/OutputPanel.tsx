"use client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Card, Prose } from "./UIPrimitives";
import DiffView from "./DiffView";
import AnalysisTable from "./AnalysisTable";

type AnalysisJSON = {
  time: { best: string; average: string; worst: string };
  space: { best: string; average: string; worst: string };
  bottlenecks: string[];
  optimizations: { title: string; idea: string; tradeoffs: string }[];
} | null;

export default function OutputPanel({
  action,
  output,
  translatedCode,
  analysis,
  loading,
  originalCode,                           
  sourceLang,                             
  targetLang,                              
}: {
  action: "explain" | "convert" | "analyze";
  output: string;
  translatedCode: string;
  analysis: AnalysisJSON;
  loading: boolean;
  originalCode?: string;                   
  sourceLang?: "python" | "javascript" | "cpp" | "java"; 
  targetLang?: "python" | "javascript" | "cpp" | "java"; 
}) {
  if (action === "convert") {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        <DiffView
          original={originalCode ?? ""}     
          translated={translatedCode}
          sourceLang={sourceLang}
          targetLang={targetLang}
        />
       <div className="min-w-0">
        <Card>
          <h3 className="font-semibold mb-2">Model Output</h3>
          <Prose>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {output || "—"}
            </ReactMarkdown>
          </Prose>
        </Card>
       </div>
        
      </div>
    );
  }

  return (
    <Card>
        {action === "analyze" && analysis ? (
            // When we have structured JSON, show only the clean table
            <AnalysisTable analysis={analysis} />
        ) : (
            <>
            <Prose>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {loading ? "⏳ Generating..." : output || "—"}
                </ReactMarkdown>
            </Prose>

            {action === "analyze" && !analysis && !loading && (
                <div className="mt-3 text-sm text-slate-400">
                No structured table. Turn off <em>Stream</em> or ensure Analyze returns strict JSON.
                </div>
            )}
            </>
        )}
    </Card>

  );
}
