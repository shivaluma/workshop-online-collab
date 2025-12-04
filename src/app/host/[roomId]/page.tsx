"use client";

import { useEffect, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { slideDeck as defaultSlideDeck, getPreset } from "@/lib/slides";
import { useWebSocket } from "@/lib/ws";
import type { ScoreEntry, QuizStats, ParticipantInfo } from "@/lib/ws/types";
import type { SlideDeck as SlideDeckType } from "@/lib/slides/types";
import { SlideDeck, HostControls } from "@/components/workshop";
import { toast, Toaster } from "sonner";
import { Copy, Check } from "lucide-react";

interface Quiz {
  id: string;
  slideId: number;
  status: string;
}

export default function HostPage({
  params,
}: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params);
  const router = useRouter();

  const [hostSecret, setHostSecret] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [participants, setParticipants] = useState<ParticipantInfo[]>([]);
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [copied, setCopied] = useState(false);

  // Slide deck (loaded from localStorage or default)
  const [slideDeckData, setSlideDeckData] = useState<SlideDeckType | null>(
    null
  );

  // Quiz state
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);
  const [answerCount, setAnswerCount] = useState<
    { count: number; total: number } | undefined
  >();
  const [quizResult, setQuizResult] = useState<{
    correct: number;
    stats: QuizStats;
  } | null>(null);

  // Load slide deck and verify host
  useEffect(() => {
    const secret = localStorage.getItem(`host_secret_${roomId}`);
    if (!secret) {
      toast.error("Không tìm thấy thông tin host");
      router.push("/");
      return;
    }

    // Fetch room data first to get slides
    const loadRoom = async () => {
      try {
        // Verify host
        const verifyRes = await fetch(`/api/rooms/${roomId}/verify-host`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ hostSecret: secret }),
        });
        const verifyData = await verifyRes.json();
        
        if (!verifyData.valid) {
          toast.error("Thông tin host không hợp lệ");
          router.push("/");
          return;
        }

        // Fetch room to get slides config
        const roomRes = await fetch(`/api/rooms/${roomId}`);
        const roomData = await roomRes.json();

        // Load slides from room data
        let slides: SlideDeckType | null = null;
        
        if (roomData.customSlides) {
          // Custom uploaded slides
          slides = roomData.customSlides as SlideDeckType;
        } else if (roomData.slidePreset) {
          // Preset slides
          const presetData = getPreset(roomData.slidePreset);
          if (presetData) {
            slides = presetData;
          }
        }
        
        // Fallback to default
        if (!slides) {
          slides = defaultSlideDeck;
        }

        setSlideDeckData(slides);
        setHostSecret(secret);
        
        // Initialize quizzes
        initializeQuizzes(secret, slides);
      } catch (error) {
        console.error("Error loading room:", error);
        toast.error("Không thể tải phòng");
        router.push("/");
      } finally {
        setIsVerifying(false);
      }
    };

    loadRoom();
  }, [roomId, router]);

  // Initialize quizzes in database
  const initializeQuizzes = async (secret: string, slides: SlideDeckType) => {
    if (!slides?.quizzes) return;

    try {
      const quizzesData = slides.quizzes.map((q) => ({
        slideId: q.slideId,
        question: q.question,
        options: q.options,
        correctOption: q.correctOption,
        timeLimit: q.timeLimit,
      }));

      const res = await fetch(`/api/rooms/${roomId}/quizzes/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hostSecret: secret, quizzes: quizzesData }),
      });

      if (res.ok) {
        const data = await res.json();
        setQuizzes(data);
      }
    } catch (error) {
      console.error("Failed to initialize quizzes:", error);
    }
  };

  // Copy room code
  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    toast.success("Đã copy mã phòng!");
    setTimeout(() => setCopied(false), 2000);
  };

  // WebSocket handlers
  const handleRoomState = useCallback(
    (state: { currentSlide: number; participants: ParticipantInfo[] }) => {
      setCurrentSlide(state.currentSlide);
      setParticipants(state.participants);
    },
    []
  );

  const handleSlideChange = useCallback((index: number) => {
    setCurrentSlide(index);
    // Reset quiz state on slide change
    setActiveQuizId(null);
    setQuizResult(null);
    setAnswerCount(undefined);
  }, []);

  const handleParticipantJoin = useCallback(
    (id: string, name: string, score: number, count: number) => {
      toast.success(`${name} đã tham gia!`);
      setParticipants((prev) => {
        const existing = prev.find((p) => p.id === id);
        if (existing) {
          return prev.map((p) =>
            p.id === id ? { ...p, isActive: true, score } : p
          );
        }
        return [...prev, { id, name, score, isActive: true }];
      });
    },
    []
  );

  const handleParticipantLeave = useCallback((id: string, count: number) => {
    setParticipants((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isActive: false } : p))
    );
  }, []);

  const handleAnswerCountUpdate = useCallback(
    (quizId: string, count: number, total: number) => {
      if (quizId === activeQuizId) {
        setAnswerCount({ count, total });
      }
    },
    [activeQuizId]
  );

  const handleQuizResult = useCallback(
    (quizId: string, correct: number, stats: QuizStats) => {
      setQuizResult({ correct, stats });
      setActiveQuizId(null);
      setQuizzes((prev) =>
        prev.map((q) => (q.id === quizId ? { ...q, status: "COMPLETED" } : q))
      );
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

  const { isConnected, changeSlide, startQuiz, endQuiz, revealScoreboard } =
    useWebSocket({
      roomId,
      isHost: true,
      hostSecret: hostSecret || undefined,
      onRoomState: handleRoomState,
      onSlideChange: handleSlideChange,
      onParticipantJoin: handleParticipantJoin,
      onParticipantLeave: handleParticipantLeave,
      onAnswerCountUpdate: handleAnswerCountUpdate,
      onQuizResult: handleQuizResult,
      onScoreboardUpdate: handleScoreboardUpdate,
      onError: handleError,
    });

  // Navigation
  const handlePrevSlide = useCallback(() => {
    if (!slideDeckData) return;
    if (currentSlide > 0) {
      const newIndex = currentSlide - 1;
      setCurrentSlide(newIndex);
      changeSlide(newIndex);
      setQuizResult(null);
      setActiveQuizId(null);
    }
  }, [currentSlide, changeSlide, slideDeckData]);

  const handleNextSlide = useCallback(() => {
    if (!slideDeckData) return;
    if (currentSlide < slideDeckData.slides.length - 1) {
      const newIndex = currentSlide + 1;
      setCurrentSlide(newIndex);
      changeSlide(newIndex);
      setQuizResult(null);
      setActiveQuizId(null);
    }
  }, [currentSlide, changeSlide, slideDeckData]);

  // Quiz controls
  const handleStartQuiz = useCallback(
    (quizId: string) => {
      setActiveQuizId(quizId);
      setQuizResult(null);
      setAnswerCount({
        count: 0,
        total: participants.filter((p) => p.isActive).length,
      });
      startQuiz(quizId);
    },
    [startQuiz, participants]
  );

  const handleEndQuiz = useCallback(
    (quizId: string) => {
      endQuiz(quizId);
    },
    [endQuiz]
  );

  const handleRevealScoreboard = useCallback(() => {
    revealScoreboard();
  }, [revealScoreboard]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        handleNextSlide();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrevSlide();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNextSlide, handlePrevSlide]);

  // Get quiz for current slide
  const currentQuiz = slideDeckData
    ? quizzes.find((q) => q.slideId === slideDeckData.slides[currentSlide]?.id)
    : null;

  if (!slideDeckData || isVerifying) {
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
      <Toaster position="top-right" theme="dark" />

      {/* Room Code Banner */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-zinc-900/90 backdrop-blur-sm border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-2 md:px-4 py-1.5 md:py-2 flex items-center justify-between gap-2">
          <div className="text-xs md:text-sm text-muted-foreground truncate">
            {slideDeckData.title}
          </div>
          <button
            onClick={copyRoomCode}
            className="flex items-center gap-1 md:gap-2 bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 rounded-lg px-2 md:px-3 py-1 md:py-1.5 transition-colors shrink-0"
          >
            <span className="text-xs md:text-sm text-muted-foreground hidden sm:inline">Mã phòng:</span>
            <span className="font-mono font-bold text-xs md:text-sm text-violet-400">{roomId}</span>
            {copied ? (
              <Check className="w-3 h-3 md:w-4 md:h-4 text-emerald-400" />
            ) : (
              <Copy className="w-3 h-3 md:w-4 md:h-4 text-muted-foreground" />
            )}
          </button>
        </div>
      </div>

      {/* Main slide area */}
      <div className="h-[calc(100vh-110px)] md:h-[calc(100vh-140px)] pt-10 md:pt-12 overflow-hidden">
        <SlideDeck
          slides={slideDeckData.slides}
          currentSlide={currentSlide}
          isHost={true}
          activeQuizId={activeQuizId}
          answerCount={answerCount}
          quizResult={quizResult}
          scores={scores}
          showLeaderboard={showLeaderboard}
        />
      </div>

      {/* Host controls */}
      <HostControls
        currentSlide={currentSlide}
        totalSlides={slideDeckData.slides.length}
        slide={slideDeckData.slides[currentSlide]}
        participants={participants}
        isConnected={isConnected}
        onPrevSlide={handlePrevSlide}
        onNextSlide={handleNextSlide}
        onStartQuiz={handleStartQuiz}
        onEndQuiz={handleEndQuiz}
        onRevealScoreboard={handleRevealScoreboard}
        activeQuizId={activeQuizId}
        quizDbId={currentQuiz?.id}
        hasQuizResult={quizResult !== null}
      />
    </div>
  );
}
