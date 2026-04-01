# API Documentation

The BrAIN Labs Inc. API is a RESTful service built with Express.js, providing robust endpoints for authentication, research content management, and administrative oversight.

## 🔐 Authentication

### 📥 User Registration
`POST /auth/register`

Creates a new user account (Supabase + Member table).

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "firstName": "First",
  "lastName": "Last",
  "role": "researcher" | "research_assistant"
}
```

### 🔓 User Login
`POST /auth/login`

Authenticates a user and returns a signed JWT.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response**:
```json
{
  "token": "eyJhbG...",
  "user": {
    "id": 1,
    "role": "admin",
    "approval_status": "APPROVED"
  }
}
```

## 👤 Member Profiles

### 🔭 Get My Profile
`GET /me`

Retrieves the authenticated member's profile and role-specific details.

### ✍️ Update Profile
`PUT /me`

Updates the researcher's bio, contact info, or social links.

## 🛡️ Administrative Operations (Admin Only)

### 👥 List Members
`GET /admin/members`

Returns a list of all registered members for the admin to manage.

### 📥 Pending Content
`GET /admin/content/pending`

Retrieves all research submissions (Blogs, Publications, etc.) awaiting admin approval.

### ✅ Approve/Reject Content
`PATCH /admin/content/:table/:id/approve`
`PATCH /admin/content/:table/:id/reject`

---

## 📚 Research Content

Each content type (Blogs, Projects, Events, Publications, Grants) follows a standardized REST structure:

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/blogs` | `GET` | List all (approved) blogs. |
| `/blogs` | `POST` | Create a new blog entry (Pending by default). |
| `/blogs/:id` | `GET` | Get detailed content for a specific blog. |
| `/blogs/:id` | `PUT` | Update an existing blog entry. |
| `/blogs/:id` | `DELETE`| Remove a blog entry. |

Similar endpoints are available for:
- `/projects`
- `/events`
- `/grants`
- `/publications`
- `/tutorials`

## 📡 Base URL & Authorization

- **Base URL**: `http://localhost:3001` (Development)
- **Authorization**: All protected routes require a `Bearer <JWT_TOKEN>` header.

> [!IMPORTANT]
> The `VITE_API_URL` environment variable must be correctly set in the frontend `.env` to communicate with the backend.
