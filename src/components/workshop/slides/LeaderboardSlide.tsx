"use client";

import { Crown, Sparkles, Trophy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { LeaderboardSlide as LeaderboardSlideType } from "@/lib/slides/types";
import { cn } from "@/lib/utils";
import type { ScoreEntry } from "@/lib/ws/types";

interface LeaderboardSlideProps {
  slide: LeaderboardSlideType;
  scores?: ScoreEntry[];
  showLeaderboard?: boolean;
}

type RevealPhase =
  | "waiting"
  | "drumroll"
  | "list-reveal"
  | "list-complete"
  | "podium-3"
  | "podium-2"
  | "podium-1"
  | "complete";

export function LeaderboardSlide({
  slide,
  scores = [],
  showLeaderboard = false,
}: LeaderboardSlideProps) {
  const [phase, setPhase] = useState<RevealPhase>("waiting");
  const [revealedListItems, setRevealedListItems] = useState<number>(0);
  const hasStartedRef = useRef(false);

  // Main reveal sequence
  useEffect(() => {
    if (!showLeaderboard || scores.length === 0 || hasStartedRef.current)
      return;

    hasStartedRef.current = true;

    const runSequence = async () => {
      // Phase 1: Drumroll
      setPhase("drumroll");
      await delay(2000);

      // Phase 2: Reveal list from bottom to top (4th place and below)
      const rest = scores.slice(3, 10);
      if (rest.length > 0) {
        setPhase("list-reveal");
        
        for (let i = rest.length; i >= 1; i--) {
          setRevealedListItems(rest.length - i + 1);
          await delay(400);
        }
        
        await delay(1000);
        setPhase("list-complete");
        await delay(1500);
      }

      // Phase 3: Podium reveal - 3rd place
      if (scores.length >= 3) {
        setPhase("podium-3");
        await delay(2000);
      }

      // Phase 4: Podium reveal - 2nd place
      if (scores.length >= 2) {
        setPhase("podium-2");
        await delay(2000);
      }

      // Phase 5: Podium reveal - 1st place
      if (scores.length >= 1) {
        setPhase("podium-1");
        await delay(2500);
      }

      // Phase 6: Complete
      setPhase("complete");
    };

    runSequence();
  }, [showLeaderboard, scores.length, scores]);

  // Reset only when showLeaderboard becomes false
  useEffect(() => {
    if (!showLeaderboard) {
      hasStartedRef.current = false;
      setPhase("waiting");
      setRevealedListItems(0);
    }
  }, [showLeaderboard]);

  // Waiting state
  if (phase === "waiting") {
    return (
      <div className="w-full max-w-3xl space-y-6 md:space-y-8 text-center px-4 animate-fade-up">
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-3">
            {slide.emoji && (
              <span className="text-4xl md:text-5xl animate-float">{slide.emoji}</span>
            )}
            <h2 className="editorial-display text-3xl md:text-4xl lg:text-5xl text-foreground">
              {slide.title}
            </h2>
          </div>
          <div className="section-rule-accent w-16 mx-auto" />
        </div>
        <p className="text-lg text-muted-foreground">
          {slide.description || "Waiting for results..."}
        </p>
        <div className="text-5xl md:text-6xl animate-pulse-subtle">🎮</div>
      </div>
    );
  }

  // Drumroll state
  if (phase === "drumroll") {
    return (
      <div className="w-full max-w-3xl text-center space-y-6 md:space-y-8 px-4">
        <div className="flex items-center justify-center gap-3">
          <Sparkles className="w-8 h-8 md:w-10 md:h-10 text-primary animate-pulse" />
          <h2 className="editorial-display text-3xl md:text-5xl text-foreground">
            And the winner is...
          </h2>
          <Sparkles className="w-8 h-8 md:w-10 md:h-10 text-primary animate-pulse" />
        </div>
        <div className="flex justify-center gap-4 md:gap-6 text-4xl md:text-6xl">
          <span className="animate-bounce" style={{ animationDelay: "0ms" }}>
            🥁
          </span>
          <span className="animate-bounce" style={{ animationDelay: "150ms" }}>
            🥁
          </span>
          <span className="animate-bounce" style={{ animationDelay: "300ms" }}>
            🥁
          </span>
        </div>
        <div className="text-lg text-muted-foreground">
          {scores.length} participants
        </div>
      </div>
    );
  }

  const top3 = scores.slice(0, 3);
  const rest = scores.slice(3, 10);
  const showPodium = phase.startsWith("podium") || phase === "complete";
  const showList = phase === "list-reveal" || phase === "list-complete" || showPodium;

  return (
    <div className="w-full max-w-4xl space-y-4 md:space-y-6 px-4 overflow-y-auto max-h-[calc(100vh-100px)]">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-3">
          <Crown className="w-6 h-6 md:w-8 md:h-8 text-primary animate-float" />
          <h2 className="editorial-display text-3xl md:text-4xl text-foreground">
            {slide.title}
          </h2>
          <Crown className="w-6 h-6 md:w-8 md:h-8 text-primary animate-float" />
        </div>
        <div className="section-rule-accent w-16 mx-auto mt-2" />
      </div>

      {/* List (4th place and below) */}
      {showList && rest.length > 0 && (
        <div className="space-y-2 px-2 md:px-4 mb-6">
          {rest.map((score, idx) => {
            const rank = idx + 4;
            const itemIndex = rest.length - idx;
            const isRevealed = revealedListItems >= itemIndex || phase !== "list-reveal";

            return (
              <div
                key={score.id}
                className={cn(
                  "flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-lg border transition-all",
                  "bg-card border-border",
                  isRevealed
                    ? "opacity-100 translate-y-0 scale-100"
                    : "opacity-0 translate-y-8 scale-95",
                )}
                style={{
                  transitionDuration: "600ms",
                }}
              >
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-muted flex items-center justify-center font-semibold text-muted-foreground shrink-0">
                  {rank}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm md:text-base truncate text-foreground">
                    {score.name}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-mono text-base md:text-lg font-semibold text-primary">
                    {score.score.toLocaleString()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Podium Area */}
      {showPodium && (
        <div className="flex items-end justify-center gap-2 sm:gap-4 md:gap-6 h-56 sm:h-72 md:h-80 pt-4">
          {/* 2nd Place */}
          <div
            className={cn(
              "flex flex-col items-center transition-all",
              phase === "podium-2" || phase === "podium-1" || phase === "complete"
                ? "opacity-100 translate-y-0 scale-100"
                : "opacity-0 translate-y-32 scale-90",
            )}
            style={{ transitionDuration: "800ms", transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)" }}
          >
            <div className="bg-card border border-border rounded-t-lg p-3 md:p-4 text-center w-20 sm:w-28 md:w-36 relative overflow-hidden">
              <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 mx-auto rounded-full bg-muted flex items-center justify-center mb-2 ring-2 ring-border">
                <span className="text-xl sm:text-2xl md:text-3xl">🥈</span>
              </div>
              <div className="font-semibold truncate text-xs sm:text-sm md:text-base text-foreground">
                {top3[1]?.name || "---"}
              </div>
              <div className="text-sm sm:text-lg md:text-xl font-mono font-semibold text-muted-foreground">
                {top3[1]?.score?.toLocaleString() || 0}
              </div>
            </div>
            <div className="w-20 sm:w-28 md:w-36 h-20 sm:h-28 md:h-32 bg-muted rounded-b-lg flex items-center justify-center">
              <span className="text-4xl sm:text-5xl md:text-6xl font-bold text-muted-foreground/50">
                2
              </span>
            </div>
          </div>

          {/* 1st Place */}
          <div
            className={cn(
              "flex flex-col items-center transition-all",
              phase === "podium-1" || phase === "complete"
                ? "opacity-100 translate-y-0 scale-100"
                : "opacity-0 translate-y-40 scale-90",
            )}
            style={{ transitionDuration: "1000ms", transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)" }}
          >
            <div className="relative">
              <div className="absolute -top-6 md:-top-8 left-1/2 -translate-x-1/2 z-10">
                <Crown
                  className={cn(
                    "w-6 h-6 md:w-10 md:h-10 text-primary transition-all duration-500",
                    phase === "complete" ? "animate-float" : "animate-pulse-subtle",
                  )}
                />
              </div>
              {(phase === "podium-1" || phase === "complete") && (
                <div className="absolute -inset-3 md:-inset-4 bg-primary/10 blur-xl rounded-full animate-pulse-subtle" />
              )}
              <div className="relative bg-accent border-2 border-primary/30 rounded-t-lg p-3 sm:p-4 md:p-5 text-center w-24 sm:w-32 md:w-44 mt-3 overflow-hidden">
                <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-2 ring-2 ring-primary/30">
                  <span className="text-2xl sm:text-3xl md:text-4xl">🏆</span>
                </div>
                <div className="font-semibold truncate text-sm sm:text-lg md:text-xl text-foreground">
                  {top3[0]?.name || "---"}
                </div>
                <div className="text-lg sm:text-xl md:text-2xl font-mono font-bold text-primary">
                  {top3[0]?.score?.toLocaleString() || 0}
                </div>
              </div>
            </div>
            <div className="w-24 sm:w-32 md:w-44 h-24 sm:h-36 md:h-44 bg-primary/20 rounded-b-lg flex items-center justify-center">
              <span className="text-5xl sm:text-6xl md:text-7xl font-bold text-primary/30">
                1
              </span>
            </div>
          </div>

          {/* 3rd Place */}
          <div
            className={cn(
              "flex flex-col items-center transition-all",
              phase === "podium-3" || phase === "podium-2" || phase === "podium-1" || phase === "complete"
                ? "opacity-100 translate-y-0 scale-100"
                : "opacity-0 translate-y-24 scale-90",
            )}
            style={{ transitionDuration: "800ms", transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)" }}
          >
            <div className="bg-card border border-border rounded-t-lg p-3 md:p-4 text-center w-20 sm:w-28 md:w-36 relative overflow-hidden">
              <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 mx-auto rounded-full bg-muted flex items-center justify-center mb-2 ring-2 ring-border">
                <span className="text-xl sm:text-2xl md:text-3xl">🥉</span>
              </div>
              <div className="font-semibold truncate text-xs sm:text-sm md:text-base text-foreground">
                {top3[2]?.name || "---"}
              </div>
              <div className="text-sm sm:text-lg md:text-xl font-mono font-semibold text-muted-foreground">
                {top3[2]?.score?.toLocaleString() || 0}
              </div>
            </div>
            <div className="w-20 sm:w-28 md:w-36 h-16 sm:h-20 md:h-24 bg-muted rounded-b-lg flex items-center justify-center">
              <span className="text-4xl sm:text-5xl md:text-6xl font-bold text-muted-foreground/50">
                3
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Confetti */}
      {phase === "complete" && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
          {Array.from({ length: 60 }).map((_, i) => {
            const emoji = ["🎉", "⭐", "🏆", "🎊", "✨", "💫"][i % 6];
            const left = Math.random() * 100;
            const animDelay = Math.random() * 2;
            const duration = 4 + Math.random() * 3;
            const size = 1 + Math.random() * 1;

            return (
              <div
                key={`confetti-${i}`}
                className="absolute animate-confetti"
                style={{
                  left: `${left}%`,
                  animationDelay: `${animDelay}s`,
                  animationDuration: `${duration}s`,
                  fontSize: `${size}rem`,
                }}
              >
                {emoji}
              </div>
            );
          })}
        </div>
      )}

      {/* Winner announcement */}
      {phase === "complete" && top3[0] && (
        <div className="text-center animate-fade-in px-4">
          <div className="inline-flex items-center gap-2 md:gap-3 bg-accent border border-primary/30 rounded-full px-5 md:px-8 py-2.5 md:py-4">
            <Trophy className="w-5 h-5 md:w-6 md:h-6 text-primary shrink-0" />
            <span className="text-base md:text-xl font-medium">
              Congratulations{" "}
              <span className="text-primary font-semibold">
                {top3[0].name}
              </span>
              !
            </span>
            <Trophy className="w-5 h-5 md:w-6 md:h-6 text-primary shrink-0" />
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Add confetti keyframe to globals.css if not present
