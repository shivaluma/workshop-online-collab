"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { WSMessage, WSClientMessage, ScoreEntry, ParticipantInfo, QuizStats } from "./types";

interface UseWebSocketOptions {
  roomId: string;
  isHost?: boolean;
  hostSecret?: string;
  participantId?: string;
  name?: string;
  onSlideChange?: (index: number) => void;
  onQuizStart?: (quizId: string, question: string, options: string[], timeout: number) => void;
  onQuizEnd?: (quizId: string) => void;
  onQuizResult?: (quizId: string, correct: number, stats: QuizStats) => void;
  onScoreboardUpdate?: (scores: ScoreEntry[]) => void;
  onParticipantJoin?: (id: string, name: string, score: number, count: number) => void;
  onParticipantLeave?: (id: string, count: number) => void;
  onAnswerCountUpdate?: (quizId: string, count: number, total: number) => void;
  onRoomState?: (state: { currentSlide: number; status: string; participants: ParticipantInfo[]; participantId?: string }) => void;
  onError?: (message: string) => void;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  isReconnecting: boolean;
  changeSlide: (index: number) => void;
  startQuiz: (quizId: string) => void;
  endQuiz: (quizId: string) => void;
  submitAnswer: (quizId: string, answer: number, timeTaken: number) => void;
  revealScoreboard: () => void;
}

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001";
const RECONNECT_INTERVAL = 3000;
const MAX_RECONNECT_ATTEMPTS = 10;
const PING_INTERVAL = 25000;

export function useWebSocket(options: UseWebSocketOptions): UseWebSocketReturn {
  const {
    roomId,
    isHost = false,
    hostSecret,
    participantId,
    name,
    onSlideChange,
    onQuizStart,
    onQuizEnd,
    onQuizResult,
    onScoreboardUpdate,
    onParticipantJoin,
    onParticipantLeave,
    onAnswerCountUpdate,
    onRoomState,
    onError,
  } = options;

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);

  const send = useCallback((message: WSClientMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const message: WSMessage = JSON.parse(event.data);

      switch (message.type) {
        case "room_state":
          onRoomState?.(message);
          break;
        case "slide_changed":
          onSlideChange?.(message.index);
          break;
        case "quiz_started":
          onQuizStart?.(message.quizId, message.question, message.options, message.timeout);
          break;
        case "quiz_ended":
          onQuizEnd?.(message.quizId);
          break;
        case "quiz_result":
          onQuizResult?.(message.quizId, message.correct, message.stats);
          break;
        case "scoreboard_updated":
          onScoreboardUpdate?.(message.scores);
          break;
        case "participant_joined":
          onParticipantJoin?.(message.id, message.name, message.score, message.participantCount);
          break;
        case "participant_left":
          onParticipantLeave?.(message.id, message.participantCount);
          break;
        case "answer_count_updated":
          onAnswerCountUpdate?.(message.quizId, message.count, message.total);
          break;
        case "error":
          onError?.(message.message);
          break;
        case "pong":
          // Heartbeat received
          break;
      }
    } catch (error) {
      console.error("Error parsing WebSocket message:", error);
    }
  }, [onSlideChange, onQuizStart, onQuizEnd, onQuizResult, onScoreboardUpdate, onParticipantJoin, onParticipantLeave, onAnswerCountUpdate, onRoomState, onError]);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      wsRef.current = new WebSocket(WS_URL);

      wsRef.current.onopen = () => {
        console.log("WebSocket connected");
        setIsConnected(true);
        setIsReconnecting(false);
        reconnectAttempts.current = 0;

        // Join room
        send({
          type: "join_room",
          roomId,
          isHost,
          hostSecret,
          participantId,
          name,
        });

        // Start ping interval
        pingIntervalRef.current = setInterval(() => {
          send({ type: "ping" });
        }, PING_INTERVAL);
      };

      wsRef.current.onmessage = handleMessage;

      wsRef.current.onclose = () => {
        console.log("WebSocket disconnected");
        setIsConnected(false);
        
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
        }

        // Attempt reconnect
        if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
          setIsReconnecting(true);
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, RECONNECT_INTERVAL);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error("WebSocket error:", error);
      };
    } catch (error) {
      console.error("Error creating WebSocket:", error);
    }
  }, [roomId, isHost, hostSecret, participantId, name, send, handleMessage]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  const changeSlide = useCallback((index: number) => {
    send({ type: "change_slide", index });
  }, [send]);

  const startQuiz = useCallback((quizId: string) => {
    send({ type: "start_quiz", quizId });
  }, [send]);

  const endQuiz = useCallback((quizId: string) => {
    send({ type: "end_quiz", quizId });
  }, [send]);

  const submitAnswer = useCallback((quizId: string, answer: number, timeTaken: number) => {
    send({ type: "submit_answer", quizId, answer, timeTaken });
  }, [send]);

  const revealScoreboard = useCallback(() => {
    send({ type: "reveal_scoreboard" });
  }, [send]);

  return {
    isConnected,
    isReconnecting,
    changeSlide,
    startQuiz,
    endQuiz,
    submitAnswer,
    revealScoreboard,
  };
}

