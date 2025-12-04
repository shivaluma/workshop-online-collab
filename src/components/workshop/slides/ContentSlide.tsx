"use client";

import type { ContentSlide as ContentSlideType } from "@/lib/slides/types";
import { cn } from "@/lib/utils";
import { Markdown } from "@/components/ui/markdown";

interface ContentSlideProps {
  slide: ContentSlideType;
}

export function ContentSlide({ slide }: ContentSlideProps) {
  const hasColumns = slide.columns && slide.columns.length > 0;
  const hasMarkdownContent = !!slide.content;

  return (
    <div className="w-full max-w-5xl space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        {slide.emoji && <span className="text-5xl">{slide.emoji}</span>}
        <h2 className="text-4xl md:text-5xl font-bold text-foreground">
          {slide.title}
        </h2>
      </div>

      {/* Markdown content */}
      {hasMarkdownContent && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Markdown>{slide.content!}</Markdown>
        </div>
      )}

      {/* Columns layout */}
      {hasColumns && (
        <div className="grid md:grid-cols-2 gap-6">
          {slide.columns?.map((column, idx) => (
            <div
              key={idx}
              className={cn(
                "rounded-2xl p-6 space-y-4",
                idx === 0 ? "bg-emerald-500/10 border border-emerald-500/30" : "bg-orange-500/10 border border-orange-500/30"
              )}
            >
              <h3 className="text-2xl font-semibold">{column.title}</h3>
              <ul className="space-y-2">
                {column.points.map((point, pIdx) => (
                  <li
                    key={pIdx}
                    className="flex items-start gap-3 text-lg animate-in fade-in slide-in-from-bottom-2"
                    style={{ animationDelay: `${pIdx * 100}ms` }}
                  >
                    <span className={idx === 0 ? "text-emerald-400" : "text-orange-400"}>•</span>
                    <Markdown compact>{point}</Markdown>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Regular points */}
      {!hasColumns && !hasMarkdownContent && slide.points && (
        <ul className="space-y-4">
          {slide.points.map((point, idx) => (
            <li
              key={idx}
              className="flex items-start gap-4 text-xl animate-in fade-in slide-in-from-left-4"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <span className="text-violet-400 font-bold text-2xl mt-0.5">•</span>
              {typeof point === "string" ? (
                <div className="flex-1">
                  <Markdown compact>{point}</Markdown>
                </div>
              ) : (
                <div>
                  <span className="font-semibold text-violet-300">{point.term}:</span>{" "}
                  <span className="text-muted-foreground">{point.description}</span>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Code block */}
      {slide.code && (
        <div className="relative animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: "300ms" }}>
          <pre className="bg-zinc-900 rounded-xl p-6 overflow-x-auto border border-zinc-700/50">
            <code className="text-sm md:text-base font-mono text-emerald-300 whitespace-pre">
              {slide.code}
            </code>
          </pre>
        </div>
      )}

      {/* Highlight */}
      {slide.highlight && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 animate-in fade-in">
          <Markdown compact>{`⚠️ ${slide.highlight}`}</Markdown>
        </div>
      )}

      {/* Note */}
      {slide.note && (
        <div className="text-muted-foreground text-lg border-l-4 border-violet-500/50 pl-4 animate-in fade-in">
          <Markdown compact>{`💡 ${slide.note}`}</Markdown>
        </div>
      )}
    </div>
  );
}
