import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Bulk create quizzes for the room (used when initializing from slides)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;
  
  try {
    const body = await request.json();
    const { hostSecret, quizzes } = body;

    // Verify host
    const room = await prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room || room.hostSecret !== hostSecret) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!Array.isArray(quizzes)) {
      return NextResponse.json(
        { error: "Quizzes must be an array" },
        { status: 400 }
      );
    }

    // Delete existing quizzes for this room
    await prisma.quiz.deleteMany({
      where: { roomId },
    });

    // Create new quizzes
    const createdQuizzes = await prisma.quiz.createMany({
      data: quizzes.map((quiz: {
        slideId: number;
        question: string;
        options: string[];
        correctOption: number;
        timeLimit?: number;
      }) => ({
        roomId,
        slideId: quiz.slideId,
        question: quiz.question,
        options: quiz.options,
        correctOption: quiz.correctOption,
        timeLimit: quiz.timeLimit || 20,
      })),
    });

    // Fetch the created quizzes with IDs
    const newQuizzes = await prisma.quiz.findMany({
      where: { roomId },
      orderBy: { slideId: "asc" },
    });

    return NextResponse.json(
      newQuizzes.map((q) => ({
        id: q.id,
        slideId: q.slideId,
        question: q.question,
        options: q.options,
        status: q.status,
        timeLimit: q.timeLimit,
      }))
    );
  } catch (error) {
    console.error("Error bulk creating quizzes:", error);
    return NextResponse.json(
      { error: "Failed to create quizzes" },
      { status: 500 }
    );
  }
}

