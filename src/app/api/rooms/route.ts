import type { Prisma } from "@prisma/client";
import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Generate short room code (5 chars, uppercase alphanumeric, no confusing chars)
function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // No I, O, 0, 1 to avoid confusion
  let code = "";
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Create a new room
export async function POST(request: NextRequest) {
  try {
    let slidePreset: string | undefined;
    let customSlides: Prisma.InputJsonValue | undefined;

    // Try to parse body (may be empty for backward compatibility)
    try {
      const body = await request.json();
      if (body.slidePreset) {
        slidePreset = body.slidePreset;
      }
      if (body.customSlides) {
        customSlides = body.customSlides;
      }
    } catch {
      // Empty body, use defaults
    }

    // Generate unique short room code
    let roomCode: string;
    let attempts = 0;
    const maxAttempts = 10;
    
    do {
      roomCode = generateRoomCode();
      const existing = await prisma.room.findUnique({ where: { id: roomCode } });
      if (!existing) break;
      attempts++;
    } while (attempts < maxAttempts);

    if (attempts >= maxAttempts) {
      return NextResponse.json(
        { error: "Could not generate unique room code" },
        { status: 500 },
      );
    }

    const room = await prisma.room.create({
      data: {
        id: roomCode,
        ...(slidePreset && { slidePreset }),
        ...(customSlides && { customSlides }),
      },
    });

    return NextResponse.json({
      id: room.id,
      hostSecret: room.hostSecret,
      slidePreset: room.slidePreset,
      createdAt: room.createdAt,
    });
  } catch (error) {
    console.error("Error creating room:", error);
    return NextResponse.json(
      { error: "Failed to create room" },
      { status: 500 },
    );
  }
}

// List all rooms (for admin purposes)
export async function GET() {
  try {
    const rooms = await prisma.room.findMany({
      include: {
        _count: {
          select: { participants: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json(
      rooms.map(
        (room: {
          id: string;
          status: string;
          currentSlide: number;
          createdAt: Date;
          _count: { participants: number };
        }) => ({
          id: room.id,
          status: room.status,
          currentSlide: room.currentSlide,
          participantCount: room._count.participants,
          createdAt: room.createdAt,
        }),
      ),
    );
  } catch (error) {
    console.error("Error listing rooms:", error);
    return NextResponse.json(
      { error: "Failed to list rooms" },
      { status: 500 },
    );
  }
}
