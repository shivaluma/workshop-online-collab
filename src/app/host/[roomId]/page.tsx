"use client";

import { Check, Copy } from "lucide-react";
import { useRouter } from "next/navigation";
import { use, useCallback, useEffect, useState } from "react";
import { Toaster, toast } from "sonner";
import { HostControls, SlideDeck } from "@/components/workshop";
import { HostNotes } from "@/components/workshop/HostNotes";
import { slideDeck as defaultSlideDeck, getPreset } from "@/lib/slides";
import { getHostNotes } from "@/lib/slides/host-notes";
import type { SlideDeck as SlideDeckType } from "@/lib/slides/types";
import { useWebSocket } from "@/lib/ws";
import type { ParticipantInfo, QuizStats, ScoreEntry } from "@/lib/ws/types";

interface Quiz {
  id: string;
  slideId: number;
  status: string;
}

export default function HostPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
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
    null,
  );
  const [slidePreset, setSlidePreset] = useState<string | null>(null);

  // Quiz state
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);
  const [answerCount, setAnswerCount] = useState<
    { count: number; total: number } | undefined
  >();
  const [quizResult, setQuizResult] = useState<{
    correct: number | number[];
    stats: QuizStats;
    quizType?: string;
  } | null>(null);

  // Load slide deck and verify host
  useEffect(() => {
    const secret = localStorage.getItem(`host_secret_${roomId}`);
    if (!secret) {
      toast.error("Host credentials not found");
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
          toast.error("Invalid host credentials");
          router.push("/");
          return;
        }

        // Fetch room to get slides config
        const roomRes = await fetch(`/api/rooms/${roomId}`);
        const roomData = await roomRes.json();

        // Load slides from room data
        let slides: SlideDeckType | null = null;
        let preset: string | null = null;

        if (roomData.customSlides) {
          // Custom uploaded slides
          slides = roomData.customSlides as SlideDeckType;
        } else if (roomData.slidePreset) {
          // Preset slides
          preset = roomData.slidePreset;
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
        setSlidePreset(preset);
        setHostSecret(secret);

        // Initialize quizzes
        initializeQuizzes(secret, slides);
      } catch (error) {
        console.error("Error loading room:", error);
        toast.error("Could not load room");
        router.push("/");
      } finally {
        setIsVerifying(false);
      }
    };

    loadRoom();
  }, [roomId, router]);

  // Initialize quizzes in database
  const initializeQuizzes = async (secret: string, slides: SlideDeckType) => {
    try {
      // Collect all quizzes: from quizzes array + ordering quizzes from slides
      const quizzesData: Array<{
        slideId: number;
        question: string;
        quizType: "CHOICE" | "ORDERING";
        options?: string[];
        items?: string[];
        correctOption?: number;
        correctOrder?: number[];
        timeLimit: number;
      }> = [];

      // Add regular quizzes from quizzes array
      if (slides?.quizzes) {
        for (const q of slides.quizzes) {
          quizzesData.push({
            slideId: q.slideId,
            question: q.question,
            quizType: "CHOICE",
            options: q.options,
            correctOption: q.correctOption,
            timeLimit: q.timeLimit,
          });
        }
      }

      // Add ordering quizzes from slides
      if (slides?.slides) {
        for (const slide of slides.slides) {
          if (slide.type === "ordering-quiz") {
            quizzesData.push({
              slideId: slide.id,
              question: slide.question,
              quizType: "ORDERING",
              items: slide.items,
              correctOrder: slide.correctOrder,
              timeLimit: slide.timeLimit,
            });
          }
        }
      }

      if (quizzesData.length === 0) return;

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
    toast.success("Room code copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  // WebSocket handlers
  const handleRoomState = useCallback(
    (state: { currentSlide: number; participants: ParticipantInfo[] }) => {
      setCurrentSlide(state.currentSlide);
      setParticipants(state.participants);
    },
    [],
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
      toast.success(`${name} joined!`);
      setParticipants((prev) => {
        const existing = prev.find((p) => p.id === id);
        if (existing) {
          return prev.map((p) =>
            p.id === id ? { ...p, isActive: true, score } : p,
          );
        }
        return [...prev, { id, name, score, isActive: true }];
      });
    },
    [],
  );

  const handleParticipantLeave = useCallback((id: string, count: number) => {
    setParticipants((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isActive: false } : p)),
    );
  }, []);

  const handleAnswerCountUpdate = useCallback(
    (quizId: string, count: number, total: number) => {
      if (quizId === activeQuizId) {
        setAnswerCount({ count, total });
      }
    },
    [activeQuizId],
  );

  const handleQuizResult = useCallback(
    (quizId: string, correct: number | number[], stats: QuizStats, quizType?: string) => {
      setQuizResult({ correct, stats, quizType });
      setActiveQuizId(null);
      setQuizzes((prev) =>
        prev.map((q) => (q.id === quizId ? { ...q, status: "COMPLETED" } : q)),
      );
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
    [startQuiz, participants],
  );

  const handleEndQuiz = useCallback(
    (quizId: string) => {
      endQuiz(quizId);
    },
    [endQuiz],
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
      <Toaster position="top-right" theme="light" />

      {/* Room Code Banner - Minimal styling */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-card/90 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-3 md:px-6 py-2 flex items-center justify-between gap-3">
          <div className="text-sm text-muted-foreground truncate">
            {slideDeckData.title}
          </div>
          <button
            onClick={copyRoomCode}
            className="flex items-center gap-2 bg-accent hover:bg-accent/80 border border-border rounded-lg px-3 py-1.5 transition-colors shrink-0"
          >
            <span className="text-sm text-muted-foreground hidden sm:inline">
              Room:
            </span>
            <span className="font-mono font-semibold text-sm text-primary">
              {roomId}
            </span>
            {copied ? (
              <Check className="w-4 h-4 text-primary" />
            ) : (
              <Copy className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
        </div>
      </div>

      {/* Main slide area */}
      <div className="h-[calc(100vh-110px)] md:h-[calc(100vh-140px)] pt-12 overflow-hidden">
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

      {/* Host notes */}
      {slidePreset && (
        <HostNotes
          notes={getHostNotes(slidePreset, currentSlide)}
          slideTitle={slideDeckData.slides[currentSlide]?.title}
        />
      )}

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
