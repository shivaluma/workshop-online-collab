"use client";

import { Slide } from "./Slide";
import type { Slide as SlideType } from "@/lib/slides/types";
import type { ScoreEntry, QuizStats } from "@/lib/ws/types";

interface SlideDeckProps {
  slides: SlideType[];
  currentSlide: number;
  isHost?: boolean;
  // Quiz props
  activeQuizId?: string | null;
  quizQuestion?: string;
  quizOptions?: string[];
  quizTimeout?: number;
  quizStartTime?: number;
  onSubmitAnswer?: (answer: number, timeTaken: number) => void;
  hasAnswered?: boolean;
  answeredOption?: number;
  answerCount?: { count: number; total: number };
  quizResult?: { correct: number; stats: QuizStats } | null;
  // Scoreboard props
  scores?: ScoreEntry[];
  showLeaderboard?: boolean;
}

export function SlideDeck({
  slides,
  currentSlide,
  isHost = false,
  activeQuizId,
  quizQuestion,
  quizOptions,
  quizTimeout,
  quizStartTime,
  onSubmitAnswer,
  hasAnswered,
  answeredOption,
  answerCount,
  quizResult,
  scores,
  showLeaderboard,
}: SlideDeckProps) {
  const slide = slides[currentSlide];

  if (!slide) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-muted-foreground">Loading slides...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <Slide
        key={`slide-${currentSlide}`}
        slide={slide}
        isHost={isHost}
        activeQuizId={activeQuizId}
        quizQuestion={quizQuestion}
        quizOptions={quizOptions}
        quizTimeout={quizTimeout}
        quizStartTime={quizStartTime}
        onSubmitAnswer={onSubmitAnswer}
        hasAnswered={hasAnswered}
        answeredOption={answeredOption}
        answerCount={answerCount}
        quizResult={quizResult}
        scores={scores}
        showLeaderboard={showLeaderboard}
      />
    </div>
  );
}

