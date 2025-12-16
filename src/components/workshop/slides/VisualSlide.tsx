"use client";

import type { VisualSlide as VisualSlideType } from "@/lib/slides/types";
import { cn } from "@/lib/utils";
import { ArrowDown } from "lucide-react";

interface VisualSlideProps {
  slide: VisualSlideType;
}

export function VisualSlide({ slide }: VisualSlideProps) {
  return (
    <div className="w-full max-w-5xl space-y-8 px-4">
      {/* Header - Editorial styling */}
      <div className="flex items-center gap-4 animate-fade-up">
        {slide.emoji && <span className="text-4xl md:text-5xl">{slide.emoji}</span>}
        <div className="space-y-2">
          <h2 className="editorial-display text-3xl md:text-4xl lg:text-5xl text-foreground">
            {slide.title}
          </h2>
          <div className="section-rule-accent w-12" />
        </div>
      </div>

      {slide.description && (
        <p className="text-lg text-muted-foreground max-w-2xl animate-fade-up delay-100">
          {slide.description}
        </p>
      )}

      {/* Comparison view - Refined cream tones */}
      {slide.visualType === "comparison" && slide.left && slide.right && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Left side - Negative/Before */}
          <div className="bg-muted/50 border border-border rounded-lg p-6 space-y-4 animate-slide-left">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-destructive" />
              <h3 className="text-xl font-semibold text-foreground">{slide.left.title}</h3>
            </div>
            <pre className="bg-background rounded-lg p-4 overflow-x-auto text-sm border border-border">
              <code className="font-mono text-foreground">{slide.left.code}</code>
            </pre>
            {slide.left.description && (
              <p className="text-muted-foreground text-sm">{slide.left.description}</p>
            )}
            {slide.left.count && (
              <div className="text-destructive font-mono text-sm font-medium">{slide.left.count}</div>
            )}
          </div>

          {/* Right side - Positive/After */}
          <div className="bg-accent/30 border border-primary/20 rounded-lg p-6 space-y-4 animate-slide-right">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary" />
              <h3 className="text-xl font-semibold text-foreground">{slide.right.title}</h3>
            </div>
            <pre className="bg-background rounded-lg p-4 overflow-x-auto text-sm border border-border">
              <code className="font-mono text-foreground">{slide.right.code}</code>
            </pre>
            {slide.right.description && (
              <p className="text-muted-foreground text-sm">{slide.right.description}</p>
            )}
            {slide.right.count && (
              <div className="text-primary font-mono text-sm font-medium">{slide.right.count}</div>
            )}
          </div>
        </div>
      )}

      {/* Flow view - Clean step visualization */}
      {slide.visualType === "flow" && slide.steps && (
        <div className="space-y-3">
          {slide.steps.map((step, idx) => (
            <div key={idx} className="animate-fade-up" style={{ animationDelay: `${idx * 100}ms` }}>
              <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-primary font-semibold text-sm">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <div className="font-mono text-foreground text-sm">{step.action}</div>
                  <div className="text-muted-foreground text-sm">→ {step.result}</div>
                </div>
              </div>
              {idx < slide.steps!.length - 1 && (
                <div className="flex justify-center py-2">
                  <ArrowDown className="w-5 h-5 text-border" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tree view - Clean hierarchical display */}
      {slide.visualType === "tree" && slide.example && (
        <div className="bg-card border border-border rounded-lg p-6 space-y-6 animate-fade-up delay-200">
          <div className="font-mono text-foreground text-lg">{slide.example.search}</div>
          <div className="space-y-3">
            {slide.example.steps.map((step, idx) => (
              <div
                key={idx}
                className="flex items-center gap-4 animate-fade-up"
                style={{ animationDelay: `${(idx + 2) * 100}ms` }}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center font-medium text-sm",
                    idx === slide.example!.steps.length - 1
                      ? "bg-primary text-primary-foreground"
                      : "bg-accent text-muted-foreground"
                  )}
                >
                  {idx + 1}
                </div>
                <div className="text-base text-muted-foreground">{step}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warning - Editorial accent bar */}
      {slide.warning && (
        <div className="bg-accent/50 border-l-4 border-primary rounded-r-lg p-4 text-foreground animate-fade-in delay-300">
          ⚠️ {slide.warning}
        </div>
      )}
    </div>
  );
}
