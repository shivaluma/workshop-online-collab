import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Join room as participant
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;
  
  try {
    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== "string" || name.trim().length < 1) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const trimmedName = name.trim().slice(0, 30);

    // Check room exists
    const room = await prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      return NextResponse.json(
        { error: "Room not found" },
        { status: 404 }
      );
    }

    // Try to find existing participant or create new
    let participant = await prisma.participant.findUnique({
      where: {
        roomId_name: { roomId, name: trimmedName },
      },
    });

    if (participant) {
      // Reactivate existing participant
      participant = await prisma.participant.update({
        where: { id: participant.id },
        data: { isActive: true },
      });
    } else {
      // Create new participant
      participant = await prisma.participant.create({
        data: {
          roomId,
          name: trimmedName,
        },
      });
    }

    return NextResponse.json({
      id: participant.id,
      name: participant.name,
      score: participant.score,
    });
  } catch (error) {
    console.error("Error joining room:", error);
    return NextResponse.json(
      { error: "Failed to join room" },
      { status: 500 }
    );
  }
}

// Get all participants in room
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;
  
  try {
    const participants = await prisma.participant.findMany({
      where: { roomId, isActive: true },
      orderBy: { score: "desc" },
    });

    return NextResponse.json(
      participants.map((p) => ({
        id: p.id,
        name: p.name,
        score: p.score,
        joinedAt: p.joinedAt,
      }))
    );
  } catch (error) {
    console.error("Error fetching participants:", error);
    return NextResponse.json(
      { error: "Failed to fetch participants" },
      { status: 500 }
    );
  }
}

