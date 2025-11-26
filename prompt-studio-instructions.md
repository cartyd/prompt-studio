Perfect, that’s a great stack. Here’s an updated, **ready-to-use prompt** you can paste into another LLM to have it scaffold and implement the project using:

* **Node.js + TypeScript**
* **Fastify**
* **Prisma ORM**
* **PostgreSQL (prod)**
* **SQLite (dev)**
* **htmx + server-rendered HTML**

You can tweak naming/details as needed.

---

````text
You are an expert full-stack TypeScript and Node.js developer and software architect.

Your task is to DESIGN AND IMPLEMENT a web application with the following stack:

- Language: TypeScript
- Backend: Node.js with Fastify
- ORM: Prisma
- Security: @fastify/helmet for HTTP hardening
- Rate limiting: @fastify/rate-limit (or equivalent)
- Frontend: Server-rendered HTML templates enhanced with htmx
- Database:
  - Development: SQLite (simple local dev DB)
  - Production: PostgreSQL (using DATABASE_URL env var)

The app helps users fill in structured prompt templates for different LLM prompting frameworks, generate final “LLM-ready” prompts, save them in a personal prompt library, and (optionally) upgrade to a premium plan for extra features such as unlimited saved prompts and exports.

==================================================
HIGH-LEVEL PRODUCT DESCRIPTION
==================================================

Working name: “Prompt Framework Studio”

Core capabilities:
- Users can:
  - Register, log in, and log out
  - Choose from several prompting frameworks:
    - Tree-of-Thought (ToT)
    - Self-Consistency
    - Chain-of-Thought (CoT)
    - Few-Shot / Role Prompting
    - Reflection / Revision Prompting
  - Fill out guided forms specific to each framework
  - Generate a final, structured “LLM-ready” prompt based on the filled fields
  - Save prompts to a personal library (with limits for free users)

- Premium users:
  - Can save unlimited prompts
  - Can export prompts (e.g., as .txt or .md files; a simple implementation is fine)

- Free users:
  - Can only save up to N prompts (e.g., 3–5; you can pick a reasonable default)

==================================================
TECHNICAL STACK & ARCHITECTURE
==================================================

1. PROJECT SETUP (TypeScript + Fastify + Prisma)
------------------------------------------------
- Use TypeScript for the entire backend.
- Recommended structure (can adjust if you have a strong opinion):
  - `src/`
    - `server.ts` (Fastify bootstrap)
    - `plugins/` (e.g., helmet, rate-limit, Prisma client, session/auth)
    - `routes/` (auth, frameworks, prompts, premium)
    - `controllers/` or `handlers/` (optional separation of route logic)
    - `views/` (HTML templates, layout files)
    - `types/` (custom types, Fastify decorators, etc.)
  - `prisma/`
    - `schema.prisma`
  - `package.json`
  - `tsconfig.json`
  - `.env` / `.env.example`
  - `README.md`

- Configure TypeScript for:
  - ES2020+ target
  - Strict type-checking (preferably `"strict": true`)
  - NodeNext or CommonJS module resolution (your choice, but be consistent)

- Set up Fastify with:
  - `@fastify/helmet` for security headers
  - `@fastify/cookie` and either `@fastify/session` or a JWT-based auth scheme
  - `@fastify/rate-limit` for login and registration endpoints
  - Basic logging using Fastify’s built-in logger

2. DATABASE & PRISMA CONFIGURATION
-----------------------------------
- Use Prisma as the ORM.
- `schema.prisma` should define at least:

  ```prisma
  datasource db {
    provider = env("DATABASE_PROVIDER") // e.g. "postgresql" in prod, "sqlite" in dev
    url      = env("DATABASE_URL")
  }

  generator client {
    provider = "prisma-client-js"
  }

  model User {
    id                    String   @id @default(cuid())
    name                  String
    email                 String   @unique
    passwordHash          String
    subscriptionTier      String   @default("free") // "free" | "premium"
    subscriptionExpiresAt DateTime?
    createdAt             DateTime @default(now())
    updatedAt             DateTime @updatedAt

    prompts               Prompt[]
  }

  model Prompt {
    id              String   @id @default(cuid())
    userId          String
    frameworkType   String   // e.g. "ToT", "SelfConsistency", "CoT", "Role", "Reflection"
    title           String
    finalPromptText String
    createdAt       DateTime @default(now())
    updatedAt       DateTime @updatedAt

    user User @relation(fields: [userId], references: [id])
  }
````

* Database configuration:

  * Use `DATABASE_URL` in `.env`:

    * Dev: `sqlite:./dev.db` or similar
    * Prod: `postgresql://user:password@host:port/dbname?schema=public`
  * Optionally use `DATABASE_PROVIDER` or separate envs to switch easily.

* Add Prisma client plugin for Fastify:

  * A Fastify plugin that attaches `prisma` to `fastify` or `request` (e.g., `fastify.prisma` or `request.prisma`).

3. AUTHENTICATION & SESSIONS

---

* Implement user auth using one of these approaches:

  * Cookie-based sessions (e.g., `@fastify/cookie` + a simple session implementation), or
  * JWT-based auth stored in an HTTP-only cookie.

* Endpoints:

  * `POST /auth/register`

    * Accepts `name`, `email`, `password`
    * Validates email uniqueness
    * Hashes password with bcrypt
    * Creates user with `subscriptionTier = "free"`

  * `POST /auth/login`

    * Accepts `email`, `password`
    * Verifies user and password
    * Establishes a session or sets a signed JWT cookie
    * Protect with `@fastify/rate-limit` (e.g., max X requests/5 min)

  * `POST /auth/logout`

    * Clears session / cookie

* Middleware / decorators:

  * A `requireAuth` preHandler that ensures the user is logged in.
  * A helper that determines the **effective subscription tier**:

    * If `subscriptionTier === "premium"` and `subscriptionExpiresAt > now()` → treat as premium
    * Otherwise → treat as free
  * Expose something like `request.user` and `request.subscription` (e.g. `{ tier: "free" | "premium", isPremium: boolean }`) to handlers.

4. SUBSCRIPTION LOGIC (PREMIUM VS FREE)

---

* Start without real payment integration (mocked upgrade flow is fine).

* Add an admin or developer endpoint (`POST /admin/make-premium` or similar) to:

  * Set a user’s `subscriptionTier = "premium"`
  * Set `subscriptionExpiresAt` to some time in the future (e.g., `now + 90 days`).

* Enforce free-tier limits:

  * Define a constant like `FREE_PROMPT_LIMIT = 5`.
  * On creating a new saved prompt:

    * Count how many prompts the user has.
    * If user is effectively free and has >= `FREE_PROMPT_LIMIT`:

      * Do NOT save the new prompt.
      * Return a response that htmx can render as:

        * “You’ve reached your free prompt limit. Upgrade to Premium for unlimited saved prompts and exports.”

==================================================
FRONTEND: TEMPLATES + HTMX
==========================

1. TEMPLATING

---

* Use a server-side template engine (you may choose one; EJS, Pug, Nunjucks, or another are all acceptable).
* Create a base layout with:

  * Header/navigation bar with links:

    * Home (`/`)
    * Frameworks (`/frameworks`)
    * My Prompts (`/prompts`)
    * Premium (`/premium`)
    * Login/Logout and Register (depending on auth state)
  * A section for flash messages (e.g., success/error)
  * A main content block

2. PAGES

---

Implement at least the following pages:

* `/` (Home)

  * Brief marketing-style explanation of what the app does
  * CTA: “Get started” → register or login
  * CTA: “Explore frameworks”

* `/auth/register` & `/auth/login`

  * Straightforward forms
  * Show validation messages and errors
  * Rate-limit login endpoint

* `/frameworks`

  * Display the list of frameworks:

    * Tree-of-Thought
    * Self-Consistency
    * Chain-of-Thought
    * Few-Shot / Role
    * Reflection / Revision
  * Each entry has:

    * Name
    * Short description
    * Link to the corresponding framework’s page, e.g. `/frameworks/tot`

* `/frameworks/:frameworkType`

  * Shows a **guided form** specific to the selected framework.

  * Examples of fields:

    * Tree-of-Thought:

      * Role
      * Objective
      * Number of approaches
      * Evaluation criteria
    * Self-Consistency:

      * Role
      * Goal
      * Number of versions
    * Few-Shot / Role:

      * Role
      * Tone sample
      * Task
    * etc.

  * This page should contain:

    * The form
    * An empty “Prompt Preview” section, e.g. `<div id="prompt-preview"></div>`

  * Use htmx for preview:

    * The form uses `hx-post="/frameworks/:frameworkType/generate"` and `hx-target="#prompt-preview"`.
    * The backend route `/frameworks/:frameworkType/generate`:

      * Reads form data
      * Constructs the final “LLM-ready” prompt text using the framework’s template
      * Returns a partial HTML snippet rendering that final prompt

  * Include a “Save Prompt” button in the preview area:

    * This button can also use htmx: `hx-post="/prompts"` with necessary data.
    * If the user is free and at their limit, respond with an upsell partial instead of saving.

* `/prompts`

  * Shows a list of the logged-in user’s prompts:

    * Title
    * Framework type
    * Created date
    * Actions: View, Copy, Delete, (and Export if premium)
  * Deletion can use htmx for inline updates:

    * `hx-delete="/prompts/:id"` with `hx-target` pointing to the row element

* `/prompts/:id`

  * View a single saved prompt
  * Show full prompt text
  * Show “Copy to Clipboard” UX (can be done with basic JS)
  * If premium:

    * Show an export button

* `/premium`

  * Show “Free vs Premium” comparison:

    * Free: limited saved prompts, no exports
    * Premium: unlimited saved prompts, exports, future features
  * CTA: “Upgrade to Premium”

    * For now, this can just be a placeholder or link to a mock upgrade flow/admin toggle

3. EXPORT FEATURE (PREMIUM ONLY)

---

* Add routes:

  * `GET /prompts/:id/export`

    * Check if user is premium
    * Return a `.txt` or `.md` file download with the prompt text

  * Optional:

    * `GET /prompts/export/all`

      * Export all prompts as a single `.txt` file

* If a free user hits these routes:

  * Do not allow export
  * Show an upsell page/snippet instead

==================================================
HTMX INTERACTIONS (KEY EXAMPLES)
================================

Implement at least these htmx patterns:

1. Prompt generation preview:

   * Form on `/frameworks/:frameworkType` with:

     * `hx-post="/frameworks/:frameworkType/generate"`
     * `hx-target="#prompt-preview"`
   * Server returns HTML partial with the final prompt wrapped in a `<pre>` or `<textarea>` and a “Save Prompt” button.

2. Saving a prompt:

   * “Save Prompt” button:

     * `hx-post="/prompts"`
     * Includes hidden fields or JSON payload with:

       * frameworkType
       * title (maybe ask user, or use a default)
       * finalPromptText
   * On success:

     * Return snippet: "Prompt saved" + maybe a link to `/prompts`
   * On hitting free limit:

     * Return snippet: "You’ve reached your free prompt limit…” with upgrade CTA.

3. Deleting prompts:

   * On `/prompts`, a delete button with:

     * `hx-delete="/prompts/:id"`
     * `hx-target="#prompt-row-:id"`
     * `hx-swap="outerHTML"` to remove the row.

==================================================
SECURITY & RATE LIMITING
========================

* Integrate `@fastify/helmet`:

  * Set default secure headers

* Integrate `@fastify/cookie` and a session solution (or JWT):

  * Cookies must be:

    * `httpOnly: true`
    * `secure: true` in production

* Integrate `@fastify/rate-limit`:

  * Rate limit `POST /auth/login`
  * Rate limit `POST /auth/register`

* Make sure all prompt-related routes require auth:

  * `/frameworks/*` (except the list page if you want it public)
  * `/prompts*`

==================================================
TESTING & QUALITY
=================

* Add at least basic tests (TypeScript-based, using Jest or another test framework):

  * User registration and login flow
  * Enforcement of free-tier prompt limit
  * Premium vs free behavior on saving and exporting prompts
  * One example of prompt generation for a framework (e.g., ToT) to confirm string construction logic.

==================================================
DOCUMENTATION
=============

Create a concise README that explains:

* Tech stack (Fastify + TS + Prisma + htmx)
* How to set up dev environment:

  * `npm install`
  * `npx prisma migrate dev`
  * `npm run dev` (or equivalent)
* How to configure environment variables:

  * `DATABASE_URL` for dev (SQLite) and prod (Postgres)
  * `SESSION_SECRET` or JWT secret
* How to run tests
* How to run Prisma migrations / studio
* Where key application modules live:

  * Routes
  * Prisma schema
  * Templates
  * Auth logic
  * Subscription gating logic

==================================================
DELIVERABLES
============

Based on this specification, generate the full TypeScript project scaffold including:

* Fastify server setup with helmet, rate-limit, and cookie/session or JWT-based auth
* Prisma schema and basic migration setup (schema.prisma + example migration command)
* Core models for User and Prompt
* Route modules and handlers for:

  * Auth (register/login/logout)
  * Frameworks (list frameworks, render forms, generate prompts)
  * Prompts (CRUD, including save + delete + export)
  * Premium page and gating
* HTML templates for:

  * Layout and basic pages
  * Framework forms with htmx attributes
  * Prompt list and detail views
* Example tests and a readable README.

Focus on:

* Clean, idiomatic TypeScript
* Clear separation of concerns
* Maintainable, extensible architecture
* A pleasant, minimal user experience with htmx-powered interactivity.

Now, using all of the above requirements, generate the complete project skeleton, including folder structure, key TypeScript files, Prisma schema, core routes, and representative templates.

```

::contentReference[oaicite:0]{index=0}
```
