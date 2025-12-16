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
import { CheckCircle2, Clock, GripVertical, XCircle, Zap } from "lucide-react";
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
        "flex items-center gap-3 md:gap-4 p-4 rounded-lg border transition-all",
        isDragging
          ? "border-primary bg-accent shadow-lg z-50"
          : "border-border bg-card hover:border-primary/50",
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
        <GripVertical className="w-5 h-5 text-muted-foreground" />
      </div>

      {/* Position number */}
      <div
        className={cn(
          "w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center font-semibold shrink-0",
          isDragging
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground"
        )}
      >
        {position + 1}
      </div>

      {/* Item text */}
      <span className="flex-1 text-sm md:text-base text-foreground select-none">{text}</span>
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

  // Reset when quiz changes
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
      <div className="w-full max-w-3xl space-y-6 md:space-y-8 text-center px-4 animate-fade-up">
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-3">
            {slide.emoji && (
              <span className="text-4xl md:text-5xl">{slide.emoji}</span>
            )}
            <h2 className="editorial-display text-3xl md:text-4xl lg:text-5xl text-foreground">
              {slide.title}
            </h2>
          </div>
          <div className="section-rule-accent w-16 mx-auto" />
        </div>

        <div className="card-minimal p-6 md:p-10 space-y-4">
          <div className="text-lg md:text-xl text-muted-foreground">
            {isHost
              ? "Ready to start the ordering quiz!"
              : "Waiting for host to start..."}
          </div>
          <div className="flex items-center justify-center gap-2 text-primary">
            <Clock className="w-5 h-5" />
            <span className="font-medium">{slide.timeLimit} seconds to arrange</span>
          </div>
          <div className="text-sm text-muted-foreground">
            Drag and drop to arrange in correct order
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
      <div className="w-full max-w-3xl space-y-6 md:space-y-8 px-4 overflow-y-auto max-h-[calc(100vh-120px)] animate-fade-up">
        <div className="text-center space-y-2">
          <span className="text-4xl md:text-5xl">
            {isAllCorrect ? "🎉" : "😅"}
          </span>
          <h2 className="editorial-display text-3xl md:text-4xl text-foreground">
            {isHost
              ? "Quiz Results"
              : isAllCorrect
                ? "Perfect!"
                : "Not quite!"}
          </h2>
          <div className="section-rule-accent w-12 mx-auto" />
        </div>

        <div className="card-minimal p-5 md:p-8 space-y-6">
          <p className="text-base md:text-lg text-center text-muted-foreground">
            {slide.question}
          </p>

          {/* Correct order */}
          <div className="space-y-3">
            <div className="text-sm text-primary font-medium">
              Correct order:
            </div>
            <div className="space-y-2">
              {correctOrder.map((itemIndex, position) => (
                <div
                  key={`correct-${itemIndex}`}
                  className="flex items-center gap-3 bg-accent/50 border border-primary/20 rounded-lg p-3"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                    {position + 1}
                  </div>
                  <span className="text-sm md:text-base text-foreground">
                    {slide.items[itemIndex]}
                  </span>
                  <CheckCircle2 className="w-5 h-5 text-primary ml-auto" />
                </div>
              ))}
            </div>
          </div>

          {/* User's order if different */}
          {!isAllCorrect && !isHost && (
            <div className="space-y-3">
              <div className="text-sm text-destructive font-medium">
                Your answer:
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
                          ? "bg-accent/50 border-primary/20"
                          : "bg-destructive/10 border-destructive/30",
                      )}
                    >
                      <div
                        className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center font-semibold",
                          isCorrectPosition 
                            ? "bg-primary text-primary-foreground" 
                            : "bg-destructive text-white",
                        )}
                      >
                        {position + 1}
                      </div>
                      <span className="text-sm md:text-base text-foreground">
                        {slide.items[itemIndex]}
                      </span>
                      {isCorrectPosition ? (
                        <CheckCircle2 className="w-5 h-5 text-primary ml-auto" />
                      ) : (
                        <XCircle className="w-5 h-5 text-destructive ml-auto" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-border">
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-semibold text-primary">
                {stats.totalAnswers}
              </div>
              <div className="text-sm text-muted-foreground">
                Responses
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-semibold text-primary">
                {stats.totalAnswers > 0
                  ? Math.round((stats.correctCount / stats.totalAnswers) * 100)
                  : 0}%
              </div>
              <div className="text-sm text-muted-foreground">
                Perfect score
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

  // Active quiz - ordering interface with DnD
  const sortableIds = currentOrder.map((idx) => `item-${idx}`);

  return (
    <div className="w-full max-w-3xl space-y-6 px-4">
      {/* Timer */}
      {!isHost && (
        <Timer
          timeRemaining={timeRemaining}
          totalTime={quizTimeout}
          isActive={isQuizActive && !hasAnswered}
        />
      )}

      {/* Question */}
      <div className="text-center space-y-3 animate-fade-up">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-foreground leading-tight">
          {slide.question}
        </h2>
        <p className="text-sm text-muted-foreground">
          Drag to arrange in correct order
        </p>
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
          <div className="space-y-2">
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
              "px-6 py-3 rounded-lg font-medium transition-all",
              "bg-primary text-primary-foreground hover:bg-primary/90",
              "disabled:opacity-50 disabled:cursor-not-allowed",
            )}
          >
            {isSubmitting ? "Submitting..." : "Confirm Order"}
          </button>
        </div>
      )}

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
