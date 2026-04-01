# Deployment Guide

This guide provides a comprehensive walkthrough for deploying the BrAIN Labs Inc. ecosystem to production environments.

## 📦 High-Level Architecture

The system is split into two primary components:
1.  **Admin Console / Web (Frontend)**: Static React/Vite application.
2.  **Express API (Backend)**: Node.js server.
3.  **Database (Supabase)**: Managed PostgreSQL.

## 🌐 Frontend Deployment (Cloudflare Pages)

The frontend is optimized for deployment on **Cloudflare Pages**.

### Pre-requisites
Ensure your environment variables are configured in the Cloudflare dashboard:
- `VITE_API_URL`: The full URL of your deployed backend (e.g., `https://api.brainlabs.inc`).

### Deployment Steps
1.  **Build**: Run `npm run build` locally or as part of a CI/CD pipeline.
2.  **Publish**: Upload the `dist/` folder to Cloudflare Pages.
    ```bash
    npx wrangler pages deploy dist --project-name brain-labs-admin
    ```

## ⚙️ Backend Deployment (Generic Node.js Host)

The Express backend can be deployed on any Node.js host (e.g., Render, Railway, DigitalOcean App Platform).

### Environment Variables
The following environment variables are **MANDATORY** for production:

| Variable | Description |
| :--- | :--- |
| `SUPABASE_URL` | Your Supabase project URL. |
| `SUPABASE_SERVICE_ROLE_KEY` | **CRITICAL**: The service role key for admin operations. |
| `JWT_SECRET` | A secure, random string for signing authorization tokens. |
| `PORT` | The port for the Express server (default: 3001). |

### Deployment Steps
1.  **Containerize (Optional)**: A Dockerfile is recommended for consistent deployment across environments.
2.  **Install Dependencies**: `npm install --production`.
3.  **Start Server**: `node src/index.js`.

## 📊 Database Migration (Supabase)

The production database must be initialized using the **`schema(2).sql`** file.

1.  **SQL Editor**: Navigate to the Supabase SQL Editor.
2.  **Execution**: Copy and paste the contents of `schema(2).sql` and execute the query.
3.  **Admin Seeding**: Run the `backend/seed-admin.js` script to bootstrap the initial administrator account.
    ```bash
    node backend/seed-admin.js
    ```

---

> [!CAUTION]
> Never expose the `SUPABASE_SERVICE_ROLE_KEY` or `JWT_SECRET` in any frontend code or public repositories.
