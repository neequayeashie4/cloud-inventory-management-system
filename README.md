# Cloud Inventory Management System

CSBC 252 Capstone — Express + MySQL + S3 inventory system with role-based access control, deployed on a single EC2 instance behind nginx.

## Stack

- **Backend:** Node.js, Express, MySQL (via `mysql2`), JWT auth, AWS SDK v3 (S3)
- **Frontend:** Plain HTML/CSS/JS, served as static files from `server/public/` — same origin as the API, no CORS
- **Infra:** EC2 (Ubuntu, nginx + pm2), RDS MySQL (private subnet), S3 (private bucket, pre-signed URLs), IAM instance role, CloudWatch

## Demo accounts

Seed them with `npm run seed:users` (see below), then log in with:

| Role | Email | Password |
|---|---|---|
| Admin | admin@demo.com | `Demo@12345` |
| Staff | staff@demo.com | `Demo@12345` |
| Viewer | viewer@demo.com | `Demo@12345` |

Viewers can read everything but see no create/edit/delete buttons — that's the RBAC demo.

## Local setup

```bash
cd server
npm install
cp .env.example .env   # fill in DB credentials, JWT secret, AWS region/bucket

# Create the schema and demo data (run in this order — seed.sql's
# stock_movements rows reference the users seed-users.js creates)
mysql -u <user> -p <db_name> < db/schema.sql
npm run seed:users
mysql -u <user> -p <db_name> < db/seed.sql

npm run dev   # nodemon, http://localhost:3000
```

Open `http://localhost:3000` — the frontend and API are served from the same Express app.

## Tests

```bash
npm test
```

Auth and stock-transaction tests run against a mocked database pool (`src/config/__mocks__/db.js`), so no live MySQL connection is required to run the suite.

## Environment variables

See `server/.env.example` for the full list. `src/config/env.js` validates all required variables at boot and exits immediately if any are missing — this is deliberate, so a misconfigured deploy fails loudly instead of serving broken requests.

## Deployment runbook (EC2, after initial setup)

```bash
ssh -i inventory-key.pem ubuntu@<elastic-ip>
cd ~/inventory-system
git pull origin main
cd server && npm ci --omit=dev
pm2 restart inventory-api
pm2 logs inventory-api --lines 50
```

## Architecture

```
Users → Internet → [ nginx :80/:443, Let's Encrypt ] → EC2 (public subnet)
                                                            │
                                                       Express app
                                                    (pm2, IAM instance role)
                                                            │
                                       ┌────────────────────┼─────────────────────┐
                                       │                                          │
                                RDS MySQL (private subnet,               S3 (private bucket,
                                security-group-to-security-group           pre-signed URLs,
                                access only, not publicly accessible)      default encryption)
```

Full diagram: `docs/aws-architecture.png`. ERD: `docs/erd.png`. API contract: `docs/api-contract.md`.

## Security notes

- Passwords hashed with bcrypt (cost factor 12)
- JWT, 8h expiry, verified on every protected route
- Parameterised queries everywhere — no string-concatenated SQL
- S3 bucket has Block Public Access ON; the app only ever hands out short-lived (300s) pre-signed URLs
- EC2 uses an IAM instance role scoped to `s3:PutObject`/`GetObject`/`DeleteObject` on one bucket prefix — no long-lived AWS keys on the server
- RDS is not publicly accessible; only the web security group can reach port 3306
- Centralised error handler never returns stack traces to the client

## Repository layout

```
inventory-system/
├── server/           Express API + static frontend (see server/src for the layered
│                      routes → controllers → services structure)
└── docs/              Diagrams, wireframes, API contract, deployment screenshots
```
