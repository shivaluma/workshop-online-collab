"use client";

import { CheckCircle2, Clock, XCircle, Zap } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import type { QuizSlide as QuizSlideType } from "@/lib/slides/types";
import { cn } from "@/lib/utils";
import type { QuizStats } from "@/lib/ws/types";
import { Timer } from "../Timer";

interface QuizSlideProps {
  slide: QuizSlideType;
  isHost?: boolean;
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
}

// Option labels
const optionLabels = ["A", "B", "C", "D", "E", "F"];

export function QuizSlide({
  slide,
  isHost = false,
  activeQuizId,
  quizQuestion,
  quizOptions,
  quizTimeout = 20,
  quizStartTime,
  onSubmitAnswer,
  hasAnswered,
  answeredOption,
  answerCount,
  quizResult,
}: QuizSlideProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(quizTimeout);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isQuizActive = activeQuizId != null && !quizResult;
  const showResults = quizResult != null;

  // Timer countdown
  useEffect(() => {
    if (!isQuizActive || !quizStartTime || isHost || hasAnswered) return;

    const interval = setInterval(() => {
      const elapsed = (Date.now() - quizStartTime) / 1000;
      const remaining = Math.max(0, quizTimeout - elapsed);
      setTimeRemaining(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isQuizActive, quizStartTime, quizTimeout, isHost, hasAnswered]);

  // Reset when quiz changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: we only want this to trigger on new quiz
  useEffect(() => {
    setSelectedAnswer(null);
    setTimeRemaining(quizTimeout);
    setIsSubmitting(false);
  }, [activeQuizId, quizTimeout]);

  const handleSelectAnswer = useCallback(
    (index: number) => {
      if (hasAnswered || isSubmitting || !isQuizActive || isHost) return;

      setSelectedAnswer(index);
      setIsSubmitting(true);

      const timeTaken = quizStartTime ? Date.now() - quizStartTime : 0;
      onSubmitAnswer?.(index, timeTaken);
    },
    [
      hasAnswered,
      isSubmitting,
      isQuizActive,
      isHost,
      quizStartTime,
      onSubmitAnswer,
    ],
  );

  // Waiting for quiz to start
  if (!isQuizActive && !showResults) {
    return (
      <div className="w-full max-w-3xl space-y-6 md:space-y-8 text-center px-4 animate-fade-up">
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-3">
            {slide.emoji && <span className="text-4xl md:text-5xl">{slide.emoji}</span>}
            <h2 className="editorial-display text-3xl md:text-4xl lg:text-5xl text-foreground">
              {slide.title}
            </h2>
          </div>
          <div className="section-rule-accent w-16 mx-auto" />
        </div>

        <div className="card-minimal p-6 md:p-10 space-y-4">
          <div className="text-lg md:text-xl text-muted-foreground">
            {isHost
              ? "Ready to start the quiz!"
              : "Waiting for host to start..."}
          </div>
          <div className="flex items-center justify-center gap-2 text-primary">
            <Clock className="w-5 h-5" />
            <span className="font-medium">{slide.timeLimit} seconds to answer</span>
          </div>
          <div className="text-sm text-muted-foreground">
            Maximum points: 1000 • Decreases over time
          </div>
        </div>
      </div>
    );
  }

  // Show results
  if (showResults && quizResult) {
    const { correct, stats } = quizResult;
    const options = quizOptions || slide.options;
    const isCorrect = answeredOption === correct;

    return (
      <div className="w-full max-w-3xl space-y-6 md:space-y-8 px-4 overflow-y-auto max-h-[calc(100vh-120px)] animate-fade-up">
        <div className="text-center space-y-2">
          <span className="text-4xl md:text-5xl">{isCorrect ? "🎉" : "😅"}</span>
          <h2 className="editorial-display text-3xl md:text-4xl text-foreground">
            {isHost ? "Quiz Results" : isCorrect ? "Correct!" : "Not quite!"}
          </h2>
          <div className="section-rule-accent w-12 mx-auto" />
        </div>

        <div className="card-minimal p-5 md:p-8 space-y-6">
          <p className="text-base md:text-lg text-center text-muted-foreground">
            {quizQuestion || slide.question}
          </p>

          {/* Options with results */}
          <div className="space-y-3">
            {options.map((option, idx) => {
              const percentage =
                stats.totalAnswers > 0
                  ? Math.round(
                      (stats.optionCounts[idx] / stats.totalAnswers) * 100,
                    )
                  : 0;
              const isCorrectOption = idx === correct;
              const wasSelected = idx === answeredOption;

              const optionKey = `result-${activeQuizId || "quiz"}-${idx}`;
              return (
                <div
                  key={optionKey}
                  className={cn(
                    "relative overflow-hidden rounded-lg border p-4",
                    isCorrectOption
                      ? "border-primary bg-accent/50"
                      : wasSelected
                        ? "border-destructive bg-destructive/10"
                        : "border-border bg-card",
                  )}
                >
                  <div
                    className={cn(
                      "absolute inset-y-0 left-0 transition-all duration-1000",
                      isCorrectOption ? "bg-primary/10" : "bg-muted/50",
                    )}
                    style={{ width: `${percentage}%` }}
                  />
                  <div className="relative flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {isCorrectOption && (
                        <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                      )}
                      {wasSelected && !isCorrectOption && (
                        <XCircle className="w-5 h-5 text-destructive shrink-0" />
                      )}
                      <span className="text-sm md:text-base text-foreground">{option}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm text-muted-foreground">
                        {stats.optionCounts[idx]}
                      </span>
                      <span className="font-semibold text-foreground">{percentage}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Stats - Clean grid */}
          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-border">
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-semibold text-primary">
                {stats.totalAnswers}
              </div>
              <div className="text-sm text-muted-foreground">Responses</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-semibold text-primary">
                {stats.totalAnswers > 0
                  ? Math.round((stats.correctCount / stats.totalAnswers) * 100)
                  : 0}%
              </div>
              <div className="text-sm text-muted-foreground">Correct</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-semibold text-primary">
                {(stats.fastestTime / 1000).toFixed(1)}s
              </div>
              <div className="text-sm text-muted-foreground truncate">
                {stats.fastestParticipant || "Fastest"}
              </div>
            </div>
          </div>

          {/* Explanation */}
          {slide.explanation && (
            <div className="bg-accent/50 border-l-4 border-primary rounded-r-lg p-4 text-sm md:text-base text-foreground">
              💡 {slide.explanation}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Active quiz
  const options = quizOptions || slide.options;
  const question = quizQuestion || slide.question;

  return (
    <div className="w-full max-w-3xl space-y-6 md:space-y-8 px-4">
      {/* Timer */}
      {!isHost && (
        <Timer
          timeRemaining={timeRemaining}
          totalTime={quizTimeout}
          isActive={isQuizActive && !hasAnswered}
        />
      )}

      {/* Question */}
      <div className="text-center space-y-4 animate-fade-up">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-foreground leading-tight">
          {question}
        </h2>
        {isHost && answerCount && (
          <div className="flex items-center justify-center gap-4">
            <Progress
              value={(answerCount.count / answerCount.total) * 100}
              className="w-32 md:w-48 h-2"
            />
            <span className="text-sm text-muted-foreground">
              {answerCount.count}/{answerCount.total}
            </span>
          </div>
        )}
      </div>

      {/* Options - Minimal card style */}
      <div className="grid grid-cols-1 gap-3">
        {options.map((option, idx) => {
          const isSelected = selectedAnswer === idx || answeredOption === idx;
          const isDisabled = hasAnswered || isSubmitting || isHost;

          const buttonKey = `active-${activeQuizId || "quiz"}-${idx}`;
          return (
            <button
              type="button"
              key={buttonKey}
              onClick={() => handleSelectAnswer(idx)}
              disabled={isDisabled}
              className={cn(
                "relative rounded-lg p-4 md:p-5 text-left transition-all duration-200 border",
                isSelected 
                  ? "border-primary bg-accent shadow-sm" 
                  : "border-border bg-card hover:border-primary/50 hover:bg-accent/30",
                isDisabled && !isSelected
                  ? "opacity-50 cursor-not-allowed"
                  : "cursor-pointer",
                "animate-fade-up"
              )}
              style={{ animationDelay: `${idx * 75}ms` }}
            >
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-semibold shrink-0",
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {optionLabels[idx]}
                </div>
                <span className="text-sm md:text-base text-foreground flex-1 pt-1">{option}</span>
              </div>
              {isSelected && hasAnswered && (
                <div className="absolute top-3 right-3">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Answered confirmation */}
      {hasAnswered && !showResults && (
        <div className="text-center animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-accent border border-primary/30 rounded-full px-5 py-2.5">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm text-foreground">
              Submitted! Waiting for results...
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
