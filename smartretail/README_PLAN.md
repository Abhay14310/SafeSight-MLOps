# SmartRetail System Recovery Plan & Fix Log

This document outlines the critical issues identified during the deployment of the SmartRetail stack and the technical solutions implemented to restore system integrity.

## 1. Client-Side Build & Runtime Fixes

### Issue A: Missing Lockfile
- **Problem**: The `client/Dockerfile` used `npm ci`, which requires an existing `package-lock.json` or `npm-shrinkwrap.json`. Since the lockfile was missing, the Docker build failed immediately at the installation stage.
- **Solution**: Generated a fresh `package-lock.json` on the host using `npm install --package-lock-only`.

### Issue B: TypeScript Strictness
- **Problem**: Several type errors blocked the `npm run build` process:
    1. `import.meta.env` was unrecognized due to missing Vite types.
    2. The `Alert` interface lacked the `source` property used in the UI.
    3. Canvas context in `CameraPage.tsx` was flagged as "possibly null".

### Issue D: White Screen After Login (Rule of Hooks Violation)
- **Problem**: The application displayed a persistent white screen immediately after a successful login redirect.
- **Cause**: A "Rule of Hooks" violation in `Login.tsx`. The component had a conditional `if (isAuth) return null;` statement *before* its `useEffect` declarations. When `isAuth` transitioned to true upon login, React detected a change in the number of hooks rendered, causing a fatal crash.
- **Solution**: Refactored `Login.tsx` to move the authentication check inside a `useEffect` and removed the early return to ensure a consistent hook count across all renders.
    4. Three.js material properties were inaccessible due to generic type definitions.
- **Solution**:
    - Created `src/vite-env.d.ts` with Vite type references.
    - Updated `src/types/index.ts` to include the `source` field.
    - Added explicit null-guards and type-casting (to `MeshStandardMaterial`) in the React components.

### Issue C: Tailwind CSS Compilation
- **Problem**: The build failed with `The bg-amber-50 class does not exist`. This occurred because `amber` was overridden as a single string in `tailwind.config.js`, which disabled Tailwind's automatic shade generation (50-900).
- **Solution**: Restored default Tailwind color objects by removing the single-value overrides.

---

## 2. Server-Side Execution Issues

### Issue E: Syntax Error & Server Crash
- **Problem**: The server failed to start (`Restarting (1)`) due to a `SyntaxError: Identifier 'Alert' has already been declared`.
- **Cause**: The `mockFootfallService.js` file contained two concatenated scripts. Both scripts attempted to require and declare the `Alert` model.
- **Solution**: Split the file into two dedicated services: `mockFootfallService.js` and `mockCameraService.js`.

### Issue F: Database Seeding
- **Problem**: Initial attempts to seed the database failed because the MongoDB container was not yet healthy or accessible on the expected host port.
- **Solution**: Orchestrated the startup via `docker-compose`, verified container health, and executed the seed script against the mapped port (`27018`).

---

## 3. Infrastructure Optimizations

### Issue G: Slow Docker Builds
- **Problem**: Lack of `.dockerignore` files meant the entire `node_modules` directory (100MB+) was being sent to the Docker daemon during every build attempt.
- **Solution**: Implemented `.dockerignore` files for both Client and Server to exclude `node_modules`, `dist`, and `.git` folders, reducing context transfer time by >95%.

---

## Final Verification Results

| Component | Status | Verification Method |
| :--- | :--- | :--- |
| **MongoDB** | ✅ Healthy | `mongosh` ping check |
| **MySQL** | ✅ Healthy | `mysqladmin` ping check |
| **Server** | ✅ Healthy | `/health` endpoint returned 200 OK |
| **Client** | ✅ Healthy | Nginx serving production build on port 3005 |
| **Data** | ✅ Seeded | 10 products and initial alerts present in DB |

**The system is now fully operational via `docker-compose up`.**
