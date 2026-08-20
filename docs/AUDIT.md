# Readiness Audit — Cloud Inventory Management System

Audited: 2026-08-20 · Deadline: 2026-08-25 (**5 days remaining**) · Read-only, no code changed.

---

## A. Readiness summary

The application code itself is in strong shape — auth, RBAC, the transactional stock-movement pattern, parameterised SQL, and S3 image handling are all correctly implemented and match the plan almost exactly. That is not where this project is at risk.

Two things are: **required deliverables are almost entirely absent** (no ERD, no use-case diagram, no AWS architecture diagram, no wireframes, no deployment-proof screenshots, no report, no video, no proposal — only the IAM policy docs and API contract exist), and **the git history does not show team contribution**. `main` has five commits, all from one contributor identity. A second teammate's four commits exist only on an unmerged, structurally incompatible `origin/development` branch. Two of the four team members have zero commits anywhere in this repository. Since the brief explicitly assesses git workflow and PR history, this will cost marks as-is regardless of code quality.

**Estimated completion against the full course requirement: ~55%.** Breaking that down: functional code ≈ 90%, security posture ≈ 95%, repository/git hygiene ≈ 40%, required deliverables ≈ 10%. The code will not be the bottleneck for the 25 August deadline — the deliverables and team-process evidence will be, and there are five days left to produce them.

---

## B. Blockers — would cost marks as submitted, ordered by severity

### B1. Required deliverables are missing (design doc, proof, report, video, proposal)
Confirmed by directory listing: `docs/deployment-proof/` and `docs/wireframes/` contain only `.gitkeep` placeholders. `README.md:79` references `docs/aws-architecture.png` and `docs/erd.png` — neither file exists. No use-case diagram, no 15-page report, no video files, no project proposal anywhere in the repo.
**Fix:** This is the single biggest risk to the deadline. Per the original build plan, days 3, 8, 9 and 10 exist specifically to produce these. If those days haven't happened yet, they need to happen now, in this order: ERD + architecture diagram + wireframes → deployment-proof screenshots (once AWS is actually running, see §D) → report → video.

### B2. Commit history does not demonstrate team contribution
`git log --format='%an|%ae' main` shows all 5 commits on `main` from a single identity (`afevi jerry` / `af-jerry`, two emails, same person). `git log main..origin/development` shows 4 commits from a second teammate (`Neequaye Ashie <2425403683@live.gctu.edu.gh>`), but they sit on a divergent branch using an entirely different, incompatible structure (`client/server.js`, `database/schema.sql` — never merged, and abandoned in favour of the current `server/src` layout). Two team members (BE, FE per the plan's role codes) have **zero** commits anywhere in this repository, on any branch.
**Fix:** Get every team member to commit real work under their own GitHub identity — even small, real contributions (a route, a test, a page) — before the deadline. If `origin/development`'s work is truly abandoned, say so explicitly in the report rather than leaving it as an unexplained dead branch; a marker who checks GitHub will find it.

### B3. No branch protection / PR workflow evident, contradicting the plan's own stated process
`git log` shows direct commits to `main` with no merge commits, and the reflog shows an amended commit (`be9ca8a`, "commit (amend): updated UI/UX") — i.e., history was rewritten on `main` directly. There is no `develop` branch in active use on this remote's default flow, and no evidence of pull requests.
**Fix:** Either retroactively document why the simplified flow was used, or — better, with 5 days left — start using PRs into `develop` for whatever work remains, so there's at least some real reviewed-PR history to screenshot.

### B4. `products.update()` lets `quantity` be overwritten outside the audited stock-movement transaction
`server/src/services/products.service.js:106,130` — the `PUT /products/:id` handler accepts and writes `quantity` directly via a plain `UPDATE products SET ... quantity = ? ...`, with no `stock_movements` row created and no `SELECT ... FOR UPDATE` lock. This bypasses the entire transactional design in `stock.service.js:6-42` that the plan (and your own report, presumably) will cite as a strength. Any admin/staff editing a product's other fields (e.g., fixing a typo in `name`) can also silently change `quantity` with zero audit trail, or two concurrent requests (a stock movement and a product edit) can race on the same row without the edit path taking a lock.
**Fix:** Either (a) exclude `quantity` from the product-edit form/payload entirely and route all quantity changes through `/stock/in` and `/stock/out`, or (b) if direct correction must stay possible, wrap it in the same `FOR UPDATE` transaction pattern and write a `stock_movements` row (e.g., type `ADJUSTMENT`) so it's still auditable. Given how close this is to the deadline, (a) is the smaller change: drop `quantity` from `productRules`/the update payload in `products.routes.js` and `products.js` (frontend), and stop rendering it as an editable field on product edit — likely a very quick change (untested; verify before relying on this fix — remember, no code was changed for this audit).

### B5. No server-side path to create staff/admin accounts
`auth.controller.js:6-7` — the comment says *"an existing admin (see routes/auth.routes.js for the guarded variant)"*, but `auth.routes.js` has no such route. Public `/auth/register` always creates a `viewer` (`auth.controller.js:8`). The only way any account gets `admin`/`staff` role today is `db/seed-users.js`, run directly against the database. If a marker registers their own account to test RBAC, they get a `viewer` and can never become `staff`/`admin` through the app itself.
**Fix:** Either add an admin-only `POST /api/auth/users` (or similar) endpoint that lets an admin create/promote accounts, or explicitly document in the report/README that role assignment is DB-seeded only by design (acceptable for a capstone demo, but currently undocumented and the misleading code comment should be removed either way).

---

## C. Gaps — incomplete but not fatal

- **README doc drift on pre-signed URL expiry.** `README.md:86` still says *"short-lived (300s) pre-signed URLs"*, but `S3_URL_EXPIRY` (added earlier this session) now defaults to 900s (`server/src/config/env.js`). Quick fix, but as-is the report/README would state something false about your own security design.
- **Region inconsistency between docs and live config.** README/plan/`docs/iam` all specify `eu-west-1`. The actual `server/.env` has `AWS_REGION=eu-north-1` and an `eu-north-1` RDS endpoint. Not wrong by itself, but confirm every resource (EC2, RDS, S3) is genuinely in the same region — a mismatch here is exactly the "half of all 'my resource has disappeared' panics" the plan warned about.
- **IAM policy JSON still has the placeholder bucket name.** `docs/iam/ec2-s3-inline-policy.json` has `Resource: "arn:aws:s3:::your-inventory-bucket-name/products/*"` — needs the real bucket name (`inventory-system-grp-2026`, per current `.env`) filled in before it's pasted into the AWS console, or the policy grants access to nothing.
- **No query-parameter validation on list/report endpoints.** `products.routes.js:21` (`GET /`), `stock.routes.js:19` (`GET /movements`), and the reports routes accept `search`, `category`, `page`, `limit`, `from`, `to` with no `express-validator` checks — unlike every POST/PUT route. Low risk in practice (the service layer's `parseInt`/`Math.max`/`Math.min` guards in `products.service.js:23-24` and `stock.service.js:53-54` prevent bad values from doing damage), but it means the "input validation on every endpoint" checklist item is not literally true.
- **Dead code:** `layout.js:113` toggles a `body.role-viewer` class that no stylesheet selector references (checked `styles.css`, `components.css`, `tokens.css`) — harmless but unused.
- **Sloppy commit message.** `662f9d7`: `git add -A && git commit -m "working state before UI refactor"` — looks like a shell command got pasted as the message rather than a real one being written; doesn't follow the `feat(scope): message` convention the team's own plan specifies.
- **A placeholder-looking secret sits in git history on `origin/development`.** `server/.env.example` on that branch (commit under `f333561`'s lineage) contains `JWT_SECRET=super_secret_jwt_key_2026` and `DB_PASSWORD=yourpassword`. These read as example placeholders, not real credentials, and grepping the *entire* history for the actual live secrets in today's `.env` (RDS password, JWT secret, bucket name) found nothing — so this is very unlikely to be a real leak. Still, worth a five-minute look at that branch to confirm before dismissing it.

---

## D. Manual verification checklist — confirm these in the AWS console

Cannot be determined from the code in this repository. `server/.env` confirms an RDS endpoint (`inventory-db.c1goqqw8w123.eu-north-1.rds.amazonaws.com`) and S3 bucket name (`inventory-system-grp-2026`) exist and are configured, but says nothing about how they're actually locked down.

- [ ] EC2 instance running, with an **Elastic IP** attached (not the default ephemeral public IP)
- [ ] IAM instance role attached to that EC2 instance, and confirm the **deployed** server's `.env` (not just this local copy) has no `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` set — local `.env` already correctly omits these, but that only proves local dev is clean, not the EC2 box
- [ ] RDS instance shows **"Publicly accessible: No"**, and its security group's inbound rule references the EC2 security group (not an IP range or `0.0.0.0/0`)
- [ ] S3 bucket has **Block Public Access: On** (all four settings) and default encryption enabled
- [ ] CloudWatch agent installed on EC2, a log group is receiving real entries, and at least one alarm exists (e.g., CPU > 70%)
- [ ] Billing alarm configured, and current credit/usage balance checked (per the plan's Free Tier warning — new AWS accounts after 15 July 2025 run on a 6-month credit model, not the old 12-month trial)
- [ ] HTTPS working on the live deployed URL (padlock in browser, valid cert — e.g., via DuckDNS + certbot as the plan describes)
- [ ] Root AWS account has MFA enabled and is not the account used for day-to-day work
- [ ] All resources (EC2, RDS, S3) confirmed in the **same** region (flagged as a doc inconsistency above — verify against the live console)

---

## E. Nice-to-have

Not applicable — items in B and D need attention before this section is worth spending time on.
