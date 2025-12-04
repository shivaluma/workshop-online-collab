import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Create a quiz for the room
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;
  
  try {
    const body = await request.json();
    const { hostSecret, slideId, question, options, correctOption, timeLimit } = body;

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

    // Validate quiz data
    if (!question || !Array.isArray(options) || options.length < 2) {
      return NextResponse.json(
        { error: "Invalid quiz data" },
        { status: 400 }
      );
    }

    if (correctOption < 0 || correctOption >= options.length) {
      return NextResponse.json(
        { error: "Invalid correct option" },
        { status: 400 }
      );
    }

    const quiz = await prisma.quiz.create({
      data: {
        roomId,
        slideId,
        question,
        options,
        correctOption,
        timeLimit: timeLimit || 20,
      },
    });

    return NextResponse.json({
      id: quiz.id,
      slideId: quiz.slideId,
      question: quiz.question,
      options: quiz.options,
      status: quiz.status,
      timeLimit: quiz.timeLimit,
    });
  } catch (error) {
    console.error("Error creating quiz:", error);
    return NextResponse.json(
      { error: "Failed to create quiz" },
      { status: 500 }
    );
  }
}

// Get all quizzes for the room
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;
  
  try {
    const quizzes = await prisma.quiz.findMany({
      where: { roomId },
      orderBy: { slideId: "asc" },
      include: {
        _count: {
          select: { answers: true },
        },
      },
    });

    return NextResponse.json(
      quizzes.map((q) => ({
        id: q.id,
        slideId: q.slideId,
        question: q.question,
        options: q.options,
        status: q.status,
        timeLimit: q.timeLimit,
        answerCount: q._count.answers,
      }))
    );
  } catch (error) {
    console.error("Error fetching quizzes:", error);
    return NextResponse.json(
      { error: "Failed to fetch quizzes" },
      { status: 500 }
    );
  }
}

