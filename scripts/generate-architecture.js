import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUTPUT_DIR = path.resolve('example');

if (!fs.existsSync(OUTPUT_DIR)) {
	fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Fitdee System Architecture & Technology Stack</title>
<style>
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  body {
    width: 1600px;
    height: 960px;
    background-color: #ffffff;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    color: #0f172a;
    display: flex;
    flex-direction: column;
    padding: 22px 30px 16px 30px;
    position: relative;
    overflow: hidden;
  }

  /* Academic Paper Header */
  .paper-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    border-bottom: 2px solid #0f172a;
    padding-bottom: 10px;
    margin-bottom: 12px;
  }
  .title-group h1 {
    font-size: 21px;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: #0f172a;
    text-transform: uppercase;
  }
  .title-group p {
    font-size: 12.5px;
    color: #475569;
    margin-top: 2px;
    font-weight: 500;
  }
  .meta-badges {
    display: flex;
    gap: 7px;
  }
  .meta-badge {
    font-size: 10.5px;
    font-weight: 700;
    padding: 3px 9px;
    border-radius: 4px;
    background: #f1f5f9;
    color: #334155;
    border: 1px solid #cbd5e1;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  /* Main Diagram Grid */
  .canvas-grid {
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 1;
    position: relative;
  }

  /* Tier Container */
  .tier-row {
    display: flex;
    border: 1px solid #cbd5e1;
    border-radius: 7px;
    background: #ffffff;
    box-shadow: 0 1px 2px rgba(0,0,0,0.03);
    position: relative;
    overflow: hidden;
  }

  .tier-sidebar {
    width: 175px;
    padding: 10px 12px;
    background: #f8fafc;
    border-right: 1px solid #e2e8f0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    flex-shrink: 0;
  }
  .tier-label {
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin-bottom: 2px;
  }
  .tier-title {
    font-size: 13px;
    font-weight: 700;
    color: #0f172a;
    line-height: 1.25;
  }
  .tier-tech-list {
    margin-top: 5px;
    font-size: 10px;
    color: #64748b;
    line-height: 1.35;
  }

  .tier-content {
    flex: 1;
    display: grid;
    padding: 8px 12px;
    gap: 9px;
    align-items: stretch;
  }

  /* Specific Tier Heights and Columns */
  #tier-client .tier-content {
    grid-template-columns: repeat(5, 1fr);
  }
  #tier-gateway .tier-content {
    grid-template-columns: repeat(4, 1fr);
  }
  #tier-ai .tier-content {
    grid-template-columns: 1fr 1fr;
  }
  #tier-storage .tier-content {
    grid-template-columns: repeat(4, 1fr);
  }

  /* Component Cards */
  .comp-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 7px 9px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    position: relative;
    box-shadow: 0 1px 2px rgba(0,0,0,0.02);
  }
  .comp-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 3px;
  }
  .comp-title {
    font-size: 12px;
    font-weight: 700;
    color: #1e293b;
    display: flex;
    align-items: center;
    gap: 5px;
  }
  .badge-tag {
    font-size: 9px;
    font-weight: 700;
    padding: 1px 5px;
    border-radius: 3px;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }
  .comp-desc {
    font-size: 10px;
    color: #475569;
    line-height: 1.35;
    margin-bottom: 5px;
  }
  .comp-footer {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
    margin-top: auto;
  }
  .tech-pill {
    font-size: 8.5px;
    font-weight: 600;
    background: #f1f5f9;
    color: #334155;
    padding: 2px 5px;
    border-radius: 3px;
    border: 1px solid #e2e8f0;
    white-space: nowrap;
  }

  /* Dual AI Sub-boxes */
  .ai-subcard {
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    padding: 8px 11px;
    display: flex;
    flex-direction: column;
    background: #fcfdfe;
  }
  .ai-subcard.edge {
    border-left: 4px solid #0284c7;
  }
  .ai-subcard.cloud {
    border-left: 4px solid #7c3aed;
  }
  .ai-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
  }
  .ai-head h3 {
    font-size: 12.5px;
    font-weight: 800;
    color: #0f172a;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .ai-pipeline-steps {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 6px;
    margin-top: 5px;
  }
  .p-step {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 4px;
    padding: 4px 6px;
    font-size: 9px;
  }
  .p-step-num {
    font-weight: 800;
    color: #0284c7;
    margin-bottom: 1px;
  }
  .p-step-title {
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 1px;
  }
  .p-step-desc {
    color: #64748b;
    font-size: 8.5px;
    line-height: 1.25;
  }

  /* Color themes for tiers */
  .color-client .tier-label { color: #0284c7; }
  .color-client .tier-sidebar { border-left: 4px solid #0284c7; }
  .badge-client { background: #e0f2fe; color: #0369a1; }

  .color-gateway .tier-label { color: #059669; }
  .color-gateway .tier-sidebar { border-left: 4px solid #059669; }
  .badge-gateway { background: #d1fae5; color: #047857; }

  .color-ai .tier-label { color: #7c3aed; }
  .color-ai .tier-sidebar { border-left: 4px solid #7c3aed; }
  .badge-ai { background: #ede9fe; color: #6d28d9; }

  .color-storage .tier-label { color: #d97706; }
  .color-storage .tier-sidebar { border-left: 4px solid #d97706; }
  .badge-storage { background: #fef3c7; color: #b45309; }

  /* Flow Connectors Overlay */
  .flow-indicator-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #f8fafc;
    border: 1px dashed #cbd5e1;
    border-radius: 5px;
    padding: 3px 12px;
    font-size: 9.5px;
    font-weight: 600;
    color: #475569;
  }
  .flow-indicator-item {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .flow-arrow-icon {
    font-weight: 900;
    font-size: 11px;
  }
  .flow-blue { color: #0284c7; }
  .flow-green { color: #059669; }
  .flow-purple { color: #7c3aed; }
  .flow-amber { color: #d97706; }

  /* Caption footer */
  .paper-caption {
    margin-top: 8px;
    padding-top: 7px;
    border-top: 1px solid #e2e8f0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 10.5px;
    color: #334155;
  }
  .caption-text {
    font-weight: 500;
    max-width: 1150px;
  }
  .caption-bold {
    font-weight: 800;
    color: #0f172a;
  }
  .caption-legend {
    display: flex;
    gap: 12px;
    font-size: 9.5px;
    font-weight: 700;
  }
  .legend-item {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .legend-dot {
    width: 8px;
    height: 8px;
    border-radius: 2px;
  }
</style>
</head>
<body>

  <!-- Academic Header -->
  <div class="paper-header">
    <div class="title-group">
      <h1>Fitdee System Architecture & Technology Stack</h1>
      <p>High-Performance Athletic Protocol Platform with On-Device WASM Biomechanics & Multimodal Foundation AI</p>
    </div>
    <div class="meta-badges">
      <span class="meta-badge">SvelteKit 2 + Svelte 5</span>
      <span class="meta-badge">Bun + Vite 8</span>
      <span class="meta-badge">MoveNet + OpenCV WASM</span>
      <span class="meta-badge">Gemini 3.8 Flash</span>
      <span class="meta-badge">PostgreSQL + Drizzle</span>
    </div>
  </div>

  <div class="canvas-grid">

    <!-- TIER 1: CLIENT PRESENTATION & SENSORS -->
    <div class="tier-row color-client" id="tier-client">
      <div class="tier-sidebar">
        <div class="tier-label">Tier 1: Client Layer</div>
        <div class="tier-title">Athlete Interface & Edge Sensors</div>
        <div class="tier-tech-list">Svelte 5 Runes • Tailwind v4 • Web Sensor APIs</div>
      </div>
      <div class="tier-content">
        <div class="comp-card">
          <div class="comp-header">
            <span class="comp-title">Daily Protocol HUD</span>
            <span class="badge-tag badge-client">Route: /</span>
          </div>
          <div class="comp-desc">Reactive workout routines, hydration tracking, and interactive Shake-to-Awake accelerometer alarm.</div>
          <div class="comp-footer">
            <span class="tech-pill">Svelte 5 $state</span>
            <span class="tech-pill">DeviceMotion API</span>
          </div>
        </div>

        <div class="comp-card">
          <div class="comp-header">
            <span class="comp-title">AI Vision Scanner</span>
            <span class="badge-tag badge-client">Route: /nutrition</span>
          </div>
          <div class="comp-desc">Live camera viewfinder & photo capture for optical food detection and instant macronutrient breakdown.</div>
          <div class="comp-footer">
            <span class="tech-pill">MediaDevices API</span>
            <span class="tech-pill">Canvas 2D</span>
          </div>
        </div>

        <div class="comp-card">
          <div class="comp-header">
            <span class="comp-title">Pose Tracking HUD</span>
            <span class="badge-tag badge-client">Route: /pose</span>
          </div>
          <div class="comp-desc">Real-time biomechanical skeleton overlay, joint angle HUD, rep counting, and posture feedback.</div>
          <div class="comp-footer">
            <span class="tech-pill">WebGL / Canvas</span>
            <span class="tech-pill">WakeLock API</span>
          </div>
        </div>

        <div class="comp-card">
          <div class="comp-header">
            <span class="comp-title">Coaches & Gyms</span>
            <span class="badge-tag badge-client">Route: /trainers</span>
          </div>
          <div class="comp-desc">Verified trainer catalog, specialty filtering, 1-on-1 booking modal flow, and affiliated facilities.</div>
          <div class="comp-footer">
            <span class="tech-pill">Lucide Icons</span>
            <span class="tech-pill">Svelte Transitions</span>
          </div>
        </div>

        <div class="comp-card">
          <div class="comp-header">
            <span class="comp-title">Telemetry & Admin</span>
            <span class="badge-tag badge-client">/profile & /admin</span>
          </div>
          <div class="comp-desc">Body composition metrics (BMI, Body Fat, Skeletal Muscle), historical weight charts, and ops console.</div>
          <div class="comp-footer">
            <span class="tech-pill">Biometric Telemetry</span>
            <span class="tech-pill">RBAC Guard</span>
          </div>
        </div>
      </div>
    </div>

    <!-- FLOW CONNECTOR 1 -->
    <div class="flow-indicator-bar">
      <div class="flow-indicator-item">
        <span class="flow-arrow-icon flow-blue">▼</span>
        <span><b>Device Sensors:</b> Camera Frames (30 FPS) • Accelerometer (Δg Motion) • Screen WakeLock</span>
      </div>
      <div class="flow-indicator-item">
        <span class="flow-arrow-icon flow-green">⇅</span>
        <span><b>Client-Edge RPC:</b> Secure JSON / Form Actions • Session Cookie Auth • Streaming Updates</span>
      </div>
      <div class="flow-indicator-item">
        <span class="flow-arrow-icon flow-purple">▼</span>
        <span><b>In-Browser Isolation:</b> Web Worker WASM Thread • SharedArrayBuffer (COOP/COEP)</span>
      </div>
    </div>

    <!-- TIER 2: GATEWAY & APPLICATION SERVER -->
    <div class="tier-row color-gateway" id="tier-gateway">
      <div class="tier-sidebar">
        <div class="tier-label">Tier 2: Edge Gateway</div>
        <div class="tier-title">Application & Security Layer</div>
        <div class="tier-tech-list">Bun Runtime • SvelteKit Server • Better-Auth</div>
      </div>
      <div class="tier-content">
        <div class="comp-card">
          <div class="comp-header">
            <span class="comp-title">High-Speed Bun Runtime</span>
            <span class="badge-tag badge-gateway">Runtime</span>
          </div>
          <div class="comp-desc">Ultra-low latency server execution, native TypeScript engine, bundled with Vite 8 for fast build and HMR.</div>
          <div class="comp-footer">
            <span class="tech-pill">Bun.js Core</span>
            <span class="tech-pill">Vite 8 Bundler</span>
          </div>
        </div>

        <div class="comp-card">
          <div class="comp-header">
            <span class="comp-title">SvelteKit Server Endpoints</span>
            <span class="badge-tag badge-gateway">RPC / API</span>
          </div>
          <div class="comp-desc">Type-safe request handlers (+server.ts) managing nutrition scans, biometric updates, routines, and bookings.</div>
          <div class="comp-footer">
            <span class="tech-pill">RequestHandler</span>
            <span class="tech-pill">Streaming JSON</span>
          </div>
        </div>

        <div class="comp-card">
          <div class="comp-header">
            <span class="comp-title">Better-Auth & Security</span>
            <span class="badge-tag badge-gateway">Identity</span>
          </div>
          <div class="comp-desc">Session token management, cryptographic password hashing, role-based access control, and admin authorization.</div>
          <div class="comp-footer">
            <span class="tech-pill">Better-Auth 1.7</span>
            <span class="tech-pill">Secure Cookies</span>
          </div>
        </div>

        <div class="comp-card">
          <div class="comp-header">
            <span class="comp-title">Concurrency & COOP / COEP</span>
            <span class="badge-tag badge-gateway">Headers</span>
          </div>
          <div class="comp-desc">Cross-Origin-Opener-Policy & COEP credentialless headers enabling high-performance multithreaded WASM SIMD.</div>
          <div class="comp-footer">
            <span class="tech-pill">COOP: same-origin</span>
            <span class="tech-pill">COEP: credentialless</span>
          </div>
        </div>
      </div>
    </div>

    <!-- FLOW CONNECTOR 2 -->
    <div class="flow-indicator-bar">
      <div class="flow-indicator-item">
        <span class="flow-arrow-icon flow-blue">◀▶</span>
        <span><b>Edge WASM Pipeline:</b> Direct WebGL Buffers ➔ MoveNet Keypoints ➔ OpenCV.js Kinematic Filtering ➔ 30+ FPS HUD</span>
      </div>
      <div class="flow-indicator-item">
        <span class="flow-arrow-icon flow-purple">▼▲</span>
        <span><b>Cloud Vision Dispatch:</b> Server-side @google/genai SDK ➔ Gemini 3.8 Flash ➔ Structured JSON Validation</span>
      </div>
    </div>

    <!-- TIER 3: DUAL-ENGINE AI & VISION CORE -->
    <div class="tier-row color-ai" id="tier-ai">
      <div class="tier-sidebar">
        <div class="tier-label">Tier 3: Dual AI Core</div>
        <div class="tier-title">Intelligent Perception Engines</div>
        <div class="tier-tech-list">MoveNet + OpenCV WASM (Edge) • Gemini 3.8 Flash (Cloud)</div>
      </div>
      <div class="tier-content">
        <!-- Edge Vision -->
        <div class="ai-subcard edge">
          <div class="ai-head">
            <h3><span style="color:#0284c7">⚡</span> Edge Biomechanics (MoveNet + OpenCV.js WASM)</h3>
            <span class="badge-tag" style="background:#e0f2fe; color:#0369a1;">Zero Latency (30+ FPS)</span>
          </div>
          <div class="comp-desc" style="margin-bottom:2px;">
            Executes on-device via TensorFlow.js MoveNet & OpenCV.js WebAssembly for privacy-preserving pose tracking, optical velocity, and kinematic smoothing.
          </div>
          <div class="ai-pipeline-steps">
            <div class="p-step">
              <div class="p-step-num">Step 1</div>
              <div class="p-step-title">Frame Acquisition</div>
              <div class="p-step-desc">Webcam stream downsampled to tensor array via WebGL.</div>
            </div>
            <div class="p-step">
              <div class="p-step-num">Step 2</div>
              <div class="p-step-title">MoveNet Inference</div>
              <div class="p-step-desc">WASM SIMD extracts 17 anatomical keypoints.</div>
            </div>
            <div class="p-step">
              <div class="p-step-num">Step 3</div>
              <div class="p-step-title">OpenCV Kinematics</div>
              <div class="p-step-desc">Vector geometry, exponential smoothing & angular velocity.</div>
            </div>
            <div class="p-step">
              <div class="p-step-num">Step 4</div>
              <div class="p-step-title">Rep State Machine</div>
              <div class="p-step-desc">Kinematic hysteresis thresholds classify reps & form score.</div>
            </div>
          </div>
        </div>

        <!-- Cloud Vision -->
        <div class="ai-subcard cloud">
          <div class="ai-head">
            <h3><span style="color:#7c3aed">🧠</span> Cloud Foundation AI (Multimodal Gemini Vision)</h3>
            <span class="badge-tag" style="background:#ede9fe; color:#6d28d9;">Official @google/genai SDK</span>
          </div>
          <div class="comp-desc" style="margin-bottom:2px;">
            Server-orchestrated visual nutrition analysis and sports-science conversational coaching using Gemini 3.8 Flash.
          </div>
          <div class="ai-pipeline-steps">
            <div class="p-step">
              <div class="p-step-num">Step 1</div>
              <div class="p-step-title">Image Payload</div>
              <div class="p-step-desc">Base64 JPEG payload received at /api/nutrition/scan.</div>
            </div>
            <div class="p-step">
              <div class="p-step-num">Step 2</div>
              <div class="p-step-title">Multimodal Prompt</div>
              <div class="p-step-desc">Sports dietitian system instruction + meal imagery.</div>
            </div>
            <div class="p-step">
              <div class="p-step-num">Step 3</div>
              <div class="p-step-title">Strict Schema JSON</div>
              <div class="p-step-desc">Output conforms to schema: kcal, protein, carbs, fat, fiber.</div>
            </div>
            <div class="p-step">
              <div class="p-step-num">Step 4</div>
              <div class="p-step-title">Coaching Engine</div>
              <div class="p-step-desc">Real-time hypertrophy advice & macro compliance feedback.</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- FLOW CONNECTOR 3 -->
    <div class="flow-indicator-bar">
      <div class="flow-indicator-item">
        <span class="flow-arrow-icon flow-amber">▼</span>
        <span><b>Persistence Pipeline:</b> Validated Meal Macros & Rep Telemetry ➔ Drizzle ORM Type-Safe SQL Queries</span>
      </div>
      <div class="flow-indicator-item">
        <span class="flow-arrow-icon flow-amber">⇅</span>
        <span><b>ACID Transaction Commit:</b> PostgreSQL 16 (Local Docker or Cloud Supabase/Neon)</span>
      </div>
      <div class="flow-indicator-item">
        <span class="flow-arrow-icon flow-green">▲</span>
        <span><b>Fault Tolerance:</b> Transparent Automatic In-Memory Fallback Repository (Zero Crashes)</span>
      </div>
    </div>

    <!-- TIER 4: PERSISTENCE & DATA LAYER -->
    <div class="tier-row color-storage" id="tier-storage">
      <div class="tier-sidebar">
        <div class="tier-label">Tier 4: Persistence</div>
        <div class="tier-title">Data Storage & Fallback Layer</div>
        <div class="tier-tech-list">PostgreSQL 16 • Drizzle ORM • Dual-Mode Storage</div>
      </div>
      <div class="tier-content">
        <div class="comp-card">
          <div class="comp-header">
            <span class="comp-title">PostgreSQL Database</span>
            <span class="badge-tag badge-storage">Primary DB</span>
          </div>
          <div class="comp-desc">ACID relational database deployed locally via Docker Compose or connected to cloud instances (Supabase/Neon).</div>
          <div class="comp-footer">
            <span class="tech-pill">PostgreSQL 16</span>
            <span class="tech-pill">Docker Compose</span>
          </div>
        </div>

        <div class="comp-card">
          <div class="comp-header">
            <span class="comp-title">Drizzle ORM & Migrations</span>
            <span class="badge-tag badge-storage">Type Safety</span>
          </div>
          <div class="comp-desc">Zero-overhead, TypeScript-first SQL schema definition and query generation with automatic migration tooling.</div>
          <div class="comp-footer">
            <span class="tech-pill">drizzle-orm</span>
            <span class="tech-pill">drizzle-kit</span>
          </div>
        </div>

        <div class="comp-card">
          <div class="comp-header">
            <span class="comp-title">Domain Schemas</span>
            <span class="badge-tag badge-storage">Telemetry Models</span>
          </div>
          <div class="comp-desc">Structured tables: Athlete Users, Auth Sessions, Daily Routines, Biometrics History, Meal Logs, and Bookings.</div>
          <div class="comp-footer">
            <span class="tech-pill">Typed Entities</span>
            <span class="tech-pill">Foreign Keys</span>
          </div>
        </div>

        <div class="comp-card">
          <div class="comp-header">
            <span class="comp-title">Dual-Mode Resilient Fallback</span>
            <span class="badge-tag badge-storage">Zero Downtime</span>
          </div>
          <div class="comp-desc">Automated in-memory fallback layer maintaining uninterrupted application availability if PostgreSQL is offline.</div>
          <div class="comp-footer">
            <span class="tech-pill">src/lib/server/repo.ts</span>
            <span class="tech-pill">In-Memory Cache</span>
          </div>
        </div>
      </div>
    </div>

  </div>

  <!-- Academic Figure Caption -->
  <div class="paper-caption">
    <div class="caption-text">
      <span class="caption-bold">Figure 1.</span> Architectural flow and multi-tier technology stack of the Fitdee athletic protocol platform, depicting client-side sensor capture, edge application routing, dual-engine AI perception (on-device MoveNet & OpenCV.js WASM biomechanics and cloud Gemini 3.8 Flash Vision), and type-safe persistence with automated in-memory fault tolerance.
    </div>
    <div class="caption-legend">
      <div class="legend-item"><div class="legend-dot" style="background:#0284c7;"></div> Client Tier</div>
      <div class="legend-item"><div class="legend-dot" style="background:#059669;"></div> Gateway Tier</div>
      <div class="legend-item"><div class="legend-dot" style="background:#7c3aed;"></div> AI/ML Tier</div>
      <div class="legend-item"><div class="legend-dot" style="background:#d97706;"></div> Persistence Tier</div>
    </div>
  </div>

</body>
</html>`;

async function run() {
	console.log('Launching headless browser...');
	const browser = await puppeteer.launch({
		executablePath: CHROME_PATH,
		headless: true,
		args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none']
	});

	const page = await browser.newPage();
	// High-res publication viewport (3200 x 1920 at 2x DPR)
	await page.setViewport({
		width: 1600,
		height: 960,
		deviceScaleFactor: 2
	});

	await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
	await page.evaluate(async () => {
		await document.fonts.ready;
	});

	const pngPath = path.join(OUTPUT_DIR, 'architecture-flow-stack.png');
	await page.screenshot({ path: pngPath, fullPage: false });
	console.log(`Saved ultra-res PNG to: ${pngPath}`);

	// Also generate standalone SVG wrapper for publication vector needs
	const svgWrapper = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="960" viewBox="0 0 1600 960">
  <foreignObject width="1600" height="960">
    ${htmlContent.replace(/<!DOCTYPE html>[\s\S]*?<body[^>]*>/, '<div xmlns="http://www.w3.org/1999/xhtml" style="width:1600px;height:960px;">').replace(/<\/body>[\s\S]*?<\/html>/, '</div>')}
  </foreignObject>
</svg>`;
	const svgPath = path.join(OUTPUT_DIR, 'architecture-flow-stack.svg');
	fs.writeFileSync(svgPath, svgWrapper, 'utf-8');
	console.log(`Saved vector SVG to: ${svgPath}`);

	await browser.close();
	console.log('Complete!');
}

run().catch(console.error);
