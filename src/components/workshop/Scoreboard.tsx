"use client";

import type { ScoreEntry } from "@/lib/ws/types";
import { cn } from "@/lib/utils";
import { Trophy, Medal, Star } from "lucide-react";

interface ScoreboardProps {
  scores: ScoreEntry[];
  currentParticipantId?: string;
  compact?: boolean;
}

export function Scoreboard({ scores, currentParticipantId, compact = false }: ScoreboardProps) {
  if (scores.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No scores yet
      </div>
    );
  }

  const displayScores = compact ? scores.slice(0, 5) : scores;

  return (
    <div className={cn("space-y-2", compact ? "text-sm" : "")}>
      {displayScores.map((score) => {
        const isCurrentUser = score.id === currentParticipantId;
        const rankIcon =
          score.rank === 1 ? <Trophy className="w-4 h-4 text-primary" /> :
          score.rank === 2 ? <Medal className="w-4 h-4 text-muted-foreground" /> :
          score.rank === 3 ? <Star className="w-4 h-4 text-primary/70" /> : null;

        return (
          <div
            key={score.id}
            className={cn(
              "flex items-center gap-3 p-3 rounded-lg border transition-all",
              isCurrentUser
                ? "bg-accent border-primary/30"
                : score.rank <= 3
                ? "bg-card border-border"
                : "bg-muted/30 border-border/50"
            )}
          >
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm",
                score.rank === 1 ? "bg-primary text-primary-foreground" :
                score.rank === 2 ? "bg-muted text-muted-foreground" :
                score.rank === 3 ? "bg-primary/20 text-primary" :
                "bg-muted text-muted-foreground"
              )}
            >
              {rankIcon || score.rank}
            </div>
            <div className="flex-1 truncate">
              <span className={cn(isCurrentUser && "font-semibold text-foreground")}>
                {score.name}
              </span>
              {isCurrentUser && (
                <span className="ml-2 text-xs text-primary">(you)</span>
              )}
            </div>
            <div className="font-mono font-semibold">{score.score}</div>
          </div>
        );
      })}
    </div>
  );
}
