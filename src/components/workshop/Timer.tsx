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
      <div className="flex items-center justify-between mb-2 md:mb-3">
        {/* Timer */}
        <div className="flex items-center gap-2">
          <Clock
            className={cn(
              "w-4 h-4 md:w-5 md:h-5 transition-colors",
              isCritical
                ? "text-destructive animate-pulse"
                : isLow
                  ? "text-primary"
                  : "text-muted-foreground",
            )}
          />
          <span
            className={cn(
              "text-xl md:text-2xl font-mono font-semibold tabular-nums transition-colors",
              isCritical
                ? "text-destructive"
                : isLow
                  ? "text-primary"
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
                "w-4 h-4 md:w-5 md:h-5 transition-colors",
                currentScore > 700
                  ? "text-primary"
                  : currentScore > 400
                    ? "text-muted-foreground"
                    : "text-destructive",
              )}
            />
            <span
              className={cn(
                "text-xl md:text-2xl font-mono font-semibold tabular-nums transition-all",
                currentScore > 700
                  ? "text-primary"
                  : currentScore > 400
                    ? "text-muted-foreground"
                    : "text-destructive",
              )}
            >
              +{currentScore}
            </span>
            <span className="text-xs md:text-sm text-muted-foreground hidden sm:inline">pts</span>
          </div>
        )}
      </div>
      
      {/* Progress bar - Minimal styling */}
      <div className="relative h-1.5 md:h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            "absolute inset-y-0 left-0 rounded-full transition-all duration-100",
            isCritical
              ? "bg-destructive"
              : isLow
                ? "bg-primary"
                : "bg-primary/60",
          )}
          style={{ width: `${percentage}%` }}
        />
        {isActive && (
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-white/20 animate-pulse-subtle"
            style={{ width: `${percentage}%` }}
          />
        )}
      </div>
      
      {/* Score hint */}
      {showScore && isActive && (
        <p className="text-center text-xs text-muted-foreground mt-2">
          Answer quickly for more points!
        </p>
      )}
    </div>
  );
}
