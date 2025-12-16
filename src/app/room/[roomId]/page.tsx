"use client";

import { Trophy, Wifi, WifiOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { use, useCallback, useEffect, useState } from "react";
import { Toaster, toast } from "sonner";
import {
  ParticipantNameModal,
  Scoreboard,
  SlideDeck,
} from "@/components/workshop";
import { slideDeck as defaultSlideDeck, getPreset } from "@/lib/slides";
import type { SlideDeck as SlideDeckType } from "@/lib/slides/types";
import { cn } from "@/lib/utils";
import { useWebSocket } from "@/lib/ws";
import type { ParticipantInfo, QuizStats, ScoreEntry } from "@/lib/ws/types";

export default function ParticipantPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = use(params);
  const router = useRouter();

  const [participantId, setParticipantId] = useState<string | null>(null);
  const [participantName, setParticipantName] = useState<string | null>(null);
  const [showNameModal, setShowNameModal] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showScoresSidebar, setShowScoresSidebar] = useState(false);

  // Slide deck
  const [slideDeckData, setSlideDeckData] =
    useState<SlideDeckType>(defaultSlideDeck);

  // Quiz state
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);
  const [quizQuestion, setQuizQuestion] = useState<string>("");
  const [quizOptions, setQuizOptions] = useState<string[]>([]);
  const [quizTimeout, setQuizTimeout] = useState(20);
  const [quizStartTime, setQuizStartTime] = useState<number | undefined>();
  const [hasAnswered, setHasAnswered] = useState(false);
  const [answeredOption, setAnsweredOption] = useState<number | undefined>();
  const [answeredOrder, setAnsweredOrder] = useState<number[] | undefined>();
  const [quizResult, setQuizResult] = useState<{
    correct: number | number[];
    stats: QuizStats;
    quizType?: string;
  } | null>(null);

  // Check for existing participant & load slides from server
  useEffect(() => {
    const loadRoom = async () => {
      try {
        // Fetch room data to get slides config
        const res = await fetch(`/api/rooms/${roomId}`);
        if (!res.ok) {
          toast.error("Room not found");
          router.push("/");
          return;
        }

        const roomData = await res.json();

        // Load slides from room data
        let slides: SlideDeckType | null = null;

        if (roomData.customSlides) {
          slides = roomData.customSlides as SlideDeckType;
        } else if (roomData.slidePreset) {
          const presetData = getPreset(roomData.slidePreset);
          if (presetData) {
            slides = presetData;
          }
        }

        if (slides) {
          setSlideDeckData(slides);
        }

        // Check for existing participant
        const storedId = localStorage.getItem(`participant_${roomId}`);
        const storedName = localStorage.getItem(`participant_name_${roomId}`);

        if (storedId && storedName) {
          setParticipantId(storedId);
          setParticipantName(storedName);
        } else {
          setShowNameModal(true);
        }
      } catch (error) {
        console.error("Error loading room:", error);
        toast.error("Room not found");
        router.push("/");
      } finally {
        setIsLoading(false);
      }
    };

    loadRoom();
  }, [roomId, router]);

  // Handle join
  const handleJoin = async (name: string) => {
    setIsJoining(true);
    setJoinError(undefined);

    try {
      const res = await fetch(`/api/rooms/${roomId}/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to join");
      }

      const participant = await res.json();

      // Store in localStorage
      localStorage.setItem(`participant_${roomId}`, participant.id);
      localStorage.setItem(`participant_name_${roomId}`, participant.name);

      setParticipantId(participant.id);
      setParticipantName(participant.name);
      setShowNameModal(false);

      toast.success("Welcome!");
    } catch (error) {
      setJoinError(
        error instanceof Error ? error.message : "Could not join room",
      );
    } finally {
      setIsJoining(false);
    }
  };

  // WebSocket handlers
  const handleRoomState = useCallback(
    (state: {
      currentSlide: number;
      status: string;
      participants: ParticipantInfo[];
      participantId?: string;
    }) => {
      setCurrentSlide(state.currentSlide);

      // Update scores
      const sortedScores = state.participants
        .sort((a, b) => b.score - a.score)
        .map((p, idx) => ({ ...p, rank: idx + 1 }));
      setScores(sortedScores);
    },
    [],
  );

  const handleSlideChange = useCallback((index: number) => {
    setCurrentSlide(index);
    // Reset quiz state
    setActiveQuizId(null);
    setQuizResult(null);
    setHasAnswered(false);
    setAnsweredOption(undefined);
    setAnsweredOrder(undefined);
    setShowLeaderboard(false);
  }, []);

  const handleQuizStart = useCallback(
    (quizId: string, question: string, options: string[], timeout: number) => {
      setActiveQuizId(quizId);
      setQuizQuestion(question);
      setQuizOptions(options);
      setQuizTimeout(timeout);
      setQuizStartTime(Date.now());
      setHasAnswered(false);
      setAnsweredOption(undefined);
      setAnsweredOrder(undefined);
      setQuizResult(null);
    },
    [],
  );

  const handleQuizEnd = useCallback((quizId: string) => {
    // Quiz ended by host before time ran out
  }, []);

  const handleQuizResult = useCallback(
    (
      quizId: string,
      correct: number | number[],
      stats: QuizStats,
      quizType?: string,
    ) => {
      setQuizResult({ correct, stats, quizType });
      setActiveQuizId(null);
    },
    [],
  );

  const handleScoreboardUpdate = useCallback((newScores: ScoreEntry[]) => {
    setScores(newScores);
    setShowLeaderboard(true);
  }, []);

  const handleError = useCallback((message: string) => {
    toast.error(message);
  }, []);

  const { isConnected, isReconnecting, submitAnswer } = useWebSocket({
    roomId,
    participantId: participantId || undefined,
    name: participantName || undefined,
    onRoomState: handleRoomState,
    onSlideChange: handleSlideChange,
    onQuizStart: handleQuizStart,
    onQuizEnd: handleQuizEnd,
    onQuizResult: handleQuizResult,
    onScoreboardUpdate: handleScoreboardUpdate,
    onError: handleError,
  });

  // Handle answer submission (supports both number for choice quiz and number[] for ordering quiz)
  const handleSubmitAnswer = useCallback(
    (answer: number | number[], timeTaken: number) => {
      if (!activeQuizId || hasAnswered) return;

      setHasAnswered(true);
      if (Array.isArray(answer)) {
        setAnsweredOrder(answer);
      } else {
        setAnsweredOption(answer);
      }
      submitAnswer(activeQuizId, answer, timeTaken);
    },
    [activeQuizId, hasAnswered, submitAnswer],
  );

  // Find current participant's score
  const myScore = scores.find((s) => s.id === participantId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster position="top-center" theme="light" />

      {/* Name modal */}
      <ParticipantNameModal
        open={showNameModal}
        onSubmit={handleJoin}
        isLoading={isJoining}
        error={joinError}
      />

      {/* Header - Minimal styling */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-card/90 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-3 md:px-6 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-base md:text-lg font-semibold text-foreground shrink-0">
              Workshop
            </span>
            {participantName && (
              <span className="text-sm text-muted-foreground truncate">
                • {participantName}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 md:gap-4 shrink-0">
            {/* Connection status */}
            <div className="flex items-center gap-1.5">
              {isConnected ? (
                <Wifi className="w-4 h-4 text-primary" />
              ) : (
                <WifiOff className="w-4 h-4 text-destructive animate-pulse" />
              )}
              <span
                className={cn(
                  "text-xs hidden sm:inline",
                  isConnected ? "text-primary" : "text-destructive",
                )}
              >
                {isReconnecting
                  ? "Connecting..."
                  : isConnected
                    ? "Live"
                    : "Offline"}
              </span>
            </div>

            {/* Score */}
            {myScore && (
              <button
                onClick={() => setShowScoresSidebar(!showScoresSidebar)}
                className="flex items-center gap-2 bg-accent border border-border rounded-full px-3 py-1.5 hover:bg-accent/80 transition-colors"
              >
                <Trophy className="w-4 h-4 text-primary" />
                <span className="font-mono font-semibold text-sm">
                  {myScore.score}
                </span>
                <span className="text-xs text-muted-foreground">
                  #{myScore.rank}
                </span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="pt-14 min-h-screen">
        <SlideDeck
          slides={slideDeckData.slides}
          currentSlide={currentSlide}
          isHost={false}
          activeQuizId={activeQuizId}
          quizQuestion={quizQuestion}
          quizOptions={quizOptions}
          quizTimeout={quizTimeout}
          quizStartTime={quizStartTime}
          onSubmitAnswer={handleSubmitAnswer}
          hasAnswered={hasAnswered}
          answeredOption={answeredOption}
          answeredOrder={answeredOrder}
          quizResult={quizResult}
          scores={scores}
          showLeaderboard={showLeaderboard}
        />
      </main>

      {/* Scores sidebar */}
      {showScoresSidebar && (
        <>
          <div
            className="fixed inset-0 bg-foreground/20 z-40"
            onClick={() => setShowScoresSidebar(false)}
          />
          <div className="fixed right-0 top-0 bottom-0 w-full sm:w-80 max-w-sm bg-card border-l border-border z-50 p-4 overflow-y-auto animate-slide-right">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" />
                Leaderboard
              </h3>
              <button
                onClick={() => setShowScoresSidebar(false)}
                className="text-muted-foreground hover:text-foreground p-1"
              >
                ✕
              </button>
            </div>
            <Scoreboard
              scores={scores}
              currentParticipantId={participantId || undefined}
            />
          </div>
        </>
      )}
    </div>
  );
}
