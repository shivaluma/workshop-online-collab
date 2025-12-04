import dbWorkshopData from "@/slides/db-workshop.json";
import systemDesignData from "@/slides/system-design-101.json";
import type { QuizData, Slide, SlideDeck } from "./types";

// Available workshop presets
export const workshopPresets: Record<string, SlideDeck> = {
  "db-workshop": dbWorkshopData as SlideDeck,
  "system-design-101": systemDesignData as SlideDeck,
};

// Default export for backward compatibility
export const slideDeck: SlideDeck = dbWorkshopData as SlideDeck;

export function getPreset(id: string): SlideDeck | undefined {
  return workshopPresets[id];
}

export function getPresetList(): { id: string; title: string; author: string; slideCount: number; quizCount: number }[] {
  return Object.entries(workshopPresets).map(([id, deck]) => ({
    id,
    title: deck.title,
    author: deck.author,
    slideCount: deck.slides.length,
    quizCount: deck.quizzes.length,
  }));
}

export function getSlide(deck: SlideDeck, index: number): Slide | undefined {
  return deck.slides[index];
}

export function getTotalSlides(deck: SlideDeck): number {
  return deck.slides.length;
}

export function getQuizForSlide(deck: SlideDeck, slideId: number): QuizData | undefined {
  return deck.quizzes.find((q) => q.slideId === slideId);
}

export function getAllQuizzes(deck: SlideDeck): QuizData[] {
  return deck.quizzes;
}

export type { QuizData, Slide, SlideDeck } from "./types";
