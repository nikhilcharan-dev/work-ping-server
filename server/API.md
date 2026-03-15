# User API Documentation

Base URL: `/api`

All routes under `/api/user/*` require JWT authentication via the `accessToken` cookie (set during login).

---

## Authentication

### POST `/api/auth/register`

Register a new user account.

**Body:**

| Field            | Type   | Required | Description              |
|------------------|--------|----------|--------------------------|
| name             | string | Yes      | Full name                |
| userEmail        | string | Yes      | Email address            |
| password         | string | Yes      | Password                 |
| organizationId   | string | Yes      | Organization ObjectId    |
| role             | string | Yes      | Role (e.g. "user")       |

**Response:** `201 Created`

```json
{
  "message": "Register Successful",
  "userDetails": {
    "id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "organizationId": "...",
    "role": "user"
  },
  "token": "jwt_token_here"
}
```

---

### POST `/api/auth/login`

Login with email and password. Sets `accessToken` cookie.

**Body:**

| Field    | Type   | Required | Description   |
|----------|--------|----------|---------------|
| userEmail| string | Yes      | Email address |
| password | string | Yes      | Password      |

**Response:** `200 OK`

```json
{
  "message": "Login Successful",
  "userDetails": { ... }
}
```

**Error Responses:**
- `400` — Email and password required
- `401` — User does not exist / Invalid credentials

---

## Profile

### GET `/api/user/profile`

Get the authenticated user's profile with populated organization and team details.

**Response:** `200 OK`

```json
{
  "_id": "...",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "employeeId": "EMP001",
  "gender": "male",
  "organizationId": { "_id": "...", "name": "Acme Corp", "type": "IT" },
  "teamId": { "_id": "...", "teamName": "Backend", "description": "..." },
  "salary": 50000,
  "dob": "1995-01-15",
  "address": "123 Main St",
  "roleInTeam": "member",
  "isActive": true
}
```

**Error Responses:**
- `403` — Unauthorized (no/invalid token)
- `404` — User not found

---

### POST `/api/user/update-profile`

Update the authenticated user's profile. Only allowed fields can be updated.

**Body:**

| Field        | Type   | Required | Description            |
|--------------|--------|----------|------------------------|
| name         | string | No       | Full name              |
| phone        | string | No       | Phone number           |
| gender       | string | No       | male / female / other  |
| dob          | date   | No       | Date of birth          |
| address      | string | No       | Address                |
| profileImage | string | No       | Profile image URL      |

**Response:** `200 OK`

```json
{
  "message": "Profile updated successfully",
  "userDetails": { ... }
}
```

**Error Responses:**
- `400` — No valid fields to update
- `404` — User not found

---

### POST `/api/user/change-password`

Change the authenticated user's password.

**Body:**

| Field           | Type   | Required | Description          |
|-----------------|--------|----------|----------------------|
| currentPassword | string | Yes      | Current password     |
| newPassword     | string | Yes      | New password         |

**Response:** `200 OK`

```json
{
  "message": "Password changed successfully"
}
```

**Error Responses:**
- `400` — Current password and new password are required
- `401` — Current password is incorrect
- `404` — User not found / Account not found

---

### POST `/api/user/deactivate-account`

Deactivate the authenticated user's account. Sets `isActive` to false and clears the auth cookie.

**Body:**

| Field    | Type   | Required | Description                     |
|----------|--------|----------|---------------------------------|
| password | string | Yes      | Password to confirm deactivation|

**Response:** `200 OK`

```json
{
  "message": "Account deactivated successfully"
}
```

**Error Responses:**
- `400` — Password is required to deactivate account
- `401` — Invalid password
- `404` — User not found / Account not found

---

## Leaves

### POST `/api/user/leaves/apply`

Apply for leave on one or more dates.

**Body:**

| Field  | Type     | Required | Description                          |
|--------|----------|----------|--------------------------------------|
| dates  | date[]   | Yes      | Array of leave dates (ISO format)    |
| reason | string   | No       | Reason for leave                     |

**Response:** `201 Created`

```json
{
  "message": "Leave application submitted successfully",
  "leaveDetails": {
    "_id": "...",
    "userId": "...",
    "organizationId": "...",
    "dates": ["2025-07-01", "2025-07-02"],
    "reason": "Personal work",
    "status": "pending",
    "appliedBy": "..."
  }
}
```

**Error Responses:**
- `400` — At least one leave date is required
- `404` — User not found / Organization not found

---

### GET `/api/user/leaves/my-leaves`

Get all leave applications of the authenticated user with pagination.

**Query Parameters:**

| Param  | Type   | Default | Description                                  |
|--------|--------|---------|----------------------------------------------|
| page   | number | 1       | Page number                                  |
| limit  | number | 10      | Records per page                             |
| status | string | —       | Filter by status: pending / approved / rejected |

**Response:** `200 OK`

```json
{
  "totalRecords": 5,
  "totalPages": 1,
  "leaves": [ ... ]
}
```

---

### GET `/api/user/leaves/balance`

Get the leave balance for the current year (based on organization's `clDays`).

**Response:** `200 OK`

```json
{
  "totalCLDays": 12,
  "usedDays": 3,
  "remainingDays": 9
}
```

**Error Responses:**
- `404` — User not found / Organization not found

---

### GET `/api/user/leaves/:leaveId`

Get a specific leave application by its ID.

**URL Parameters:**

| Param   | Type   | Description       |
|---------|--------|-------------------|
| leaveId | string | Leave ObjectId    |

**Response:** `200 OK`

```json
{
  "_id": "...",
  "userId": "...",
  "dates": ["2025-07-01"],
  "status": "approved",
  "reason": "...",
  "approvedBy": { "name": "Jane Doe", "email": "jane@example.com" }
}
```

**Error Responses:**
- `400` — Invalid leaveId
- `404` — Leave not found

---

### DELETE `/api/user/leaves/cancel/:leaveId`

Cancel a pending leave application. Only leaves with status `pending` can be cancelled.

**URL Parameters:**

| Param   | Type   | Description       |
|---------|--------|-------------------|
| leaveId | string | Leave ObjectId    |

**Response:** `200 OK`

```json
{
  "message": "Leave cancelled successfully"
}
```

**Error Responses:**
- `400` — Invalid leaveId / Only pending leaves can be cancelled
- `404` — Leave not found

---

## Organisation

### GET `/api/user/organisation/my-organization`

Get details of the authenticated user's organization.

**Response:** `200 OK`

```json
{
  "_id": "...",
  "name": "Acme Corp",
  "type": "IT",
  "clDays": 12,
  "description": "...",
  "IPWhitelist": [],
  "foundedAt": "2020-01-01"
}
```

**Error Responses:**
- `404` — User not found / Organization not found

---

### GET `/api/user/organisation/my-team`

Get the authenticated user's primary team details with manager and leader info.

**Response:** `200 OK`

```json
{
  "_id": "...",
  "teamName": "Backend",
  "description": "Backend development team",
  "organizationId": "...",
  "managerId": { "name": "Alice", "email": "alice@example.com" },
  "leaderIds": [{ "name": "Bob", "email": "bob@example.com" }]
}
```

**Error Responses:**
- `404` — User not found / You are not assigned to any team / Team not found

---

### GET `/api/user/organisation/my-team-members`

Get all active members of the authenticated user's primary team.

**Response:** `200 OK`

```json
[
  {
    "_id": "...",
    "userId": { "name": "John", "email": "john@example.com", "phone": "...", "roleInTeam": "member", "profileImage": null },
    "teamId": "...",
    "roleInTeam": "member",
    "isActive": true
  }
]
```

**Error Responses:**
- `404` — User not found / You are not assigned to any team

---

### GET `/api/user/organisation/my-teams`

Get all teams the authenticated user is a member of (via TeamMembership).

**Response:** `200 OK`

```json
[
  {
    "_id": "...",
    "userId": "...",
    "teamId": { "teamName": "Backend", "description": "...", "organizationId": "..." },
    "organizationId": { "name": "Acme Corp" },
    "roleInTeam": "member",
    "isActive": true
  }
]
```

---

## Payroll

### GET `/api/user/payroll/my-salary-slips`

Get all salary slips of the authenticated user with pagination.

**Query Parameters:**

| Param  | Type   | Default | Description                         |
|--------|--------|---------|-------------------------------------|
| page   | number | 1       | Page number                         |
| limit  | number | 10      | Records per page                    |
| status | string | —       | Filter by status: pending / paid    |

**Response:** `200 OK`

```json
{
  "totalRecords": 6,
  "totalPages": 1,
  "salarySlips": [
    {
      "_id": "...",
      "userId": "...",
      "month": "2025-06",
      "baseSalary": 50000,
      "bonuses": 5000,
      "deductions": 2000,
      "tax": 5000,
      "netSalary": 48000,
      "status": "paid"
    }
  ]
}
```

---

### GET `/api/user/payroll/by-month`

Get salary slip for a specific month.

**Query Parameters:**

| Param | Type   | Required | Description                    |
|-------|--------|----------|--------------------------------|
| month | string | Yes      | Month identifier (e.g. "2025-06") |

**Response:** `200 OK`

```json
{
  "_id": "...",
  "userId": "...",
  "month": "2025-06",
  "daysPresent": 22,
  "lopDays": 0,
  "baseSalary": 50000,
  "netSalary": 48000,
  "status": "paid"
}
```

**Error Responses:**
- `400` — Month is required
- `404` — Salary slip not found for the given month

---

### GET `/api/user/payroll/:salaryId`

Get a specific salary slip by ID.

**URL Parameters:**

| Param    | Type   | Description        |
|----------|--------|--------------------|
| salaryId | string | Salary ObjectId    |

**Response:** `200 OK`

```json
{
  "_id": "...",
  "userId": "...",
  "month": "2025-06",
  "baseSalary": 50000,
  "netSalary": 48000,
  "status": "paid"
}
```

**Error Responses:**
- `400` — Invalid salaryId
- `404` — Salary slip not found

---

## Projects

### GET `/api/user/projects/my-projects`

Get all projects assigned to the authenticated user with pagination.

**Query Parameters:**

| Param  | Type   | Default | Description                                       |
|--------|--------|---------|---------------------------------------------------|
| page   | number | 1       | Page number                                       |
| limit  | number | 10      | Records per page                                  |
| status | string | —       | Filter by project status: active / completed / onHold |

**Response:** `200 OK`

```json
{
  "totalRecords": 3,
  "totalPages": 1,
  "projects": [
    {
      "_id": "...",
      "userId": "...",
      "projectId": "...",
      "role": "developer",
      "project": {
        "name": "Project Alpha",
        "description": "...",
        "status": "active",
        "projectManager": "...",
        "organizationId": "..."
      }
    }
  ]
}
```

---

### GET `/api/user/projects/:projectId`

Get details of a specific project. User must be a member of the project.

**URL Parameters:**

| Param     | Type   | Description         |
|-----------|--------|---------------------|
| projectId | string | Project ObjectId    |

**Response:** `200 OK`

```json
{
  "project": {
    "_id": "...",
    "name": "Project Alpha",
    "description": "...",
    "status": "active",
    "projectManager": { "name": "Alice", "email": "alice@example.com" },
    "organizationId": { "name": "Acme Corp" },
    "assignedDate": "2025-01-01",
    "dueDate": "2025-12-31"
  },
  "myRole": "developer"
}
```

**Error Responses:**
- `400` — Invalid projectId
- `403` — You are not a member of this project
- `404` — Project not found

---

### GET `/api/user/projects/:projectId/members`

Get all active members of a specific project. User must be a member of the project.

**URL Parameters:**

| Param     | Type   | Description         |
|-----------|--------|---------------------|
| projectId | string | Project ObjectId    |

**Response:** `200 OK`

```json
[
  {
    "_id": "...",
    "projectId": "...",
    "userId": { "name": "John", "email": "john@example.com", "phone": "...", "roleInTeam": "member", "profileImage": null },
    "role": "developer",
    "isActive": true
  }
]
```

**Error Responses:**
- `400` — Invalid projectId
- `403` — You are not a member of this project

---

## Attendance

> **Note:** The `POST /api/attendance/verify-mark-attendance` endpoint (face-verification based) is registered separately in the central routes and is not documented here as it was pre-existing.

### GET `/api/user/attendance/my-attendance`

Get the authenticated user's attendance history with pagination and optional filters.

**Query Parameters:**

| Param     | Type   | Default | Description                                        |
|-----------|--------|---------|----------------------------------------------------|
| page      | number | 1       | Page number                                        |
| limit     | number | 10      | Records per page                                   |
| startDate | date   | —       | Filter from this date (ISO format)                 |
| endDate   | date   | —       | Filter up to this date (ISO format)                |
| status    | string | —       | Filter by status: present / absent / late / halfDay|

**Response:** `200 OK`

```json
{
  "totalRecords": 22,
  "totalPages": 3,
  "attendance": [
    {
      "_id": "...",
      "userId": "...",
      "organizationId": "...",
      "date": "2025-07-01",
      "status": "present",
      "checkIn": "2025-07-01T09:00:00.000Z",
      "checkOut": "2025-07-01T18:00:00.000Z",
      "remarks": ""
    }
  ]
}
```

---

### GET `/api/user/attendance/by-date`

Get attendance record for a specific date.

**Query Parameters:**

| Param | Type | Required | Description              |
|-------|------|----------|--------------------------|
| date  | date | Yes      | Date in ISO format       |

**Response:** `200 OK`

```json
{
  "_id": "...",
  "userId": "...",
  "date": "2025-07-01",
  "status": "present",
  "checkIn": "2025-07-01T09:00:00.000Z",
  "checkOut": "2025-07-01T18:00:00.000Z"
}
```

**Error Responses:**
- `400` — Date is required
- `404` — No attendance record found for the given date

---

### GET `/api/user/attendance/summary`

Get a monthly attendance summary with status breakdown.

**Query Parameters:**

| Param | Type   | Required | Description           |
|-------|--------|----------|-----------------------|
| month | number | Yes      | Month number (1-12)   |
| year  | number | Yes      | Year (e.g. 2025)      |

**Response:** `200 OK`

```json
{
  "totalDays": 22,
  "present": 18,
  "absent": 2,
  "late": 1,
  "halfDay": 1
}
```

**Error Responses:**
- `400` — Month and year are required


---

## Admin Profile

### GET `/api/admin/profile`

Get the authenticated admin's profile.

**Response:** `200 OK`

```json
{
  "_id": "...",
  "name": "Admin Name",
  "email": "admin@example.com",
  "phoneNumber": "9876543210",
  "plan": { "name": "Pro", "maxOrganizations": 5, "maxEmployees": 100 },
  "organizations": [
    { "_id": "...", "name": "Acme Corp", "type": "IT", "clDays": 12 }
  ]
}
```

---

### GET `/api/admin/profile/by-email`

Get an admin profile by their email address.

**Query Parameters:**

| Param | Type   | Required | Description   |
|-------|--------|----------|---------------|
| email | string | Yes      | Email address |

**Response:** `200 OK`

```json
{
  ...adminDetails
}
```

---

### PUT `/api/admin/profile`

Update the authenticated admin's profile.

**Body:**

| Field       | Type   | Required | Description      |
|-------------|--------|----------|------------------|
| name        | string | No       | Full name        |
| phoneNumber | string | No       | Phone number     |

**Response:** `200 OK`

```json
{
  "message": "Admin profile updated successfully",
  "data": { ... }
}
```

---

### PUT `/api/admin/profile/change-password`

Change the authenticated admin's password.

**Body:**

| Field           | Type   | Required | Description      |
|-----------------|--------|----------|------------------|
| currentPassword | string | Yes      | Current password |
| newPassword     | string | Yes      | New password     |

**Response:** `200 OK`

```json
{
  "message": "Password changed successfully"
}
```

---

## Common Error Responses

All protected routes may return:

| Status | Description                  |
|--------|------------------------------|
| `403`  | Unauthorized — missing or invalid JWT token |
| `500`  | Internal Server Error        |

---

## Authentication Details

- All `/api/user/*` routes require the `accessToken` cookie (set by `/api/auth/login`).
- The JWT payload contains `{ userId }` which identifies the authenticated user.
- Cookie is `httpOnly`, with `secure` and `sameSite` flags set based on production mode.
