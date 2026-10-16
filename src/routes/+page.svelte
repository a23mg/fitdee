<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Reactive local copies for instantaneous optimistic UI
	let currentShakes = $state(data.challenge?.currentShakes ?? 18);
	let shakeTarget = $state(data.challenge?.shakeTarget ?? 30);
	let exercises = $state(data.exercises ?? []);
	let waterTotal = $state(data.waterTotal ?? 1750);
	let waterTarget = $state(data.profile?.dailyWaterTargetMl ?? 3000);
	let isSimulatingShake = $state(false);
	let showReminder = $state(true);

	let shakePercent = $derived(Math.min(100, Math.round((currentShakes / (shakeTarget || 1)) * 100)));
	let waterPercent = $derived(Math.min(100, Math.round((waterTotal / (waterTarget || 1)) * 100)));

	async function simulateShake() {
		if (isSimulatingShake) return;
		isSimulatingShake = true;
		currentShakes = Math.min(shakeTarget, currentShakes + 1);

		try {
			const res = await fetch('/api/routine/shake', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'shake' })
			});
			const json = await res.json();
			if (json.success) {
				currentShakes = json.currentShakes;
			}
		} catch (err) {
			console.error('Failed to update shake:', err);
		} finally {
			isSimulatingShake = false;
		}
	}

	async function resetAlarm() {
		currentShakes = 0;
		try {
			await fetch('/api/routine/shake', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'reset' })
			});
		} catch (err) {
			console.error(err);
		}
	}

	async function toggleExercise(exId: string) {
		const ex = exercises.find((e: any) => e.id === exId);
		if (!ex) return;

		// Optimistic update
		ex.isDone = !ex.isDone;
		ex.completedSets = ex.isDone ? ex.sets : 0;

		try {
			const res = await fetch('/api/routine/exercise', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ exerciseId: exId })
			});
			const json = await res.json();
			if (json.success && json.exercise) {
				ex.isDone = json.exercise.isDone;
				ex.completedSets = json.exercise.completedSets;
			}
		} catch (err) {
			console.error(err);
		}
	}

	async function addWater(amountMl: number) {
		waterTotal += amountMl;
		try {
			const res = await fetch('/api/routine/water', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ amountMl })
			});
			const json = await res.json();
			if (json.success) {
				waterTotal = json.waterTotal;
			}
		} catch (err) {
			console.error(err);
		}
	}
</script>

<svelte:head>
	<title>Fitdee | Daily Routine & Home</title>
</svelte:head>

<div class="flex flex-col w-full space-y-4 pt-2">
	<!-- Active Challenge Card: Wake-up Alarm Shake Progress -->
	<section class="relative overflow-hidden rounded-2xl bg-[#1c1c1e] p-4 border border-[#2e2e32] shadow-xl">
		<div class="absolute -right-8 -top-8 w-40 h-40 bg-red-600/10 rounded-full blur-3xl pointer-events-none"></div>
		<div class="absolute -left-8 -bottom-8 w-32 h-32 bg-orange-600/10 rounded-full blur-2xl pointer-events-none"></div>
		
		<div class="flex items-start justify-between relative z-10">
			<div class="flex items-center space-x-3">
				<div class="w-10 h-10 rounded-xl bg-red-950/60 border border-red-800/60 flex items-center justify-center text-[#ff3333] shadow-sm flex-shrink-0">
					<span class="material-symbols-outlined text-[22px]">alarm_on</span>
				</div>
				<div>
					<div class="flex items-center space-x-1.5">
						<span class="inline-block w-1.5 h-1.5 rounded-full bg-[#ff0101] shadow-[0_0_5px_#ff0101]"></span>
						<span class="text-[10px] text-[#ff3333] uppercase font-bold tracking-wider font-mono">ACTIVE PROTOCOL</span>
					</div>
					<h2 class="text-sm text-white font-bold tracking-tight">06:30 AM • Shake to Awake</h2>
				</div>
			</div>
			<span class="text-[10px] px-2.5 py-1 rounded-full bg-[#242426] border border-[#2e2e32] text-[#a1a1aa] font-medium tracking-wide">
				{data.profile?.activeTier ?? '1-Year Tier'}
			</span>
		</div>

		<div class="mt-3.5 bg-[#121212] border border-[#2e2e32] rounded-xl p-3 relative z-10 shadow-inner">
			<div class="flex justify-between items-end mb-2">
				<div class="flex flex-col">
					<span class="text-[11px] text-[#a1a1aa]">Wake-up Sensor Progress</span>
					<span class="text-[13px] text-white font-bold mt-0.5 font-mono">
						Shakes: {currentShakes} / {shakeTarget}
					</span>
				</div>
				<div class="flex items-center gap-1.5">
					<span class="w-1.5 h-1.5 rounded-full bg-[#ff0101] shadow-[0_0_5px_#ff0101]"></span>
					<span class="text-[11px] text-[#ff3333] font-bold font-mono">{shakePercent}% Done</span>
				</div>
			</div>

			<!-- Dynamic Progress Bar -->
			<div class="w-full h-2.5 bg-[#242426] rounded-full overflow-hidden p-0.5 border border-[#2e2e32]">
				<div
					class="h-full bg-gradient-to-r from-red-600 to-[#ff0101] rounded-full transition-all duration-300 ease-out shadow-[0_0_8px_rgba(255,1,1,0.5)]"
					style="width: {shakePercent}%"
				></div>
			</div>

			<div class="mt-3 flex items-center justify-between gap-2">
				<button
					type="button"
					onclick={simulateShake}
					class="flex-1 py-2 px-3 bg-[#ff0101] hover:bg-red-700 active:scale-95 text-white text-xs font-semibold rounded-xl flex items-center justify-center space-x-1.5 transition-all shadow-md cursor-pointer"
				>
					<span class="material-symbols-outlined text-[17px]">vibration</span>
					<span>Simulate Shake (+1)</span>
				</button>
				<button
					type="button"
					onclick={resetAlarm}
					class="py-2 px-3 bg-[#1c1c1e] hover:bg-[#242426] text-[#a1a1aa] hover:text-white rounded-xl text-xs font-medium transition-colors border border-[#2e2e32] cursor-pointer"
				>
					Reset
				</button>
			</div>
		</div>
	</section>

	<!-- Scheduled Routine Notification Toast -->
	{#if showReminder}
		<section class="bg-[#1c1c1e] border border-[#2e2e32] rounded-xl p-3 flex items-center justify-between shadow-md relative overflow-hidden">
			<div class="absolute left-0 top-0 bottom-0 w-1.5 bg-[#ff0101]"></div>
			<div class="flex items-center space-x-2.5 pl-2 min-w-0">
				<div class="w-8 h-8 rounded-xl flex items-center justify-center bg-red-950/50 text-[#ff3333] border border-red-800/60 flex-shrink-0">
					<span class="material-symbols-outlined text-[18px]">notifications_active</span>
				</div>
				<div class="min-w-0">
					<p class="text-xs text-white font-semibold truncate leading-tight">Reminder: Evening Cardio 05:30 PM</p>
					<p class="text-[11px] text-[#a1a1aa] font-normal truncate mt-0.5">Hydrate before session • 45 min target</p>
				</div>
			</div>
			<button
				type="button"
				onclick={() => (showReminder = false)}
				aria-label="Dismiss notification"
				class="text-[#a1a1aa] hover:text-white p-1.5 transition-colors rounded-lg hover:bg-[#242426] flex-shrink-0 cursor-pointer"
			>
				<span class="material-symbols-outlined text-[18px]">check</span>
			</button>
		</section>
	{/if}

	<!-- Daily Workout Routine & Checklist -->
	<section class="flex flex-col space-y-2.5">
		<div class="flex items-center justify-between gap-2">
			<div>
				<span class="text-[10px] uppercase text-[#ff3333] font-bold tracking-wider font-mono">WORKOUT PROTOCOL</span>
				<h3 class="text-sm text-white font-bold truncate">Today's Workout Routine</h3>
			</div>
			<div class="flex items-center space-x-1 px-2.5 py-1 bg-[#1c1c1e] border border-[#2e2e32] rounded-full text-[#a1a1aa] shadow-xs flex-shrink-0">
				<span class="material-symbols-outlined text-[14px] text-[#ff3333]">fitness_center</span>
				<span class="text-[11px] font-semibold text-white">{data.routine?.category ?? 'Chest & Triceps'}</span>
			</div>
		</div>

		<!-- Visual workout preview thumbnail -->
		<div class="relative w-full h-36 rounded-2xl overflow-hidden shadow-lg border border-[#2e2e32] group">
			<img
				src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=80"
				alt="Athletic training preview"
				class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
			/>
			<div class="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/50 to-transparent"></div>
			<div class="absolute bottom-2.5 left-3 right-3 flex items-center justify-between gap-2">
				<div class="min-w-0">
					<span class="text-[10px] text-red-400 uppercase font-bold tracking-wider font-mono">Daily Target</span>
					<p class="text-xs text-white font-semibold truncate">{data.routine?.name ?? 'Hypertrophy Block A'} • {exercises.length} Exercises</p>
				</div>
				<a
					href="/pose"
					class="px-2.5 py-1 rounded-lg bg-[#ff0101] hover:bg-red-700 text-white text-[11px] font-bold shadow-md flex items-center gap-1 cursor-pointer"
				>
					<span class="material-symbols-outlined text-[14px]">videocam</span>
					<span>Pose HUD</span>
				</a>
			</div>
		</div>

		<!-- Interactive Exercise Checklist -->
		<div class="flex flex-col space-y-2">
			{#each exercises as ex}
				<div class="bg-[#1c1c1e] hover:bg-[#242426] border border-[#2e2e32] transition-all rounded-xl flex items-center justify-between shadow-sm p-3">
					<div class="flex items-center space-x-3 min-w-0">
						<button
							type="button"
							onclick={() => toggleExercise(ex.id)}
							aria-label="Toggle exercise status"
							class="w-7 h-7 rounded-full flex items-center justify-center transition-transform active:scale-90 flex-shrink-0 cursor-pointer {ex.isDone ? 'bg-[#ff0101] text-white shadow-[0_0_8px_rgba(255,1,1,0.5)]' : 'bg-[#242426] border border-[#3f3f46] text-[#a1a1aa] hover:border-[#ff0101]'}"
						>
							<span class="material-symbols-outlined text-[16px] font-bold">
								{ex.isDone ? 'check' : 'radio_button_unchecked'}
							</span>
						</button>
						<div class="flex flex-col min-w-0">
							<span class="text-xs font-semibold truncate leading-tight {ex.isDone ? 'text-[#71717a] line-through' : 'text-white'}">
								{ex.name}
							</span>
							<span class="text-[11px] text-[#a1a1aa] font-normal truncate mt-0.5">
								{ex.targetArea}
							</span>
						</div>
					</div>

					<span class="text-[11px] font-mono font-bold px-2 py-0.5 rounded border ml-2 whitespace-nowrap {ex.isDone ? 'text-[#ff3333] bg-red-950/50 border-red-800/60' : 'text-[#a1a1aa] bg-[#242426] border-[#2e2e32]'}">
						{ex.completedSets}/{ex.sets}
					</span>
				</div>
			{/each}
		</div>
	</section>

	<!-- Hydration & Water Intake Tracker -->
	<section class="bg-[#1c1c1e] border border-[#2e2e32] rounded-2xl p-4 shadow-xl">
		<div class="flex items-center justify-between mb-3">
			<div class="flex items-center gap-2">
				<div class="w-8 h-8 rounded-lg bg-blue-950/60 border border-blue-800/50 flex items-center justify-center text-[#488fff]">
					<span class="material-symbols-outlined text-[18px]">water_drop</span>
				</div>
				<div>
					<span class="text-[10px] text-[#488fff] uppercase font-bold tracking-wider font-mono">HYDRATION PROTOCOL</span>
					<h4 class="text-xs font-bold text-white">Daily Water Intake</h4>
				</div>
			</div>
			<span class="text-xs font-mono font-bold text-[#488fff]">{waterTotal} / {waterTarget} ml</span>
		</div>

		<div class="w-full h-2 bg-[#242426] rounded-full overflow-hidden p-0.5 border border-[#2e2e32] mb-3">
			<div
				class="h-full bg-gradient-to-r from-blue-600 to-[#488fff] rounded-full transition-all duration-300"
				style="width: {waterPercent}%"
			></div>
		</div>

		<div class="flex gap-2">
			<button
				type="button"
				onclick={() => addWater(250)}
				class="flex-1 py-1.5 px-2 bg-[#121212] hover:bg-[#242426] border border-[#2e2e32] rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
			>
				<span class="material-symbols-outlined text-[16px] text-[#488fff]">add</span>
				<span>+250 ml</span>
			</button>
			<button
				type="button"
				onclick={() => addWater(500)}
				class="flex-1 py-1.5 px-2 bg-[#121212] hover:bg-[#242426] border border-[#2e2e32] rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
			>
				<span class="material-symbols-outlined text-[16px] text-[#488fff]">add</span>
				<span>+500 ml</span>
			</button>
		</div>
	</section>

	<!-- Quick Navigation Cards -->
	<section class="grid grid-cols-2 gap-3 pt-1">
		<a
			href="/nutrition"
			class="p-3.5 rounded-2xl bg-[#1c1c1e] hover:bg-[#242426] border border-[#2e2e32] flex flex-col justify-between group transition-all shadow-md"
		>
			<div class="w-8 h-8 rounded-xl bg-red-950/60 border border-red-800/60 flex items-center justify-center text-[#ff0101] mb-2 group-hover:scale-110 transition-transform">
				<span class="material-symbols-outlined text-[18px]">photo_camera</span>
			</div>
			<div>
				<span class="text-xs font-bold text-white block">AI Nutrition Vision</span>
				<span class="text-[10px] text-[#a1a1aa] block mt-0.5">Macro scanning & meal logs</span>
			</div>
		</a>

		<a
			href="/trainers"
			class="p-3.5 rounded-2xl bg-[#1c1c1e] hover:bg-[#242426] border border-[#2e2e32] flex flex-col justify-between group transition-all shadow-md"
		>
			<div class="w-8 h-8 rounded-xl bg-red-950/60 border border-red-800/60 flex items-center justify-center text-[#ff3333] mb-2 group-hover:scale-110 transition-transform">
				<span class="material-symbols-outlined text-[18px]">sports_gymnastics</span>
			</div>
			<div>
				<span class="text-xs font-bold text-white block">Verified Trainers</span>
				<span class="text-[10px] text-[#a1a1aa] block mt-0.5">Book 1-on-1 coaching</span>
			</div>
		</a>
	</section>
</div>
