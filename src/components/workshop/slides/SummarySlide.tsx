"use client";

import type { SummarySlide as SummarySlideType } from "@/lib/slides/types";

interface SummarySlideProps {
  slide: SummarySlideType;
}

export function SummarySlide({ slide }: SummarySlideProps) {
  return (
    <div className="w-full max-w-4xl space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        {slide.emoji && <span className="text-5xl">{slide.emoji}</span>}
        <h2 className="text-4xl md:text-5xl font-bold text-foreground">
          {slide.title}
        </h2>
      </div>

      {/* Summary points */}
      <div className="grid gap-4">
        {slide.points.map((point, idx) => (
          <div
            key={`summary-${point.slice(0, 20)}-${idx}`}
            className="bg-gradient-to-r from-zinc-800/80 to-zinc-800/40 border border-zinc-700/50 rounded-xl p-5 animate-in fade-in slide-in-from-left-4"
            style={{ animationDelay: `${idx * 100}ms` }}
          >
            <div className="text-xl">{point}</div>
          </div>
        ))}
      </div>

      {/* Decorative footer */}
      <div className="text-center pt-8">
        <div className="text-6xl animate-bounce-slow">🚀</div>
        <p className="text-xl text-muted-foreground mt-4">
          Now go build amazing things!
        </p>
      </div>
    </div>
  );
}

