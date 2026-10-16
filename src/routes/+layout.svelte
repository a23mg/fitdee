<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';
	import { onMount, onDestroy } from 'svelte';

	let { children } = $props();

	let isDark = $state(true);
	let showNotifications = $state(false);
	let showQuickMenu = $state(false);
	let quickToast = $state<string | null>(null);

	// Workout Rest Timer State
	let isRestTimerActive = $state(false);
	let restSecondsRemaining = $state(60);
	let restTotalSeconds = $state(60);
	let restTimerInterval: any = null;

	onMount(() => {
		isDark = document.documentElement.classList.contains('dark');
	});

	onDestroy(() => {
		clearInterval(restTimerInterval);
	});

	function toggleTheme() {
		isDark = !isDark;
		if (isDark) {
			document.documentElement.classList.add('dark');
			localStorage.setItem('fitdee_theme', 'dark');
		} else {
			document.documentElement.classList.remove('dark');
			localStorage.setItem('fitdee_theme', 'light');
		}
	}

	function startRestTimer(seconds = 60) {
		clearInterval(restTimerInterval);
		restTotalSeconds = seconds;
		restSecondsRemaining = seconds;
		isRestTimerActive = true;
		showQuickMenu = false;

		restTimerInterval = setInterval(() => {
			if (restSecondsRemaining > 1) {
				restSecondsRemaining--;
			} else {
				restSecondsRemaining = 0;
				clearInterval(restTimerInterval);
				triggerTimerAlarm();
			}
		}, 1000);
	}

	function adjustRestTimer(delta: number) {
		restSecondsRemaining = Math.max(5, restSecondsRemaining + delta);
		restTotalSeconds = Math.max(restTotalSeconds, restSecondsRemaining);
	}

	function stopRestTimer() {
		clearInterval(restTimerInterval);
		isRestTimerActive = false;
	}

	function triggerTimerAlarm() {
		// Haptic vibration buzz
		if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
			try {
				navigator.vibrate([150, 100, 150, 100, 300]);
			} catch (_) {}
		}

		// Web Audio chime
		try {
			const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
			const osc = ctx.createOscillator();
			const gain = ctx.createGain();
			osc.connect(gain);
			gain.connect(ctx.destination);
			osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
			osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.15); // E5
			osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.3); // G5
			gain.gain.setValueAtTime(0.2, ctx.currentTime);
			gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
			osc.start();
			osc.stop(ctx.currentTime + 0.7);
		} catch (_) {}

		quickToast = 'Rest interval complete! Time for next set.';
		setTimeout(() => { quickToast = null; }, 4000);
	}

	async function quickWaterLog() {
		showQuickMenu = false;
		try {
			const res = await fetch('/api/routine/water', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ amountMl: 250 })
			});
			const json = await res.json();
			if (json.success) {
				quickToast = `+250 ml logged! Today: ${json.waterTotal} ml`;
				if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
					try { navigator.vibrate([40, 30, 40]); } catch (_) {}
				}
				setTimeout(() => { quickToast = null; }, 3000);
			}
		} catch (_) {}
	}

	const navItems = [
		{ label: 'Home', href: '/', icon: 'dashboard' },
		{ label: 'Vision', href: '/nutrition', icon: 'camera_alt' },
		{ label: 'Pose HUD', href: '/pose', icon: 'accessibility_new' },
		{ label: 'Coaches', href: '/trainers', icon: 'sports_gymnastics' },
		{ label: 'Profile', href: '/profile', icon: 'person' }
	];

	let formattedRestTime = $derived(
		`${String(Math.floor(restSecondsRemaining / 60)).padStart(2, '0')}:${String(restSecondsRemaining % 60).padStart(2, '0')}`
	);
</script>

<div class="min-h-[100dvh] flex flex-col bg-[#0a0a0a] text-white selection:bg-[#ff0101] selection:text-white transition-colors duration-200">
	<!-- Fixed Header -->
	<header class="fixed top-0 inset-x-0 z-50 backdrop-blur-xl border-b border-[#2e2e32] shadow-sm pt-safe bg-[#0a0a0a]/90 transition-colors">
		<div class="max-w-md mx-auto h-16 px-4 flex items-center justify-between">
			<!-- Logo & Year 1 Tag -->
			<a href="/" class="flex items-center gap-2 group">
				<div class="relative w-8 h-8 rounded-lg bg-gradient-to-br from-[#ff0101] to-[#990000] flex items-center justify-center shadow-[0_0_12px_rgba(255,1,1,0.4)] group-hover:scale-105 transition-transform">
					<span class="material-symbols-outlined text-white text-[20px] font-bold">bolt</span>
				</div>
				<div class="flex flex-col">
					<div class="flex items-center gap-1.5">
						<span class="font-bold text-[15px] leading-tight tracking-tight text-white">Fitdee</span>
						<span class="px-1.5 py-0.2 rounded bg-red-950/70 border border-red-800/60 text-[9px] text-[#ff3333] font-semibold tracking-wider uppercase">YEAR 1 FOCUS</span>
					</div>
					<span class="uppercase text-[#a1a1aa] text-[9px] tracking-widest font-mono">INTELLIGENT ATHLETIC PROTOCOL</span>
				</div>
			</a>

			<!-- Action Buttons -->
			<div class="flex items-center gap-2">
				<!-- Theme Toggle -->
				<button
					type="button"
					onclick={toggleTheme}
					aria-label="Toggle theme mode"
					title="Toggle Dark/Light Mode"
					class="w-9 h-9 rounded-full bg-[#1c1c1e] border border-[#2e2e32] flex items-center justify-center text-[#a1a1aa] hover:text-white hover:border-[#ff0101]/50 transition-all cursor-pointer"
				>
					<span class="material-symbols-outlined text-[18px]">
						{isDark ? 'light_mode' : 'dark_mode'}
					</span>
				</button>

				<!-- Notifications Bell -->
				<div class="relative">
					<button
						type="button"
						onclick={() => (showNotifications = !showNotifications)}
						aria-label="Notifications"
						class="w-9 h-9 rounded-full bg-[#1c1c1e] border border-[#2e2e32] flex items-center justify-center text-[#a1a1aa] hover:text-[#ff0101] transition-colors relative cursor-pointer"
					>
						<span class="material-symbols-outlined text-[18px]">notifications</span>
						<span class="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#ff0101] shadow-[0_0_6px_#ff0101]"></span>
					</button>

					<!-- Notifications Popover -->
					{#if showNotifications}
						<div class="absolute right-0 mt-2 w-72 bg-[#1c1c1e] border border-[#2e2e32] rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2">
							<div class="flex items-center justify-between pb-2 mb-2 border-b border-[#2e2e32]">
								<span class="text-xs font-semibold text-white">Active Alerts</span>
								<span class="text-[10px] text-[#ff3333] font-mono">1 New</span>
							</div>
							<div class="space-y-2">
								<div class="p-2 rounded-xl bg-[#121212] border border-red-900/30 flex items-start gap-2">
									<span class="material-symbols-outlined text-[#ff0101] text-[18px]">alarm_on</span>
									<div>
										<p class="text-xs font-medium text-white">Daily Workout Reminder</p>
										<p class="text-[11px] text-[#a1a1aa]">Evening Cardio at 05:30 PM</p>
									</div>
								</div>
								<div class="p-2 rounded-xl bg-[#121212] border border-[#2e2e32] flex items-start gap-2">
									<span class="material-symbols-outlined text-[#488fff] text-[18px]">water_drop</span>
									<div>
										<p class="text-xs font-medium text-white">Hydration Target</p>
										<p class="text-[11px] text-[#a1a1aa]">1,250 ml remaining for 3L target</p>
									</div>
								</div>
							</div>
						</div>
					{/if}
				</div>

				<!-- Profile Avatar Shortcut -->
				<a
					href="/profile"
					aria-label="User Profile"
					class="w-9 h-9 rounded-full bg-gradient-to-tr from-red-600 to-[#ff0101] p-0.5 shadow-sm hover:scale-105 active:scale-95 transition-transform flex-shrink-0"
				>
					<div class="w-full h-full rounded-full bg-[#121212] flex items-center justify-center overflow-hidden">
						<img
							src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
							alt="Alex Mercer"
							class="w-full h-full object-cover"
						/>
					</div>
				</a>
			</div>
		</div>
	</header>

	<!-- Main Screen Body with Max Width Mobile Frame -->
	<main class="flex-1 flex flex-col w-full max-w-md mx-auto pt-16 pb-24 px-4 bg-[#0a0a0a]">
		{@render children()}
	</main>

	<!-- Floating Rest Timer HUD (Visible while resting between sets) -->
	{#if isRestTimerActive}
		<div class="fixed bottom-20 inset-x-4 max-w-md mx-auto z-40 bg-[#1c1c1e] border border-red-700/60 rounded-2xl p-3 shadow-2xl flex items-center justify-between animate-in slide-in-from-bottom-3">
			<div class="flex items-center gap-3">
				<div class="w-10 h-10 rounded-xl bg-red-950/80 border border-red-700 flex items-center justify-center text-[#ff3333] shadow-md">
					<span class="material-symbols-outlined text-[20px] animate-spin">timelapse</span>
				</div>
				<div>
					<span class="text-[9px] font-mono text-[#ff3333] uppercase font-bold tracking-wider">REST INTERVAL</span>
					<div class="text-lg font-mono font-bold text-white leading-tight">
						{formattedRestTime}
					</div>
				</div>
			</div>

			<div class="flex items-center gap-1.5">
				<button
					type="button"
					onclick={() => adjustRestTimer(15)}
					class="px-2 py-1 bg-[#121212] hover:bg-[#242426] border border-[#2e2e32] rounded-lg text-xs font-mono text-white cursor-pointer"
				>
					+15s
				</button>
				<button
					type="button"
					onclick={stopRestTimer}
					class="w-8 h-8 rounded-lg bg-red-950/80 hover:bg-red-900 border border-red-700 text-[#ff3333] flex items-center justify-center cursor-pointer"
				>
					<span class="material-symbols-outlined text-[16px]">close</span>
				</button>
			</div>
		</div>
	{/if}

	<!-- Floating Quick Action Button (FAB) -->
	<div class="fixed bottom-20 right-4 z-40 max-w-md mx-auto">
		<button
			type="button"
			onclick={() => (showQuickMenu = !showQuickMenu)}
			aria-label="Quick Actions"
			class="w-12 h-12 rounded-full bg-[#ff0101] hover:bg-red-700 active:scale-95 text-white flex items-center justify-center shadow-[0_4px_16px_rgba(255,1,1,0.5)] transition-all cursor-pointer"
		>
			<span class="material-symbols-outlined text-[24px]">
				{showQuickMenu ? 'close' : 'bolt'}
			</span>
		</button>

		<!-- Quick Actions Sheet -->
		{#if showQuickMenu}
			<div class="absolute bottom-14 right-0 w-52 bg-[#1c1c1e] border border-[#2e2e32] rounded-2xl shadow-2xl p-2 space-y-1.5 animate-in fade-in slide-in-from-bottom-2">
				<button
					type="button"
					onclick={quickWaterLog}
					class="w-full p-2 rounded-xl bg-[#121212] hover:bg-[#242426] flex items-center gap-2.5 text-left text-xs font-semibold text-white transition-colors cursor-pointer"
				>
					<span class="material-symbols-outlined text-[#488fff] text-[18px]">water_drop</span>
					<span>+250ml Water</span>
				</button>

				<button
					type="button"
					onclick={() => startRestTimer(60)}
					class="w-full p-2 rounded-xl bg-[#121212] hover:bg-[#242426] flex items-center gap-2.5 text-left text-xs font-semibold text-white transition-colors cursor-pointer"
				>
					<span class="material-symbols-outlined text-[#ff3333] text-[18px]">timer</span>
					<span>60s Rest Timer</span>
				</button>

				<a
					href="/nutrition"
					onclick={() => (showQuickMenu = false)}
					class="w-full p-2 rounded-xl bg-[#121212] hover:bg-[#242426] flex items-center gap-2.5 text-left text-xs font-semibold text-white transition-colors cursor-pointer"
				>
					<span class="material-symbols-outlined text-[#ff0101] text-[18px]">camera_alt</span>
					<span>Fast Meal Scan</span>
				</a>
			</div>
		{/if}
	</div>

	<!-- Instant Toast Notification -->
	{#if quickToast}
		<div class="fixed top-20 inset-x-4 max-w-sm mx-auto z-50 bg-[#1c1c1e] border border-red-700 text-white px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2">
			<span class="material-symbols-outlined text-[#ff0101] text-[18px]">verified</span>
			<span class="text-xs font-medium">{quickToast}</span>
		</div>
	{/if}

	<!-- Bottom Navigation Bar -->
	<nav class="fixed bottom-0 inset-x-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-xl border-t border-[#2e2e32] pb-safe shadow-lg">
		<div class="max-w-md mx-auto h-16 px-3 flex items-center justify-around">
			{#each navItems as item}
				{@const active = page.url.pathname === item.href}
				<a
					href={item.href}
					class="flex flex-col items-center justify-center flex-1 py-1 transition-all group {active ? 'text-[#ff0101]' : 'text-[#a1a1aa] hover:text-white'}"
				>
					<div class="relative flex items-center justify-center w-8 h-8 rounded-full transition-transform group-active:scale-90 {active ? 'bg-red-950/40' : ''}">
						<span class="material-symbols-outlined text-[20px] transition-transform group-hover:scale-110 {active ? 'text-[#ff0101]' : ''}">
							{item.icon}
						</span>
						{#if active}
							<span class="absolute -bottom-0.5 w-1 h-1 rounded-full bg-[#ff0101] shadow-[0_0_4px_#ff0101]"></span>
						{/if}
					</div>
					<span class="text-[10px] tracking-tight font-medium mt-0.5 whitespace-nowrap {active ? 'font-semibold text-white' : ''}">
						{item.label}
					</span>
				</a>
			{/each}
		</div>
	</nav>
</div>
