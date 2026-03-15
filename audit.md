# Codebase Audit Report — Agentic-AI / Work Ping Server

**Date:** 2026-03-11
**Auditor:** Claude Code (Automated)
**Risk Level: MEDIUM-HIGH**

---

## Executive Summary

The project is a **Node.js/Express HR management system** backed by MongoDB, featuring employee management, project allocation, leave management, payroll, and attendance tracking. `CHANGES.md` documents 35 prior bug fixes, indicating active remediation — however, new issues were identified in this audit.

---

## 1. Project Structure

```
server/
├── models/              22 MongoDB schemas
├── controllers/         Web route handlers (admin & user)
├── routes/              Express route definitions
├── services/            OAuth, 2FA, mailer, payment gateways
├── middleware/          JWT validation, error handling
├── helpers/             Pagination, data reduction
├── utils/               Validators, error handling, axios
├── config/              Mongoose, Redis, Multer
├── app/                 Express app setup, Socket.io
└── cleanup/             Database cleanup utilities
```

**Tech Stack:**
- Runtime: Node.js (ES modules)
- Framework: Express 5.2.1
- Database: MongoDB 8.17.0 + Mongoose
- Cache: Redis 5.10.0
- Auth: JWT + bcrypt 6.0.0
- External: Google OAuth, Microsoft OAuth, Face Recognition API, WhatsApp Gateway, PhonePe

---

## 2. Architecture

```
Request → Middleware (CORS, JWT)
    ↓
Routes (REST endpoints)
    ↓
Controllers (Business logic)
    ↓
Models (MongoDB schemas)
    ↓
Database / External Services
```

**Key Patterns:**
- `asyncHandler` wrapper for uniform error forwarding
- Centralized error middleware with custom `AppError` class
- Cookie-based JWT auth (`accessToken` httpOnly cookie)
- Module aliases via `package.json` imports

---

## 3. Security Findings

### CRITICAL

| # | Issue | File | Line | Details |
|---|-------|------|------|---------|
| S1 | **Plaintext credentials in `.env`** | `.env` | Multiple | MongoDB URI with credentials, Redis IP + password, Google and Microsoft OAuth secrets, JWT secret, mail service key — all stored in plaintext and committed or accessible in repo |
| S2 | **Admin cookie `httpOnly: false`** | `controllers/web/admin/auth/controller.js` | 95 | Admin JWT cookie is readable by JavaScript — any XSS steals admin tokens |
| S3 | **Hardcoded credentials visible in source** | `.env` | — | `SECRET_KEY`, `MAIL_SERVICE_KEY`, `MONGODB_URI`, `REDIS_PASSWORD` are plaintext; `GOOGLE_CLIENT_SECRET` and `MS_CLIENT_SECRET` leak if repo is exposed |

### HIGH

| # | Issue | File | Details |
|---|-------|------|---------|
| S4 | **No rate limiting on auth endpoints** | `app/middleware.js` | Login and register routes are unprotected from brute force; `express-rate-limit` is in `package.json` but never applied |
| S5 | **No CSRF protection** | All routes | No CSRF tokens on any state-changing POST/PUT/DELETE endpoints |
| S6 | **Email verification never enforced** | `models/Account.js:32-34` | `emailVerified` defaults `false` and is never checked before granting access |
| S7 | **Project manager not validated as org member** | `controllers/web/admin/project/project.controller.js` | Any `User._id` can be assigned as project manager regardless of organization membership |
| S8 | **Foreign key references not validated** | Multiple controllers | `organizationId`, `userId`, and `projectId` references are not verified to exist before use |

### MEDIUM

| # | Issue | File | Details |
|---|-------|------|---------|
| S9 | **Pagination limit unbound** | `helpers/pagination.js:18` | `limit` query param is accepted with no maximum cap — passing `limit=100000` causes expensive queries |
| S10 | **Socket.io Redis errors unhandled** | `app/socket.io.js:23-31` | `redis.get(...)` inside socket handler has no try/catch; unhandled promise rejection can crash the process |
| S11 | **Missing security headers** | `app/middleware.js` | No `helmet` — no CSP, X-Frame-Options, X-Content-Type-Options, or HSTS |
| S12 | **Redis connection commented out** | `server.js:17` | `// await redis.connect();` — Redis is configured but never connected; features relying on it silently fail |
| S13 | **Role-based access control not enforced** | Routes | No middleware validates that a user's role permits the requested action |

### LOW

| # | Issue | Details |
|---|-------|---------|
| S14 | No `SameSite` default for all cookies | Edge cases where `sameSite` policy may not apply |
| S15 | File uploads have no virus scanning | Multer accepts files without content inspection |
| S16 | Profile image URL not validated as URL | Length is checked, format is not |
| S17 | Organization IPWhitelist not validated as IP | Accepts arbitrary strings |

---

## 4. Code Quality

### High Severity

| # | Issue | File | Line | Details |
|---|-------|------|------|---------|
| Q1 | **User register returns token in response body; login sets cookie** | `controllers/web/user/auth/controller.js` | — | Inconsistent auth delivery between register and login flows |
| Q2 | **Inconsistent error response format** | Multiple controllers | — | Three different shapes: `{ message }`, `{ status, error }`, `{ error }` — clients must handle all three |

### Medium Severity

| # | Issue | File | Details |
|---|-------|------|---------|
| Q3 | **451 `console.log` statements** | Codebase-wide | No structured logging; information leaks in production logs; should use Winston or Pino |
| Q4 | **Dead code / commented-out logic** | `controllers/web/user/attendance/controller.js:72-76` | Attendance DB record creation is commented out — attendance is only tracked in Flask, never written to MongoDB |
| Q5 | **Magic numbers not extracted as constants** | `admin/auth/controller.js:98` | `maxAge: 1000 * 60 * 60 * 24`, `5 * 1024 * 1024` bytes — should be named constants |
| Q6 | **Race condition: phone uniqueness** | `controllers/web/user/profile/controller.js` | Uniqueness check → update window allows two requests to claim the same phone; unique index catches it but error surfacing is inconsistent |
| Q7 | **`TEXT_CLASSIFICATION_URI` is empty** | `.env` | Variable defined but empty; calls to this service will fail silently or throw |

### Low Severity

| # | Issue | Details |
|---|-------|---------|
| Q8 | Endpoint URLs use action verbs (`/get-members`, `/create-project`, `/remove-members`) instead of REST noun conventions |
| Q9 | No `.env.example` or environment variable documentation |
| Q10 | `NODE_ENV` not used; custom `MODE` variable used only for cookie flags |
| Q11 | `package-lock.json` in `.gitignore` — builds are non-reproducible across environments |

---

## 5. Bugs

| # | Bug | File | Line | Status |
|---|-----|------|------|--------|
| B1 | **Admin cookie `httpOnly: false`** | `controllers/web/admin/auth/controller.js` | 95 | **NOT FIXED** (CHANGES.md implies it should be) |
| B2 | **Attendance DB record never created** | `controllers/web/user/attendance/controller.js` | 72-76 | Present — logic commented out |
| B3 | **`getProfile` does not return `role`** | `controllers/web/user/profile/controller.js` | 20-22 | `User` doc has no `role`; `API.md` says role is returned |
| B4 | **Leave dates: today may be rejected by `noPast` validator** | `controllers/web/user/leaves/controller.js` | 31-32 | Edge case — same-day leave requests may fail |
| B5 | **`Holiday` model was exported as `DayInfo`** | `models/Holiday.js` | — | Listed as fixed in CHANGES.md #21 — verify applied |
| B6 | **`CL.OD` model was completely empty** | `models/CL.OD.js` | — | Listed as fixed in CHANGES.md #22 — verify applied |

---

## 6. Performance

| # | Issue | File | Details |
|---|-------|------|---------|
| P1 | **Unbounded pagination** | `helpers/pagination.js:18` | No max `limit` — large values cause slow full-collection scans |
| P2 | **Missing index: `Account` by role** | `models/Account.js` | Role lookups without index will scan all accounts |
| P3 | **Aggregation pipelines on large collections without timeout** | Multiple controllers | No `maxTimeMS` set on complex pipelines |
| P4 | **Redis disabled** | `server.js:17` | Caching layer exists but is unused |

**Indexes Present (confirmed):**
- ✅ `User`: email, organizationId, role, isActive
- ✅ `Project`: name + org (unique), status
- ✅ `ProjectMember`: composite unique (project + user)
- ✅ `Attendance`: composite unique (user + date)
- ✅ `Leave`: userId, status, organizationId

---

## 7. Dependencies

**File:** `server/package.json`

| Package | Version | Status |
|---------|---------|--------|
| express | 5.2.1 | ✅ Current |
| mongoose | 8.17.0 | ✅ Current |
| jsonwebtoken | 9.0.3 | ✅ Current |
| bcrypt | 6.0.0 | ✅ Current |
| redis | 5.10.0 | ✅ Current |
| nodemailer | 7.0.12 | ✅ Current |
| socket.io | 4.8.3 | ⚠️ Not latest major |
| axios | 1.13.2 | ❌ Outdated |
| helmet | — | ❌ Not installed |
| express-rate-limit | — | ❌ In package.json but not applied |

**Issues:**
- `axios` is outdated — potential unpatched vulnerabilities
- `helmet` not installed — no automatic security headers
- `express-rate-limit` declared but never applied to any route
- `package-lock.json` gitignored — no reproducible builds

---

## 8. Database Design

| # | Issue | Model | Details |
|---|-------|-------|---------|
| D1 | No cascade deletes | `User`, `ProjectMember`, `Team` | Deleting an org or user leaves orphaned child documents |
| D2 | `sparse: true` on `phone` | `User` | Sparse unique indexes do not behave reliably with `null` values across all Mongoose versions |
| D3 | `emailVerified` never enforced | `Account` | Defaults `false`, never read before granting access |
| D4 | No migrations framework | All | Schema changes require ad-hoc scripts with no rollback |
| D5 | `twoFactorSecret` defaults to `""` | `Account` | Empty string vs. `null` creates inconsistency in 2FA detection logic |

---

## 9. Testing

**Current coverage: 0%**

- No unit tests
- No integration tests
- No E2E tests
- `test` script in `package.json` runs `nodemon` (dev server), not a test runner

**Impact:** No regression protection, no CI validation gate, refactoring is high-risk.

**Recommended additions:**
```json
{
  "devDependencies": {
    "jest": "^29.0.0",
    "supertest": "^6.3.0",
    "mongodb-memory-server": "^8.0.0"
  }
}
```

---

## 10. Documentation

| Item | Status |
|------|--------|
| `API.md` — user API reference (722 lines) | ✅ Present |
| `PT.md` — project members API (95 lines) | ✅ Present |
| `CHANGES.md` — bug fix log (35 items) | ✅ Present |
| README | ❌ Missing |
| Setup / onboarding guide | ❌ Missing |
| Architecture diagram | ❌ Missing |
| Auth & authorization model documentation | ❌ Missing |
| Deployment guide | ❌ Missing |
| `.env.example` | ❌ Missing |
| JSDoc / inline code comments | ❌ Sparse |

---

## 11. Prioritized Action Plan

### Immediate (Critical — Fix Before Any Deployment)

1. **Rotate all credentials** — MongoDB, Redis, Google OAuth, Microsoft OAuth, JWT secret, mail service key
2. **Fix `httpOnly: false`** → `httpOnly: true` in `controllers/web/admin/auth/controller.js:95`
3. **Apply rate limiting** to all auth endpoints (`/login`, `/register`, `/forgot-password`)
4. **Add `helmet`** middleware for security headers
5. **Enforce email verification** before granting account access

### High (Fix This Sprint)

6. **Validate foreign keys** — ensure `projectManager`, `organizationId`, `userId` exist before write
7. **Standardize error response format** across all controllers
8. **Replace `console.log`** with structured logger (Winston or Pino)
9. **Enable Redis** (`await redis.connect()`) or remove it completely
10. **Fix attendance DB write** — uncomment / complete the MongoDB record creation
11. **Cap pagination `limit`** to a safe maximum (e.g., 100)

### Medium (Schedule)

12. Add CSRF protection (e.g., `csurf` or double-submit cookie pattern)
13. Enforce role-based access control at middleware level
14. Add test suite (unit + integration)
15. Create `.env.example` documenting all required environment variables
16. Update `axios` and other outdated dependencies
17. Enforce `emailVerified` in auth middleware

### Low (Backlog)

18. Adopt REST noun conventions for URL design
19. Add JSDoc to public controller functions
20. Add `maxTimeMS` to heavy aggregation queries
21. Write README and architecture documentation
22. Fix `package-lock.json` gitignore entry

---

## 12. Files Requiring Attention

| Priority | File | Reason |
|----------|------|--------|
| CRITICAL | `server/.env` | Rotate all secrets immediately |
| CRITICAL | `controllers/web/admin/auth/controller.js:95` | `httpOnly: false` on admin cookie |
| HIGH | `app/middleware.js` | Add rate limiting and helmet |
| HIGH | `controllers/web/user/attendance/controller.js:72-76` | DB write commented out |
| HIGH | `controllers/web/admin/project/project.controller.js` | Missing FK validation |
| HIGH | `controllers/web/admin/project/teams.controller.js` | Missing FK validation |
| MEDIUM | `helpers/pagination.js:18` | No max limit cap |
| MEDIUM | `app/socket.io.js:23-31` | Unhandled promise in socket handler |
| MEDIUM | `server.js:17` | Redis connect commented out |
| MEDIUM | `controllers/web/user/auth/controller.js` | Register/login cookie inconsistency |
| LOW | `package.json` | Update axios, add helmet, lock file policy |

---

## 13. Risk Summary

| Category | Critical | High | Medium | Low |
|----------|:--------:|:----:|:------:|:---:|
| Security | 3 | 5 | 6 | 4 |
| Code Quality | 0 | 2 | 5 | 4 |
| Bugs | 2 | 2 | 2 | 0 |
| Performance | 0 | 0 | 4 | 0 |
| Testing | 1 | 0 | 0 | 0 |
| Documentation | 0 | 0 | 1 | 5 |

**Conclusion:** The codebase is not production-ready in its current state. The exposed credentials and insecure admin cookie are blockers. The lack of tests makes safe iteration difficult. Prioritize security fixes before any further feature work.
