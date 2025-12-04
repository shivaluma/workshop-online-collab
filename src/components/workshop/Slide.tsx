"use client";

import type { Slide as SlideType } from "@/lib/slides/types";
import { cn } from "@/lib/utils";
import type { QuizStats, ScoreEntry } from "@/lib/ws/types";
import { ArticleSlide } from "./slides/ArticleSlide";
import { ContentSlide } from "./slides/ContentSlide";
import { LeaderboardSlide } from "./slides/LeaderboardSlide";
import { QuizSlide } from "./slides/QuizSlide";
import { SummarySlide } from "./slides/SummarySlide";
import { TitleSlide } from "./slides/TitleSlide";
import { VisualSlide } from "./slides/VisualSlide";

interface SlideProps {
  slide: SlideType;
  className?: string;
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

export function Slide({
  slide,
  className,
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
}: SlideProps) {
  const renderSlide = () => {
    switch (slide.type) {
      case "title":
        return <TitleSlide slide={slide} />;
      case "content":
        return <ContentSlide slide={slide} />;
      case "article":
        return <ArticleSlide slide={slide} />;
      case "visual":
        return <VisualSlide slide={slide} />;
      case "quiz":
        return (
          <QuizSlide
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
          />
        );
      case "summary":
        return <SummarySlide slide={slide} />;
      case "leaderboard":
        return (
          <LeaderboardSlide
            slide={slide}
            scores={scores}
            showLeaderboard={showLeaderboard}
          />
        );
      default:
        return <div>Unknown slide type</div>;
    }
  };

  return (
    <div
      className={cn(
        "w-full h-full flex items-center justify-center p-4 md:p-8 animate-in fade-in slide-in-from-right-4 duration-500",
        className,
      )}
    >
      {renderSlide()}
    </div>
  );
}
