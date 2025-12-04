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
        
        // Reveal from last to first (bottom to top effect)
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

      // Phase 5: Podium reveal - 1st place (dramatic!)
      if (scores.length >= 1) {
        setPhase("podium-1");
        await delay(2500);
      }

      // Phase 6: Complete with confetti
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
      <div className="w-full max-w-4xl space-y-4 md:space-y-8 text-center px-2">
        <div className="flex items-center justify-center gap-2 md:gap-4">
          {slide.emoji && (
            <span className="text-4xl md:text-6xl animate-bounce-slow">{slide.emoji}</span>
          )}
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-foreground">
            {slide.title}
          </h2>
        </div>
        <p className="text-base md:text-xl text-muted-foreground">
          {slide.description || "Chờ host reveal kết quả..."}
        </p>
        <div className="text-5xl md:text-8xl animate-pulse">🎮</div>
      </div>
    );
  }

  // Drumroll state
  if (phase === "drumroll") {
    return (
      <div className="w-full max-w-4xl text-center space-y-4 md:space-y-8 px-2">
        <div className="flex items-center justify-center gap-2 md:gap-4">
          <Sparkles className="w-6 h-6 md:w-12 md:h-12 text-amber-400 animate-spin-slow" />
          <h2 className="text-2xl sm:text-3xl md:text-6xl font-bold bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400 bg-clip-text text-transparent animate-pulse">
            Và người chiến thắng là...
          </h2>
          <Sparkles className="w-6 h-6 md:w-12 md:h-12 text-amber-400 animate-spin-slow" />
        </div>
        <div className="flex justify-center gap-4 md:gap-6 text-4xl md:text-7xl">
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
        <div className="text-lg md:text-2xl text-muted-foreground animate-pulse">
          {scores.length} người chơi tham gia
        </div>
      </div>
    );
  }

  const top3 = scores.slice(0, 3);
  const rest = scores.slice(3, 10);
  const showPodium = phase.startsWith("podium") || phase === "complete";
  const showList = phase === "list-reveal" || phase === "list-complete" || showPodium;

  return (
    <div className="w-full max-w-5xl space-y-4 md:space-y-6 px-2 overflow-y-auto max-h-[calc(100vh-100px)]">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 md:gap-4">
          <Crown className="w-6 h-6 md:w-10 md:h-10 text-amber-400 animate-bounce-slow" />
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400 bg-clip-text text-transparent">
            {slide.title}
          </h2>
          <Crown className="w-6 h-6 md:w-10 md:h-10 text-amber-400 animate-bounce-slow" />
        </div>
      </div>

      {/* List (4th place and below) - Revealed first from bottom to top */}
      {showList && rest.length > 0 && (
        <div className="space-y-1.5 md:space-y-2 px-1 md:px-4 mb-4 md:mb-8">
          {rest.map((score, idx) => {
            const rank = idx + 4;
            // Reverse the reveal - last items show first
            const itemIndex = rest.length - idx;
            const isRevealed = revealedListItems >= itemIndex || phase !== "list-reveal";

            return (
              <div
                key={score.id}
                className={cn(
                  "flex items-center gap-2 md:gap-4 p-2 md:p-3 rounded-lg md:rounded-xl border transition-all",
                  "bg-zinc-800/80 border-zinc-600",
                  isRevealed
                    ? "opacity-100 translate-y-0 scale-100"
                    : "opacity-0 translate-y-8 scale-95",
                )}
                style={{
                  transitionDuration: "600ms",
                  transitionDelay: isRevealed ? "0ms" : "0ms",
                }}
              >
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-lg text-sm md:text-base shrink-0">
                  {rank}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm md:text-lg truncate">{score.name}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-mono text-base md:text-xl font-bold text-violet-400">
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
        <div className="flex items-end justify-center gap-1 sm:gap-3 md:gap-6 h-56 sm:h-72 md:h-96 pt-2 md:pt-4">
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
            <div className="bg-gradient-to-b from-slate-400/30 to-slate-500/10 border-2 border-slate-400/50 rounded-t-xl md:rounded-t-2xl p-2 md:p-4 text-center w-20 sm:w-28 md:w-36 backdrop-blur-sm relative overflow-hidden">
              {/* Shine effect */}
              {(phase === "podium-2" || phase === "podium-1" || phase === "complete") && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shine" />
              )}
              <div className="w-10 h-10 sm:w-14 sm:h-14 md:w-18 md:h-18 mx-auto rounded-full bg-gradient-to-br from-slate-300 to-slate-500 flex items-center justify-center mb-1 md:mb-2 ring-2 md:ring-4 ring-slate-400/50 shadow-xl">
                <span className="text-xl sm:text-3xl md:text-4xl">🥈</span>
              </div>
              <div className="font-bold truncate text-xs sm:text-sm md:text-base text-white">
                {top3[1]?.name || "---"}
              </div>
              <div className="text-sm sm:text-xl md:text-2xl font-mono font-bold text-slate-300">
                {top3[1]?.score?.toLocaleString() || 0}
              </div>
            </div>
            <div className="w-20 sm:w-28 md:w-36 h-20 sm:h-32 md:h-40 bg-gradient-to-b from-slate-400 to-slate-600 rounded-b-lg flex items-center justify-center shadow-xl shadow-slate-500/40">
              <span className="text-4xl sm:text-6xl md:text-7xl font-bold text-white/90">
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
              {/* Glowing crown */}
              <div className="absolute -top-6 md:-top-10 left-1/2 -translate-x-1/2 z-10">
                <Crown
                  className={cn(
                    "w-8 h-8 md:w-12 md:h-12 text-amber-400 transition-all duration-500 drop-shadow-[0_0_15px_rgba(251,191,36,0.8)]",
                    phase === "complete" ? "animate-bounce-slow" : "animate-pulse",
                  )}
                />
              </div>
              {/* Glow effect behind card */}
              {(phase === "podium-1" || phase === "complete") && (
                <div className="absolute -inset-2 md:-inset-4 bg-amber-400/20 blur-xl md:blur-2xl rounded-full animate-pulse" />
              )}
              <div className="relative bg-gradient-to-b from-amber-400/40 to-yellow-500/20 border-2 border-amber-400/60 rounded-t-xl md:rounded-t-2xl p-2 sm:p-4 md:p-5 text-center w-24 sm:w-32 md:w-44 backdrop-blur-sm mt-3 md:mt-4 overflow-hidden">
                {/* Shine effect */}
                {(phase === "podium-1" || phase === "complete") && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-shine" />
                )}
                <div className="w-12 h-12 sm:w-18 sm:h-18 md:w-24 md:h-24 mx-auto rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center mb-1 md:mb-2 ring-2 md:ring-4 ring-amber-400/60 shadow-2xl shadow-amber-500/50">
                  <span className="text-2xl sm:text-4xl md:text-5xl">🏆</span>
                </div>
                <div className="font-bold truncate text-sm sm:text-lg md:text-xl text-white">
                  {top3[0]?.name || "---"}
                </div>
                <div className="text-lg sm:text-2xl md:text-3xl font-mono font-bold text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]">
                  {top3[0]?.score?.toLocaleString() || 0}
                </div>
              </div>
            </div>
            <div className="w-24 sm:w-32 md:w-44 h-24 sm:h-40 md:h-52 bg-gradient-to-b from-amber-400 to-yellow-600 rounded-b-lg flex items-center justify-center shadow-2xl shadow-amber-500/50">
              <span className="text-5xl sm:text-7xl md:text-8xl font-bold text-white/90 drop-shadow-lg">
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
            <div className="bg-gradient-to-b from-orange-600/30 to-amber-700/10 border-2 border-orange-600/50 rounded-t-xl md:rounded-t-2xl p-2 md:p-4 text-center w-20 sm:w-28 md:w-36 backdrop-blur-sm relative overflow-hidden">
              {/* Shine effect */}
              {(phase === "podium-3" || phase === "podium-2" || phase === "podium-1" || phase === "complete") && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shine" />
              )}
              <div className="w-10 h-10 sm:w-14 sm:h-14 md:w-18 md:h-18 mx-auto rounded-full bg-gradient-to-br from-orange-500 to-amber-700 flex items-center justify-center mb-1 md:mb-2 ring-2 md:ring-4 ring-orange-500/50 shadow-xl">
                <span className="text-xl sm:text-3xl md:text-4xl">🥉</span>
              </div>
              <div className="font-bold truncate text-xs sm:text-sm md:text-base text-white">
                {top3[2]?.name || "---"}
              </div>
              <div className="text-sm sm:text-xl md:text-2xl font-mono font-bold text-orange-400">
                {top3[2]?.score?.toLocaleString() || 0}
              </div>
            </div>
            <div className="w-20 sm:w-28 md:w-36 h-16 sm:h-24 md:h-28 bg-gradient-to-b from-orange-500 to-amber-700 rounded-b-lg flex items-center justify-center shadow-xl shadow-orange-500/40">
              <span className="text-4xl sm:text-6xl md:text-7xl font-bold text-white/90">
                3
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Confetti */}
      {phase === "complete" && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
          {Array.from({ length: 80 }).map((_, i) => {
            const emoji = ["🎉", "⭐", "🏆", "🎊", "✨", "💫", "🌟", "🎯", "💎"][i % 9];
            const left = Math.random() * 100;
            const animDelay = Math.random() * 2;
            const duration = 4 + Math.random() * 3;
            const size = 1 + Math.random() * 1.5;

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
        <div className="text-center animate-in fade-in zoom-in duration-1000 px-2">
          <div className="inline-flex items-center gap-2 md:gap-3 bg-gradient-to-r from-amber-500/20 via-yellow-500/30 to-amber-500/20 border-2 border-amber-500/50 rounded-full px-4 md:px-8 py-2 md:py-4 shadow-xl shadow-amber-500/20">
            <Trophy className="w-5 h-5 md:w-8 md:h-8 text-amber-400 animate-bounce-slow shrink-0" />
            <span className="text-base md:text-2xl font-bold">
              🎊 Chúc mừng{" "}
              <span className="text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]">
                {top3[0].name}
              </span>
              ! 🎊
            </span>
            <Trophy className="w-5 h-5 md:w-8 md:h-8 text-amber-400 animate-bounce-slow shrink-0" />
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
