# Contributing to BrAIN Labs Inc.

Thank you for your interest in contributing to the **BrAIN Labs Inc.** official platform! This document outlines our professional workflow, coding standards, and project expectations.

---

## 📋 Table of Contents

1. [Reporting an Issue](#-reporting-an-issue)
2. [Branching Strategy](#-branching-strategy)
3. [Professional Workflow](#-professional-workflow)
4. [Coding Standards](#-coding-standards)
5. [Pull Request Process](#-pull-request-process)
6. [Code of Conduct](#-code-of-conduct)

---

## 🐛 Reporting an Issue

Before opening a new issue, please **search existing issues** to avoid duplicates: [View Open Issues](https://github.com/BrAINLabs-Inc/official-web/issues)

If you find a bug:
1.  Navigate to the [Issues tab](https://github.com/BrAINLabs-Inc/official-web/issues).
2.  Click **"New Issue"**.
3.  Provide a clear **Title**, **Description**, **Steps to Reproduce**, and **Screenshots** (if applicable).

---

## 🌿 Branching Strategy

Our repository follows a structured branching model to maintain stability:

| Branch | Purpose |
| :--- | :--- |
| **`main`** | **Production-ready stable code.** No direct commits. Only updated via PR from `development`. |
| **`development`** | **Active integration branch.** All PRs target this branch. |
| **`feature/*`** | **Short-lived branches** for specific tasks (e.g., `feature/login-system`). |
| **`bugfix/*`** | **Short-lived branches** for critical bug fixes. |

---

## 🔄 Professional Workflow

To contribute effectively, follow these steps:

1.  **Fork** the repository and **Clone** your fork.
2.  **Add Upstream Remote**: `git remote add upstream https://github.com/BrAINLabs-Inc/official-web.git`.
3.  **Sync Local**: `git fetch upstream && git checkout development && git merge upstream/development`.
4.  **Create Feature Branch**: `git checkout -b feature/your-feature-name upstream/development`.
5.  **Make Changes**: Write clean, readable code and test locally.
6.  **Commit**: Use descriptive, conventional commit messages (e.g., `feat: provide admin dashboard`).
7.  **Push**: `git push origin feature/your-feature-name`.

---

## 📜 Coding Standards

We maintain a high bar for code quality:

### TypeScript & React
-   **Strong Typing**: Avoid `any` whenever possible. Define interfaces for API responses.
-   **Functional Components**: Use modern React 18 patterns and hooks (`useAuth`, `useEffect`).
-   **Naming**: PascalCase for components, camelCase for variables/functions.

### API & Backend
-   **ISA Pattern**: Adhere to the specialize-member pattern in `schema(2).sql`.
-   **Role Gating**: Ensure sensitive routes are protected by the `authenticateToken` middleware and role checks.
-   **Implicit Admin Approval**: As per the architecture, **Admins** do not have an `approval_status`. **Researchers** and **RAs** must always be checked for an `APPROVED` status.

---

## 🔀 Pull Request Process

1.  Target **`development`** — never `main`.
2.  Fill in the **PR template** with a detailed summary and evidence of testing.
3.  Request a review from the maintainer.
4.  Once approved, the maintainer will merge the PR into `development`.

---

## 🤝 Code of Conduct

We are committed to a respectful and inclusive community. Unacceptable behavior includes:
-   Harassment or discrimination.
-   Personal attacks.
-   Publishing private information.

Violations result in contribution rejection and repository ban.

---

*Thank you for contributing — together, we are pushing the boundaries of AI and neuroscience!* 🧠🚀
