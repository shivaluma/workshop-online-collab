// WebSocket Server for Workshop Platform
// Run with: node src/server/ws-server.js

const { WebSocketServer, WebSocket } = require("ws");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const PORT = process.env.WS_PORT || 3001;

// Room connections: Map<roomId, Map<clientId, { ws, isHost, participantId }>>
const rooms = new Map();

// Heartbeat interval
const HEARTBEAT_INTERVAL = 30000;

const wss = new WebSocketServer({ port: PORT });

console.log(`WebSocket server running on port ${PORT}`);

// Broadcast to all clients in a room
function broadcast(roomId, message, excludeClientId = null) {
  const roomClients = rooms.get(roomId);
  if (!roomClients) return;

  const messageStr = JSON.stringify(message);
  roomClients.forEach((client, clientId) => {
    if (clientId !== excludeClientId && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(messageStr);
    }
  });
}

// Send to specific client
function sendTo(ws, message) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

// Handle join room
async function handleJoinRoom(ws, clientId, data) {
  const { roomId, participantId, name, isHost, hostSecret } = data;

  try {
    // Verify room exists
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: { participants: { where: { isActive: true } } },
    });

    if (!room) {
      sendTo(ws, { type: "error", message: "Room not found" });
      return;
    }

    // Verify host secret if joining as host
    if (isHost && room.hostSecret !== hostSecret) {
      sendTo(ws, { type: "error", message: "Invalid host credentials" });
      return;
    }

    // Create room in memory if not exists
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Map());
    }

    const roomClients = rooms.get(roomId);

    // For participants, verify or create
    let participant = null;
    let isNewJoin = false;
    
    if (!isHost && participantId) {
      participant = await prisma.participant.findUnique({
        where: { id: participantId },
      });
      
      if (participant) {
        // Check if was inactive (rejoining)
        isNewJoin = !participant.isActive;
        // Mark as active
        await prisma.participant.update({
          where: { id: participantId },
          data: { isActive: true },
        });
      }
    } else if (!isHost && name) {
      // Try to find existing participant with same name
      participant = await prisma.participant.findUnique({
        where: { roomId_name: { roomId, name } },
      });

      if (!participant) {
        participant = await prisma.participant.create({
          data: { roomId, name, score: 0, isActive: true },
        });
        isNewJoin = true;
      } else {
        // Check if was inactive (rejoining)
        isNewJoin = !participant.isActive;
        // Reactivate
        await prisma.participant.update({
          where: { id: participant.id },
          data: { isActive: true },
        });
      }
    }
    
    // Broadcast participant joined (for new joins or reconnects)
    if (!isHost && participant && isNewJoin) {
      // Get fresh count
      const activeCount = await prisma.participant.count({
        where: { roomId, isActive: true },
      });
      
      broadcast(roomId, {
        type: "participant_joined",
        id: participant.id,
        name: participant.name,
        score: participant.score,
        participantCount: activeCount,
      });
    }

    // Store connection
    roomClients.set(clientId, {
      ws,
      isHost,
      participantId: participant?.id,
      roomId,
    });

    // Send current room state
    const participants = await prisma.participant.findMany({
      where: { roomId, isActive: true },
      orderBy: { score: "desc" },
    });

    sendTo(ws, {
      type: "room_state",
      currentSlide: room.currentSlide,
      status: room.status,
      participants: participants.map((p) => ({
        id: p.id,
        name: p.name,
        score: p.score,
        isActive: p.isActive,
      })),
      participantId: participant?.id,
    });

    console.log(`Client ${clientId} joined room ${roomId} as ${isHost ? "host" : participant?.name}`);
  } catch (error) {
    console.error("Error joining room:", error);
    sendTo(ws, { type: "error", message: "Failed to join room" });
  }
}

// Handle slide change
async function handleSlideChange(ws, clientId, data) {
  const client = findClientRoom(clientId);
  if (!client || !client.isHost) return;

  const { index } = data;
  const { roomId } = client;

  try {
    await prisma.room.update({
      where: { id: roomId },
      data: { currentSlide: index },
    });

    broadcast(roomId, { type: "slide_changed", index });
    console.log(`Room ${roomId}: Slide changed to ${index}`);
  } catch (error) {
    console.error("Error changing slide:", error);
  }
}

// Handle start quiz
async function handleStartQuiz(ws, clientId, data) {
  const client = findClientRoom(clientId);
  if (!client || !client.isHost) return;

  const { quizId } = data;
  const { roomId } = client;

  try {
    const quiz = await prisma.quiz.update({
      where: { id: quizId },
      data: { status: "ACTIVE", startedAt: new Date() },
    });

    await prisma.room.update({
      where: { id: roomId },
      data: { status: "QUIZ_ACTIVE" },
    });

    broadcast(roomId, {
      type: "quiz_started",
      quizId: quiz.id,
      question: quiz.question,
      options: quiz.options,
      timeout: quiz.timeLimit,
    });

    console.log(`Room ${roomId}: Quiz ${quizId} started`);
  } catch (error) {
    console.error("Error starting quiz:", error);
  }
}

// Handle submit answer
async function handleSubmitAnswer(ws, clientId, data) {
  const client = findClientRoom(clientId);
  if (!client || client.isHost || !client.participantId) return;

  const { quizId, answer, timeTaken } = data;
  const { roomId, participantId } = client;

  try {
    const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
    if (!quiz || quiz.status !== "ACTIVE") {
      sendTo(ws, { type: "error", message: "Quiz not active" });
      return;
    }

    // Check if already answered
    const existingAnswer = await prisma.answer.findUnique({
      where: { participantId_quizId: { participantId, quizId } },
    });

    if (existingAnswer) {
      sendTo(ws, { type: "error", message: "Already answered" });
      return;
    }

    const isCorrect = answer === quiz.correctOption;
    
    // Calculate points: 1000 max, decreases linearly to 0 over time
    // Score = (timeRemaining / totalTime) * 1000
    let points = 0;
    if (isCorrect) {
      const timeRemaining = Math.max(0, quiz.timeLimit * 1000 - timeTaken);
      points = Math.round((timeRemaining / (quiz.timeLimit * 1000)) * 1000);
      // Minimum 100 points for correct answer even if time almost ran out
      points = Math.max(100, points);
    }

    // Save answer
    await prisma.answer.create({
      data: {
        participantId,
        quizId,
        answer,
        isCorrect,
        timeTaken,
        points,
      },
    });

    // Update participant score
    if (isCorrect) {
      await prisma.participant.update({
        where: { id: participantId },
        data: { score: { increment: points } },
      });
    }

    // Broadcast answer count
    const answerCount = await prisma.answer.count({ where: { quizId } });
    const totalParticipants = await prisma.participant.count({
      where: { roomId, isActive: true },
    });

    broadcast(roomId, {
      type: "answer_count_updated",
      quizId,
      count: answerCount,
      total: totalParticipants,
    });

    // Confirm to participant
    sendTo(ws, { type: "answer_submitted", participantId, quizId });

    console.log(`Room ${roomId}: Participant ${participantId} answered quiz ${quizId}`);
  } catch (error) {
    console.error("Error submitting answer:", error);
    sendTo(ws, { type: "error", message: "Failed to submit answer" });
  }
}

// Handle end quiz
async function handleEndQuiz(ws, clientId, data) {
  const client = findClientRoom(clientId);
  if (!client || !client.isHost) return;

  const { quizId } = data;
  const { roomId } = client;

  try {
    const quiz = await prisma.quiz.update({
      where: { id: quizId },
      data: { status: "COMPLETED", endedAt: new Date() },
    });

    await prisma.room.update({
      where: { id: roomId },
      data: { status: "ACTIVE" },
    });

    // Calculate stats
    const answers = await prisma.answer.findMany({
      where: { quizId },
      include: { participant: true },
    });

    const optionCounts = quiz.options.map((_, i) => 
      answers.filter(a => a.answer === i).length
    );

    const correctAnswers = answers.filter(a => a.isCorrect);
    const times = answers.map(a => a.timeTaken);
    const fastestAnswer = correctAnswers.length > 0 
      ? correctAnswers.reduce((min, a) => a.timeTaken < min.timeTaken ? a : min)
      : null;

    const stats = {
      totalAnswers: answers.length,
      correctCount: correctAnswers.length,
      optionCounts,
      averageTime: times.length > 0 ? Math.floor(times.reduce((a, b) => a + b, 0) / times.length) : 0,
      fastestTime: fastestAnswer?.timeTaken || 0,
      fastestParticipant: fastestAnswer?.participant.name,
    };

    broadcast(roomId, {
      type: "quiz_ended",
      quizId,
    });

    // Small delay before showing results
    setTimeout(() => {
      broadcast(roomId, {
        type: "quiz_result",
        quizId,
        correct: quiz.correctOption,
        stats,
      });
    }, 500);

    console.log(`Room ${roomId}: Quiz ${quizId} ended`);
  } catch (error) {
    console.error("Error ending quiz:", error);
  }
}

// Handle reveal scoreboard
async function handleRevealScoreboard(ws, clientId) {
  const client = findClientRoom(clientId);
  if (!client || !client.isHost) return;

  const { roomId } = client;

  try {
    const participants = await prisma.participant.findMany({
      where: { roomId, isActive: true },
      orderBy: { score: "desc" },
    });

    const scores = participants.map((p, index) => ({
      id: p.id,
      name: p.name,
      score: p.score,
      rank: index + 1,
    }));

    broadcast(roomId, { type: "scoreboard_updated", scores });
    console.log(`Room ${roomId}: Scoreboard revealed`);
  } catch (error) {
    console.error("Error revealing scoreboard:", error);
  }
}

// Find client's room
function findClientRoom(clientId) {
  for (const [roomId, clients] of rooms) {
    const client = clients.get(clientId);
    if (client) {
      return { ...client, roomId };
    }
  }
  return null;
}

// Handle client disconnect
function handleDisconnect(clientId) {
  for (const [roomId, clients] of rooms) {
    const client = clients.get(clientId);
    if (client) {
      clients.delete(clientId);
      
      if (client.participantId) {
        // Mark participant as inactive
        prisma.participant.update({
          where: { id: client.participantId },
          data: { isActive: false },
        }).then(() => {
          // Broadcast leave
          prisma.participant.count({
            where: { roomId, isActive: true },
          }).then(count => {
            broadcast(roomId, {
              type: "participant_left",
              id: client.participantId,
              participantCount: count,
            });
          });
        }).catch(console.error);
      }
      
      console.log(`Client ${clientId} disconnected from room ${roomId}`);
      
      // Clean up empty rooms
      if (clients.size === 0) {
        rooms.delete(roomId);
        console.log(`Room ${roomId} cleaned up`);
      }
      break;
    }
  }
}

// WebSocket connection handler
wss.on("connection", (ws) => {
  const clientId = Math.random().toString(36).substring(2, 15);
  console.log(`New connection: ${clientId}`);

  // Setup heartbeat
  ws.isAlive = true;
  ws.on("pong", () => {
    ws.isAlive = true;
  });

  ws.on("message", async (message) => {
    try {
      const data = JSON.parse(message.toString());
      
      switch (data.type) {
        case "join_room":
          await handleJoinRoom(ws, clientId, data);
          break;
        case "change_slide":
          await handleSlideChange(ws, clientId, data);
          break;
        case "start_quiz":
          await handleStartQuiz(ws, clientId, data);
          break;
        case "submit_answer":
          await handleSubmitAnswer(ws, clientId, data);
          break;
        case "end_quiz":
          await handleEndQuiz(ws, clientId, data);
          break;
        case "reveal_scoreboard":
          await handleRevealScoreboard(ws, clientId);
          break;
        case "ping":
          sendTo(ws, { type: "pong" });
          break;
        default:
          console.log(`Unknown message type: ${data.type}`);
      }
    } catch (error) {
      console.error("Error processing message:", error);
    }
  });

  ws.on("close", () => {
    handleDisconnect(clientId);
  });

  ws.on("error", (error) => {
    console.error(`WebSocket error for ${clientId}:`, error);
  });
});

// Heartbeat check
setInterval(() => {
  wss.clients.forEach((ws) => {
    if (!ws.isAlive) {
      return ws.terminate();
    }
    ws.isAlive = false;
    ws.ping();
  });
}, HEARTBEAT_INTERVAL);

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("Shutting down WebSocket server...");
  wss.close();
  await prisma.$disconnect();
  process.exit(0);
});

