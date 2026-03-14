<div align="center">

```
 ██████╗ ██████╗ ██████╗ ███████╗ ██████╗ ██████╗ ██╗     ██╗      █████╗ ██████╗ 
██╔════╝██╔═══██╗██╔══██╗██╔════╝██╔════╝██╔═══██╗██║     ██║     ██╔══██╗██╔══██╗
██║     ██║   ██║██║  ██║█████╗  ██║     ██║   ██║██║     ██║     ███████║██████╔╝
██║     ██║   ██║██║  ██║██╔══╝  ██║     ██║   ██║██║     ██║     ██╔══██║██╔══██╗
╚██████╗╚██████╔╝██████╔╝███████╗╚██████╗╚██████╔╝███████╗███████╗██║  ██║██████╔╝
 ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝ ╚═════╝ ╚═════╝ ╚══════╝╚══════╝╚═╝  ╚═╝╚═════╝ 
```

**A real-time collaborative coding platform for developers.**  
Write, run, and discuss code together — powered by AI.

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=flat-square&logo=mysql&logoColor=white)](https://mysql.com)
[![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?style=flat-square&logo=prisma&logoColor=white)](https://prisma.io)
[![Socket.io](https://img.shields.io/badge/Socket.io-4-010101?style=flat-square&logo=socket.io&logoColor=white)](https://socket.io)
[![License](https://img.shields.io/badge/License-MIT-6366f1?style=flat-square)](LICENSE)

[Features](#-features) · [Tech Stack](#-tech-stack) · [Getting Started](#-getting-started) · [Project Structure](#-project-structure) · [API Reference](#-api-reference) · [Environment Variables](#-environment-variables)

</div>

---

## ✨ Features

- **Real-time Collaborative Editing** — Multiple developers can write code simultaneously with live cursor sync powered by Socket.io
- **AI Pair Programmer** — Context-aware AI assistant (Groq / LLaMA 3) that reads your current code and responds with streaming output
- **Live Code Execution** — Run code in 8+ languages directly in the browser via Judge0 CE. Results broadcast to all room members
- **Monaco Editor** — The same editor that powers VS Code, with syntax highlighting, bracket matching, and font ligatures
- **Team Chat** — Real-time chat panel persisted to the database, visible to everyone in the room
- **Room System** — Create public or private rooms, join via invite code, manage multiple sessions
- **Online Presence** — See exactly who is in the room live with color-coded user indicators
- **Save & Download** — Save code to the database or download it directly to your computer with the correct file extension
- **JWT Auth** — Secure authentication with access tokens + refresh token rotation via HTTP-only cookies

---

## 🛠 Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 18 + Vite | UI framework and build tool |
| Monaco Editor | VS Code-grade code editor |
| Socket.io Client | Real-time bidirectional communication |
| Zustand | Lightweight global state management |
| React Router v6 | Client-side routing |
| TailwindCSS | Utility-first styling |
| Axios | HTTP client with interceptors |

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express | REST API server |
| Socket.io | WebSocket server for real-time sync |
| Prisma ORM v5 | Type-safe database access |
| MySQL 8 | Primary database |
| JSON Web Tokens | Stateless authentication |
| bcryptjs | Password hashing |
| Groq SDK | AI streaming completions |
| Axios | Judge0 API communication |

### External Services
| Service | Purpose | Cost |
|---|---|---|
| [Groq](https://console.groq.com) | LLaMA 3 inference (AI assistant) | Free tier |
| [Judge0 CE](https://ce.judge0.com) | Code execution engine | Free, no key required |

---

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:

- **Node.js** v18 or higher
- **MySQL** 8.0 or higher
- **Git**
- A free **Groq API key** from [console.groq.com](https://console.groq.com)

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/codecollab.git
cd codecollab
```

### 2. Set Up the Database

Open MySQL and create the database:

```sql
CREATE DATABASE codecollab;
EXIT;
```

### 3. Configure the Backend

```bash
cd server
npm install
```

Create your environment file:

```bash
cp .env.example .env
```

Edit `server/.env` with your values:

```env
DATABASE_URL="mysql://root:yourpassword@localhost:3306/codecollab"
JWT_SECRET=your_jwt_secret_here
REFRESH_SECRET=your_refresh_secret_here
GROQ_API_KEY=your_groq_api_key_here
CLIENT_URL=http://localhost:5173
PORT=4000
```

Run database migrations:

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 4. Configure the Frontend

```bash
cd ../client
npm install
```

Create your environment file:

```bash
cp .env.example .env
```

Edit `client/.env`:

```env
VITE_API_URL=http://localhost:4000/api
VITE_SOCKET_URL=http://localhost:4000
```

### 5. Run the Application

Open **two terminals**:

**Terminal 1 — Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd client
npm run dev
```

Visit **http://localhost:5173** and start coding!

---

## 📁 Project Structure

```
codecollab/
│
├── server/                         # Node.js backend
│   ├── prisma/
│   │   └── schema.prisma           # Database schema
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── auth.controller.js  # Register, login, logout, refresh
│   │   │   ├── room.controller.js  # Room CRUD, join, snapshots
│   │   │   ├── ai.controller.js    # Groq streaming endpoint
│   │   │   └── execution.controller.js  # Judge0 code runner
│   │   ├── middleware/
│   │   │   └── auth.middleware.js  # JWT verification
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── room.routes.js
│   │   │   ├── ai.routes.js
│   │   │   └── execution.routes.js
│   │   ├── services/
│   │   │   ├── ai.service.js       # Groq API integration
│   │   │   └── execution.service.js # Judge0 API integration
│   │   ├── socket/
│   │   │   └── index.js            # Socket.io event handlers
│   │   ├── utils/
│   │   │   └── prisma.js           # Prisma client singleton
│   │   └── index.js                # App entry point
│   ├── .env
│   └── package.json
│
└── client/                         # React frontend
    ├── src/
    │   ├── components/
    │   │   └── room/
    │   │       ├── ChatPanel.jsx   # Team chat + AI assistant
    │   │       ├── OutputPanel.jsx # Code execution output
    │   │       └── UsersPanel.jsx  # Online presence indicator
    │   ├── hooks/
    │   │   └── useRoom.js          # Room state + socket logic
    │   ├── pages/
    │   │   ├── LandingPage.jsx
    │   │   ├── LoginPage.jsx
    │   │   ├── RegisterPage.jsx
    │   │   ├── DashboardPage.jsx
    │   │   └── RoomPage.jsx        # Main editor view
    │   ├── socket/
    │   │   └── socket.js           # Socket.io client singleton
    │   ├── store/
    │   │   └── authStore.js        # Zustand auth state
    │   ├── utils/
    │   │   └── axios.js            # Axios instance + interceptors
    │   ├── App.jsx                 # Routes + auth guards
    │   └── main.jsx
    ├── .env
    └── package.json
```

---

## 🗄 Database Schema

```
User ─────────┬──── RoomMember ────── Room ──── Message
              │                         │
              └──── Message             └──── Snapshot
              │
              └──── Session
```

| Model | Description |
|---|---|
| `User` | Registered user with hashed password |
| `Room` | A coding session with language, code state, and invite code |
| `RoomMember` | Join table linking users to rooms with roles |
| `Message` | Chat messages (type: `text` or `ai`) |
| `Snapshot` | Point-in-time saves of room code |
| `Session` | Refresh token store for auth rotation |

---

## 📡 API Reference

### Auth

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/auth/register` | Create a new account | ❌ |
| `POST` | `/api/auth/login` | Sign in | ❌ |
| `POST` | `/api/auth/logout` | Sign out + clear cookie | ❌ |
| `POST` | `/api/auth/refresh` | Rotate refresh token | ❌ |
| `GET` | `/api/auth/me` | Get current user | ✅ |

### Rooms

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/rooms` | Create a room | ✅ |
| `GET` | `/api/rooms/my` | Get user's rooms | ✅ |
| `GET` | `/api/rooms/public` | Get public rooms | ✅ |
| `GET` | `/api/rooms/:id` | Get room by ID | ✅ |
| `GET` | `/api/rooms/:id/messages` | Get room chat history | ✅ |
| `POST` | `/api/rooms/join/:inviteCode` | Join a room | ✅ |
| `PATCH` | `/api/rooms/:id/code` | Save current code | ✅ |
| `POST` | `/api/rooms/:id/snapshot` | Create a code snapshot | ✅ |

### AI & Execution

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/ai/ask` | Stream AI response (SSE) | ✅ |
| `POST` | `/api/execute/run` | Execute code via Judge0 | ✅ |

### Health

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Server health check |

---

## 🔌 Socket Events

### Client → Server

| Event | Payload | Description |
|---|---|---|
| `room:join` | `{ roomId, username }` | Join a room channel |
| `chat:send` | `{ roomId, content, username }` | Send a chat message |
| `code:change` | `{ roomId, code }` | Broadcast code update |
| `language:change` | `{ roomId, language }` | Sync language change |
| `cursor:update` | `{ roomId, position, username }` | Share cursor position |
| `execution:result` | `{ roomId, result }` | Broadcast run output |

### Server → Client

| Event | Payload | Description |
|---|---|---|
| `user:joined` | `{ userId, username }` | Someone joined the room |
| `user:left` | `{ userId, username }` | Someone left the room |
| `chat:receive` | `Message` | New chat message |
| `code:change` | `string` | Code updated by another user |
| `language:change` | `string` | Language changed |
| `cursor:update` | `{ userId, username, position }` | Another user's cursor |
| `execution:result` | `ExecutionResult` | Code execution finished |

---

## 🌐 Supported Languages

| Language | Monaco ID | Judge0 ID |
|---|---|---|
| JavaScript | `javascript` | 63 |
| TypeScript | `typescript` | 74 |
| Python | `python` | 71 |
| C++ | `cpp` | 54 |
| Java | `java` | 62 |
| Go | `go` | 60 |
| C | `c` | 50 |
| Rust | `rust` | 73 |

---

## 🔒 Environment Variables

### `server/.env`

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | MySQL connection string |
| `JWT_SECRET` | ✅ | Secret for signing access tokens (15min expiry) |
| `REFRESH_SECRET` | ✅ | Secret for signing refresh tokens (7d expiry) |
| `GROQ_API_KEY` | ✅ | From [console.groq.com](https://console.groq.com) |
| `CLIENT_URL` | ✅ | Frontend origin for CORS (e.g. `http://localhost:5173`) |
| `PORT` | ❌ | Server port (default: `4000`) |

### `client/.env`

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | ✅ | Backend API base URL |
| `VITE_SOCKET_URL` | ✅ | Backend Socket.io URL |

---

## 🚢 Deployment

### Recommended Stack

| Layer | Service | Free Tier |
|---|---|---|
| Frontend | [Vercel](https://vercel.com) | ✅ |
| Backend | [Railway](https://railway.app) | ✅ |
| Database | [Railway MySQL](https://railway.app) | ✅ |

### Deploy Frontend to Vercel

```bash
cd client
npm run build
# Push to GitHub and connect repo to Vercel
# Set VITE_API_URL and VITE_SOCKET_URL in Vercel environment settings
```

### Deploy Backend to Railway

```bash
# Push server/ to GitHub
# Connect to Railway, set all environment variables
# Railway auto-detects Node.js and runs npm start
```

> **Note:** Update `CLIENT_URL` in your server env to your Vercel domain, and update `VITE_API_URL` / `VITE_SOCKET_URL` in your client env to your Railway domain.

---

## 🛣 Roadmap

- [ ] Yjs CRDT integration for true conflict-free collaborative editing
- [ ] Session recording and playback
- [ ] GitHub integration — push final code directly to a repo
- [ ] Code annotation — pin comments to specific lines
- [ ] Custom themes for the Monaco editor
- [ ] Mobile responsive layout

---

## 🤝 Contributing

Contributions are welcome!

```bash
# Fork the repo, then:
git checkout -b feature/your-feature
git commit -m "feat: add your feature"
git push origin feature/your-feature
# Open a Pull Request
```

Please follow conventional commit messages: `feat:`, `fix:`, `chore:`, `docs:`, etc.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

Built with ❤️ by [subxm](https://github.com/subxm)

⭐ Star this repo if you found it useful!

</div>
