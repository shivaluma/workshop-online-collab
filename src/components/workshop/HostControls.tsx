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
  const isQuizSlide = slide.type === "quiz" || slide.type === "ordering-quiz";
  const isLeaderboardSlide = slide.type === "leaderboard";
  const canStartQuiz =
    isQuizSlide && !activeQuizId && quizDbId && !hasQuizResult;
  const canEndQuiz = isQuizSlide && activeQuizId;

  const activeParticipants = participants.filter((p) => p.isActive);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card/95 border-t border-border backdrop-blur-sm safe-area-pb">
      <div className="max-w-7xl mx-auto px-3 md:px-6 py-2.5 md:py-4">
        {/* Mobile: Stacked layout */}
        <div className="flex flex-col gap-2 md:hidden">
          {/* Row 1: Status + Actions */}
          <div className="flex items-center justify-between">
            {/* Status */}
            <div className="flex items-center gap-2">
              {isConnected ? (
                <Wifi className="w-4 h-4 text-primary" />
              ) : (
                <WifiOff className="w-4 h-4 text-destructive animate-pulse" />
              )}
              <span className={cn("text-xs", isConnected ? "text-primary" : "text-destructive")}>
                {isConnected ? "Live" : "Offline"}
              </span>
              
              {/* Participant count */}
              <HoverCard openDelay={200}>
                <HoverCardTrigger asChild>
                  <button type="button" className="flex items-center gap-1 bg-muted hover:bg-accent rounded-full px-2 py-1 transition-colors">
                    <Users className="w-3 h-3 text-primary" />
                    <span className="font-mono text-xs">{activeParticipants.length}</span>
                  </button>
                </HoverCardTrigger>
                <HoverCardContent className="w-56 bg-card border-border" side="top" align="start">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold">Participants</h4>
                      <span className="text-xs text-muted-foreground">{activeParticipants.length} online</span>
                    </div>
                    {activeParticipants.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-2">No one yet...</p>
                    ) : (
                      <ScrollArea className="h-[150px]">
                        <div className="space-y-1">
                          {activeParticipants.map((p, index) => (
                            <div key={p.id} className="flex items-center justify-between py-1 px-2 rounded-md hover:bg-accent">
                              <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
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
                <Button size="sm" onClick={() => onStartQuiz?.(quizDbId)} className="gap-1 h-8 px-2 text-xs">
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
                <Button size="sm" onClick={onRevealScoreboard} className="gap-1 h-8 px-2 text-xs">
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
            <div className="bg-muted rounded-lg px-3 py-1 text-center">
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
                <Wifi className="w-5 h-5 text-primary" />
              ) : (
                <WifiOff className="w-5 h-5 text-destructive animate-pulse" />
              )}
              <span className={cn("text-sm", isConnected ? "text-primary" : "text-destructive")}>
                {isConnected ? "Connected" : "Disconnected"}
              </span>
            </div>

            {/* Participant count with hover card */}
            <HoverCard openDelay={200}>
              <HoverCardTrigger asChild>
                <button type="button" className="flex items-center gap-2 bg-muted hover:bg-accent rounded-full px-4 py-1.5 transition-colors cursor-pointer">
                  <Users className="w-4 h-4 text-primary" />
                  <span className="font-mono text-sm">{activeParticipants.length}</span>
                </button>
              </HoverCardTrigger>
              <HoverCardContent className="w-64 bg-card border-border" side="top" align="start">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold">Participants</h4>
                    <span className="text-xs text-muted-foreground">{activeParticipants.length} online</span>
                  </div>
                  {activeParticipants.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2">No one has joined yet...</p>
                  ) : (
                    <ScrollArea className="h-[200px]">
                      <div className="space-y-1">
                        {activeParticipants.map((p, index) => (
                          <div key={p.id} className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-accent">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
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
            <div className="bg-muted rounded-lg px-4 py-2 min-w-[100px] text-center">
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
              <Button size="lg" onClick={() => onStartQuiz?.(quizDbId)} className="gap-2">
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
              <Button size="lg" onClick={onRevealScoreboard} className="gap-2">
                <Trophy className="w-5 h-5" />
                Reveal Scores
              </Button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-2 md:mt-4 h-1 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${((currentSlide + 1) / totalSlides) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
