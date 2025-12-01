# 📖 API Documentation

This document describes the REST API endpoints available in the Exaroton Servers Manager.

## Authentication

All API endpoints require authentication via Firebase JWT token. Include the token in the `Authorization` header:

```
Authorization: Bearer <firebase-jwt-token>
```

## Response Format

All responses are returned in JSON format.

### Success Response

```json
{
  "data": { ... }
}
```

### Error Response

```json
{
  "error": "Error message description"
}
```

## HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Missing or invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 500 | Internal Server Error |

---

## Servers

### List Servers

Get all servers the authenticated user has access to.

```
GET /api/servers
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `forceRefresh` | boolean | Skip cache and fetch fresh data from Exaroton |

**Response:**

```json
{
  "servers": [
    {
      "id": "server-id",
      "name": "My Server",
      "address": "server.exaroton.me",
      "motd": "A Minecraft Server",
      "status": 1,
      "host": null,
      "port": 25565,
      "players": {
        "max": 20,
        "count": 0,
        "list": []
      },
      "software": {
        "id": "vanilla",
        "name": "Vanilla",
        "version": "1.20.4"
      },
      "shared": false
    }
  ]
}
```

**Server Status Codes:**

| Code | Status |
|------|--------|
| 0 | Offline |
| 1 | Online |
| 2 | Starting |
| 3 | Stopping |
| 4 | Restarting |
| 5 | Saving |
| 6 | Loading |
| 7 | Crashed |
| 8 | Pending |
| 10 | Preparing |

---

### Get Server Details

Get details for a specific server.

```
GET /api/servers/{id}
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | The server ID |

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `forceRefresh` | boolean | Skip cache and fetch fresh data |

**Response:**

```json
{
  "server": {
    "id": "server-id",
    "name": "My Server",
    "address": "server.exaroton.me",
    "status": 1,
    "players": {
      "max": 20,
      "count": 5,
      "list": ["Player1", "Player2"]
    },
    "software": {
      "id": "paper",
      "name": "Paper",
      "version": "1.20.4"
    }
  },
  "fromCache": false
}
```

---

### Start Server

Start a stopped server.

```
POST /api/servers/{id}/start
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | The server ID |

**Permissions:** User must have access to the server.

**Response:**

```json
{
  "success": true,
  "message": "Server starting"
}
```

---

### Stop Server

Stop a running server.

```
POST /api/servers/{id}/stop
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | The server ID |

**Permissions:** 
- Admins: Can stop anytime
- Users: Can only stop when no players are online

**Response:**

```json
{
  "success": true,
  "message": "Server stopping"
}
```

**Error (403) - Players Online:**

```json
{
  "error": "Cannot stop server: players are online"
}
```

---

### Restart Server

Restart a running server.

```
POST /api/servers/{id}/restart
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | The server ID |

**Permissions:** Admin only

**Response:**

```json
{
  "success": true,
  "message": "Server restarting"
}
```

---

### Execute Command

Execute a command on the server console.

```
POST /api/servers/{id}/command
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | The server ID |

**Request Body:**

```json
{
  "command": "say Hello World"
}
```

**Response:**

```json
{
  "success": true
}
```

---

## Account

### Get Account Info

Get the Exaroton account information.

```
GET /api/account
```

**Permissions:** Admin only

**Response:**

```json
{
  "name": "Username",
  "email": "user@example.com",
  "credits": 150.50,
  "verified": true
}
```

---

## Credits

### Get Credits History

Get credits history with spending calculations.

```
GET /api/credits/history
```

**Permissions:** Admin only

**Response:**

```json
{
  "currentCredits": 150.50,
  "spending": {
    "today": {
      "period": "today",
      "amount": 2.5,
      "startCredits": 153.0,
      "endCredits": 150.5,
      "startDate": "2025-01-01T00:00:00Z",
      "endDate": "2025-01-01T23:59:59Z"
    },
    "last3Days": { ... },
    "last7Days": { ... },
    "last30Days": { ... }
  },
  "dailySpending": [
    {
      "date": "2025-01-01",
      "amount": 2.5,
      "startCredits": 153.0,
      "endCredits": 150.5
    }
  ],
  "snapshots": [ ... ]
}
```

---

### Create Credit Snapshot

Manually create a credit snapshot.

```
POST /api/credits/snapshot
```

**Permissions:** Admin only

**Response:**

```json
{
  "success": true,
  "snapshot": {
    "id": "snapshot-id",
    "credits": 150.50,
    "timestamp": "2025-01-01T12:00:00Z",
    "type": "manual"
  }
}
```

---

## Users

### List Users

Get all users (admin only).

```
GET /api/users
```

**Permissions:** Admin only

**Response:**

```json
{
  "users": [
    {
      "id": "user-uid",
      "email": "user@example.com",
      "name": "User Name",
      "photoURL": "https://...",
      "isAdmin": false,
      "serverAccess": ["server-id-1", "server-id-2"],
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ]
}
```

---

### Update User Role

Change a user's admin status.

```
PUT /api/users/{id}/role
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | The user's UID |

**Permissions:** Admin only

**Request Body:**

```json
{
  "isAdmin": true
}
```

**Response:**

```json
{
  "success": true,
  "message": "User role updated"
}
```

---

### Update Server Access

Update a user's server access list.

```
PUT /api/users/{id}/server-access
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | The user's UID |

**Permissions:** Admin only

**Request Body:**

```json
{
  "serverAccess": ["server-id-1", "server-id-2"]
}
```

**Response:**

```json
{
  "success": true,
  "message": "Server access updated"
}
```

---

### Grant/Revoke Server Access

Grant or revoke access to a specific server.

```
POST /api/users/{id}/server-access
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | The user's UID |

**Permissions:** Admin only

**Request Body:**

```json
{
  "serverId": "server-id",
  "action": "grant"  // or "revoke"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Server access granted"
}
```

---

## History

### Get Action History

Get the action logs with filters.

```
GET /api/history
```

**Permissions:** Admin only

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `userId` | string | Filter by user ID |
| `serverId` | string | Filter by server ID |
| `type` | string | Filter by action type (comma-separated) |
| `startDate` | string | Start date (ISO format) |
| `endDate` | string | End date (ISO format) |
| `success` | boolean | Filter by success status |
| `limit` | number | Results per page (default: 50, max: 200) |
| `page` | number | Page number (default: 1) |

**Action Types:**

- `server_start`
- `server_stop`
- `server_restart`
- `user_login`
- `user_logout`
- `user_role_change`
- `server_access_grant`
- `server_access_revoke`

**Response:**

```json
{
  "logs": [
    {
      "id": "log-id",
      "type": "server_start",
      "userId": "user-uid",
      "userName": "User Name",
      "userEmail": "user@example.com",
      "serverId": "server-id",
      "serverName": "My Server",
      "timestamp": "2025-01-01T12:00:00Z",
      "success": true,
      "metadata": {}
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "totalPages": 2
  }
}
```

---

## Rate Limiting

The API uses Exaroton's rate limits. Please be mindful of:

- **Server operations**: Limited per minute
- **Cache**: Server data is cached for 5 minutes to reduce API calls

Use `forceRefresh=true` only when necessary.

---

## Webhooks & Real-time

For real-time updates, the application uses:

- **Server-Sent Events (SSE)** for console logs: `GET /api/servers/{id}/stream`
- **Polling** with cache for status updates

---

## Error Handling

Always check the response status code and handle errors appropriately:

```typescript
const response = await fetch('/api/servers', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

if (!response.ok) {
  const error = await response.json();
  console.error(error.error);
  return;
}

const data = await response.json();
```
