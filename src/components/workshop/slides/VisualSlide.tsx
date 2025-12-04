"use client";

import type { VisualSlide as VisualSlideType } from "@/lib/slides/types";
import { cn } from "@/lib/utils";
import { ArrowDown } from "lucide-react";

interface VisualSlideProps {
  slide: VisualSlideType;
}

export function VisualSlide({ slide }: VisualSlideProps) {
  return (
    <div className="w-full max-w-5xl space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        {slide.emoji && <span className="text-5xl">{slide.emoji}</span>}
        <h2 className="text-4xl md:text-5xl font-bold text-foreground">
          {slide.title}
        </h2>
      </div>

      {slide.description && (
        <p className="text-xl text-muted-foreground">{slide.description}</p>
      )}

      {/* Comparison view */}
      {slide.visualType === "comparison" && slide.left && slide.right && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Left side */}
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-6 space-y-4 animate-in fade-in slide-in-from-left-8 duration-500">
            <h3 className="text-2xl font-semibold text-rose-300">{slide.left.title}</h3>
            <pre className="bg-zinc-900/80 rounded-lg p-4 overflow-x-auto text-sm">
              <code className="text-rose-200">{slide.left.code}</code>
            </pre>
            {slide.left.description && (
              <p className="text-muted-foreground">{slide.left.description}</p>
            )}
            {slide.left.count && (
              <div className="text-rose-400 font-mono text-lg">{slide.left.count}</div>
            )}
          </div>

          {/* Right side */}
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 space-y-4 animate-in fade-in slide-in-from-right-8 duration-500 delay-200">
            <h3 className="text-2xl font-semibold text-emerald-300">{slide.right.title}</h3>
            <pre className="bg-zinc-900/80 rounded-lg p-4 overflow-x-auto text-sm">
              <code className="text-emerald-200">{slide.right.code}</code>
            </pre>
            {slide.right.description && (
              <p className="text-muted-foreground">{slide.right.description}</p>
            )}
            {slide.right.count && (
              <div className="text-emerald-400 font-mono text-lg">{slide.right.count}</div>
            )}
          </div>
        </div>
      )}

      {/* Flow view */}
      {slide.visualType === "flow" && slide.steps && (
        <div className="space-y-4">
          {slide.steps.map((step, idx) => (
            <div key={idx} className="animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: `${idx * 200}ms` }}>
              <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-400 font-bold">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <div className="font-mono text-amber-300">{step.action}</div>
                  <div className="text-muted-foreground">→ {step.result}</div>
                </div>
              </div>
              {idx < slide.steps!.length - 1 && (
                <div className="flex justify-center py-2">
                  <ArrowDown className="w-6 h-6 text-violet-400 animate-bounce" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tree view */}
      {slide.visualType === "tree" && slide.example && (
        <div className="bg-zinc-800/50 border border-zinc-700 rounded-2xl p-6 space-y-6">
          <div className="text-xl text-amber-300 font-mono">{slide.example.search}</div>
          <div className="space-y-3">
            {slide.example.steps.map((step, idx) => (
              <div
                key={idx}
                className="flex items-center gap-4 animate-in fade-in slide-in-from-left-4"
                style={{ animationDelay: `${idx * 150}ms` }}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                    idx === slide.example!.steps.length - 1
                      ? "bg-emerald-500 text-white"
                      : "bg-violet-500/30 text-violet-300"
                  )}
                >
                  {idx + 1}
                </div>
                <div className="text-lg">{step}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warning */}
      {slide.warning && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-amber-200">
          ⚠️ {slide.warning}
        </div>
      )}
    </div>
  );
}

