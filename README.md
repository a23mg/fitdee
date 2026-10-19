# Fitdee | Intelligent Athletic Protocol

Production-ready fitness & athletic protocol application built with **SvelteKit (Svelte 5 runes)**, **Bun runtime**, **MoveNet + OpenCV.js WASM**, **Tailwind CSS**, and **PostgreSQL with Drizzle ORM**.

Based directly on the Google Stitch *Dynamic Pulse* cyber-athletic design system.

---

## System Architecture & Technology Stack

![Fitdee System Architecture and Technology Stack](example/architecture-flow-stack.png)

> **Figure 1.** High-level multi-tier system architecture and full-stack component breakdown of the Fitdee athletic protocol platform. Details client-side edge sensors, Bun/SvelteKit application gateway, dual-engine AI perception (on-device MoveNet & OpenCV.js WASM biomechanics and cloud Gemini 3.8 Flash Multimodal Vision), and PostgreSQL type-safe persistence with automated resilient fallback. *(Publication formats available: [High-Resolution PNG](example/architecture-flow-stack.png) · [Vector SVG](example/architecture-flow-stack.svg))*.

---

## Architecture & Features

1. **Home & Daily Routine (`/`)**
   - Active Challenge sensor card with wake-up shake counter (`18/30`) and interactive shake simulation.
   - Today's workout routine (`Hypertrophy Block A`) with live checklist toggles and progress sets.
   - Hydration protocol widget with quick `+250ml` and `+500ml` logging.
   - Quick navigation to AI Vision and Coach Directory.

2. **AI Nutrition Vision (`/nutrition`)**
   - Live camera viewfinder & photo upload analyzer.
   - Optical food detection with instant macro breakdown (Calories, Protein, Carbs, Fat) and Gemini Vision integration ready.
   - Manual custom meal logger and logged meal history with instant removal.
   - Interactive AI Biometric Coach advice panel.

3. **MoveNet & OpenCV.js Pose Tracking HUD (`/pose`) — Client-Side WASM**
   - Live webcam feed with human skeletal reticle guide.
   - **OpenCV.js WASM Kinematics Engine** (`src/lib/wasm/opencv.ts`): Real-time angular velocity calculation (deg/s), concentric vs. eccentric motion phase tracking, and exponential moving-average jitter smoothing over MoveNet keypoint coordinates.
   - Optical rep counting HUD with form score (`98%`) and real-time posture feedback cues.
   - Configured with `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: credentialless` headers for high-performance multithreaded WASM/SIMD SharedArrayBuffer execution.
   - **Client-Side Model & WASM Cache Manager** (`src/lib/wasm/model-cache.ts`): Automatically caches MoveNet model weights in **IndexedDB** and OpenCV.js WASM binaries in the browser **Cache API** on first launch, slashing subsequent startup times to <100ms and enabling full offline execution without network roundtrips.
   - Modular `PosePipelineManager` and `MoveNetTracker` with automated resilient fallbacks for zero-latency in-browser execution.

4. **Coaches & Gyms Directory (`/trainers`)**
   - Filterable trainer catalog by specialty (*Hypertrophy*, *Mobility & Rehab*, *Conditioning*).
   - Verified badges, hourly rates, and athlete reviews.
   - Full 1-on-1 booking modal flow saved directly to the database.
   - Partner gym facility overview.

5. **Profile, Body Metrics & Plans (`/profile`)**
   - Biometric Telemetry 4-grid cluster: Weight, Height/BMI, Body Fat %, Skeletal Muscle Mass.
   - Weight delta historical progression timeline bar chart.
   - Interactive "Update Biometrics" modal saving to database.
   - Year 1 Priority Pass subscription overview.

---

## Getting Started

### 1. Install Dependencies
```bash
bun install
```

### 2. Database Setup
To run local PostgreSQL:
```bash
docker compose up -d
```
Or set `DATABASE_URL` in `.env` to any remote PostgreSQL instance (Supabase, Neon).
*Note: If PostgreSQL is offline during local dev, the app runs with an automatic in-memory persistent fallback with zero crashes.*

### 3. Run Development Server
```bash
bun run dev
```
Open [http://localhost:5173](http://localhost:5173).

### 4. Build for Production
```bash
bun run build
bun run preview
```
