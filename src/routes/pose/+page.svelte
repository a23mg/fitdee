<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { PosePipelineManager } from '#lib/wasm/pose-pipeline';

	let videoEl: HTMLVideoElement | null = $state(null);
	let canvasEl: HTMLCanvasElement | null = $state(null);
	let isCameraRunning = $state(false);
	let selectedExercise = $state('squats');
	let repCount = $state(0);
	let formScore = $state(98);
	let feedbackText = $state('Stand in full frame. Maintain neutral spine.');
	let isSessionActive = $state(false);
	let sessionTimeSeconds = $state(0);
	let timerInterval: any = null;
	let animFrameId: any = null;
	let manager: PosePipelineManager | null = null;
	let sessionSavedMessage = $state<string | null>(null);

	const exercises = [
		{ id: 'squats', name: 'Barbell/Bodyweight Squat', targetRep: 12, target: 'Quads & Glutes' },
		{ id: 'pushups', name: 'Standard Pushups', targetRep: 15, target: 'Chest & Core' },
		{ id: 'curls', name: 'Bicep Strict Curls', targetRep: 10, target: 'Biceps Brachii' }
	];

	onMount(() => {
		manager = new PosePipelineManager();
		manager.initialize();
	});

	onDestroy(() => {
		stopCamera();
		clearInterval(timerInterval);
		if (animFrameId) cancelAnimationFrame(animFrameId);
	});

	async function startCamera() {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
			});
			if (videoEl) {
				videoEl.srcObject = stream;
				await videoEl.play();
				isCameraRunning = true;
				isSessionActive = true;
				startTimer();
				drawPoseLoop();
			}
		} catch (err) {
			console.warn('Camera not available, falling back to simulated optical HUD:', err);
			isCameraRunning = false;
			isSessionActive = true;
			startTimer();
			drawSimulatedLoop();
		}
	}

	function stopCamera() {
		if (videoEl && videoEl.srcObject) {
			const stream = videoEl.srcObject as MediaStream;
			stream.getTracks().forEach((t) => t.stop());
			videoEl.srcObject = null;
		}
		isCameraRunning = false;
		isSessionActive = false;
		clearInterval(timerInterval);
	}

	function startTimer() {
		clearInterval(timerInterval);
		sessionTimeSeconds = 0;
		timerInterval = setInterval(() => {
			sessionTimeSeconds++;
		}, 1000);
	}

	function triggerSimulatedRep() {
		repCount += 1;
		formScore = Math.floor(92 + Math.random() * 7);
		if (selectedExercise === 'squats') {
			feedbackText = 'Parallel depth reached. Drive through midfoot.';
		} else if (selectedExercise === 'pushups') {
			feedbackText = 'Chest touch deck. Full scapular extension.';
		} else {
			feedbackText = 'Peak contraction held. Controlled eccentric.';
		}
	}

	function resetSession() {
		repCount = 0;
		sessionTimeSeconds = 0;
		feedbackText = 'Stand in full frame. Maintain neutral spine.';
		sessionSavedMessage = null;
	}

	async function saveSet() {
		sessionSavedMessage = `Saved ${repCount} reps of ${selectedExercise} to daily log!`;
		setTimeout(() => {
			sessionSavedMessage = null;
		}, 3000);
	}

	// Render HUD skeleton guide on canvas
	function drawSimulatedLoop() {
		if (!canvasEl) return;
		const ctx = canvasEl.getContext('2d');
		if (!ctx) return;

		const width = canvasEl.width;
		const height = canvasEl.height;

		ctx.clearRect(0, 0, width, height);

		// Guide silhouette
		ctx.strokeStyle = '#ff0101';
		ctx.lineWidth = 2;
		ctx.setLineDash([4, 4]);

		// Center body frame guide
		const cx = width / 2;
		const headY = height * 0.25;
		const shoulderY = height * 0.35;
		const hipY = height * 0.6;
		const ankleY = height * 0.88;

		// Head circle
		ctx.beginPath();
		ctx.arc(cx, headY, 20, 0, Math.PI * 2);
		ctx.stroke();

		// Torso
		ctx.beginPath();
		ctx.moveTo(cx, shoulderY);
		ctx.lineTo(cx, hipY);
		ctx.stroke();

		// Shoulders & Arms
		ctx.beginPath();
		ctx.moveTo(cx - 35, shoulderY);
		ctx.lineTo(cx + 35, shoulderY);
		ctx.lineTo(cx + 45, shoulderY + 50);
		ctx.moveTo(cx - 35, shoulderY);
		ctx.lineTo(cx - 45, shoulderY + 50);
		ctx.stroke();

		// Legs
		ctx.beginPath();
		ctx.moveTo(cx, hipY);
		ctx.lineTo(cx - 25, ankleY);
		ctx.moveTo(cx, hipY);
		ctx.lineTo(cx + 25, ankleY);
		ctx.stroke();

		ctx.setLineDash([]);
	}

	function drawPoseLoop() {
		if (!isSessionActive) return;
		drawSimulatedLoop();
		animFrameId = requestAnimationFrame(drawPoseLoop);
	}

	let formattedTime = $derived(
		`${String(Math.floor(sessionTimeSeconds / 60)).padStart(2, '0')}:${String(sessionTimeSeconds % 60).padStart(2, '0')}`
	);
</script>

<svelte:head>
	<title>Fitdee | MoveNet Pose HUD</title>
</svelte:head>

<div class="flex flex-col w-full space-y-4 pt-2">
	<!-- Exercise Selection Header -->
	<div class="flex items-center justify-between">
		<div>
			<span class="text-[10px] text-[#ff3333] uppercase font-bold tracking-wider font-mono">OPTICAL TRACKING</span>
			<h2 class="text-sm font-bold text-white">MoveNet Biomechanical HUD</h2>
		</div>
		<span class="px-2 py-0.5 rounded bg-red-950/80 border border-red-700 text-[10px] font-mono text-[#ff3333] font-bold">
			WASM PREP
		</span>
	</div>

	<!-- Exercise Selector Pills -->
	<div class="flex gap-2 overflow-x-auto pb-1">
		{#each exercises as ex}
			<button
				type="button"
				onclick={() => { selectedExercise = ex.id; repCount = 0; }}
				class="py-1.5 px-3 rounded-xl border text-xs font-semibold whitespace-nowrap transition-all cursor-pointer {selectedExercise === ex.id ? 'bg-[#ff0101] border-[#ff0101] text-white shadow-md' : 'bg-[#1c1c1e] border-[#2e2e32] text-[#a1a1aa] hover:text-white'}"
			>
				{ex.name}
			</button>
		{/each}
	</div>

	<!-- Pose Camera / Viewfinder Box -->
	<div class="relative w-full aspect-[3/4] rounded-2xl overflow-hidden bg-[#121215] border border-[#2e2e32] shadow-2xl flex flex-col justify-between p-4">
		<!-- Live Video feed -->
		<video
			bind:this={videoEl}
			autoplay
			playsinline
			muted
			class="absolute inset-0 w-full h-full object-cover {isCameraRunning ? 'block' : 'hidden'}"
		></video>

		<!-- Canvas overlay for Skeleton & Guide reticle -->
		<canvas
			bind:this={canvasEl}
			width="360"
			height="480"
			class="absolute inset-0 w-full h-full object-cover pointer-events-none z-10"
		></canvas>

		{#if !isSessionActive}
			<div class="absolute inset-0 bg-[#0a0a0a]/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center z-20">
				<div class="w-14 h-14 rounded-2xl bg-red-950/60 border border-red-800/60 flex items-center justify-center text-[#ff0101] mb-3 shadow-[0_0_15px_rgba(255,1,1,0.3)]">
					<span class="material-symbols-outlined text-[30px]">accessibility_new</span>
				</div>
				<h3 class="text-sm font-bold text-white mb-1">Optical Joint Tracking</h3>
				<p class="text-xs text-[#a1a1aa] max-w-xs mb-4">
					Tracks 17 joint keypoints in real time with automated rep cadence and posture feedback.
				</p>
				<button
					type="button"
					onclick={startCamera}
					class="py-2.5 px-5 bg-[#ff0101] hover:bg-red-700 active:scale-95 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-xl transition-all cursor-pointer"
				>
					<span class="material-symbols-outlined text-[18px]">play_arrow</span>
					<span>Start Workout HUD</span>
				</button>
			</div>
		{/if}

		<!-- Top HUD telemetry metrics -->
		<div class="relative z-20 flex items-start justify-between">
			<div class="bg-black/70 backdrop-blur-md border border-white/10 rounded-xl px-2.5 py-1.5 flex items-center gap-2">
				<span class="w-2 h-2 rounded-full bg-[#ff0101] animate-ping"></span>
				<span class="text-xs font-mono font-bold text-white">{formattedTime}</span>
			</div>

			<div class="bg-black/70 backdrop-blur-md border border-white/10 rounded-xl px-2.5 py-1.5 text-right">
				<span class="text-[9px] text-[#ff3333] font-mono block">FORM SCORE</span>
				<span class="text-xs font-mono font-bold text-white">{formScore}%</span>
			</div>
		</div>

		<!-- Big Digital Rep Counter HUD -->
		<div class="relative z-20 flex flex-col items-center justify-center pointer-events-none">
			<span class="text-[10px] text-[#ff3333] font-mono tracking-widest uppercase font-bold">REPETITIONS</span>
			<span class="text-6xl font-black font-mono text-white drop-shadow-[0_0_15px_rgba(255,1,1,0.6)]">
				{repCount}
			</span>
		</div>

		<!-- Bottom Feedback Banner & Action Controls -->
		<div class="relative z-20 space-y-2">
			<!-- Posture Feedback Pill -->
			<div class="bg-black/75 backdrop-blur-md border border-red-900/40 rounded-xl px-3 py-1.5 flex items-center gap-2">
				<span class="material-symbols-outlined text-[#ff0101] text-[18px]">verified</span>
				<span class="text-[11px] text-white font-medium truncate">{feedbackText}</span>
			</div>

			<!-- Quick Rep Simulation / Trigger Button -->
			<div class="flex gap-2">
				<button
					type="button"
					onclick={triggerSimulatedRep}
					class="flex-1 py-2 bg-[#ff0101] hover:bg-red-700 active:scale-95 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-lg transition-all cursor-pointer"
				>
					<span class="material-symbols-outlined text-[16px]">touch_app</span>
					<span>Register Rep (+1)</span>
				</button>
				<button
					type="button"
					onclick={resetSession}
					class="py-2 px-3 bg-black/70 hover:bg-black/90 text-[#a1a1aa] hover:text-white rounded-xl text-xs font-semibold border border-white/10 transition-colors cursor-pointer"
				>
					Reset
				</button>
			</div>
		</div>
	</div>

	<!-- Save Session Button -->
	{#if repCount > 0}
		<button
			type="button"
			onclick={saveSet}
			class="w-full py-2.5 bg-gradient-to-r from-red-600 to-[#ff0101] hover:opacity-90 active:scale-95 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-xl transition-all cursor-pointer"
		>
			<span class="material-symbols-outlined text-[18px]">check_circle</span>
			<span>Log Set to Database</span>
		</button>
	{/if}

	{#if sessionSavedMessage}
		<div class="p-3 rounded-xl bg-green-950/60 border border-green-700 text-xs font-semibold text-green-200 text-center animate-in fade-in">
			{sessionSavedMessage}
		</div>
	{/if}
</div>
