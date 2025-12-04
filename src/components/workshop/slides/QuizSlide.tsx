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

const optionColors = [
  "from-rose-500 to-pink-600",
  "from-blue-500 to-cyan-600",
  "from-amber-500 to-orange-600",
  "from-emerald-500 to-teal-600",
];

const optionBgColors = [
  "bg-rose-500/10 border-rose-500/30 hover:bg-rose-500/20",
  "bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20",
  "bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20",
  "bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20",
];

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

  // Reset when quiz changes - we want this to trigger on new quiz, not on timeout changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: we only want this to trigger on new quiz
    useEffect(() => {
    setSelectedAnswer(null);
    setTimeRemaining(quizTimeout);
    setIsSubmitting(false);
  }, [activeQuizId, quizTimeout]); // Intentionally only depend on activeQuizId

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
      <div className="w-full max-w-4xl space-y-4 md:space-y-8 text-center px-2">
        <div className="flex items-center justify-center gap-2 md:gap-4">
          {slide.emoji && <span className="text-3xl md:text-5xl">{slide.emoji}</span>}
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold">{slide.title}</h2>
        </div>
        <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl md:rounded-2xl p-4 md:p-8">
          <div className="text-lg md:text-2xl text-muted-foreground">
            {isHost
              ? "Sẵn sàng bắt đầu quiz!"
              : "Đang chờ host bắt đầu quiz..."}
          </div>
          <div className="mt-3 md:mt-4 text-base md:text-lg text-violet-400">
            ⏱️ {slide.timeLimit} giây để trả lời
          </div>
          <div className="mt-2 text-xs md:text-sm text-muted-foreground">
            💡 Điểm tối đa: 1000 • Giảm dần theo thời gian
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
      <div className="w-full max-w-4xl space-y-4 md:space-y-8 px-2 overflow-y-auto max-h-[calc(100vh-120px)]">
        <div className="flex items-center justify-center gap-2 md:gap-4">
          <span className="text-3xl md:text-5xl">{isCorrect ? "🎉" : "😅"}</span>
          <h2 className="text-2xl md:text-4xl font-bold">
            {isHost ? "Kết quả Quiz" : isCorrect ? "Chính xác!" : "Chưa đúng!"}
          </h2>
        </div>

        <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl md:rounded-2xl p-3 md:p-6 space-y-4 md:space-y-6">
          <div className="text-base md:text-xl text-center text-muted-foreground">
            {quizQuestion || slide.question}
          </div>

          {/* Options with results */}
          <div className="grid gap-2 md:gap-3">
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
                    "relative overflow-hidden rounded-lg md:rounded-xl border p-3 md:p-4",
                    isCorrectOption
                      ? "border-emerald-500 bg-emerald-500/10"
                      : wasSelected
                        ? "border-rose-500 bg-rose-500/10"
                        : "border-zinc-700 bg-zinc-800/30",
                  )}
                >
                  <div
                    className={cn(
                      "absolute inset-y-0 left-0 transition-all duration-1000",
                      isCorrectOption ? "bg-emerald-500/20" : "bg-zinc-700/30",
                    )}
                    style={{ width: `${percentage}%` }}
                  />
                  <div className="relative flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 md:gap-3 min-w-0">
                      {isCorrectOption && (
                        <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-emerald-400 shrink-0" />
                      )}
                      {wasSelected && !isCorrectOption && (
                        <XCircle className="w-4 h-4 md:w-5 md:h-5 text-rose-400 shrink-0" />
                      )}
                      <span className="text-sm md:text-lg truncate">{option}</span>
                    </div>
                    <div className="flex items-center gap-1 md:gap-2 shrink-0">
                      <span className="text-xs md:text-base text-muted-foreground">
                        {stats.optionCounts[idx]}
                      </span>
                      <span className="font-bold text-sm md:text-base">{percentage}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 md:gap-4 pt-3 md:pt-4 border-t border-zinc-700">
            <div className="text-center">
              <div className="text-xl md:text-3xl font-bold text-violet-400">
                {stats.totalAnswers}
              </div>
              <div className="text-xs md:text-sm text-muted-foreground">Trả lời</div>
            </div>
            <div className="text-center">
              <div className="text-xl md:text-3xl font-bold text-emerald-400">
                {stats.totalAnswers > 0
                  ? Math.round((stats.correctCount / stats.totalAnswers) * 100)
                  : 0}%
              </div>
              <div className="text-xs md:text-sm text-muted-foreground">Đúng</div>
            </div>
            <div className="text-center">
              <div className="text-xl md:text-3xl font-bold text-amber-400">
                {(stats.fastestTime / 1000).toFixed(1)}s
              </div>
              <div className="text-xs md:text-sm text-muted-foreground truncate">
                {stats.fastestParticipant || "Nhanh nhất"}
              </div>
            </div>
          </div>

          {/* Explanation */}
          {slide.explanation && (
            <div className="bg-violet-500/10 border border-violet-500/30 rounded-lg md:rounded-xl p-3 md:p-4 text-sm md:text-base text-violet-200">
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
    <div className="w-full max-w-4xl space-y-4 md:space-y-8 px-2">
      {/* Timer */}
      {!isHost && (
        <Timer
          timeRemaining={timeRemaining}
          totalTime={quizTimeout}
          isActive={isQuizActive && !hasAnswered}
        />
      )}

      {/* Question */}
      <div className="text-center space-y-3 md:space-y-4">
        <h2 className="text-xl sm:text-2xl md:text-4xl font-bold leading-tight">{question}</h2>
        {isHost && answerCount && (
          <div className="flex items-center justify-center gap-2 md:gap-4">
            <Progress
              value={(answerCount.count / answerCount.total) * 100}
              className="w-32 md:w-64 h-2 md:h-3"
            />
            <span className="text-sm md:text-lg text-muted-foreground">
              {answerCount.count}/{answerCount.total}
            </span>
          </div>
        )}
      </div>

      {/* Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
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
                "relative overflow-hidden rounded-xl md:rounded-2xl p-3 md:p-6 text-left transition-all duration-300 border-2",
                isSelected ? "ring-2 md:ring-4 ring-white/30 scale-[1.01] md:scale-[1.02]" : "",
                isDisabled && !isSelected
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:scale-[1.01] md:hover:scale-[1.02] cursor-pointer active:scale-[0.98]",
                optionBgColors[idx],
              )}
            >
              <div className="flex items-center gap-2 md:gap-4">
                <div
                  className={cn(
                    "w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-gradient-to-br flex items-center justify-center text-sm md:text-xl font-bold text-white shrink-0",
                    optionColors[idx],
                  )}
                >
                  {String.fromCharCode(65 + idx)}
                </div>
                <span className="text-sm md:text-xl font-medium line-clamp-2">{option}</span>
              </div>
              {isSelected && hasAnswered && (
                <div className="absolute top-1.5 right-1.5 md:top-2 md:right-2">
                  <div className="bg-white/20 rounded-full p-0.5 md:p-1">
                    <Clock className="w-3 h-3 md:w-5 md:h-5" />
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Answered confirmation */}
      {hasAnswered && !showResults && (
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-4 md:px-6 py-2 md:py-3">
            <Zap className="w-4 h-4 md:w-5 md:h-5 text-emerald-400" />
            <span className="text-sm md:text-base text-emerald-300">
              Đã gửi! Đang chờ kết quả...
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
