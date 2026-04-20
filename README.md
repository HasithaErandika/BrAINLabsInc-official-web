# BrAIN Labs Inc. Official Platform

## 🧠 Brain-Inspired AI and Neuroinformatics Lab

Welcome to the **BrAIN Labs Inc.** official ecosystem. This repository contains the source code for our research platform, including the administrative console and the core research API.

---

## 🚀 System Overview

The platform is designed to facilitate research collaboration, content moderation, and public visibility for our lab's initiatives in **Large Language Models (LLM)** and **Neuromorphic Computing**.

### 🛠️ Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons.
- **Backend**: Node.js, Express.js (Restful API).
- **Database**: PostgreSQL (Managed by Supabase).
- **Auth**: Supabase Auth + Custom JWT Authorization.

---

## 📂 Project Structure

```text
BrAINLabsInc/
├── admin/          # Admin Console (React + Vite)
├── backend/        # Express.js API & Database Seeds
├── docs/           # System Documentation
├── web/            # Public Content Portal (React + Vite)
├── schema.sql      # Canonical Database Schema
└── README.md       # High-level project entry point
```

---

## ⚙️ Getting Started

### 1. Prerequisites
- **Node.js** (v18+)
- **Supabase Account** (with a project initialized)

### 2. Backend Setup
Navigate to the `backend/` directory:
```bash
cp .env.example .env
npm install
npm run dev
```
Initialize the database using `schema.sql` in the Supabase SQL editor and run the seeders:
```bash

# 1. Seed Team Members (Creates Auth Users & Member profiles)
node data_seed/execute-team-seed.js

# 2. Seed Legacy Content (Blogs, Projects, Publications, etc.)
node data_seed/execute-seed.js
```

### 3. Web Portal Setup
Navigate to the `web/` directory:
```bash
cp .env.example .env
npm install
npm run dev
```

### 4. Admin Console Setup
Navigate to the `admin/` directory:
```bash
cp .env.example .env
npm install
npm run dev
```

---

## 📚 Documentation

Detailed documentation is available in the [docs/](file:///home/hasithaerandika/Documents/Projects/BrAINLabsInc/docs) directory:

- [System Architecture](file:///home/hasithaerandika/Documents/Projects/BrAINLabsInc/docs/architecture.md)
- [API Reference](file:///home/hasithaerandika/Documents/Projects/BrAINLabsInc/docs/api.md)
- [Database Schema](file:///home/hasithaerandika/Documents/Projects/BrAINLabsInc/docs/database.md)
- [Auth Flow](file:///home/hasithaerandika/Documents/Projects/BrAINLabsInc/docs/auth-flow.md)
- [Deployment Guide](file:///home/hasithaerandika/Documents/Projects/BrAINLabsInc/docs/deployment.md)

---

## 🤝 Contributing

We welcome contributions from our multidisciplinary team! Please refer to the [CONTRIBUTING.md](file:///home/hasithaerandika/Documents/Projects/BrAINLabsInc/CONTRIBUTING.md) for our workflow and coding standards.

**Contact**: info@brainlabs.inc
**GitHub**: [https://github.com/BrAINLabs-Inc](https://github.com/BrAINLabs-Inc)

---

© 2026 BrAIN Labs Inc. All rights reserved.
