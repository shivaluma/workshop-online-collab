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
    <div className="w-full max-w-5xl space-y-8 px-4">
      {/* Header - Editorial serif heading */}
      <div className="flex items-center gap-4 animate-fade-up">
        {slide.emoji && <span className="text-4xl md:text-5xl">{slide.emoji}</span>}
        <div className="space-y-2">
          <h2 className="editorial-display text-3xl md:text-4xl lg:text-5xl text-foreground">
            {slide.title}
          </h2>
          <div className="section-rule-accent w-12" />
        </div>
      </div>

      {/* Markdown content */}
      {hasMarkdownContent && (
        <div className="animate-fade-up delay-100 prose prose-lg max-w-none">
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
                "rounded-lg p-6 space-y-4 border animate-fade-up",
                idx === 0 
                  ? "bg-accent/30 border-primary/20" 
                  : "bg-muted/30 border-border"
              )}
              style={{ animationDelay: `${(idx + 1) * 100}ms` }}
            >
              <h3 className="text-xl font-semibold text-foreground">{column.title}</h3>
              <ul className="space-y-3">
                {column.points.map((point, pIdx) => (
                  <li
                    key={pIdx}
                    className="flex items-start gap-3 text-base"
                  >
                    <span className={cn(
                      "mt-1.5 shrink-0",
                      idx === 0 ? "text-primary" : "text-foreground/60"
                    )}>—</span>
                    <span className="text-foreground/85">
                      <Markdown compact>{point}</Markdown>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Regular points - Editorial dash style */}
      {!hasColumns && !hasMarkdownContent && slide.points && (
        <ul className="space-y-4">
          {slide.points.map((point, idx) => (
            <li
              key={idx}
              className="flex items-start gap-4 text-lg animate-fade-up"
              style={{ animationDelay: `${(idx + 1) * 100}ms` }}
            >
              <span className="text-primary mt-1 shrink-0">—</span>
              {typeof point === "string" ? (
                <div className="flex-1 text-foreground/85">
                  <Markdown compact>{point}</Markdown>
                </div>
              ) : (
                <div>
                  <span className="font-semibold text-foreground">{point.term}:</span>{" "}
                  <span className="text-foreground/85">{point.description}</span>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Code block - Editorial styling */}
      {slide.code && (
        <div className="animate-fade-up delay-300">
          <pre className="bg-muted border border-border rounded-lg p-6 overflow-x-auto">
            <code className="text-sm md:text-base font-mono text-foreground whitespace-pre">
              {slide.code}
            </code>
          </pre>
        </div>
      )}

      {/* Highlight - Warm accent */}
      {slide.highlight && (
        <div className="bg-accent/50 border-l-4 border-primary rounded-r-lg p-4 animate-fade-in delay-400">
          <Markdown compact>{`⚠️ ${slide.highlight}`}</Markdown>
        </div>
      )}

      {/* Note - Subtle sidebar */}
      {slide.note && (
        <div className="text-foreground/80 text-base border-l-2 border-primary/50 pl-4 animate-fade-in delay-400 bg-primary/5 py-2 pr-4 rounded-r-lg">
          <Markdown compact>{`💡 ${slide.note}`}</Markdown>
        </div>
      )}
    </div>
  );
}
