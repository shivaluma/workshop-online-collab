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
          score.rank === 1 ? <Trophy className="w-4 h-4 text-amber-400" /> :
          score.rank === 2 ? <Medal className="w-4 h-4 text-slate-400" /> :
          score.rank === 3 ? <Star className="w-4 h-4 text-amber-600" /> : null;

        return (
          <div
            key={score.id}
            className={cn(
              "flex items-center gap-3 p-3 rounded-lg border transition-all",
              isCurrentUser
                ? "bg-violet-500/20 border-violet-500/50"
                : score.rank <= 3
                ? "bg-zinc-800/50 border-zinc-700"
                : "bg-zinc-800/30 border-zinc-700/50"
            )}
          >
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                score.rank === 1 ? "bg-amber-500 text-white" :
                score.rank === 2 ? "bg-slate-400 text-white" :
                score.rank === 3 ? "bg-amber-700 text-white" :
                "bg-zinc-700 text-zinc-300"
              )}
            >
              {rankIcon || score.rank}
            </div>
            <div className="flex-1 truncate">
              <span className={cn(isCurrentUser && "font-semibold")}>
                {score.name}
              </span>
              {isCurrentUser && (
                <span className="ml-2 text-xs text-violet-400">(you)</span>
              )}
            </div>
            <div className="font-mono font-bold">{score.score}</div>
          </div>
        );
      })}
    </div>
  );
}

