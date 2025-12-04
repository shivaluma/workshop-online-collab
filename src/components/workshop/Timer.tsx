"use client";

import { Clock, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimerProps {
  timeRemaining: number;
  totalTime: number;
  isActive: boolean;
  showScore?: boolean;
}

export function Timer({ timeRemaining, totalTime, isActive, showScore = true }: TimerProps) {
  const percentage = (timeRemaining / totalTime) * 100;
  const isLow = timeRemaining <= 5;
  const isCritical = timeRemaining <= 3;
  
  // Calculate current potential score (1000 max, decreasing to 100 min)
  const currentScore = Math.max(100, Math.round((timeRemaining / totalTime) * 1000));

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-3">
        {/* Timer */}
        <div className="flex items-center gap-2">
          <Clock
            className={cn(
              "w-5 h-5 transition-colors",
              isCritical
                ? "text-rose-500 animate-pulse"
                : isLow
                  ? "text-amber-500"
                  : "text-violet-400",
            )}
          />
          <span
            className={cn(
              "text-2xl font-mono font-bold tabular-nums transition-colors",
              isCritical
                ? "text-rose-500"
                : isLow
                  ? "text-amber-500"
                  : "text-foreground",
            )}
          >
            {Math.ceil(timeRemaining)}s
          </span>
        </div>

        {/* Current Score */}
        {showScore && isActive && (
          <div className="flex items-center gap-2">
            <Zap
              className={cn(
                "w-5 h-5 transition-colors",
                currentScore > 700
                  ? "text-emerald-400"
                  : currentScore > 400
                    ? "text-amber-400"
                    : "text-rose-400",
              )}
            />
            <span
              className={cn(
                "text-2xl font-mono font-bold tabular-nums transition-all",
                currentScore > 700
                  ? "text-emerald-400"
                  : currentScore > 400
                    ? "text-amber-400"
                    : "text-rose-400",
              )}
            >
              +{currentScore}
            </span>
            <span className="text-sm text-muted-foreground">điểm</span>
          </div>
        )}
      </div>
      
      {/* Progress bar */}
      <div className="relative h-3 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={cn(
            "absolute inset-y-0 left-0 rounded-full transition-all duration-100",
            isCritical
              ? "bg-gradient-to-r from-rose-500 to-rose-600"
              : isLow
                ? "bg-gradient-to-r from-amber-500 to-orange-500"
                : "bg-gradient-to-r from-violet-500 to-fuchsia-500",
          )}
          style={{ width: `${percentage}%` }}
        />
        {isActive && (
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-white/20 animate-pulse"
            style={{ width: `${percentage}%` }}
          />
        )}
      </div>
      
      {/* Score hint */}
      {showScore && isActive && (
        <p className="text-center text-xs text-muted-foreground mt-2">
          Trả lời đúng và nhanh để được nhiều điểm hơn!
        </p>
      )}
    </div>
  );
}
