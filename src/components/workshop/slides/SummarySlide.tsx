"use client";

import type { SummarySlide as SummarySlideType } from "@/lib/slides/types";

interface SummarySlideProps {
  slide: SummarySlideType;
}

export function SummarySlide({ slide }: SummarySlideProps) {
  return (
    <div className="w-full max-w-3xl space-y-8 px-4">
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

      {/* Summary points - Clean editorial list */}
      <div className="space-y-3">
        {slide.points.map((point, idx) => (
          <div
            key={`summary-${point.slice(0, 20)}-${idx}`}
            className="card-minimal p-4 md:p-5 animate-fade-up"
            style={{ animationDelay: `${(idx + 1) * 100}ms` }}
          >
            <div className="flex items-start gap-3">
              <span className="text-primary shrink-0 mt-0.5">—</span>
              <span className="text-base md:text-lg text-foreground">{point}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Decorative footer */}
      <div className="text-center pt-8 animate-fade-up delay-500">
        <div className="text-5xl md:text-6xl animate-float">🚀</div>
        <p className="text-lg text-muted-foreground mt-4">
          Now go build amazing things!
        </p>
      </div>
    </div>
  );
}
