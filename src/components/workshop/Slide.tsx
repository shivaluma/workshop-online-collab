"use client";

import type { Slide as SlideType } from "@/lib/slides/types";
import { cn } from "@/lib/utils";
import type { QuizStats, ScoreEntry } from "@/lib/ws/types";
import { ArticleSlide } from "./slides/ArticleSlide";
import { ContentSlide } from "./slides/ContentSlide";
import { LeaderboardSlide } from "./slides/LeaderboardSlide";
import { OrderingQuizSlide } from "./slides/OrderingQuizSlide";
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
  onSubmitAnswer?: (answer: number | number[], timeTaken: number) => void;
  hasAnswered?: boolean;
  answeredOption?: number;
  answeredOrder?: number[];
  answerCount?: { count: number; total: number };
  quizResult?: { correct: number | number[]; stats: QuizStats; quizType?: string } | null;
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
  answeredOrder,
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
      case "quiz": {
        // Transform quizResult for choice quiz component
        const choiceQuizResult = quizResult && quizResult.quizType !== "ORDERING"
          ? { correct: quizResult.correct as number, stats: quizResult.stats }
          : null;
        return (
          <QuizSlide
            slide={slide}
            isHost={isHost}
            activeQuizId={activeQuizId}
            quizQuestion={quizQuestion}
            quizOptions={quizOptions}
            quizTimeout={quizTimeout}
            quizStartTime={quizStartTime}
            onSubmitAnswer={onSubmitAnswer as ((answer: number, timeTaken: number) => void) | undefined}
            hasAnswered={hasAnswered}
            answeredOption={answeredOption}
            answerCount={answerCount}
            quizResult={choiceQuizResult}
          />
        );
      }
      case "ordering-quiz": {
        // Transform quizResult for ordering quiz component
        const orderingQuizResult = quizResult && quizResult.quizType === "ORDERING" 
          ? { correctOrder: quizResult.correct as number[], stats: quizResult.stats }
          : null;
        return (
          <OrderingQuizSlide
            slide={slide}
            isHost={isHost}
            activeQuizId={activeQuizId}
            quizTimeout={quizTimeout}
            quizStartTime={quizStartTime}
            onSubmitAnswer={onSubmitAnswer as ((answer: number[], timeTaken: number) => void) | undefined}
            hasAnswered={hasAnswered}
            answeredOrder={answeredOrder}
            answerCount={answerCount}
            quizResult={orderingQuizResult}
          />
        );
      }
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
