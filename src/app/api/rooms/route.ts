import type { Prisma } from "@prisma/client";
import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

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

    const room = await prisma.room.create({
      data: {
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
