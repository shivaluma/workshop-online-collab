"use client";

import type { TitleSlide as TitleSlideType } from "@/lib/slides/types";

interface TitleSlideProps {
  slide: TitleSlideType;
}

export function TitleSlide({ slide }: TitleSlideProps) {
  return (
    <div className="text-center space-y-6 md:space-y-10 max-w-5xl px-4 animate-fade-up">
      {/* Optional emoji - refined size */}
      {slide.emoji && (
        <div className="text-5xl md:text-6xl animate-float">{slide.emoji}</div>
      )}

      {/* Main title - Editorial display typography */}
      <div className="space-y-4">
        <h1 className="editorial-display text-5xl sm:text-6xl md:text-8xl lg:text-9xl text-foreground leading-[0.9]">
          {slide.title}
        </h1>
        
        {/* Decorative rule */}
        <div className="flex justify-center">
          <div className="section-rule-accent w-16 md:w-24" />
        </div>
      </div>

      {/* Subtitle - Light sans-serif */}
      {slide.subtitle && (
        <h2 className="text-xl sm:text-2xl md:text-3xl text-muted-foreground font-light tracking-wide animate-fade-in delay-200">
          {slide.subtitle}
        </h2>
      )}

      {/* Description - Refined body text */}
      {slide.description && (
        <p className="text-base md:text-lg text-muted-foreground/80 max-w-2xl mx-auto leading-relaxed animate-fade-in delay-300">
          {slide.description}
        </p>
      )}
    </div>
  );
}
