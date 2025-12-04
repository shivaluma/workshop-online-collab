import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Submit an answer (backup HTTP endpoint, WebSocket is preferred)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { participantId, quizId, answer, timeTaken } = body;

    // Validate input
    if (!participantId || !quizId || answer === undefined || !timeTaken) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify participant and quiz
    const [participant, quiz] = await Promise.all([
      prisma.participant.findUnique({ where: { id: participantId } }),
      prisma.quiz.findUnique({ where: { id: quizId } }),
    ]);

    if (!participant) {
      return NextResponse.json(
        { error: "Participant not found" },
        { status: 404 }
      );
    }

    if (!quiz) {
      return NextResponse.json(
        { error: "Quiz not found" },
        { status: 404 }
      );
    }

    if (quiz.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Quiz is not active" },
        { status: 400 }
      );
    }

    // Check if already answered
    const existingAnswer = await prisma.answer.findUnique({
      where: {
        participantId_quizId: { participantId, quizId },
      },
    });

    if (existingAnswer) {
      return NextResponse.json(
        { error: "Already answered" },
        { status: 400 }
      );
    }

    const isCorrect = answer === quiz.correctOption;
    
    // Calculate points: 1000 max, decreases linearly to 100 min over time
    let points = 0;
    if (isCorrect) {
      const timeRemaining = Math.max(0, quiz.timeLimit * 1000 - timeTaken);
      points = Math.round((timeRemaining / (quiz.timeLimit * 1000)) * 1000);
      // Minimum 100 points for correct answer
      points = Math.max(100, points);
    }

    // Create answer and update score in transaction
    const result = await prisma.$transaction(async (tx) => {
      const createdAnswer = await tx.answer.create({
        data: {
          participantId,
          quizId,
          answer,
          isCorrect,
          timeTaken,
          points,
        },
      });

      if (isCorrect) {
        await tx.participant.update({
          where: { id: participantId },
          data: { score: { increment: points } },
        });
      }

      return createdAnswer;
    });

    return NextResponse.json({
      id: result.id,
      isCorrect: result.isCorrect,
      points: result.points,
    });
  } catch (error) {
    console.error("Error submitting answer:", error);
    return NextResponse.json(
      { error: "Failed to submit answer" },
      { status: 500 }
    );
  }
}

