"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast, Toaster } from "sonner";
import {
  Users,
  Presentation,
  Upload,
  FileJson,
  Sparkles,
  ArrowRight,
  Check,
  X,
  Database,
  Server,
} from "lucide-react";
import { getPresetList } from "@/lib/slides";

// Icon mapping for presets
const PRESET_ICONS: Record<string, React.ReactNode> = {
  "db-workshop": <Database className="w-5 h-5 text-emerald-400" />,
  "system-design-101": <Server className="w-5 h-5 text-blue-400" />,
};

export default function HomePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [presets, setPresets] = useState<
    { id: string; title: string; author: string; slideCount: number; quizCount: number }[]
  >([]);
  const [isCreating, setIsCreating] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  // Slide selection
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    data: unknown;
    slideCount: number;
    quizCount: number;
  } | null>(null);

  // Load presets on mount
  useEffect(() => {
    setPresets(getPresetList());
  }, []);

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".json")) {
      toast.error("Chỉ chấp nhận file JSON");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);

        // Validate structure
        if (!data.slides || !Array.isArray(data.slides)) {
          toast.error("File JSON không hợp lệ: thiếu 'slides' array");
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
        toast.success(`Đã load ${slideCount} slides, ${quizCount} quizzes`);
      } catch {
        toast.error("File JSON không hợp lệ");
      }
    };
    reader.readAsText(file);
  };

  // Create room
  const handleCreateRoom = async () => {
    if (!selectedPreset && !uploadedFile) {
      toast.error("Vui lòng chọn bài giảng hoặc upload file");
      return;
    }

    setIsCreating(true);
    try {
      // Send slidePreset or customSlides to server
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

      // Store host secret locally
      localStorage.setItem(`host_secret_${room.id}`, room.hostSecret);

      toast.success("Đã tạo phòng!");
      router.push(`/host/${room.id}`);
    } catch {
      toast.error("Không thể tạo phòng");
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
      toast.error("Không tìm thấy phòng");
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
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <Toaster position="top-center" theme="dark" />

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-2xl font-bold">
            <Sparkles className="w-7 h-7 text-violet-400" />
            <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              Workshop
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Interactive Quiz Platform
          </p>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="join" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-12 bg-zinc-900">
            <TabsTrigger
              value="join"
              className="data-[state=active]:bg-violet-600"
            >
              <Users className="w-4 h-4 mr-2" />
              Tham gia
            </TabsTrigger>
            <TabsTrigger
              value="host"
              className="data-[state=active]:bg-violet-600"
            >
              <Presentation className="w-4 h-4 mr-2" />
              Tạo phòng
            </TabsTrigger>
          </TabsList>

          {/* Join Tab */}
          <TabsContent value="join" className="mt-4">
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Tham gia Workshop</CardTitle>
                <CardDescription>Nhập mã phòng từ host</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleJoinRoom} className="space-y-4">
                  <Input
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    placeholder="Mã phòng"
                    className="h-12 text-center text-lg tracking-widest uppercase bg-zinc-800 border-zinc-700"
                    disabled={isJoining}
                  />
                  <Button
                    type="submit"
                    disabled={!joinCode.trim() || isJoining}
                    className="w-full h-12 bg-violet-600 hover:bg-violet-700"
                  >
                    {isJoining ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Đang vào...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Vào phòng
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Host Tab */}
          <TabsContent value="host" className="mt-4">
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Tạo Workshop</CardTitle>
                <CardDescription>
                  Chọn bài giảng có sẵn hoặc upload file JSON
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Presets */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Bài giảng có sẵn
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {presets.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setSelectedPreset(preset.id);
                          setUploadedFile(null);
                        }}
                        className={`w-full p-3 rounded-lg border text-left transition-all relative ${
                          selectedPreset === preset.id
                            ? "border-violet-500 bg-violet-500/10"
                            : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-600"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="shrink-0">
                            {PRESET_ICONS[preset.id] || (
                              <Sparkles className="w-5 h-5 text-violet-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">
                              {preset.title}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {preset.author}
                            </div>
                          </div>
                          <div className="text-right text-xs text-muted-foreground shrink-0">
                            <div>{preset.slideCount} slides</div>
                            <div>{preset.quizCount} quizzes</div>
                          </div>
                          {selectedPreset === preset.id && (
                            <Check className="w-5 h-5 text-violet-400 shrink-0" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-zinc-700" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-zinc-900 px-2 text-muted-foreground">
                      hoặc
                    </span>
                  </div>
                </div>

                {/* Upload */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Upload JSON
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />

                  {uploadedFile ? (
                    <div className="flex items-center gap-3 p-3 rounded-lg border border-emerald-500/50 bg-emerald-500/10">
                      <FileJson className="w-8 h-8 text-emerald-400" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {uploadedFile.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {uploadedFile.slideCount} slides,{" "}
                          {uploadedFile.quizCount} quizzes
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={clearUpload}
                        className="p-1 hover:bg-zinc-700 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full p-4 rounded-lg border-2 border-dashed border-zinc-700 hover:border-zinc-600 transition-colors"
                    >
                      <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                      <div className="text-sm text-muted-foreground">
                        Click để upload file .json
                      </div>
                    </button>
                  )}
                </div>

                {/* Create Button */}
                <Button
                  onClick={handleCreateRoom}
                  disabled={
                    (!selectedPreset && !uploadedFile) || isCreating
                  }
                  className="w-full h-12 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700"
                >
                  {isCreating ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Đang tạo...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Tạo phòng Workshop
                    </span>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
