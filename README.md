# LabTrack — Laboratory Incident Management & AI Assistant

A small, two-part system:

- **Part 1 — Web app**: ASP.NET Core Web API (C#, EF Core, SQL Server) + a React
  frontend, for logging, tracking and searching lab incidents through a simple
  status workflow.
- **Part 2 — AI assistant**: a Retrieval-Augmented Generation (RAG) pipeline that
  answers questions and summarizes incidents using only knowledge documents your
  team has uploaded — and says "I don't know" instead of guessing.

This README walks through everything from installing tools to running the demo,
in order. Follow it top to bottom the first time.

---

## 0. Project layout (what's in each folder)

```
LabIncidentSystem/
├── LabAPI/                     ← Part 1 + Part 2 backend (ASP.NET Core Web API)
│   ├── Models/                 ← EF Core entities (database tables)
│   ├── Data/                   ← DbContext + seed data
│   ├── DTOs/                   ← request/response shapes (never expose Models directly)
│   ├── Services/
│   │   ├── Auth/                ← login / JWT tokens
│   │   ├── Incidents/            ← CRUD + status workflow logic
│   │   ├── Documents/            ← turns uploaded files into searchable knowledge
│   │   └── Ai/                   ← chunking, embeddings, retrieval, generation (RAG)
│   ├── Controllers/             ← the actual HTTP endpoints (thin — call Services)
│   ├── Middleware/               ← global error handling
│   └── Program.cs               ← wires everything together (read this after the rest)
├── LabAPI.Tests/                ← unit tests + integration tests
├── lab-frontend/                ← React (Vite) single-page app
│   └── src/
│       ├── api/client.js         ← the ONLY place that calls fetch()
│       ├── context/AuthContext.jsx
│       ├── components/           ← small reusable pieces (badges, navbar…)
│       └── pages/                ← one file per screen
└── sample-knowledge-base/       ← two .txt files to upload for the AI demo
```

**Why so many small files?** Each file has one job. If you're learning: start by
opening `Models/Incident.cs` (what data looks like), then
`Services/Incidents/IncidentService.cs` (what we do with it), then
`Controllers/IncidentsController.cs` (how the outside world reaches it). That
same three-step pattern (Model → Service → Controller) repeats for every
feature, including the AI ones.

---

## 1. Install prerequisites (do this once)

| Tool | Why | Check you have it |
|---|---|---|
| **.NET 8 SDK** | Runs the backend | `dotnet --version` → should print `8.x` |
| **Node.js 18+** | Runs the React frontend | `node --version` |
| **SQL Server** (Developer/Express edition, or Docker) | The database | see below |
| **A code editor** | Visual Studio, VS Code, or Rider — any is fine | — |

If you don't want to install SQL Server directly, the easiest option is Docker:

```bash
docker run -e "ACCEPT_EULA=Y" -e "MSSQL_SA_PASSWORD=YourStrong!Passw0rd" \
  -p 1433:1433 --name lab-sql -d mcr.microsoft.com/mssql/server:2022-latest
```

This matches the connection string already in `LabAPI/appsettings.json`. If you
use a different password/server, update `ConnectionStrings:DefaultConnection` there.

---

## 2. Set up and run the backend (Part 1 + Part 2 live together here)

```bash
cd LabIncidentSystem/LabAPI

# 1. Restore NuGet packages
dotnet restore

# 2. Install the EF Core CLI tool (once, globally, if you don't have it)
dotnet tool install --global dotnet-ef

# 3. Create the first migration (this generates the SQL to build your tables)
dotnet ef migrations add InitialCreate

# 4. Run the API — this also applies the migration and seeds demo data automatically
dotnet run
```

You should see the API start on **http://localhost:5000**. Open
**http://localhost:5000/swagger** in a browser — that's your interactive API
documentation (Functional Requirement: "Swagger/OpenAPI").

**Seeded demo accounts** (created automatically on first run, see
`Data/DbSeeder.cs`):

| Email | Password | Role |
|---|---|---|
| admin@lab.local | Admin123! | Administrator |
| reviewer@lab.local | Reviewer123! | Reviewer |
| labuser@lab.local | LabUser123! | LabUser |

As the Administrator, visit **Admin → Manage accounts** to change anyone's
role, deactivate/reactivate an account, or issue a temporary password. A
deactivated account is rejected at login (`AuthService.LoginAsync`), even
with the correct password.

### Try it in Swagger first
1. `POST /api/auth/login` with `admin@lab.local` / `Admin123!` → copy the `token`.
2. Click **Authorize** (top right) → type `Bearer <paste token>` → Authorize.
3. Try `GET /api/incidents`, `POST /api/incidents`, etc.

---

## 3. Set up and run the frontend

In a **second terminal**:

```bash
cd LabIncidentSystem/lab-frontend
npm install
npm run dev
```

Open **http://localhost:5173**. Log in with one of the seeded accounts above
(or register a new one — new sign-ups become `LabUser` by default).

The frontend talks to the backend at `http://localhost:5000/api` (see
`src/api/client.js`). If your backend runs on a different port, change
`BASE_URL` there.

---

## 4. Demonstrating the main workflow (Part 1)

1. **Log in** as `labuser@lab.local`.
2. **Dashboard** → shows live counts by status.
3. **New Incident** → fill the form → creates an incident with status `Open`.
4. **Log out, log in as `reviewer@lab.local`.**
5. Open the incident → **Move to Investigating** (status buttons only appear
   for Reviewer/Administrator — that's the "role-aware actions" requirement).
6. Add an **investigation note** and a **corrective action**.
7. Move to **Resolved**, then **Closed**.
8. Go back to **Incidents** → use the **status/severity/search filters** to find it.

Try an invalid transition on purpose (e.g. call `PATCH /api/incidents/5/status`
with `Closed` on a freshly created `Open` incident, via Swagger) — you'll get a
`400 Bad Request` explaining the workflow rule was violated. That's the
"validation and consistent error handling" requirement in action.

---

## 5. Why Administrator and Reviewer are genuinely different roles

It's easy to end up with two roles that can do the same things. Here they're
split by *what kind of authority* each one holds:

| | Reviewer / Manager | Administrator |
|---|---|---|
| Assign incidents, move status, resolve | ✅ | ✅ |
| Upload a candidate knowledge document | ✅ | ✅ |
| **Approve/reject a document for the AI to use** | ❌ | ✅ only |
| **Manage user accounts** (roles, activate/deactivate, reset passwords) | ❌ | ✅ only |
| Delete an incident or a document | ❌ | ✅ only |

The important one: **uploading a document does not make the AI use it.**
Every upload starts as `Pending`. `RagService` (the retrieval step) filters
strictly on `Status == Approved` — a Reviewer can *submit* a safety procedure,
but only an Administrator can *approve* it into the assistant's working
knowledge base. That's the mechanism that guarantees the AI answers only from
vetted material, never from the open internet or from unreviewed uploads —
see `Services/Ai/RagService.cs`, in the `RetrieveTopChunksAsync` method.

Account management (`/admin/users`, `AdminController.cs`) is Administrator-only
for the same reason a Reviewer shouldn't be able to promote themselves, or
anyone, to Administrator, or lock other people out of the system.

## 6. Demonstrating the AI assistant (Part 2)

The AI works in three steps every time (this is what "RAG" means):

1. **Chunk & embed** — when you upload a document, it's split into small
   overlapping pieces, and each piece gets converted into a numeric vector
   (an "embedding") that represents its meaning.
2. **Retrieve** — when you ask a question, your question is embedded the same
   way, then compared (cosine similarity) against every stored chunk to find
   the most relevant ones.
3. **Generate, grounded** — only the retrieved chunks are handed to the answer
   generator, with an explicit instruction to say "I don't know" if the
   context doesn't cover the question. This is what keeps the assistant from
   presenting unsupported information as fact.

### Normal case
1. Go to **Knowledge Base** (as Reviewer or Admin) → upload both files from
   `sample-knowledge-base/` (`centrifuge-safety-procedure.txt` and
   `chemical-spill-response.txt`). They appear with a **Pending** badge.
2. **Log in as `admin@lab.local`** → go to **Knowledge Base** → click
   **Approve** on both documents. (This step is the point — try asking a
   question *before* approving, and notice the assistant still says it
   doesn't have enough information, even though the file is uploaded.)
3. Go to **Ask AI** → ask: *"What should I do if a centrifuge overheats?"*
   → you'll get a grounded answer **with source references** (document title,
   chunk index, similarity score) — the "supporting document/section
   references" requirement.
4. Open any incident → click **Generate** under "AI summary & next step" →
   see a short summary plus a suggested next investigative step.

### Failure / edge case (on purpose)
Ask something completely unrelated, e.g. *"What's the capital of France?"* or
*"How do I fix a printer jam?"* before uploading anything (or with the
knowledge base empty). Because no chunk is similar enough to the question, the
assistant responds that it doesn't have enough information — instead of
inventing an answer. Look at the response: `isGrounded: false` in the JSON,
and a visibly different (amber) banner in the UI.

---

## 7. Running the automated tests

```bash
cd LabIncidentSystem/LabAPI.Tests
dotnet test
```

This runs:
- **Unit tests** (`IncidentServiceTests.cs`) — status-workflow rules, using an
  in-memory database, no SQL Server required.
- **Unit tests** (`VectorMathTests.cs`, `TextChunkerTests.cs`) — the AI math
  and chunking logic in isolation.
- **Integration tests** (`IncidentsControllerIntegrationTests.cs`) — spins up
  the real HTTP pipeline via `WebApplicationFactory` and exercises
  register → login → create incident → fetch incident end to end.

---

## 8. Design decision worth explaining in your demo

**Why the AI providers are "pluggable" (interfaces, not hardcoded calls).**
`IEmbeddingService` and `ITextGenerationService` are interfaces. By default
the app uses `LocalEmbeddingService` / `LocalTextGenerationService` — a
free, offline, hashed-bag-of-words embedding and an extractive "generator"
that just assembles the retrieved sentences. This means the **entire RAG
pipeline, including the tests, runs with zero API keys and zero cost**, which
is ideal for a student project graded by someone who won't have your API key.

To use a real semantic model instead, set in `appsettings.json`:
```json
"Ai": { "EmbeddingProvider": "OpenAI", "OpenAiApiKey": "sk-..." }
```
and `Program.cs` automatically swaps in `OpenAiEmbeddingService` /
`OpenAiTextGenerationService` — nothing else in the app changes. That's the
value of coding against an interface instead of a specific vendor's SDK.

## 9. A known limitation worth mentioning too

The local embedding is a **lexical** (word-overlap) representation, not a true
deep-learning semantic embedding — it will miss paraphrases that don't share
words (e.g. "centrifuge is smoking" vs "centrifuge overheating" may score
lower than expected). It's intentionally simple so every line is readable and
explainable, and it can be swapped for `OpenAiEmbeddingService` for
production-quality semantic matching without touching any other file.
Similarly, chunk vectors are stored as comma-separated text in a normal SQL
Server column and compared with an in-memory loop — fine at this data scale,
but a real deployment would use a proper vector index/database (see the
stretch-features note in the project brief).

---

## 10. Stretch features (only after the above works)

Not built by default, but the codebase is structured to make each of these a
small, contained addition:
- **Similarity search for related historical incidents** — reuse
  `IEmbeddingService`/`VectorMath` on `Incident.Description` instead of
  document chunks.
- **Confidence/grounding indicator** — already partially done (`isGrounded`
  + similarity scores are returned); could be shown as a percentage bar.
- **Docker** — add a `Dockerfile` for `LabAPI` and a `docker-compose.yml`
  that also starts SQL Server.
- **CI** — a GitHub Actions workflow running `dotnet test` and `npm run build`
  on every push.

---

## 11. Git workflow reminder

Commit early and often from **both team members**, with messages that say
*what* and *why* (e.g. `Add status-transition validation to IncidentService`
rather than `update`). Suggested split: one person owns `LabAPI` +
`LabAPI.Tests`, the other owns `lab-frontend`, then pair up on the `Services/Ai`
folder together since it's the part most worth understanding deeply for the
demo Q&A.
