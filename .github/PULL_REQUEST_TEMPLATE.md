## BrAIN Labs Inc. Pull Request Template

## Description

> Provide a clear and concise summary of the changes in this PR. Explain **what** was changed and **why**.

<!-- Example: This PR migrates the backend from Ballerina to ExpressJS to improve scalability and developer experience. -->

Fixes # (issue number, if applicable)

---

## Type of Change

> Check the box(es) that apply to this PR.

- [ ] **New Feature** (non-breaking change that adds functionality)
- [ ] **Bug Fix** (non-breaking change that fixes an issue)
- [ ] **Breaking Change** (fix or feature that would cause existing functionality to change)
- [ ] **Refactor** (code change that is neither a fix nor a feature)
- [ ] **Documentation Update**
- [ ] **Tests & CI/CD** (adding/updating tests or GitHub Actions)
- [ ] **Chore** (maintenance, dependencies, style updates)

---

## Checklist

> Make sure all of the following are completed before requesting a review.

### General
- [ ] My branch is based off the latest `development` branch.
- [ ] My code follows the project's coding style and conventions.
- [ ] I have added comments to any complex or non-obvious code.
- [ ] I have updated the documentation where necessary.

### Quality Control
- [ ] **Linting**: I have run `npm run lint` and resolved all warnings/errors.
- [ ] **Tests**: I have run `npm test` and all tests pass.
- [ ] **Build**: I have verified that the project builds locally without errors.

### Schema Alignment
- [ ] My changes are strictly aligned with [schema(2).sql](file:///home/hasithaerandika/Documents/Projects/BrAINLabsInc/schema(2).sql).
- [ ] I have not re-introduced any sensitive keys (Supabase) to the frontend.

---

## How Has This Been Tested?

> Describe how you verified that your changes work correctly. Include steps so the reviewer can reproduce.

1. 
2. 
3. 

---

## Screenshots (if applicable)

> If your changes include UI updates, please provide before and after screenshots.

| Before | After |
|--------|-------|
|        |       |

---

## Additional Notes

> Add any other context, concerns, or information for the reviewer here.
