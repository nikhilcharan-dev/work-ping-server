# Pending Tasks

## 🔴 Critical — Missing Files to Create

### Controllers
- [ ] `server/controllers/organizationController.js` — CRUD operations for Organization model
- [ ] `server/controllers/admin2faController.js` — 2FA setup, verify-setup, verify-login, disable
- [ ] `server/controllers/orgAdminController.js` — Manage OrgAdmin assignments (primary/secondary admin)

### Routes
- [ ] `server/routes/organizationRoutes.js` — REST endpoints for `/api/organizations`
- [ ] `server/routes/admin2faRoutes.js` — 2FA endpoints under `/api/auth/admin/2fa`
- [ ] `server/routes/orgAdminRoutes.js` — Endpoints for `/api/org-admins`

### Middleware
- [ ] `server/middleware/ipWhitelistMiddleware.js` — Validate request IP against `Organization.IPWhitelist`

---

## 🟡 Modifications Required on Existing Files

### `server/models/Admin.js`
- [ ] Add `twoFactorSecret` field (`String`)
- [ ] Add `twoFactorEnabled` field (`Boolean`, default: `false`)

### `server/server.js` (or main app entry)
- [ ] Register `/api/organizations` route → `organizationRoutes`
- [ ] Register `/api/auth/admin/2fa` route → `admin2faRoutes`
- [ ] Register `/api/org-admins` route → `orgAdminRoutes`

### `server/middleware/authMiddleware.js`
- [ ] Verify `protect` middleware exists and works with admin JWT
- [ ] Verify `adminOnly` middleware is exported

---

## 🟢 Already Completed
- [x] Organization model (`server/models/Organization.js`)
- [x] Admin model (`server/models/Admin.js`) — base schema
- [x] OrgAdmin model (`server/models/Admin.Org.js`) — links Organization to primary/secondary Admin
- [x] User model (`server/models/User.js`)
- [x] Auth controller (`server/controllers/authController.js`)
- [x] Admin controller (`server/controllers/adminController.js`)
- [x] Auth routes (`server/routes/authRoutes.js`)
- [x] Admin routes (`server/routes/adminRoutes.js`)
- [x] Auth middleware (`server/middleware/authMiddleware.js`)
- [x] npm packages installed: `speakeasy`, `qrcode`, `jsonwebtoken`

---

## 📌 API Endpoints to Implement

### Organization (`/api/organizations`)
| Method | Endpoint                              | Auth       | Description              |
|--------|---------------------------------------|------------|--------------------------|
| POST   | `/api/organizations`                  | Admin only | Create organization      |
| GET    | `/api/organizations`                  | Admin only | List all organizations   |
| GET    | `/api/organizations/:id`              | Admin only | Get single organization  |
| PUT    | `/api/organizations/:id`              | Admin only | Update organization      |
| DELETE | `/api/organizations/:id`              | Admin only | Delete organization      |
| PUT    | `/api/organizations/:id/ip-whitelist` | Admin only | Add/remove whitelisted IPs |

### OrgAdmin (`/api/org-admins`)
| Method | Endpoint                              | Auth       | Description                          |
|--------|---------------------------------------|------------|--------------------------------------|
| POST   | `/api/org-admins`                     | Admin only | Assign primary/secondary admin to org |
| GET    | `/api/org-admins`                     | Admin only | List all org-admin assignments        |
| GET    | `/api/org-admins/:orgId`              | Admin only | Get admins for a specific org         |
| PUT    | `/api/org-admins/:id`                 | Admin only | Update admin assignment               |
| DELETE | `/api/org-admins/:id`                 | Admin only | Remove admin assignment               |

### Admin 2FA (`/api/auth/admin/2fa`)
| Method | Endpoint                           | Auth       | Description                    |
|--------|------------------------------------|------------|--------------------------------|
| POST   | `/api/auth/admin/2fa/setup`        | Admin only | Generate 2FA secret & QR code  |
| POST   | `/api/auth/admin/2fa/verify-setup` | Admin only | Verify token & enable 2FA      |
| POST   | `/api/auth/admin/2fa/verify-login` | Public     | Verify 2FA during login flow   |
| POST   | `/api/auth/admin/2fa/disable`      | Admin only | Disable 2FA                    |

---

## 🗂️ Models Reference

### `Organization` — `server/models/Organization.js`
| Field         | Type     | Notes              |
|---------------|----------|--------------------|
| `name`        | String   |                    |
| `type`        | String   |                    |
| `clDays`      | Number   | Casual leave days  |
| `description` | String   |                    |
| `IPWhitelist` | [String] | Allowed IPs        |
| `foundedAt`   | Date     |                    |

### `OrgAdmin` — `server/models/Admin.Org.js`
| Field            | Type     | Notes                                |
|------------------|----------|--------------------------------------|
| `organizationId` | ObjectId | Ref: `Organization` (required, indexed) |
| `primaryAdmin`   | ObjectId | Ref: `Admin` (required)              |
| `secondaryAdmin` | ObjectId | Ref: `Admin` (optional)              |

### `Admin` — `server/models/Admin.js`
| Field              | Type    | Notes                        |
|--------------------|---------|------------------------------|
| `twoFactorSecret`  | String  | ⚠️ **To be added**          |
| `twoFactorEnabled` | Boolean | ⚠️ **To be added** (default: false) |

---

## 🔧 Import Aliases Reference (from `package.json`)
| Alias              | Path                  |
|--------------------|-----------------------|
| `#webRoutes/*`     | `./routes/web/*`      |
| `#appRoutes/*`     | `./routes/app/*`      |
| `#appController/*` | `./controllers/app/*` |
| `#webController/*` | `./controllers/web/*` |
| `#models/*`        | `./models/*`          |
| `#utils/*`         | `./utils/*`           |
| `#middleware/*`     | `./middleware/*`       |
| `#adminHelper/*`   | `./helpers/admin/*`   |
| `#config/*`        | `./config/*`          |
| `#helpers/*`       | `./helpers/*`         |
| `#services/*`      | `./services/*`        |

> **Note:** New controllers/routes should follow the existing `web/` and `app/` directory structure based on these aliases.

---

## 📝 Notes
- **OrgAdmin relationship:** Each organization has one primary admin (required) and an optional secondary admin. Controllers must enforce this constraint.
- **2FA login flow:** Admin logs in with email/password → server returns `adminId` \+ `requires2FA: true` → client sends `adminId` \+ TOTP token to `/verify-login` → server returns JWT
- **IP Whitelist middleware** should normalize IPv6-mapped IPv4 addresses (`::ffff:` prefix)
- All 2FA tokens use TOTP with `window: 2` for clock drift tolerance

---

*Last updated: 2025-07-24*
