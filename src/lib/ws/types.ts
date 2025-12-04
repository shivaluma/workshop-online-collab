// WebSocket Message Types

export type WSMessage =
  | { type: "participant_joined"; id: string; name: string; score: number; participantCount: number }
  | { type: "participant_left"; id: string; name: string; participantCount: number }
  | { type: "slide_changed"; index: number }
  | { type: "quiz_started"; quizId: string; question: string; options: string[]; timeout: number }
  | { type: "answer_submitted"; participantId: string; quizId: string }
  | { type: "answer_count_updated"; quizId: string; count: number; total: number }
  | { type: "quiz_ended"; quizId: string }
  | { type: "quiz_result"; quizId: string; correct: number; stats: QuizStats }
  | { type: "scoreboard_updated"; scores: ScoreEntry[] }
  | { type: "room_state"; currentSlide: number; status: string; participants: ParticipantInfo[] }
  | { type: "error"; message: string }
  | { type: "pong" };

export type WSClientMessage =
  | { type: "join_room"; roomId: string; participantId?: string; name?: string; isHost?: boolean; hostSecret?: string }
  | { type: "change_slide"; index: number }
  | { type: "start_quiz"; quizId: string }
  | { type: "end_quiz"; quizId: string }
  | { type: "submit_answer"; quizId: string; answer: number; timeTaken: number }
  | { type: "reveal_scoreboard" }
  | { type: "ping" };

export interface ScoreEntry {
  id: string;
  name: string;
  score: number;
  rank: number;
  previousRank?: number;
  isNew?: boolean;
}

export interface QuizStats {
  totalAnswers: number;
  correctCount: number;
  optionCounts: number[];
  averageTime: number;
  fastestTime: number;
  fastestParticipant?: string;
}

export interface ParticipantInfo {
  id: string;
  name: string;
  score: number;
  isActive: boolean;
}

