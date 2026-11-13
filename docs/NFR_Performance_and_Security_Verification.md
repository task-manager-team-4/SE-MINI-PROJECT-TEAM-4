# Non-Functional Requirements (NFR) Performance, Security, and Maintainability Verification Report

**Project:** Task Manager Application — Team 4  
**Assigned Quality & NFR Lead:** Rajat (`rajatkooge5-learn`)  
**Sprint Coverage:** Sprint 1 & Sprint 2 Integration  
**Traceable Backlog Issues:** #12, #13, #14  

---

## 1. Executive Summary & Purpose

This verification report documents the testing, benchmarking, and quality assurance activities conducted for the Task Manager Application, specifically addressing Non-Functional Requirements (NFRs) and System Requirements (SRs) defined in the IEEE-format Software Requirements Specification (SRS) and Test Plan:
- **Issue #12:** Performance & Reliability (`NFR-01`, `NFR-04`)
- **Issue #13:** Security & Access Control (`NFR-02`, `SR-02`, `SR-03`)
- **Issue #14:** Usability & Maintainability (`NFR-03`, `NFR-05`, `NFR-06`)

---

## 2. Requirement Traceability Matrix

| Requirement ID | Specification Category | Target Metric / Constraint | Test Methodology | Result |
| :--- | :--- | :--- | :--- | :---: |
| **NFR-01** | Performance (Response Time) | API requests complete under 2.0 seconds under normal operation | Latency profiling using parallel fetch & AbortController | **PASSED** (48ms–120ms) |
| **NFR-04** | Reliability & Persistence | Stored user and task data preserved across refresh and restart | Database state verification post backend restart and re-login | **PASSED** (Zero data loss) |
| **NFR-02** | Security (Authentication Guard) | Unauthenticated users denied access to task manipulation | Protected API endpoints, token verification, session expiry | **PASSED** (HTTP 401/403 enforced) |
| **SR-02** | Security (Authorization Isolation) | Strict user data isolation and session clearing on invalid token | Client-side invalidation and redirect to login state | **PASSED** (Session sanitized) |
| **SR-03** | Security (Credential Safety) | Passwords hashed; zero plain-text credential leaks | Bcrypt hashing audit, payload inspection | **PASSED** (No secrets in logs/DOM) |
| **NFR-03** | Usability & UI Feedback | Meaningful validation, visual states, and loading feedback | Form validation testing, empty title error state audit | **PASSED** (Intuitive feedback) |
| **NFR-05** | Maintainability & Modularity | Independent module separation, zero circular dependencies | Lint compliance check, export/import modularity in `db.js` | **PASSED** (Clean architecture) |
| **NFR-06** | Testability & CI Automation | Automated verification of builds and syntax checks on PRs | GitHub Actions continuous integration workflow | **PASSED** (CI enabled) |

---

## 3. Performance & Reliability Verification (Issue #12)

### 3.1 Network Latency and API Benchmarks (NFR-01)
To prevent sequential fetch bottlenecks during task and user synchronization:
1. **Parallel Execution:** Implemented parallel fetching using `Promise.all` for tasks and users API endpoints.
2. **Resource Management:** Bound requests to an `AbortController` signal to clean up unmounted async subscriptions and prevent memory leaks.
3. **Observed Timings:**
   - `GET /api/tasks`: 56 ms (HTTP 304 cached) / ~120 ms (uncached DB query).
   - `GET /api/users`: 48 ms (HTTP 304 cached) / ~95 ms (uncached DB query).
   - **Conclusion:** Both operations perform well within the SRS response-time threshold of < 2,000 ms.

### 3.2 Task & Session Persistence (NFR-04)
- **Browser Refresh Test:** Created tasks, triggered full browser refresh (`Ctrl+F5`). State correctly rehydrated from backend storage.
- **Server Restart Test:** Terminated Express server instance, restarted backend, and authenticated. All previous task statuses, assignments, and titles remained intact in PostgreSQL.

---

## 4. Security & Access Control Verification (Issue #13)

### 4.1 Unauthenticated Access Prevention (NFR-02)
- Attempted direct access to `/api/tasks` without `Authorization: Bearer <token>` header.
- Endpoint returned HTTP `401 Unauthorized`. Client was gracefully redirected to the login interface.

### 4.2 Client-Side Session Sanity & Token Cleansing (SR-02)
- Implemented automatic cleanup in `frontend/src/App.jsx` upon encountering authentication failures:
  - Expired or malformed JWT tokens stored in `localStorage` are cleared immediately.
  - UI state resets to unauthenticated view, preventing unauthorized state retention in memory.

### 4.3 Credential Protection (SR-03)
- Validated that user passwords are encrypted using `bcrypt` prior to database insertion.
- Inspected Network tab and application logs to ensure password hashes and plaintext credentials are never returned in user listing or task payloads.

---

## 5. Usability & Maintainability Verification (Issue #14)

### 5.1 UI Feedback & Error States (NFR-03)
- **Empty Title Validation:** Submitting a task without a title triggers immediate inline error feedback without throwing unhandled exceptions.
- **Loading Indicators:** User interfaces display appropriate loading spinners during async network calls.

### 5.2 React Rendering Stability & Lint Compliance (NFR-05)
- Resolved React warning regarding state updates inside component effects during task data initialization.
- Validated complete ESLint rule compliance (`eslint .`) and production build bundling via Vite.

### 5.3 Automated Continuous Integration (NFR-06)
- Configured `.github/workflows/ci.yml` to automatically execute backend syntax validation and frontend linting/building on every Pull Request and push to `main`.

---

## 6. Sign-off & Conclusion
All Non-Functional Requirements covered by backlog issues **#12**, **#13**, and **#14** have been fully implemented, validated, and documented. The system satisfies the quality attributes outlined in the project SRS, SAD, and Test Plan.
