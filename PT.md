# Project Members API

Base URL: `/api/admin/project`

All routes require a valid `accessToken` cookie (JWT authentication).

---

## Routes

### 1. Add Project Member

**POST** `/api/admin/project/add-member`

Adds a user to a project. A user can only be added once per project.

**Request Body**

```json
{
  "projectId": "664f1a2b3c4d5e6f7a8b9c0d",
  "userId": "664f1a2b3c4d5e6f7a8b9c0e",
  "organizationId": "664f1a2b3c4d5e6f7a8b9c0f",
  "role": "developer"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `projectId` | ObjectId | Yes | Must be a valid project |
| `userId` | ObjectId | Yes | Must be a valid user |
| `organizationId` | ObjectId | Yes | Must be a valid organization |
| `role` | String | No | `manager`, `developer`, or `tester`. Defaults to `developer` |

**Response `201`**

```json
{
  "status": "success",
  "data": {
    "_id": "...",
    "projectId": "...",
    "userId": "...",
    "organizationId": "...",
    "role": "developer",
    "isActive": true,
    "assignedDate": "2026-03-11T00:00:00.000Z",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

**Error Cases**
- `400` — Missing required fields
- `400` — Invalid ObjectId format
- `400` — Invalid role value
- `400` — User is already a member of this project

---

### 2. Get Project Members

**GET** `/api/admin/project/get-members`

Returns a paginated list of members for a project, with user info joined.

**Query Parameters**

| Param | Type | Required | Notes |
|---|---|---|---|
| `projectId` | ObjectId | Yes | Filter members by project |
| `page` | Number | No | Defaults to `1` |
| `limit` | Number | No | Defaults to `10` |
| `search` | String | No | Searches by user name (case-insensitive) |
| `role` | String | No | Filter by role: `manager`, `developer`, or `tester` |

**Example Request**

```
GET /api/admin/project/get-members?projectId=664f1a2b3c4d5e6f7a8b9c0d&page=1&limit=10&search=john&role=developer
```

**Response `200`**

```json
{
  "status": "success",
  "members": [
    {
      "_id": "...",
      "projectId": "...",
      "userId": "...",
      "organizationId": "...",
      "role": "developer",
      "isActive": true,
      "assignedDate": "...",
      "userName": "John Doe",
      "userEmail": "john@example.com",
      "employeeId": "EMP001"
    }
  ],
  "totalRecords": 25,
  "totalPages": 3
}
```

**Error Cases**
- `400` — `projectId` is missing
- `400` — Invalid `projectId` format

---

### 3. Get Single Project Member

**GET** `/api/admin/project/get-member/:id`

Returns a single project member record with populated user, project, and organization details.

**URL Params**

| Param | Type | Required |
|---|---|---|
| `id` | ObjectId | Yes |

**Example Request**

```
GET /api/admin/project/get-member/664f1a2b3c4d5e6f7a8b9c1a
```

**Response `200`**

```json
{
  "status": "success",
  "data": {
    "_id": "...",
    "projectId": { "_id": "...", "name": "Project Alpha", "status": "active" },
    "userId": { "_id": "...", "name": "John Doe", "email": "john@example.com", "employeeId": "EMP001" },
    "organizationId": { "_id": "...", "name": "Acme Corp" },
    "role": "developer",
    "isActive": true,
    "assignedDate": "..."
  }
}
```

**Error Cases**
- `400` — Invalid ObjectId format
- `404` — Member not found

---

### 4. Update Project Member

**PUT** `/api/admin/project/update-member/:id`

Updates the `role` and/or `isActive` status of a project member.

**URL Params**

| Param | Type | Required |
|---|---|---|
| `id` | ObjectId | Yes |

**Request Body**

```json
{
  "role": "tester",
  "isActive": false
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `role` | String | No | `manager`, `developer`, or `tester` |
| `isActive` | Boolean | No | `true` or `false` |

At least one of `role` or `isActive` must be provided.

**Response `200`**

```json
{
  "status": "success",
  "data": {
    "_id": "...",
    "role": "tester",
    "isActive": false,
    "updatedAt": "..."
  }
}
```

**Error Cases**
- `400` — Invalid ObjectId format
- `400` — Invalid role value
- `400` — `isActive` is not a boolean
- `400` — No valid fields to update
- `404` — Member not found

---

### 5. Remove Project Members

**POST** `/api/admin/project/remove-members`

Bulk-deletes project members by their IDs.

**Request Body**

```json
{
  "data": [
    "664f1a2b3c4d5e6f7a8b9c1a",
    "664f1a2b3c4d5e6f7a8b9c1b"
  ]
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `data` | ObjectId[] | Yes | Non-empty array of member `_id` values |

**Response `200`**

```json
{
  "status": "success",
  "message": "2 member(s) removed successfully"
}
```

**Error Cases**
- `400` — `data` is not a non-empty array
- `400` — Any ID in the array is invalid
- `404` — No matching members found

---

## Role Reference

| Role | Description |
|---|---|
| `manager` | Project manager with oversight responsibility |
| `developer` | Default role for team members doing development |
| `tester` | Quality assurance / testing role |

---

## Notes

- A user can only be a member of a project **once** — duplicate additions are rejected.
- Removing a member is **permanent** (hard delete). To temporarily deactivate, use `update-member` with `isActive: false` instead.
- `get-members` performs a name search on the joined user document, not on the member record itself.
