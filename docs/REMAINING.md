# Remaining Work — Cloud Inventory Management System

Everything below is outside what can be fixed in code. Written after working through `docs/AUDIT.md` sections B (Blockers) and C (Gaps) — see that file for the original findings and file/line citations. All code-fixable items from both sections are done (B4: quantity bypass closed, B5: admin user-creation endpoint + UI added, C1–C5: doc drift, IAM placeholder, query validation, dead code all fixed).

Deadline: 25 August 2026.

---

## 1. AWS console tasks

Region for every resource: **`eu-north-1`** (confirmed). A resource in any other region will not be reachable by the app and is the single most common cause of "it works locally but not deployed."

| # | Task | Console path | What to check/set | Screenshot for proof | Required? |
|---|---|---|---|---|---|
| 1 | Create & attach the EC2 instance role | IAM → Roles → Create role (steps fully written out in `docs/iam/README.md`, policy JSON already has the real bucket name filled in) | Role `EC2-InventoryApp-Role` exists, has the `ProductImageAccess` inline policy + `CloudWatchAgentServerPolicy`, attached to the running EC2 instance | Role summary page showing both policies; EC2 instance's "Security" tab showing the role attached | **Required** |
| 2 | Confirm no AWS keys on the live server | SSH into EC2, `cat ~/inventory-system/server/.env` | `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` must be **absent** — the role supplies credentials instead. (Local dev `.env` is already correct; this only checks the deployed copy.) | Not screenshottable without exposing other secrets — just confirm and note it in the report | **Required** |
| 3 | Elastic IP | EC2 → Elastic IPs → Allocate, then Associate with your instance | IP no longer changes on reboot | Elastic IPs page showing it associated to your instance | **Required** |
| 4 | RDS not publicly accessible | RDS → Databases → your instance → Modify | "Publicly accessible" = **No** | RDS instance detail page showing this setting | **Required** |
| 5 | RDS security group is SG-to-SG, not IP-based | EC2 → Security Groups → the DB's SG → Inbound rules | Port 3306 source is the **web security group** (e.g. `sg-inventory-web`), not an IP range or `0.0.0.0/0` | Inbound rules screenshot | **Required** |
| 6 | S3 Block Public Access | S3 → your bucket (`inventory-system-grp-2026`) → Permissions | All four "Block Public Access" settings = On | Permissions tab screenshot | **Required** |
| 7 | S3 default encryption | S3 → your bucket → Properties | Default encryption = Enabled (SSE-S3 or SSE-KMS) | Properties tab screenshot | **Required** |
| 8 | CloudWatch agent + logs | EC2 (installed per the original build plan's Day 6 steps) | Agent running, a log group exists and has real entries from the app | CloudWatch → Log groups, showing recent entries | **Required** |
| 9 | CloudWatch alarm | CloudWatch → Alarms → Create alarm | At least one alarm (e.g. CPU > 70% for 5 min), showing state = OK | Alarm detail page | **Required** |
| 10 | Billing alarm | Billing → Budgets, or CloudWatch → Billing alarm in us-east-1 | Alarm set (e.g. at $20) | Budget/alarm confirmation | **Required** (protects the deployment from disappearing before grading) |
| 11 | HTTPS on the live site | nginx + certbot on EC2 (per README's deployment runbook) | Padlock in browser on the real domain | Browser screenshot of the live site with the padlock visible | **Required** |
| 12 | Root account MFA | IAM → Dashboard → root account | MFA enabled, root not used day-to-day | IAM dashboard security recommendations, showing MFA green | **Required** |
| 13 | Confirm every resource is actually in `eu-north-1` | Top-right region selector, check EC2/RDS/S3 individually | All three in the same region | Not required as a screenshot, just confirm — a mismatch here silently breaks connectivity | **Required** |

---

## 2. Content, documentation, and team-process tasks

| # | Task | Detail | Required? |
|---|---|---|---|
| 1 | Use case diagram | Not present anywhere in the repo (`docs/wireframes/` and `docs/deployment-proof/` only have `.gitkeep`) | **Required** |
| 2 | ERD | `README.md` already references `docs/erd.png` — the file doesn't exist. Generate from `server/db/schema.sql` (dbdiagram.io imports MySQL DDL directly) | **Required** |
| 3 | AWS architecture diagram | `README.md` references `docs/aws-architecture.png` — doesn't exist. Must show: Users → Internet → SG → EC2 (public subnet) → RDS (private subnet), S3 + CloudWatch attached, IAM role annotated, VPC boundary drawn | **Required** |
| 4 | UI wireframes | `docs/wireframes/` is empty | **Required** |
| 5 | Deployment-proof screenshots | `docs/deployment-proof/` is empty. Once §1 above is done, this is just collecting the screenshots already listed there, plus the demo login flow | **Required** |
| 6 | Final technical report (≤15 pages) | Not in the repo. Structure is in the original build plan (intro, objectives, design, implementation, cloud/security, testing, challenges, future work, conclusion) | **Required** |
| 7 | Video presentation | No video files in the repo. Individual 3–4 min contributions + merged final cut | **Required** |
| 8 | Project proposal | Not in the repo — confirm whether this was already submitted separately at project start; if not, treat as required | **Required (verify)** |
| 9 | Git: get real commits from all four team members | `main` currently has commits from one person only (two git identities, same human). A second teammate's work exists only on the unmerged, structurally incompatible `origin/development` branch (`client/`, `database/` folders — a different, abandoned scaffold). Two team members have zero commits anywhere. Every member needs real, own-identity commits before the deadline, or the report needs to explicitly explain the gap | **Required** (explicitly assessed per the brief) |
| 10 | Git: PR workflow / branch protection | No evidence of PRs or a `develop` branch in active use; `main` has at least one amended (rewritten) commit. If time allows, start routing remaining changes through PRs into `develop` so there's real reviewed history to point to | **Recommended**, required if the brief grades this literally |
| 11 | Decide & document the divergent `origin/development` branch | Either merge/salvage anything useful from it, or explicitly note in the report that it was an early, abandoned direction — don't leave it unexplained for a marker to stumble on | **Recommended** |
| 12 | Add a `products.test.js` covering the quantity-bypass fix | The B4 fix (quantity ignored on `PUT /products/:id`) is verified manually but has no automated test, unlike the auth/stock paths | Optional |
| 13 | Historical placeholder secret in git history | `origin/development` has a commit with `JWT_SECRET=super_secret_jwt_key_2026` / `DB_PASSWORD=yourpassword` in a `.env.example`. Almost certainly placeholder text, not a real leak (verified none of the real, current secrets appear anywhere in history) — worth a five-minute look, not worth rewriting history over | Optional |

---

## 3. Attempted but not completed, and why

- **Running the app against a real MySQL instance to verify end-to-end**, rather than only the mocked test suite. Attempted via a local Docker container; blocked because the local user account isn't in the `docker` group and there's no passwordless `sudo` on this machine — both `docker run` and `sudo docker run` require an interactive password I can't supply. Not attempted via native `apt install mysql-server` for the same reason (needs `sudo`). This wasn't retried after `.env` was pointed at the real RDS endpoint, since verifying against production infrastructure directly wasn't asked for — but it means every fix in this session has been verified by (a) the mocked Jest suite and (b) manual code/syntax review, not a live database run. Worth doing yourself once RDS is confirmed reachable (§1 items 4–5).
- **Everything in §1 (AWS console tasks)** — no AWS console access from this environment; all of it requires you to act directly in the console or CLI with your own credentials.
- **Anything requiring your GitHub account** — pushing branches, opening PRs, enabling branch protection, or getting teammates to commit under their own identities all need to happen from your/their own machines and GitHub logins.
