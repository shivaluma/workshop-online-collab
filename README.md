# 🗄️ Database Mental Model Workshop

An interactive, real-time workshop platform for teaching "Database Mental Model for FE Devs" — like Kahoot, but self-hosted and customizable.

## ✨ Features

- **Real-time Slide Sync** — Host controls slides, participants see changes instantly
- **Interactive Quizzes** — Multiple choice with timers and scoring
- **Live Leaderboard** — Kahoot-style progressive reveal
- **100% Self-Hosted** — No cloud dependencies, runs entirely on Docker Compose
- **Modern Stack** — Next.js 16, TypeScript, TailwindCSS, WebSockets

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    DOCKER COMPOSE NETWORK                       │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  NEXTJS + WEBSOCKET CONTAINER                            │  │
│  │  • Next.js 16 App Router (Port 3000)                     │  │
│  │  • WebSocket Server (Port 3001)                          │  │
│  │  • Prisma ORM                                            │  │
│  └────────────────────────────┬─────────────────────────────┘  │
│                               │                                 │
│  ┌────────────────────────────┴─────────────────────────────┐  │
│  │  POSTGRESQL CONTAINER                                     │  │
│  │  • PostgreSQL 16 (Port 5432)                              │  │
│  │  • Persistent Volume                                      │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Option 1: Docker Compose (Recommended for Production)

```bash
# 1. Clone and setup environment
cp .env.example .env

# 2. Start all services
docker compose up -d

# 3. Open in browser
# Host: http://localhost:3000
```

### Option 2: Local Development

```bash
# 1. Install dependencies
pnpm install

# 2. Setup environment
cp .env.example .env

# 3. Start PostgreSQL (via Docker or local install)
docker compose up postgres -d

# 4. Setup database
pnpm db:generate
pnpm db:push

# 5. Start development servers (Next.js + WebSocket)
pnpm dev:all
```

## 📁 Project Structure

```
src/
├── app/
│   ├── api/                    # API Routes
│   │   ├── rooms/              # Room CRUD
│   │   ├── answers/            # Quiz answers
│   │   └── ...
│   ├── host/[roomId]/          # Host view
│   ├── room/[roomId]/          # Participant view
│   └── page.tsx                # Landing page
├── components/
│   ├── ui/                     # Shadcn components
│   └── workshop/               # Workshop components
│       ├── Slide.tsx
│       ├── SlideDeck.tsx
│       ├── HostControls.tsx
│       ├── Timer.tsx
│       ├── Scoreboard.tsx
│       └── slides/             # Slide type components
├── lib/
│   ├── db/                     # Prisma client
│   ├── ws/                     # WebSocket hooks
│   └── slides/                 # Slide utilities
├── server/
│   └── ws-server.js            # WebSocket server
└── slides/
    └── db-workshop.json        # Slide content
```

## 🎮 How It Works

### For Hosts

1. Go to `http://localhost:3000`
2. Click "Host Workshop" → "Create Workshop Room"
3. Share the room code with participants
4. Use arrow keys or buttons to navigate slides
5. Start/End quizzes on quiz slides
6. Reveal scoreboard on the final slide

### For Participants

1. Go to `http://localhost:3000`
2. Enter the room code shared by host
3. Enter your name to join
4. Answer quizzes when they appear
5. Check your score in the top-right corner

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://workshop:workshop123@localhost:5432/db_workshop` |
| `NEXT_PUBLIC_WS_URL` | WebSocket server URL | `ws://localhost:3001` |
| `WS_PORT` | WebSocket server port | `3001` |
| `POSTGRES_USER` | Database user | `workshop` |
| `POSTGRES_PASSWORD` | Database password | `workshop123` |
| `POSTGRES_DB` | Database name | `db_workshop` |

### Customizing Slides

Edit `src/slides/db-workshop.json` to customize:

- Slide content and order
- Quiz questions and answers
- Time limits
- Explanations

Slide types supported:
- `title` — Title slides
- `content` — Bullet points, code blocks
- `visual` — Comparisons, flows, trees
- `quiz` — Interactive quizzes
- `summary` — Recap slides
- `leaderboard` — Final scoreboard

## 📦 Docker Commands

```bash
# Start production
docker compose up -d

# Start with hot reload (development)
docker compose --profile dev up

# View logs
docker compose logs -f app

# Rebuild after changes
docker compose up -d --build

# Stop all services
docker compose down

# Stop and remove volumes
docker compose down -v
```

## 🛠️ Development Commands

```bash
# Install dependencies
pnpm install

# Start Next.js dev server
pnpm dev

# Start WebSocket server
pnpm dev:ws

# Start both (recommended)
pnpm dev:all

# Database commands
pnpm db:generate  # Generate Prisma client
pnpm db:push      # Push schema to database
pnpm db:migrate   # Run migrations
pnpm db:studio    # Open Prisma Studio

# Build for production
pnpm build
pnpm start
```

## 📡 WebSocket Events

### Server → Client

| Event | Description |
|-------|-------------|
| `room_state` | Initial room state on join |
| `slide_changed` | Slide index updated |
| `participant_joined` | New participant joined |
| `participant_left` | Participant disconnected |
| `quiz_started` | Quiz is now active |
| `quiz_ended` | Quiz timer ended |
| `quiz_result` | Quiz results with stats |
| `answer_count_updated` | Answer count changed |
| `scoreboard_updated` | Leaderboard data |
| `error` | Error message |

### Client → Server

| Event | Description |
|-------|-------------|
| `join_room` | Join a room |
| `change_slide` | Change current slide (host) |
| `start_quiz` | Start a quiz (host) |
| `end_quiz` | End a quiz early (host) |
| `submit_answer` | Submit quiz answer |
| `reveal_scoreboard` | Show leaderboard (host) |
| `ping` | Heartbeat |

## 🗄️ Database Schema

```prisma
model Room {
  id           String        @id
  currentSlide Int
  status       RoomStatus
  hostSecret   String        @unique
  participants Participant[]
  quizzes      Quiz[]
}

model Participant {
  id      String   @id
  roomId  String
  name    String
  score   Int
  answers Answer[]
}

model Quiz {
  id            String
  roomId        String
  slideId       Int
  question      String
  options       String[]
  correctOption Int
  timeLimit     Int
  status        QuizStatus
  answers       Answer[]
}

model Answer {
  id            String
  participantId String
  quizId        String
  answer        Int
  isCorrect     Boolean
  timeTaken     Int
  points        Int
}
```

## 🎨 Customization

### Theming

Edit `src/app/globals.css` to customize:
- Colors (using oklch)
- Border radius
- Animations

### Adding New Slide Types

1. Add type to `src/lib/slides/types.ts`
2. Create component in `src/components/workshop/slides/`
3. Add case in `src/components/workshop/Slide.tsx`

## 📜 License

MIT

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

Built with ❤️ using Next.js 16, TypeScript, TailwindCSS, WebSockets, and PostgreSQL
