"use client";

import { Sparkles, User } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface ParticipantNameModalProps {
  open: boolean;
  onSubmit: (name: string) => void;
  isLoading?: boolean;
  error?: string;
}

export function ParticipantNameModal({
  open,
  onSubmit,
  isLoading = false,
  error,
}: ParticipantNameModalProps) {
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim());
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md bg-zinc-900 border-zinc-800">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Sparkles className="w-6 h-6 text-violet-400" />
              Join Workshop
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Enter your name to join the workshop. This will be displayed on
              the leaderboard.
            </DialogDescription>
          </DialogHeader>

          <div className="py-6">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="pl-10 h-12 text-lg bg-zinc-800 border-zinc-700 focus:border-violet-500"
                maxLength={30}
                autoFocus
                disabled={isLoading}
              />
            </div>
            {error && <p className="mt-2 text-sm text-rose-400">{error}</p>}
          </div>

          <DialogFooter>
            <Button
              type="submit"
              disabled={!name.trim() || isLoading}
              className="w-full h-12 text-lg bg-violet-600 hover:bg-violet-700"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Joining...
                </span>
              ) : (
                "Join Workshop"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
