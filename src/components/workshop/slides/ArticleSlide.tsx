"use client";

import type { ArticleSlide as ArticleSlideType } from "@/lib/slides/types";
import { Markdown } from "@/components/ui/markdown";

interface ArticleSlideProps {
  slide: ArticleSlideType;
}

export function ArticleSlide({ slide }: ArticleSlideProps) {
  return (
    <div className="w-full max-w-4xl space-y-4 md:space-y-6 overflow-y-auto max-h-[calc(100vh-120px)] md:max-h-[calc(100vh-200px)] px-2 md:px-4">
      {/* Header */}
      <div className="flex items-center gap-2 md:gap-4 mb-4 md:mb-6">
        {slide.emoji && <span className="text-3xl md:text-5xl shrink-0">{slide.emoji}</span>}
        <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-foreground leading-tight">
          {slide.title}
        </h2>
      </div>

      {/* Markdown content with images */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Markdown compact>{slide.content}</Markdown>
      </div>
    </div>
  );
}

