"use client";

import {
  ArrowRight,
  Check,
  Database,
  FileJson,
  Presentation,
  Server,
  Upload,
  Users,
  X,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { Toaster, toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getPresetList } from "@/lib/slides";

// Icon mapping for presets
const PRESET_ICONS: Record<string, React.ReactNode> = {
  "db-workshop": <Database className="w-5 h-5 text-primary" />,
  "system-design-101": <Server className="w-5 h-5 text-primary" />,
};

// Wrapper with Suspense for useSearchParams
export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      }
    >
      <HomePageContent />
    </Suspense>
  );
}

function HomePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [presets, setPresets] = useState<
    {
      id: string;
      title: string;
      author: string;
      slideCount: number;
      quizCount: number;
    }[]
  >([]);
  const [isCreating, setIsCreating] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  // Secret host mode - only show host tab if ?host=1 or unlocked via easter egg
  const [hostUnlocked, setHostUnlocked] = useState(false);
  const [logoClickCount, setLogoClickCount] = useState(0);

  // Slide selection
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    data: unknown;
    slideCount: number;
    quizCount: number;
  } | null>(null);

  // View mode
  const [activeView, setActiveView] = useState<"join" | "host">("join");

  // Check URL param for host mode
  useEffect(() => {
    if (searchParams.get("host") === "1") {
      setHostUnlocked(true);
    }
  }, [searchParams]);

  // Easter egg: click logo 5 times to unlock host mode
  const handleLogoClick = () => {
    const newCount = logoClickCount + 1;
    setLogoClickCount(newCount);
    if (newCount >= 5 && !hostUnlocked) {
      setHostUnlocked(true);
      toast.success("Host mode unlocked");
    }
  };

  // Load presets on mount
  useEffect(() => {
    setPresets(getPresetList());
  }, []);

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".json")) {
      toast.error("Only JSON files accepted");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);

        if (!data.slides || !Array.isArray(data.slides)) {
          toast.error("Invalid JSON: missing 'slides' array");
          return;
        }

        const slideCount = data.slides.length;
        const quizCount = data.quizzes?.length || 0;

        setUploadedFile({
          name: file.name,
          data,
          slideCount,
          quizCount,
        });
        setSelectedPreset(null);
        toast.success(`Loaded ${slideCount} slides, ${quizCount} quizzes`);
      } catch {
        toast.error("Invalid JSON file");
      }
    };
    reader.readAsText(file);
  };

  // Create room
  const handleCreateRoom = async () => {
    if (!selectedPreset && !uploadedFile) {
      toast.error("Please select a workshop or upload a file");
      return;
    }

    setIsCreating(true);
    try {
      const body: { slidePreset?: string; customSlides?: unknown } = {};
      if (selectedPreset) {
        body.slidePreset = selectedPreset;
      } else if (uploadedFile) {
        body.customSlides = uploadedFile.data;
      }

      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to create room");

      const room = await res.json();
      localStorage.setItem(`host_secret_${room.id}`, room.hostSecret);

      toast.success("Room created!");
      router.push(`/host/${room.id}`);
    } catch {
      toast.error("Could not create room");
    } finally {
      setIsCreating(false);
    }
  };

  // Join room
  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;

    setIsJoining(true);
    try {
      const res = await fetch(`/api/rooms/${joinCode.trim()}`);
      if (!res.ok) throw new Error("Room not found");

      router.push(`/room/${joinCode.trim()}`);
    } catch {
      toast.error("Room not found");
    } finally {
      setIsJoining(false);
    }
  };

  const clearUpload = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-center" theme="light" />

      {/* Editorial Hero Section */}
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <header className="px-6 md:px-12 py-6 flex items-center justify-between">
          <button
            type="button"
            onClick={handleLogoClick}
            className="cursor-default select-none"
          >
            <span className="editorial-subhead text-muted-foreground tracking-widest">
              Interactive Learning
            </span>
          </button>

          {hostUnlocked && (
            <nav className="flex gap-1">
              <button
                type="button"
                onClick={() => setActiveView("join")}
                className={`px-4 py-2 text-sm transition-colors ${
                  activeView === "join"
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Join
              </button>
              <button
                type="button"
                onClick={() => setActiveView("host")}
                className={`px-4 py-2 text-sm transition-colors ${
                  activeView === "host"
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Host
              </button>
            </nav>
          )}
        </header>

        {/* Main Content */}
        <main className="flex-1 flex items-center">
          <div className="w-full px-6 md:px-12 lg:px-24 py-12">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-center max-w-7xl mx-auto">
              {/* Left: Editorial Typography */}
              <div className="space-y-8 animate-fade-up">
                <div className="space-y-4">
                  <h1 className="editorial-display text-6xl md:text-7xl lg:text-8xl text-foreground">
                    Workshop
                  </h1>
                  <div className="section-rule-accent" />
                </div>

                <p className="text-lg md:text-xl text-muted-foreground max-w-md leading-relaxed">
                  Premium interactive learning experiences for developers.
                  Real-time quizzes, live leaderboards, and engaging content.
                </p>

                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Live Sessions
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Interactive Quizzes
                  </span>
                </div>
              </div>

              {/* Right: Join/Host Card */}
              <div className="animate-fade-up delay-200">
                {activeView === "join" || !hostUnlocked ? (
                  <JoinCard
                    joinCode={joinCode}
                    setJoinCode={setJoinCode}
                    isJoining={isJoining}
                    onSubmit={handleJoinRoom}
                  />
                ) : (
                  <HostCard
                    presets={presets}
                    selectedPreset={selectedPreset}
                    setSelectedPreset={setSelectedPreset}
                    uploadedFile={uploadedFile}
                    fileInputRef={fileInputRef}
                    handleFileUpload={handleFileUpload}
                    clearUpload={clearUpload}
                    isCreating={isCreating}
                    onCreateRoom={handleCreateRoom}
                  />
                )}
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="px-6 md:px-12 py-6 border-t border-border">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>© 2025</span>
            <span className="editorial-subhead tracking-widest">Built for developers</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// JOIN CARD COMPONENT
// ══════════════════════════════════════════════════════════════

interface JoinCardProps {
  joinCode: string;
  setJoinCode: (code: string) => void;
  isJoining: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

function JoinCard({ joinCode, setJoinCode, isJoining, onSubmit }: JoinCardProps) {
  return (
    <div className="card-minimal p-8 md:p-10 space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 text-primary" />
          <h2 className="text-2xl font-semibold">Join Workshop</h2>
        </div>
        <p className="text-muted-foreground">
          Enter the room code provided by your host
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="editorial-subhead text-muted-foreground">
            Room Code
          </label>
          <Input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder="ABC123"
            className="h-14 text-center text-2xl tracking-[0.3em] uppercase font-mono bg-cream border-border focus:border-primary"
            disabled={isJoining}
            maxLength={10}
          />
        </div>

        <Button
          type="submit"
          disabled={!joinCode.trim() || isJoining}
          className="w-full h-12 text-base"
        >
          {isJoining ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              Joining...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              Enter Room
              <ArrowRight className="w-4 h-4" />
            </span>
          )}
        </Button>
      </form>

      <div className="pt-4 border-t border-border">
        <p className="text-sm text-muted-foreground text-center">
          Don&apos;t have a code? Ask your workshop host.
        </p>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// HOST CARD COMPONENT
// ══════════════════════════════════════════════════════════════

interface HostCardProps {
  presets: {
    id: string;
    title: string;
    author: string;
    slideCount: number;
    quizCount: number;
  }[];
  selectedPreset: string | null;
  setSelectedPreset: (id: string | null) => void;
  uploadedFile: {
    name: string;
    data: unknown;
    slideCount: number;
    quizCount: number;
  } | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  clearUpload: () => void;
  isCreating: boolean;
  onCreateRoom: () => void;
}

function HostCard({
  presets,
  selectedPreset,
  setSelectedPreset,
  uploadedFile,
  fileInputRef,
  handleFileUpload,
  clearUpload,
  isCreating,
  onCreateRoom,
}: HostCardProps) {
  return (
    <div className="card-minimal p-8 md:p-10 space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Presentation className="w-5 h-5 text-primary" />
          <h2 className="text-2xl font-semibold">Create Workshop</h2>
        </div>
        <p className="text-muted-foreground">
          Select a preset or upload your own content
        </p>
      </div>

      {/* Presets */}
      <div className="space-y-3">
        <label className="editorial-subhead text-muted-foreground">
          Available Workshops
        </label>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {presets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => {
                setSelectedPreset(preset.id);
              }}
              className={`w-full p-4 rounded-lg border text-left transition-all ${
                selectedPreset === preset.id
                  ? "border-primary bg-accent"
                  : "border-border hover:border-primary/50 bg-background"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="shrink-0">
                  {PRESET_ICONS[preset.id] || (
                    <Database className="w-5 h-5 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{preset.title}</div>
                  <div className="text-sm text-muted-foreground truncate">
                    {preset.author}
                  </div>
                </div>
                <div className="text-right text-xs text-muted-foreground shrink-0">
                  <div>{preset.slideCount} slides</div>
                  <div>{preset.quizCount} quizzes</div>
                </div>
                {selectedPreset === preset.id && (
                  <Check className="w-5 h-5 text-primary shrink-0" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-card px-3 text-sm text-muted-foreground">or</span>
        </div>
      </div>

      {/* Upload */}
      <div className="space-y-3">
        <label className="editorial-subhead text-muted-foreground">
          Custom Content
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileUpload}
          className="hidden"
        />

        {uploadedFile ? (
          <div className="flex items-center gap-3 p-4 rounded-lg border border-primary bg-accent">
            <FileJson className="w-6 h-6 text-primary" />
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{uploadedFile.name}</div>
              <div className="text-sm text-muted-foreground">
                {uploadedFile.slideCount} slides, {uploadedFile.quizCount} quizzes
              </div>
            </div>
            <button
              type="button"
              onClick={clearUpload}
              className="p-1.5 hover:bg-background rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full p-6 rounded-lg border-2 border-dashed border-border hover:border-primary/50 transition-colors"
          >
            <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
            <div className="text-sm text-muted-foreground">
              Upload JSON file
            </div>
          </button>
        )}
      </div>

      {/* Create Button */}
      <Button
        onClick={onCreateRoom}
        disabled={(!selectedPreset && !uploadedFile) || isCreating}
        className="w-full h-12 text-base"
      >
        {isCreating ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            Creating...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            Create Room
            <ArrowRight className="w-4 h-4" />
          </span>
        )}
      </Button>
    </div>
  );
}
