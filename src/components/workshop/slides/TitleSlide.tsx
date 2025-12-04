"use client";

import type { TitleSlide as TitleSlideType } from "@/lib/slides/types";

interface TitleSlideProps {
  slide: TitleSlideType;
}

export function TitleSlide({ slide }: TitleSlideProps) {
  return (
    <div className="text-center space-y-4 md:space-y-8 max-w-4xl px-2">
      {slide.emoji && (
        <div className="text-5xl md:text-8xl animate-bounce-slow">{slide.emoji}</div>
      )}
      <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold bg-gradient-to-r from-violet-400 via-fuchsia-400 to-orange-400 bg-clip-text text-transparent leading-tight">
        {slide.title}
      </h1>
      {slide.subtitle && (
        <h2 className="text-xl sm:text-2xl md:text-4xl text-muted-foreground font-light">
          {slide.subtitle}
        </h2>
      )}
      {slide.description && (
        <p className="text-base md:text-xl text-muted-foreground/80 max-w-2xl mx-auto">
          {slide.description}
        </p>
      )}
    </div>
  );
}

