import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Verify host secret
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;
  
  try {
    const body = await request.json();
    const { hostSecret } = body;

    const room = await prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      return NextResponse.json(
        { error: "Room not found" },
        { status: 404 }
      );
    }

    const isValid = room.hostSecret === hostSecret;

    return NextResponse.json({ valid: isValid });
  } catch (error) {
    console.error("Error verifying host:", error);
    return NextResponse.json(
      { error: "Failed to verify host" },
      { status: 500 }
    );
  }
}

