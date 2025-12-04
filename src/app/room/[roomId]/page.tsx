"use client";

import { useEffect, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { slideDeck as defaultSlideDeck, getPreset } from "@/lib/slides";
import { useWebSocket } from "@/lib/ws";
import type { ScoreEntry, QuizStats, ParticipantInfo } from "@/lib/ws/types";
import type { SlideDeck as SlideDeckType } from "@/lib/slides/types";
import {
  SlideDeck,
  ParticipantNameModal,
  Scoreboard,
} from "@/components/workshop";
import { toast, Toaster } from "sonner";
import { cn } from "@/lib/utils";
import { Wifi, WifiOff, Trophy } from "lucide-react";

export default function ParticipantPage({
  params,
}: { params: Promise<{ roomId: string }> }) {
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
  const [slideDeckData, setSlideDeckData] = useState<SlideDeckType>(defaultSlideDeck);

  // Quiz state
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);
  const [quizQuestion, setQuizQuestion] = useState<string>("");
  const [quizOptions, setQuizOptions] = useState<string[]>([]);
  const [quizTimeout, setQuizTimeout] = useState(20);
  const [quizStartTime, setQuizStartTime] = useState<number | undefined>();
  const [hasAnswered, setHasAnswered] = useState(false);
  const [answeredOption, setAnsweredOption] = useState<number | undefined>();
  const [quizResult, setQuizResult] = useState<{
    correct: number;
    stats: QuizStats;
  } | null>(null);

  // Check for existing participant & load slides from server
  useEffect(() => {
    const loadRoom = async () => {
      try {
        // Fetch room data to get slides config
        const res = await fetch(`/api/rooms/${roomId}`);
        if (!res.ok) {
          toast.error("Không tìm thấy phòng");
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
        toast.error("Không tìm thấy phòng");
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

      toast.success("Chào mừng bạn!");
    } catch (error) {
      setJoinError(error instanceof Error ? error.message : "Không thể vào phòng");
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
    []
  );

  const handleSlideChange = useCallback((index: number) => {
    setCurrentSlide(index);
    // Reset quiz state
    setActiveQuizId(null);
    setQuizResult(null);
    setHasAnswered(false);
    setAnsweredOption(undefined);
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
      setQuizResult(null);
    },
    []
  );

  const handleQuizEnd = useCallback((quizId: string) => {
    // Quiz ended by host before time ran out
  }, []);

  const handleQuizResult = useCallback(
    (quizId: string, correct: number, stats: QuizStats) => {
      setQuizResult({ correct, stats });
      setActiveQuizId(null);
    },
    []
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

  // Handle answer submission
  const handleSubmitAnswer = useCallback(
    (answer: number, timeTaken: number) => {
      if (!activeQuizId || hasAnswered) return;

      setHasAnswered(true);
      setAnsweredOption(answer);
      submitAnswer(activeQuizId, answer, timeTaken);
    },
    [activeQuizId, hasAnswered, submitAnswer]
  );

  // Find current participant's score
  const myScore = scores.find((s) => s.id === participantId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-muted-foreground">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-foreground">
      <Toaster position="top-center" theme="dark" />

      {/* Name modal */}
      <ParticipantNameModal
        open={showNameModal}
        onSubmit={handleJoin}
        isLoading={isJoining}
        error={joinError}
      />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-zinc-900/90 backdrop-blur-sm border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-2 md:px-4 py-2 md:py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            <span className="text-sm md:text-lg font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent shrink-0">
              Workshop
            </span>
            {participantName && (
              <span className="text-xs md:text-base text-muted-foreground truncate">• {participantName}</span>
            )}
          </div>

          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            {/* Connection status */}
            <div className="flex items-center gap-1 md:gap-2">
              {isConnected ? (
                <Wifi className="w-3 h-3 md:w-4 md:h-4 text-emerald-400" />
              ) : (
                <WifiOff className="w-3 h-3 md:w-4 md:h-4 text-rose-400 animate-pulse" />
              )}
              <span
                className={cn(
                  "text-[10px] md:text-xs hidden sm:inline",
                  isConnected ? "text-emerald-400" : "text-rose-400"
                )}
              >
                {isReconnecting
                  ? "Đang kết nối..."
                  : isConnected
                    ? "Live"
                    : "Offline"}
              </span>
            </div>

            {/* Score */}
            {myScore && (
              <button
                onClick={() => setShowScoresSidebar(!showScoresSidebar)}
                className="flex items-center gap-1 md:gap-2 bg-violet-500/20 border border-violet-500/30 rounded-full px-2 md:px-4 py-1 md:py-1.5 hover:bg-violet-500/30 transition-colors"
              >
                <Trophy className="w-3 h-3 md:w-4 md:h-4 text-violet-400" />
                <span className="font-mono font-bold text-sm md:text-base">{myScore.score}</span>
                <span className="text-[10px] md:text-xs text-muted-foreground">
                  #{myScore.rank}
                </span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="pt-12 md:pt-16 min-h-screen">
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
          quizResult={quizResult}
          scores={scores}
          showLeaderboard={showLeaderboard}
        />
      </main>

      {/* Scores sidebar */}
      {showScoresSidebar && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowScoresSidebar(false)}
          />
          <div className="fixed right-0 top-0 bottom-0 w-full sm:w-80 max-w-sm bg-zinc-900 border-l border-zinc-800 z-50 p-3 md:p-4 overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <h3 className="text-base md:text-lg font-semibold flex items-center gap-2">
                <Trophy className="w-4 h-4 md:w-5 md:h-5 text-amber-400" />
                Bảng xếp hạng
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
