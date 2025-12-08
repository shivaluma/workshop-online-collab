"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CheckCircle2, GripVertical, XCircle, Zap } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Progress } from "@/components/ui/progress";
import type { OrderingQuizSlide as OrderingQuizSlideType } from "@/lib/slides/types";
import { cn } from "@/lib/utils";
import type { QuizStats } from "@/lib/ws/types";
import { Timer } from "../Timer";

interface OrderingQuizSlideProps {
  slide: OrderingQuizSlideType;
  isHost?: boolean;
  activeQuizId?: string | null;
  quizTimeout?: number;
  quizStartTime?: number;
  onSubmitAnswer?: (answer: number[], timeTaken: number) => void;
  hasAnswered?: boolean;
  answeredOrder?: number[];
  answerCount?: { count: number; total: number };
  quizResult?: { correctOrder: number[]; stats: QuizStats } | null;
}

const itemColors = [
  "from-rose-500 to-pink-600",
  "from-blue-500 to-cyan-600",
  "from-amber-500 to-orange-600",
  "from-emerald-500 to-teal-600",
];

// Fisher-Yates shuffle with seed based on quizId
function shuffleArray<T>(array: T[], seed: string): T[] {
  const result = [...array];
  let seedNum = 0;
  for (let i = 0; i < seed.length; i++) {
    seedNum += seed.charCodeAt(i);
  }

  for (let i = result.length - 1; i > 0; i--) {
    seedNum = (seedNum * 9301 + 49297) % 233280;
    const j = Math.floor((seedNum / 233280) * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Sortable Item Component
interface SortableItemProps {
  id: string;
  position: number;
  text: string;
  isDisabled: boolean;
}

function SortableItem({ id, position, text, isDisabled }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: isDisabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 md:gap-3 p-3 md:p-4 rounded-xl border-2 transition-colors",
        isDragging
          ? "border-violet-500 bg-violet-500/20 shadow-2xl shadow-violet-500/20 z-50"
          : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-600",
        isDisabled
          ? "opacity-60 cursor-default"
          : "cursor-grab active:cursor-grabbing",
      )}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className={cn(
          "touch-none",
          isDisabled ? "cursor-default" : "cursor-grab active:cursor-grabbing",
        )}
      >
        <GripVertical className="w-5 h-5 md:w-6 md:h-6 text-zinc-500" />
      </div>

      {/* Position number */}
      <div
        className={cn(
          "w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-to-br flex items-center justify-center text-white font-bold shrink-0",
          itemColors[position % itemColors.length],
        )}
      >
        {position + 1}
      </div>

      {/* Item text */}
      <span className="flex-1 text-sm md:text-lg select-none">{text}</span>
    </div>
  );
}

export function OrderingQuizSlide({
  slide,
  isHost = false,
  activeQuizId,
  quizTimeout = 30,
  quizStartTime,
  onSubmitAnswer,
  hasAnswered,
  answeredOrder,
  answerCount,
  quizResult,
}: OrderingQuizSlideProps) {
  // Create initial shuffled order based on quizId
  const initialOrder = useMemo(() => {
    const indices = slide.items.map((_, i) => i);
    return shuffleArray(indices, slide.quizId);
  }, [slide.items, slide.quizId]);

  const [currentOrder, setCurrentOrder] = useState<number[]>(initialOrder);
  const [timeRemaining, setTimeRemaining] = useState(quizTimeout);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isQuizActive = activeQuizId != null && !quizResult;
  const showResults = quizResult != null;
  const isDisabled = hasAnswered || isSubmitting || isHost || !isQuizActive;

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

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

  // Reset when quiz changes - we want to reset on new quiz
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally reset on activeQuizId change
  useEffect(() => {
    setCurrentOrder(initialOrder);
    setTimeRemaining(quizTimeout);
    setIsSubmitting(false);
  }, [activeQuizId, initialOrder]);

  // Handle drag end
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setCurrentOrder((items) => {
        const oldIndex = items.findIndex(
          (item) => `item-${item}` === active.id,
        );
        const newIndex = items.findIndex((item) => `item-${item}` === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }, []);

  // Submit answer
  const handleSubmit = useCallback(() => {
    if (hasAnswered || isSubmitting || !isQuizActive || isHost) return;

    setIsSubmitting(true);
    const timeTaken = quizStartTime ? Date.now() - quizStartTime : 0;
    onSubmitAnswer?.(currentOrder, timeTaken);
  }, [
    hasAnswered,
    isSubmitting,
    isQuizActive,
    isHost,
    quizStartTime,
    currentOrder,
    onSubmitAnswer,
  ]);

  // Waiting for quiz to start
  if (!isQuizActive && !showResults) {
    return (
      <div className="w-full max-w-4xl space-y-4 md:space-y-8 text-center px-2">
        <div className="flex items-center justify-center gap-2 md:gap-4">
          {slide.emoji && (
            <span className="text-3xl md:text-5xl">{slide.emoji}</span>
          )}
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold">
            {slide.title}
          </h2>
        </div>
        <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl md:rounded-2xl p-4 md:p-8">
          <div className="text-lg md:text-2xl text-muted-foreground">
            {isHost
              ? "Sẵn sàng bắt đầu quiz sắp xếp!"
              : "Đang chờ host bắt đầu quiz..."}
          </div>
          <div className="mt-3 md:mt-4 text-base md:text-lg text-violet-400">
            ⏱️ {slide.timeLimit} giây để sắp xếp đúng thứ tự
          </div>
          <div className="mt-2 text-xs md:text-sm text-muted-foreground">
            🎯 Kéo thả để sắp xếp đúng thứ tự!
          </div>
        </div>
      </div>
    );
  }

  // Show results
  if (showResults && quizResult) {
    const { correctOrder, stats } = quizResult;
    const userOrder = answeredOrder || currentOrder;
    const isAllCorrect =
      JSON.stringify(userOrder) === JSON.stringify(correctOrder);

    return (
      <div className="w-full max-w-4xl space-y-4 md:space-y-8 px-2 overflow-y-auto max-h-[calc(100vh-120px)]">
        <div className="flex items-center justify-center gap-2 md:gap-4">
          <span className="text-3xl md:text-5xl">
            {isAllCorrect ? "🎉" : "😅"}
          </span>
          <h2 className="text-2xl md:text-4xl font-bold">
            {isHost
              ? "Kết quả Quiz"
              : isAllCorrect
                ? "Chính xác!"
                : "Chưa đúng!"}
          </h2>
        </div>

        <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl md:rounded-2xl p-3 md:p-6 space-y-4 md:space-y-6">
          <div className="text-base md:text-xl text-center text-muted-foreground">
            {slide.question}
          </div>

          {/* Correct order */}
          <div className="space-y-2">
            <div className="text-sm text-emerald-400 font-medium">
              ✅ Thứ tự đúng:
            </div>
            <div className="space-y-2">
              {correctOrder.map((itemIndex, position) => (
                <div
                  key={`correct-${itemIndex}`}
                  className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white font-bold">
                    {position + 1}
                  </div>
                  <span className="text-sm md:text-base">
                    {slide.items[itemIndex]}
                  </span>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 ml-auto" />
                </div>
              ))}
            </div>
          </div>

          {/* User's order if different */}
          {!isAllCorrect && !isHost && (
            <div className="space-y-2">
              <div className="text-sm text-rose-400 font-medium">
                ❌ Câu trả lời của bạn:
              </div>
              <div className="space-y-2">
                {userOrder.map((itemIndex, position) => {
                  const isCorrectPosition =
                    correctOrder[position] === itemIndex;
                  return (
                    <div
                      key={`user-item-${itemIndex}`}
                      className={cn(
                        "flex items-center gap-3 rounded-lg p-3 border",
                        isCorrectPosition
                          ? "bg-emerald-500/10 border-emerald-500/30"
                          : "bg-rose-500/10 border-rose-500/30",
                      )}
                    >
                      <div
                        className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold",
                          isCorrectPosition ? "bg-emerald-500" : "bg-rose-500",
                        )}
                      >
                        {position + 1}
                      </div>
                      <span className="text-sm md:text-base">
                        {slide.items[itemIndex]}
                      </span>
                      {isCorrectPosition ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 ml-auto" />
                      ) : (
                        <XCircle className="w-5 h-5 text-rose-400 ml-auto" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2 md:gap-4 pt-3 md:pt-4 border-t border-zinc-700">
            <div className="text-center">
              <div className="text-xl md:text-3xl font-bold text-violet-400">
                {stats.totalAnswers}
              </div>
              <div className="text-xs md:text-sm text-muted-foreground">
                Trả lời
              </div>
            </div>
            <div className="text-center">
              <div className="text-xl md:text-3xl font-bold text-emerald-400">
                {stats.totalAnswers > 0
                  ? Math.round((stats.correctCount / stats.totalAnswers) * 100)
                  : 0}
                %
              </div>
              <div className="text-xs md:text-sm text-muted-foreground">
                Đúng hoàn toàn
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

  // Active quiz - ordering interface with DnD
  const sortableIds = currentOrder.map((idx) => `item-${idx}`);

  return (
    <div className="w-full max-w-4xl space-y-4 md:space-y-6 px-2">
      {/* Timer */}
      {!isHost && (
        <Timer
          timeRemaining={timeRemaining}
          totalTime={quizTimeout}
          isActive={isQuizActive && !hasAnswered}
        />
      )}

      {/* Question */}
      <div className="text-center space-y-3">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold leading-tight">
          {slide.question}
        </h2>
        <p className="text-sm md:text-base text-muted-foreground">
          ✋ Kéo thả để sắp xếp đúng thứ tự
        </p>
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

      {/* Sortable items */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sortableIds}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2 md:space-y-3">
            {currentOrder.map((itemIndex, position) => (
              <SortableItem
                key={`item-${itemIndex}`}
                id={`item-${itemIndex}`}
                position={position}
                text={slide.items[itemIndex]}
                isDisabled={isDisabled}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Submit button */}
      {!isHost && !hasAnswered && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={cn(
              "px-8 py-3 rounded-xl font-bold text-lg transition-all",
              "bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "shadow-lg hover:shadow-violet-500/25",
            )}
          >
            {isSubmitting ? "Đang gửi..." : "✓ Xác nhận thứ tự"}
          </button>
        </div>
      )}

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
