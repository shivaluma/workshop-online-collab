"use client";

import {
  ChevronLeft,
  ChevronRight,
  Play,
  Square,
  Trophy,
  Users,
  Wifi,
  WifiOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Slide } from "@/lib/slides/types";
import { cn } from "@/lib/utils";
import type { ParticipantInfo } from "@/lib/ws/types";

interface HostControlsProps {
  currentSlide: number;
  totalSlides: number;
  slide: Slide;
  participants: ParticipantInfo[];
  isConnected: boolean;
  onPrevSlide: () => void;
  onNextSlide: () => void;
  onStartQuiz?: (quizId: string) => void;
  onEndQuiz?: (quizId: string) => void;
  onRevealScoreboard?: () => void;
  activeQuizId?: string | null;
  quizDbId?: string | null;
  hasQuizResult?: boolean;
}

export function HostControls({
  currentSlide,
  totalSlides,
  slide,
  participants,
  isConnected,
  onPrevSlide,
  onNextSlide,
  onStartQuiz,
  onEndQuiz,
  onRevealScoreboard,
  activeQuizId,
  quizDbId,
  hasQuizResult,
}: HostControlsProps) {
  const isQuizSlide = slide.type === "quiz";
  const isLeaderboardSlide = slide.type === "leaderboard";
  const canStartQuiz =
    isQuizSlide && !activeQuizId && quizDbId && !hasQuizResult;
  const canEndQuiz = isQuizSlide && activeQuizId;

  const activeParticipants = participants.filter((p) => p.isActive);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-zinc-900/95 border-t border-zinc-800 backdrop-blur-sm safe-area-pb">
      <div className="max-w-7xl mx-auto px-2 md:px-6 py-2 md:py-4">
        {/* Mobile: Stacked layout */}
        <div className="flex flex-col gap-2 md:hidden">
          {/* Row 1: Status + Actions */}
          <div className="flex items-center justify-between">
            {/* Status */}
            <div className="flex items-center gap-2">
              {isConnected ? (
                <Wifi className="w-4 h-4 text-emerald-400" />
              ) : (
                <WifiOff className="w-4 h-4 text-rose-400 animate-pulse" />
              )}
              <span className={cn("text-xs", isConnected ? "text-emerald-400" : "text-rose-400")}>
                {isConnected ? "Live" : "Offline"}
              </span>
              
              {/* Participant count */}
              <HoverCard openDelay={200}>
                <HoverCardTrigger asChild>
                  <button type="button" className="flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700 rounded-full px-2 py-1 transition-colors">
                    <Users className="w-3 h-3 text-violet-400" />
                    <span className="font-mono text-xs">{activeParticipants.length}</span>
                  </button>
                </HoverCardTrigger>
                <HoverCardContent className="w-56 bg-zinc-900 border-zinc-700" side="top" align="start">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold">Người tham gia</h4>
                      <span className="text-xs text-muted-foreground">{activeParticipants.length} online</span>
                    </div>
                    {activeParticipants.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-2">Chưa có ai...</p>
                    ) : (
                      <ScrollArea className="h-[150px]">
                        <div className="space-y-1">
                          {activeParticipants.map((p, index) => (
                            <div key={p.id} className="flex items-center justify-between py-1 px-2 rounded-md hover:bg-zinc-800">
                              <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full bg-violet-500/20 flex items-center justify-center text-xs font-medium text-violet-400">
                                  {index + 1}
                                </div>
                                <span className="text-xs truncate max-w-[100px]">{p.name}</span>
                              </div>
                              <span className="text-xs font-mono text-muted-foreground">{p.score}</span>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </div>
                </HoverCardContent>
              </HoverCard>
            </div>
            
            {/* Quiz/Leaderboard Actions */}
            <div className="flex items-center gap-2">
              {canStartQuiz && (
                <Button size="sm" onClick={() => onStartQuiz?.(quizDbId)} className="gap-1 bg-emerald-600 hover:bg-emerald-700 h-8 px-2 text-xs">
                  <Play className="w-3 h-3" />
                  Start
                </Button>
              )}
              {canEndQuiz && (
                <Button size="sm" variant="destructive" onClick={() => onEndQuiz?.(activeQuizId)} className="gap-1 h-8 px-2 text-xs">
                  <Square className="w-3 h-3" />
                  End
                </Button>
              )}
              {isLeaderboardSlide && (
                <Button size="sm" onClick={onRevealScoreboard} className="gap-1 bg-amber-600 hover:bg-amber-700 h-8 px-2 text-xs">
                  <Trophy className="w-3 h-3" />
                  Reveal
                </Button>
              )}
            </div>
          </div>
          
          {/* Row 2: Navigation */}
          <div className="flex items-center justify-center gap-2">
            <Button variant="outline" size="sm" onClick={onPrevSlide} disabled={currentSlide === 0} className="h-8 px-2">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="bg-zinc-800 rounded-lg px-3 py-1 text-center">
              <span className="font-mono text-sm">{currentSlide + 1} / {totalSlides}</span>
            </div>
            <Button variant="outline" size="sm" onClick={onNextSlide} disabled={currentSlide === totalSlides - 1} className="h-8 px-2">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Desktop: Horizontal layout */}
        <div className="hidden md:flex items-center justify-between gap-4">
          {/* Left: Status */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {isConnected ? (
                <Wifi className="w-5 h-5 text-emerald-400" />
              ) : (
                <WifiOff className="w-5 h-5 text-rose-400 animate-pulse" />
              )}
              <span className={cn("text-sm", isConnected ? "text-emerald-400" : "text-rose-400")}>
                {isConnected ? "Connected" : "Disconnected"}
              </span>
            </div>

            {/* Participant count with hover card */}
            <HoverCard openDelay={200}>
              <HoverCardTrigger asChild>
                <button className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 rounded-full px-4 py-1.5 transition-colors cursor-pointer">
                  <Users className="w-4 h-4 text-violet-400" />
                  <span className="font-mono text-sm">{activeParticipants.length}</span>
                </button>
              </HoverCardTrigger>
              <HoverCardContent className="w-64 bg-zinc-900 border-zinc-700" side="top" align="start">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold">Người tham gia</h4>
                    <span className="text-xs text-muted-foreground">{activeParticipants.length} online</span>
                  </div>
                  {activeParticipants.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2">Chưa có ai tham gia...</p>
                  ) : (
                    <ScrollArea className="h-[200px]">
                      <div className="space-y-1">
                        {activeParticipants.map((p, index) => (
                          <div key={p.id} className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-zinc-800">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center text-xs font-medium text-violet-400">
                                {index + 1}
                              </div>
                              <span className="text-sm truncate max-w-[120px]">{p.name}</span>
                            </div>
                            <span className="text-xs font-mono text-muted-foreground">{p.score} pts</span>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              </HoverCardContent>
            </HoverCard>
          </div>

          {/* Center: Navigation */}
          <div className="flex items-center gap-4">
            <Button variant="outline" size="lg" onClick={onPrevSlide} disabled={currentSlide === 0} className="gap-2">
              <ChevronLeft className="w-5 h-5" />
              Previous
            </Button>
            <div className="bg-zinc-800 rounded-lg px-4 py-2 min-w-[100px] text-center">
              <span className="font-mono text-lg">{currentSlide + 1} / {totalSlides}</span>
            </div>
            <Button variant="outline" size="lg" onClick={onNextSlide} disabled={currentSlide === totalSlides - 1} className="gap-2">
              Next
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            {canStartQuiz && (
              <Button size="lg" onClick={() => onStartQuiz?.(quizDbId)} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                <Play className="w-5 h-5" />
                Start Quiz
              </Button>
            )}
            {canEndQuiz && (
              <Button size="lg" variant="destructive" onClick={() => onEndQuiz?.(activeQuizId)} className="gap-2">
                <Square className="w-5 h-5" />
                End Quiz
              </Button>
            )}
            {isLeaderboardSlide && (
              <Button size="lg" onClick={onRevealScoreboard} className="gap-2 bg-amber-600 hover:bg-amber-700">
                <Trophy className="w-5 h-5" />
                Reveal Scores
              </Button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-2 md:mt-4 h-1 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-300"
            style={{ width: `${((currentSlide + 1) / totalSlides) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
