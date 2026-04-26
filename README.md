# ScioAI – Autonomous Research Platform

<div align="center">

![ScioAI Banner](https://img.shields.io/badge/ScioAI-Autonomous%20Research-6366f1?style=for-the-badge&logo=sparkles&logoColor=white)
&nbsp;
![Next.js](https://img.shields.io/badge/Next.js_14-000000?style=for-the-badge&logo=next.js&logoColor=white)
&nbsp;
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
&nbsp;
![LangGraph](https://img.shields.io/badge/LangGraph-4f46e5?style=for-the-badge&logo=langchain&logoColor=white)

**ScioAI** orchestrates a coordinated team of specialized AI agents — Researcher, Writer, and Critic — to produce citation-grounded, objective research reports in seconds.

</div>

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Environment Configuration](#environment-configuration)
- [Running the App](#running-the-app)
- [API Reference](#api-reference)
- [How the Pipeline Works](#how-the-pipeline-works)
- [Frontend Design System](#frontend-design-system)

---

## Overview

ScioAI is a full-stack **multi-agent research platform** that takes a natural language query and returns a polished, structured Markdown report with citations. It combines:

- **Live web search** (Tavily) for real-time intelligence
- **Vector memory** (Pinecone) for domain-specific context retrieval
- **LLM synthesis** (Groq · Llama 3.3 70B) for report writing and critical review
- **LangGraph** for orchestrating the agent workflow as a stateful directed acyclic graph

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (Next.js 14)                    │
│  Landing Page  ·  Multi-Session Chat Workspace  ·  PDF Export │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP (REST)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   BACKEND (FastAPI + Uvicorn)                 │
│   POST /api/chat           POST /api/generate-pdf            │
│   GET  /health                                               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│               LangGraph Multi-Agent Pipeline                  │
│                                                               │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────────┐   │
│  │  Researcher  │──▶│   Writer    │──▶│     Critic      │   │
│  │             │   │             │   │                 │   │
│  │ Tavily Web  │   │ Llama 3.3   │   │  Llama 3.3 70B  │   │
│  │ Pinecone    │   │   70B LLM   │   │  Citation Check │   │
│  └─────────────┘   └─────────────┘   └─────────────────┘   │
└─────────────────────────────────────────────────────────────┘
           │                                      │
    ┌──────┴──────┐                        ┌──────┴──────┐
    │  Tavily API  │                        │  Pinecone   │
    │ (Web Search) │                        │  (Vectors)  │
    └─────────────┘                        └─────────────┘
                              │
                       ┌──────┴──────┐
                       │  Groq API   │
                       │(Llama 3.3)  │
                       └─────────────┘
```

### Data Flow

1. **User sends a query** → Next.js frontend → `POST /api/chat`
2. **FastAPI** receives the request and invokes the LangGraph compiled graph
3. **Researcher node** queries Tavily (6 web results) + Pinecone (4 top chunks) → formats evidence
4. **Writer node** calls Groq LLM with a structured report prompt + all evidence → produces draft
5. **Critic node** calls Groq LLM again with draft + evidence → verifies citations, improves objectivity
6. **Final report** (Markdown) is returned to the frontend
7. User can optionally export the report as a **PDF** via `POST /api/generate-pdf`

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 14 (App Router) | React-based UI framework |
| **Styling** | Tailwind CSS v3 + @tailwindcss/typography | Utility-first CSS design system |
| **Animations** | Framer Motion | Page and component animations |
| **Markdown** | react-markdown + remark-gfm | Render AI reports in the chat |
| **Icons** | Lucide React | Consistent icon set |
| **Backend** | FastAPI + Uvicorn | High-performance Python API server |
| **Agent Orchestration** | LangGraph 0.2 | Stateful multi-agent DAG |
| **LLM** | Groq · Llama 3.3 70B | Ultra-fast LLM inference |
| **Web Search** | Tavily | Real-time web intelligence |
| **Vector Store** | Pinecone | Semantic document retrieval |
| **PDF Export** | WeasyPrint (optional) | Markdown → PDF rendering |

---

## Project Structure

```
ScioAI/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── config.py        # Settings from .env
│   │   ├── graph.py         # LangGraph pipeline (Researcher→Writer→Critic)
│   │   ├── main.py          # FastAPI app + routes
│   │   └── models.py        # Pydantic request/response models
│   ├── .env                 # Your secrets (not committed)
│   ├── .env.template        # Template for .env
│   └── requirements.txt     # Python dependencies
│
└── frontend/
    ├── app/
    │   ├── app/
    │   │   └── page.tsx     # Main chat workspace (/app route)
    │   ├── globals.css      # Global styles + design tokens
    │   ├── layout.tsx       # Root layout (fonts, metadata)
    │   └── page.tsx         # Landing page (/ route)
    ├── components/
    │   ├── ChatWindow.tsx   # Chat UI with messages, loading, PDF export
    │   └── Sidebar.tsx      # Session management sidebar
    ├── hooks/
    │   └── useChatSessions.ts  # localStorage-backed session state
    ├── types/
    │   └── chat.ts          # TypeScript interfaces
    ├── package.json
    └── tailwind.config.ts
```

---

## Environment Configuration

### Backend `.env` (required)

Create `backend/.env` based on `backend/.env.template`:

```env
# Groq API – https://console.groq.com/
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxx

# Tavily Search API – https://tavily.com/
TAVILY_API_KEY=tvly-xxxxxxxxxxxxxxxxxxxx

# Pinecone – https://app.pinecone.io/
PINECONE_API_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
PINECONE_INDEX_NAME=your-index-name
```

> **Pinecone Index:** The index must already exist and be populated with your documents. The Researcher agent queries it using a zero-vector (returns top-4 matches by score). Ensure the index dimension matches your embedding model.

### Frontend `.env.local` (optional)

If your backend runs on a different port:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

---

## Running the App

### Prerequisites

- Python 3.10+ installed and on PATH
- Node.js 18+ and npm installed
- All API keys configured in `backend/.env`

### 1. Install Python Dependencies

```powershell
# From the project root
pip install -r backend/requirements.txt
```

> **Note:** WeasyPrint (PDF export) requires GTK/Pango native libraries on Windows. The backend starts fine without them — PDF export will return a 503 if they are missing. Install [MSYS2 GTK runtime](https://github.com/tschoonj/GTK-for-Windows-Runtime-Environment-Installer) to enable PDF export.

### 2. Install Frontend Dependencies

```powershell
cd frontend
npm install
```

### 3. Start the Backend

```powershell
# From the project root (backend/)
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at: `http://localhost:8000`  
Swagger UI docs: `http://localhost:8000/docs`

### 4. Start the Frontend

```powershell
# In a separate terminal, from frontend/
cd frontend
npm run dev
```

The app will be available at: `http://localhost:3000`

### Running Both Concurrently (PowerShell)

```powershell
# From the project root
Start-Process powershell -ArgumentList '-NoExit', '-Command', 'cd backend; uvicorn app.main:app --reload --port 8000'
Start-Process powershell -ArgumentList '-NoExit', '-Command', 'cd frontend; npm run dev'
```

---

## API Reference

### `GET /health`

Health check endpoint.

**Response:**
```json
{ "status": "ok" }
```

---

### `POST /api/chat`

Run the multi-agent research pipeline.

**Request Body:**
```json
{
  "session_id": "uuid-string",
  "query": "What are the latest breakthroughs in fusion energy?"
}
```

**Response:**
```json
{
  "response": "# Fusion Energy Breakthroughs\n\n## Executive Summary\n...",
  "current_step": "critic_complete",
  "workflow_steps": ["researcher", "writer", "critic"]
}
```

---

### `POST /api/generate-pdf`

Convert a Markdown report to a styled PDF download.

**Request Body:**
```json
{
  "markdown": "# My Report\n\n...",
  "filename": "ScioAI-Report-20260426"
}
```

**Response:** Binary PDF file with `Content-Disposition: attachment` header.

> **Note:** Returns `503` on Windows if WeasyPrint native dependencies are not installed.

---

## How the Pipeline Works

### LangGraph State

The pipeline uses a `TypedDict` state object passed through all nodes:

```python
class ResearchGraphState(TypedDict):
    user_query: str        # Original user question
    research_data: str     # Formatted Tavily + Pinecone evidence
    draft: str             # Writer's initial report
    final_report: str      # Critic's refined final report
    current_step: str      # Current pipeline stage
    workflow_steps: list   # Completed agent names
```

### Node Descriptions

| Node | Role | Model |
|------|------|-------|
| **researcher** | Tavily web search (6 results) + Pinecone vector query (top-4 chunks) | — |
| **writer** | Synthesizes evidence into structured Markdown report | Llama 3.3 70B |
| **critic** | Reviews draft, verifies citations, removes unsupported claims | Llama 3.3 70B |

### Graph Topology

```
START → researcher → writer → critic → END
```

---

## Frontend Design System

The frontend uses a premium light theme with:

- **Primary Color:** Indigo `#6366f1` → Violet `#8b5cf6` (gradient brand)
- **Accent Color:** Orange `#f97316`
- **Surface:** Pure white `#ffffff` on `#f8fafc` backgrounds
- **Typography:** Inter (body) + Plus Jakarta Sans (headings) from Google Fonts
- **Shadows:** Layered glass-effect shadows with colored undertones
- **Animations:** Framer Motion for page transitions; CSS for micro-interactions

### Key Components

- **Landing Page** (`/`) — Hero, agent cards, workflow steps, tech stack, CTA
- **Chat Workspace** (`/app`) — Sidebar sessions + full-height chat window
- **ChatWindow** — Message bubbles, loading pipeline stages, PDF export
- **Sidebar** — Session list with context menus (rename/delete)

---

## License

MIT License – see `LICENSE` for details.

---

<div align="center">
Built with ♥ using LangGraph · Groq · Pinecone · Next.js · FastAPI
</div>
