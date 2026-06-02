# Trading Agents Backend Architecture

This document describes the architectural design and structural choices for the TradingAgents backend.

## 1. Domain-Driven Design (DDD) & Dependency Injection
The application is structured around a "Feature-based" module system conforming to Domain-Driven Design (DDD) principles. Each core business domain is encapsulated in its own directory under `app/routers/v1/`.

To ensure separation of concerns and testability, the system strictly utilizes FastAPI's Dependency Injection (`Depends()`) to pass `Repository` classes into `Service` classes, and `Service` classes into `Controllers`.

### Layered Architecture
- **Controllers:** Handles HTTP routing, request/response validation, and injects the corresponding Service. Contains NO business logic or database queries.
- **Services:** Contains all core business logic, orchestrates data flow, and injects Repositories to access data.
- **Repositories:** Inherits from `BaseRepository` (using Python Generics) to handle standard CRUD operations (`get`, `create`, `update`, `delete`). Isolates SQLAlchemy ORM logic from the rest of the application.
- **Schemas:** Pydantic models for request validation and response serialization.
- **Models:** Database ORM mappings (SQLAlchemy for relational, Beanie for MongoDB).

### Directory Structure
```
app/
├── agent_core/       # LangChain / AI Agent specific implementations
├── core/             # Central configs (config.py, database.py, repository.py)
├── dependencies/     # FastAPI Dependency injection (auth.py, db.py)
└── routers/
    └── v1/
        ├── auth/
        ├── users/
        ├── agent_chats/
        └── portfolio/
            ├── controllers.py    # FastAPI endpoint routes
            ├── schemas/          # Pydantic validation models
            ├── services/         # Business logic layer
            ├── repositories/     # Database access layer
            └── models/
                ├── relational.py      # SQLAlchemy ORM (PostgreSQL)
                └── non_relational.py  # Beanie ODM (MongoDB)
```

## 2. Hybrid Data Architecture (SQL + NoSQL)
To match the scalability and throughput of modern AI chat applications (like ChatGPT/Claude), the system employs a Hybrid Data Architecture.

### PostgreSQL (Core Business Logic)
- **Role:** Handles heavily structured, relational data where ACID compliance is critical.
- **Models:**
  - `User`, `UserSetting` (Auth/Configuration)
  - `ChatSession`, `ChatMessage` (Thread and Message relationships)
  - `Report` (Financial summary output attached to a specific ChatMessage)
  - `Portfolio`, `Position`, `Order` (Trading execution)
- **Tech:** SQLAlchemy 2.0 (Async), asyncpg

### MongoDB (AI Logging & Analytics)
- **Role:** Handles high-volume, unstructured, write-heavy data streams.
- **Models (Collections):**
  - `AgentLog`: Captures every step of the agent's reasoning (Action, Synthesis, Tool calls) in real-time. This data is streamed to the UI's Holographic Viewer via WebSockets.
  - `TokenUsage`: Tracks detailed LLM token consumption per user/message/model for accurate billing and cost management.
- **Tech:** Motor (AsyncIO driver), Beanie (ODM for Pydantic/FastAPI)

## 3. Data Flow Example: Manual AI Research
1. User sends a message via UI (`/research`).
2. Controller injects `ChatService` and triggers the chat handler.
3. `ChatService` uses `ChatMessageRepository` to save the message (Role: user) in PostgreSQL.
4. `ChatService` triggers the `agent_core` pipeline.
5. As AI agents debate and reason, the Service writes `AgentLog` documents into MongoDB via callbacks.
6. Once the pipeline finishes, the final financial summary is saved as a `Report` in PostgreSQL using `ReportRepository`, linked 1:1 to a new `ChatMessage` (Role: assistant).
7. Total API usage is written to `TokenUsage` in MongoDB.
