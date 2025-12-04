export interface SlideBase {
  id: number;
  title: string;
  emoji?: string;
}

export interface TitleSlide extends SlideBase {
  type: "title";
  subtitle?: string;
  description?: string;
}

export interface ContentSlide extends SlideBase {
  type: "content";
  points?: (string | { term: string; description: string })[];
  content?: string; // Markdown content
  note?: string;
  code?: string;
  highlight?: string;
  columns?: {
    title: string;
    points: string[];
  }[];
}

export interface ArticleSlide extends SlideBase {
  type: "article";
  content: string; // Full markdown content with images
}

export interface VisualSlide extends SlideBase {
  type: "visual";
  visualType: "comparison" | "flow" | "tree";
  description?: string;
  left?: {
    title: string;
    code: string;
    description?: string;
    count?: string;
  };
  right?: {
    title: string;
    code: string;
    description?: string;
    count?: string;
  };
  steps?: {
    action: string;
    result: string;
  }[];
  example?: {
    search: string;
    steps: string[];
  };
  warning?: string;
}

export interface QuizSlide extends SlideBase {
  type: "quiz";
  quizId: string;
  question: string;
  options: string[];
  correctOption: number;
  timeLimit: number;
  explanation?: string;
}

export interface SummarySlide extends SlideBase {
  type: "summary";
  points: string[];
}

export interface LeaderboardSlide extends SlideBase {
  type: "leaderboard";
  description?: string;
}

export type Slide = TitleSlide | ContentSlide | ArticleSlide | VisualSlide | QuizSlide | SummarySlide | LeaderboardSlide;

export interface QuizData {
  slideId: number;
  question: string;
  options: string[];
  correctOption: number;
  timeLimit: number;
}

export interface SlideDeck {
  title: string;
  author: string;
  slides: Slide[];
  quizzes: QuizData[];
}

