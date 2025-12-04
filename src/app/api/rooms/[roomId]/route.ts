import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Get room details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;
  
  try {
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        participants: {
          where: { isActive: true },
          orderBy: { score: "desc" },
        },
        quizzes: {
          orderBy: { slideId: "asc" },
        },
      },
    });

    if (!room) {
      return NextResponse.json(
        { error: "Room not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: room.id,
      status: room.status,
      currentSlide: room.currentSlide,
      createdAt: room.createdAt,
      slidePreset: room.slidePreset,
      customSlides: room.customSlides,
      participants: room.participants.map((p: { id: string; name: string; score: number }) => ({
        id: p.id,
        name: p.name,
        score: p.score,
      })),
      quizzes: room.quizzes.map((q: { id: string; slideId: number; question: string; options: string[]; status: string; timeLimit: number }) => ({
        id: q.id,
        slideId: q.slideId,
        question: q.question,
        options: q.options,
        status: q.status,
        timeLimit: q.timeLimit,
      })),
    });
  } catch (error) {
    console.error("Error fetching room:", error);
    return NextResponse.json(
      { error: "Failed to fetch room" },
      { status: 500 }
    );
  }
}

// Update room (host only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;
  
  try {
    const body = await request.json();
    const { hostSecret, currentSlide, status } = body;

    // Verify host secret
    const room = await prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room || room.hostSecret !== hostSecret) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const updatedRoom = await prisma.room.update({
      where: { id: roomId },
      data: {
        ...(currentSlide !== undefined && { currentSlide }),
        ...(status && { status }),
      },
    });

    return NextResponse.json({
      id: updatedRoom.id,
      status: updatedRoom.status,
      currentSlide: updatedRoom.currentSlide,
    });
  } catch (error) {
    console.error("Error updating room:", error);
    return NextResponse.json(
      { error: "Failed to update room" },
      { status: 500 }
    );
  }
}

// Delete room (host only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;
  
  try {
    const { searchParams } = new URL(request.url);
    const hostSecret = searchParams.get("hostSecret");

    const room = await prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room || room.hostSecret !== hostSecret) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await prisma.room.delete({
      where: { id: roomId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting room:", error);
    return NextResponse.json(
      { error: "Failed to delete room" },
      { status: 500 }
    );
  }
}

