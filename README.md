# 🧁 Chez Hayet Bakery API

The backend for [chezhayetoh.com](https://www.chezhayetoh.com): a TypeScript Express API that takes orders and contact messages from the public site, and powers the baker's login and dashboard. The front end lives in [chez-hayet-bakery](https://github.com/LynzTighers/chez-hayet-bakery).

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white) ![Node.js](https://img.shields.io/badge/Node.js%2022-5FA04E?style=flat-square&logo=nodedotjs&logoColor=white) ![Express](https://img.shields.io/badge/Express%205-000000?style=flat-square&logo=express&logoColor=white) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white) ![Drizzle](https://img.shields.io/badge/Drizzle%20ORM-C5F74F?style=flat-square&logo=drizzle&logoColor=black) ![Zod](https://img.shields.io/badge/Zod-3E67B1?style=flat-square&logo=zod&logoColor=white) ![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white) ![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white)

## Endpoints

| Method | Path | Auth | What it does |
| --- | --- | --- | --- |
| `GET` | `/api/health` | | Health check |
| `POST` | `/api/orders` | | Place an order (name, phone, email, category, product, details, pickup date) |
| `POST` | `/api/contacts` | | Send a contact message |
| `POST` | `/api/auth/login` | | Baker login; sets the session cookie |
| `POST` | `/api/auth/logout` | | Ends the session |
| `GET` | `/api/auth/me` | ✅ | The logged-in baker |
| `GET` | `/api/admin/orders` | ✅ | All orders |
| `PATCH` | `/api/admin/orders/:id` | ✅ | Change an order's status (`new`, `confirmed`, `completed`, `cancelled`) |
| `GET` | `/api/admin/contacts` | ✅ | All contact messages, with their replies |
| `POST` | `/api/admin/contacts/:id/reply` | ✅ | Reply to a message; the reply is emailed to the customer |

Invalid input gets a `400` with an error message for each field, which the site shows next to the matching form field.

## Highlights

- **Validation:** every request body is checked with zod before it reaches the database: phone and email formats, length limits, and pickup dates that can't be in the past (in the bakery's timezone, not the server's).
- **Baker login:** passwords are hashed with bcrypt. Logging in creates a random session token, which is sent as an `httpOnly`, `sameSite=lax` cookie (HTTPS-only in production) and stored in the database only as a hash. Sessions last 7 days, and 5 wrong passwords lock that username for 15 minutes.
- **Email replies:** Nodemailer sends the baker's replies over SMTP. In Docker, Mailpit catches them, so testing never emails real people.
- **Database:** Postgres with Drizzle ORM and SQL migrations in `drizzle/`. Locally it runs in Docker; in production it's Neon.
- **Security basics:** `helmet` headers and a 20 kb request body limit.
- **Deployment:** on Vercel, `src/app.ts` runs as a serverless function. For Docker and local development, `src/server.ts` runs the same app as a normal server.

## Project structure

```
src/
  app.ts            Express app (Vercel entry point)
  server.ts         app.listen() for Docker and local dev
  routes/           orders, contacts, auth, admin
  auth/             password hashing and sessions
  middleware/       validation, requireAdmin, error handling
  validation/       zod schemas
  db/               Drizzle schema, client, migration runner
  email/            mailer and email templates
  scripts/          create-admin
drizzle/            SQL migrations
```

## Running locally

### With Docker (easiest)

```bash
docker compose up --build
```

This starts the API on http://localhost:4000, Postgres, and Mailpit (its inbox is at http://localhost:8025). The API applies migrations on startup.

Then create the baker's login (it asks for a password of at least 12 characters):

```bash
npm install
npm run admin:create -- <username>
```

### Without Docker

You need Node.js 22+ and a Postgres database.

```bash
cp .env.example .env    # then set DATABASE_URL
npm install
npm run db:migrate
npm run dev
```

## Environment variables

See [`.env.example`](.env.example).

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Postgres connection string (use Neon's pooled one in production) |
| `PORT` | Port for `server.ts` (default `4000`) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | SMTP server for reply emails |
| `MAIL_FROM`, `MAIL_REPLY_TO` | Sender address, and where customers' replies go |
| `BAKERY_TIMEZONE` | Timezone for "today" when checking pickup dates (default `America/New_York`) |

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Start with auto-reload (tsx) |
| `npm run build` / `npm start` | Compile to `dist/` and run it |
| `npm run typecheck` | Type-check without building |
| `npm run db:generate` | Generate a migration from schema changes |
| `npm run db:migrate` | Apply migrations (`db:migrate:neon` for the live database) |
| `npm run admin:create -- <username>` | Create the baker's login or reset its password (`admin:create:neon` for live) |
