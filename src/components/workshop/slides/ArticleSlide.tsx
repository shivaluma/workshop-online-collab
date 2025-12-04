"use client";

import type { ArticleSlide as ArticleSlideType } from "@/lib/slides/types";
import { Markdown } from "@/components/ui/markdown";

interface ArticleSlideProps {
  slide: ArticleSlideType;
}

export function ArticleSlide({ slide }: ArticleSlideProps) {
  return (
    <div className="w-full max-w-4xl space-y-6 overflow-y-auto max-h-[calc(100vh-200px)] px-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        {slide.emoji && <span className="text-5xl">{slide.emoji}</span>}
        <h2 className="text-4xl md:text-5xl font-bold text-foreground">
          {slide.title}
        </h2>
      </div>

      {/* Markdown content with images */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Markdown>{slide.content}</Markdown>
      </div>
    </div>
  );
}

