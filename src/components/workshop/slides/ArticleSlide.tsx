"use client";

import type { ArticleSlide as ArticleSlideType } from "@/lib/slides/types";
import { Markdown } from "@/components/ui/markdown";

interface ArticleSlideProps {
  slide: ArticleSlideType;
}

export function ArticleSlide({ slide }: ArticleSlideProps) {
  return (
    <div className="w-full max-w-3xl space-y-6 overflow-y-auto max-h-[calc(100vh-120px)] md:max-h-[calc(100vh-200px)] px-4">
      {/* Header - Editorial styling */}
      <div className="flex items-center gap-3 md:gap-4 mb-6 animate-fade-up">
        {slide.emoji && <span className="text-3xl md:text-5xl shrink-0">{slide.emoji}</span>}
        <div className="space-y-2">
          <h2 className="editorial-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-foreground leading-tight">
            {slide.title}
          </h2>
          <div className="section-rule-accent w-12" />
        </div>
      </div>

      {/* Markdown content - Clean prose styling */}
      <div className="animate-fade-up delay-100 prose prose-lg max-w-none
        prose-headings:font-display prose-headings:text-foreground
        prose-p:text-muted-foreground prose-p:leading-relaxed
        prose-strong:text-foreground prose-strong:font-semibold
        prose-a:text-primary prose-a:no-underline hover:prose-a:underline
        prose-code:bg-cream prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-foreground prose-code:font-normal prose-code:before:content-none prose-code:after:content-none
        prose-pre:bg-cream prose-pre:border prose-pre:border-border
        prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground prose-blockquote:not-italic
        prose-li:text-muted-foreground
        prose-img:rounded-lg prose-img:border prose-img:border-border
        prose-table:text-sm
        prose-th:text-muted-foreground prose-th:font-medium prose-th:uppercase prose-th:tracking-wide prose-th:text-xs
        prose-td:text-muted-foreground
      ">
        <Markdown>{slide.content}</Markdown>
      </div>
    </div>
  );
}
