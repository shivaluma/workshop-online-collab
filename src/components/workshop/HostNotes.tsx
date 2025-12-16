"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown, BookOpen, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface HostNotesProps {
  notes?: string;
  slideTitle?: string;
}

export function HostNotes({ notes, slideTitle }: HostNotesProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  if (!notes) return null;

  // Parse notes - support bullet points with "-" or "*"
  const parseNotes = (text: string) => {
    return text.split("\n").filter((line) => line.trim());
  };

  const noteLines = parseNotes(notes);

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-28 md:bottom-36 right-4 z-40 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full p-3 shadow-lg transition-all hover:scale-105"
        title="Open notes"
      >
        <BookOpen className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div
      className={cn(
        "fixed right-4 z-40 transition-all duration-300 ease-out",
        isExpanded
          ? "bottom-28 md:bottom-36 w-[calc(100%-2rem)] sm:w-96 max-h-[50vh]"
          : "bottom-28 md:bottom-36 w-80 sm:w-96"
      )}
    >
      <div className="bg-card/95 backdrop-blur-sm border border-primary/20 rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-2.5 bg-accent/50 border-b border-border cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">
              Host Notes
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMinimized(true);
              }}
              className="p-1 hover:bg-muted rounded transition-colors"
              title="Minimize"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Content */}
        <div
          className={cn(
            "transition-all duration-300 overflow-hidden",
            isExpanded ? "max-h-[40vh]" : "max-h-32"
          )}
        >
          <ScrollArea className={isExpanded ? "h-[40vh]" : "h-32"}>
            <div className="p-4 space-y-2">
              {slideTitle && (
                <div className="text-xs text-muted-foreground mb-3 pb-2 border-b border-border">
                  📍 {slideTitle}
                </div>
              )}
              {noteLines.map((line, idx) => {
                const isBullet = line.trim().startsWith("-") || line.trim().startsWith("*");
                const isHighlight = line.includes("**") || line.includes("💡") || line.includes("⚠️");
                const isQuestion = line.includes("?");
                
                let content = line.trim();
                if (isBullet) {
                  content = content.substring(1).trim();
                }
                
                // Simple bold parsing
                content = content.replace(/\*\*(.*?)\*\*/g, "→ $1");

                return (
                  <div
                    key={idx}
                    className={cn(
                      "text-sm leading-relaxed",
                      isBullet && "flex items-start gap-2",
                      isHighlight && "text-primary font-medium",
                      isQuestion && "text-muted-foreground italic",
                      !isBullet && !isHighlight && !isQuestion && "text-foreground/80"
                    )}
                  >
                    {isBullet && (
                      <span className="text-primary mt-0.5 shrink-0">•</span>
                    )}
                    <span>{content}</span>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Expand hint */}
        {!isExpanded && noteLines.length > 3 && (
          <div className="px-4 py-1.5 bg-muted/50 border-t border-border">
            <span className="text-xs text-muted-foreground">
              Click to expand ({noteLines.length} lines)
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
