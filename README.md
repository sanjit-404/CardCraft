# CardCraft

CardCraft is a web app for designing credit and debit card mockups. You sign in, type a cardholder name and card number, drag the name around a live card preview, add co-brand logos, and save your designs. You can download a design as a PNG or PDF, or ask an AI (Google Gemini) to score the design and suggest improvements.

The app only makes mockups. It never stores a full card number.

## Stack

| Part | Technology | Hosting |
| --- | --- | --- |
| Frontend (`card-craft/`) | React 19, TypeScript, Vite, Konva (canvas), jsPDF, Zod | Vercel |
| Backend (`card-craft-server/`) | Node.js, Express 5, Mongoose, Zod, JSON Web Tokens, bcrypt, express-rate-limit | Render |
| Database | MongoDB | MongoDB Atlas |
| AI review | Google Gemini via `@google/genai` | Google AI Studio API key |

## Features

- Sign up and log in with an email and password.
- A live 400 × 252 card canvas. You can drag the cardholder name to move it, and it stays inside the card.
- The app works out the card network (Visa, Mastercard, Amex, RuPay) from the number. It checks the number's length and its Luhn check digit.
- Co-branding: choose up to two preset logos and lay them out side by side or stacked.
- Save designs as draft or final, then list, edit and delete them.
- Download a design as a PNG or PDF.
- AI design review: a score from 1 to 10 and 2–4 tips.

## Run locally

You need Node.js 20 or later, plus a MongoDB connection string (from a free Atlas cluster or a local `mongod`).

```bash
# 1. Backend
cd card-craft-server
npm install
cp .env.example .env      # then fill in the values (see below)
npm run dev               # http://localhost:3000

# 2. Frontend (in a second terminal)
cd card-craft
npm install
cp .env.example .env.local   # the default points at http://localhost:3000
npm run dev                  # http://localhost:5173
```

To check that the backend is running, open `GET http://localhost:3000/`. It should return `{"status":"ok"}`.

## Environment variables

Never commit real values. Only the `.env.example` files go in git.

### Backend (`card-craft-server/.env`)

| Variable | Required | Purpose |
| --- | --- | --- |
| `MONGO_URI` | Yes | MongoDB connection string, e.g. `mongodb+srv://<user>:<password>@<cluster>/<db>` |
| `JWT_SECRET` | Yes | Long random string used to sign login tokens. The server refuses to start without it. Generate one with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `GEMINI_API_KEY` | For AI review | Google AI Studio API key. If it is missing, reviews return 503. |
| `GEMINI_MODEL` | For AI review | Gemini model name. If it is missing, reviews return 503. |
| `CLIENT_ORIGIN` | In production | The frontend's exact origin, which CORS allows (no trailing slash). Defaults to `http://localhost:5173`. |
| `PORT` | No | Defaults to 3000. Render sets this for you. |

### Frontend (`card-craft/.env.local`)

| Variable | Purpose |
| --- | --- |
| `VITE_API_URL` | Backend base URL, with no trailing slash. Defaults to `http://localhost:3000`. |

## API

All `/api/cards` routes require the header `Authorization: Bearer <token>`.

| Method | Path | Description |
| --- | --- | --- |
| GET | `/` | Health check |
| POST | `/api/auth/register` | Create an account and get back a token |
| POST | `/api/auth/login` | Log in and get back a token |
| GET | `/api/cards` | List your cards, newest first |
| GET | `/api/cards/:id` | Get one of your cards |
| POST | `/api/cards` | Create a card |
| PUT | `/api/cards/:id` | Update a card (partial) |
| DELETE | `/api/cards/:id` | Delete a card |
| POST | `/api/cards/:id/review` | AI design review → `{ score, tips }` |

## Design decisions

- **Only the last 4 digits are stored.** The server needs the full card number for two things: checking it (length and Luhn) and working out the network. After that it saves only `cardLast4` and `network`, and drops the full number. So the full number is never written to the database, never returned by the API, and never sent to the AI.
- **JWT authentication.** Passwords are hashed with bcrypt (cost 10), and the hash is excluded from queries by default. Login gives back an HS256 token that expires after 7 days. The server checks it with a pinned algorithm. A wrong email and a wrong password get the same error, so nobody can use login to find out which emails have accounts. The auth routes are rate-limited.
- **Server-side Zod validation.** Every request body is checked against a Zod schema before the route code runs. Zod drops fields that aren't in the schema, so a client can't set `owner`, `network` or `cardLast4` itself. Bad input gets a 400 with an error message for each field. The lists of allowed values (logos, layouts, statuses, canvas size) live in one config file, which both the Mongoose model and the Zod schemas use.
- **Every query is limited to the card's owner.** Each card query filters on `{ _id, owner: req.userId }`, and the owner always comes from the token. If you ask for someone else's card, you get a 404, exactly as if the card didn't exist, so card ids can't be discovered by guessing.
- **Gemini review with safe parsing.** The prompt is built only from the design fields, and it tells the model to treat the design as data, not as instructions. The model is asked to reply as structured JSON. Even so, the server pulls the JSON object out of the reply and checks it with Zod (score must be a whole number from 1 to 10, with 2–4 short tips) before using it. A timeout, a blocked prompt or a malformed reply becomes a friendly 503. The server never logs the API key or the prompt, and the review route has its own tighter rate limit, because each call costs money.
- **The API only sends its own short JSON error messages.** Raw library errors are never sent to clients, and unknown routes and malformed JSON also get a JSON reply.

## Deployment

- **Database:** MongoDB Atlas. In Network Access, allow only your Render service's outbound IP ranges (find them in the Render dashboard under Connect → Outbound). Never allow `0.0.0.0/0`.
- **Backend:** Render web service with root directory `card-craft-server`, build command `npm install`, start command `npm start`, and health check path `/`.
- **Frontend:** Vercel project with root directory `card-craft`, framework Vite, and `VITE_API_URL` set to the Render URL.
