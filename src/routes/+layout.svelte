<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';
	import { goto, invalidateAll } from '$app/navigation';
	import { onMount, onDestroy } from 'svelte';
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: any } = $props();

	let currentUser = $derived(data.user);
	let isDark = $state(true);
	let showNotifications = $state(false);
	let showUserMenu = $state(false);
	let showQuickMenu = $state(false);
	let quickToast = $state<string | null>(null);

	// Notification list state & Poller
	let notifications = $state<any[]>(data.notifications ? [...data.notifications] : []);
	let unreadCount = $derived(notifications.filter((n) => !n.isRead).length);
	let notifPoller: any = null;
	let notificationPermission = $state<NotificationPermission>('default');

	$effect(() => {
		if (data.notifications) {
			notifications = [...data.notifications];
		}
	});

	// Workout Rest Timer State
	let isRestTimerActive = $state(false);
	let restSecondsRemaining = $state(60);
	let restTotalSeconds = $state(60);
	let restTimerInterval: any = null;

	onMount(() => {
		isDark = document.documentElement.classList.contains('dark');

		if (typeof window !== 'undefined' && 'Notification' in window) {
			notificationPermission = Notification.permission;
		}

		// Poll for real-time notifications every 4 seconds
		notifPoller = setInterval(async () => {
			try {
				const res = await fetch('/api/notifications');
				const json = await res.json();
				if (json.success && Array.isArray(json.notifications)) {
					const prevIds = new Set(notifications.map((n) => n.id));
					const freshNotifs = json.notifications.filter((n: any) => !prevIds.has(n.id));

					if (freshNotifs.length > 0) {
						const newest = freshNotifs[0];
						triggerQuickToast(`🔔 ${newest.title}: ${newest.message}`);
						playNotificationAudio();

						if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
							try { navigator.vibrate([100, 50, 100]); } catch (_) {}
						}

						if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
							new Notification(newest.title, {
								body: newest.message,
								icon: '/favicon.png'
							});
						}
					}
					notifications = json.notifications;
				}
			} catch (_) {}
		}, 4000);
	});

	onDestroy(() => {
		clearInterval(restTimerInterval);
		clearInterval(notifPoller);
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
		if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
			try { navigator.vibrate([150, 100, 150, 100, 300]); } catch (_) {}
		}

		try {
			const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
			const osc = ctx.createOscillator();
			const gain = ctx.createGain();
			osc.connect(gain);
			gain.connect(ctx.destination);
			osc.frequency.setValueAtTime(523.25, ctx.currentTime);
			osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.15);
			osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.3);
			gain.gain.setValueAtTime(0.2, ctx.currentTime);
			gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
			osc.start();
			osc.stop(ctx.currentTime + 0.7);
		} catch (_) {}

		triggerQuickToast('Rest interval complete! Time for next set.');
	}

	function playNotificationAudio() {
		try {
			const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
			const osc = ctx.createOscillator();
			const gain = ctx.createGain();
			osc.connect(gain);
			gain.connect(ctx.destination);
			osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
			osc.frequency.setValueAtTime(880.0, ctx.currentTime + 0.1); // A5
			gain.gain.setValueAtTime(0.2, ctx.currentTime);
			gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
			osc.start();
			osc.stop(ctx.currentTime + 0.4);
		} catch (_) {}
	}

	function triggerQuickToast(msg: string) {
		quickToast = msg;
		setTimeout(() => {
			if (quickToast === msg) quickToast = null;
		}, 4000);
	}

	async function markAsRead(id: string) {
		try {
			await fetch('/api/notifications', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id })
			});
			const n = notifications.find((item) => item.id === id);
			if (n) n.isRead = true;
		} catch (_) {}
	}

	async function clearAllNotifications() {
		try {
			await fetch('/api/notifications', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ clearAll: true })
			});
			notifications = [];
		} catch (_) {}
	}

	async function requestNotificationPermission() {
		if (typeof window !== 'undefined' && 'Notification' in window) {
			const res = await Notification.requestPermission();
			notificationPermission = res;
			if (res === 'granted') {
				triggerQuickToast('Browser push notifications enabled!');
			}
		}
	}

	async function handleLogout() {
		showUserMenu = false;
		try {
			await fetch('/api/auth/logout', { method: 'POST' });
			await invalidateAll();
			goto('/login');
		} catch (_) {}
	}

	async function switchAccount(userId: string) {
		showUserMenu = false;
		try {
			const res = await fetch('/api/auth/switch', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ userId })
			});
			const json = await res.json();
			if (json.success) {
				triggerQuickToast(`Switched session to ${json.user.name}`);
				await invalidateAll();
				window.location.reload();
			}
		} catch (_) {}
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
				triggerQuickToast(`+250 ml logged! Today: ${json.waterTotal} ml`);
				if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
					try { navigator.vibrate([40, 30, 40]); } catch (_) {}
				}
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
						{#if unreadCount > 0}
							<span class="absolute top-1.5 right-1.5 min-w-[14px] h-[14px] px-1 rounded-full bg-[#ff0101] text-white text-[9px] font-bold flex items-center justify-center shadow-[0_0_8px_#ff0101]">
								{unreadCount}
							</span>
						{/if}
					</button>

					<!-- Notifications Popover -->
					{#if showNotifications}
						<div class="absolute right-0 mt-2 w-80 bg-[#1c1c1e] border border-[#2e2e32] rounded-2xl shadow-2xl p-3.5 z-50 animate-in fade-in slide-in-from-top-2">
							<div class="flex items-center justify-between pb-2 mb-2 border-b border-[#2e2e32]">
								<div class="flex items-center gap-1.5">
									<span class="text-xs font-bold text-white">Active Telemetry Alerts</span>
									{#if unreadCount > 0}
										<span class="px-1.5 py-0.2 rounded bg-red-950 text-[#ff3333] text-[9px] font-mono font-bold border border-red-800">
											{unreadCount} New
										</span>
									{/if}
								</div>
								<div class="flex items-center gap-2">
									{#if notifications.length > 0}
										<button
											type="button"
											onclick={clearAllNotifications}
											class="text-[10px] text-[#a1a1aa] hover:text-white transition-colors"
										>
											Clear
										</button>
									{/if}
								</div>
							</div>

							<!-- Web Push Permission Banner -->
							{#if notificationPermission !== 'granted'}
								<div class="mb-2 p-2 rounded-xl bg-[#121212] border border-[#2e2e32] flex items-center justify-between text-[11px]">
									<span class="text-[#a1a1aa]">Browser Push Alerts:</span>
									<button
										type="button"
										onclick={requestNotificationPermission}
										class="px-2 py-0.5 rounded bg-red-950 text-[#ff3333] border border-red-800 font-medium hover:brightness-110 text-[10px]"
									>
										Enable
									</button>
								</div>
							{/if}

							<!-- Notifications List -->
							<div class="space-y-2 max-h-64 overflow-y-auto pr-1">
								{#if notifications.length === 0}
									<div class="py-6 text-center text-[#71717a] text-xs">
										No active notifications
									</div>
								{:else}
									{#each notifications as notif}
										<div
											class="p-2.5 rounded-xl border transition-all cursor-pointer {notif.isRead ? 'bg-[#121212]/60 border-[#2e2e32]/60 opacity-70' : 'bg-[#121212] border-red-900/40'}"
											onclick={() => markAsRead(notif.id)}
										>
											<div class="flex items-start gap-2">
												<span class="material-symbols-outlined text-[18px] {notif.type === 'challenge' ? 'text-[#ff0101]' : notif.type === 'warning' ? 'text-amber-400' : notif.type === 'critical' ? 'text-purple-400' : 'text-[#488fff]'}">
													{notif.type === 'challenge' ? 'alarm_on' : notif.type === 'warning' ? 'warning' : notif.type === 'critical' ? 'emergency' : 'info'}
												</span>
												<div class="flex-1 min-w-0">
													<div class="flex items-center justify-between">
														<p class="text-xs font-semibold text-white truncate">{notif.title}</p>
														{#if !notif.isRead}
															<span class="w-1.5 h-1.5 rounded-full bg-[#ff0101]"></span>
														{/if}
													</div>
													<p class="text-[11px] text-[#a1a1aa] mt-0.5 leading-snug">{notif.message}</p>
													<span class="text-[9px] text-[#71717a] font-mono mt-1 block">
														{new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
													</span>
												</div>
											</div>
										</div>
									{/each}
								{/if}
							</div>
						</div>
					{/if}
				</div>

				<!-- Account / Avatar Dropdown -->
				<div class="relative">
					{#if currentUser}
						<button
							type="button"
							onclick={() => (showUserMenu = !showUserMenu)}
							aria-label="User Account Menu"
							class="w-9 h-9 rounded-full bg-gradient-to-tr from-red-600 to-[#ff0101] p-0.5 shadow-sm hover:scale-105 active:scale-95 transition-transform flex-shrink-0 cursor-pointer relative"
						>
							<div class="w-full h-full rounded-full bg-[#121212] flex items-center justify-center overflow-hidden">
								<img
									src={currentUser.image || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(currentUser.name)}`}
									alt={currentUser.name}
									class="w-full h-full object-cover"
								/>
							</div>
							{#if currentUser.role === 'admin'}
								<span class="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-purple-600 border border-black flex items-center justify-center text-[7px] text-white font-bold" title="Admin">
									★
								</span>
							{/if}
						</button>

						<!-- User Dropdown Popover -->
						{#if showUserMenu}
							<div class="absolute right-0 mt-2 w-64 bg-[#1c1c1e] border border-[#2e2e32] rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2 space-y-2">
								<div class="pb-2 border-b border-[#2e2e32]">
									<div class="flex items-center gap-2">
										<p class="text-xs font-bold text-white truncate">{currentUser.name}</p>
										<span class="px-1.5 py-0.2 rounded text-[8px] font-mono uppercase {currentUser.role === 'admin' ? 'bg-purple-950 text-purple-400 border border-purple-800' : 'bg-red-950 text-red-400 border border-red-800'}">
											{currentUser.role}
										</span>
									</div>
									<p class="text-[10px] text-[#a1a1aa] font-mono truncate">{currentUser.email}</p>
								</div>

								<div class="space-y-1">
									<a
										href="/profile"
										onclick={() => (showUserMenu = false)}
										class="flex items-center gap-2 px-2.5 py-2 rounded-xl hover:bg-[#2e2e32] text-xs text-white transition-colors"
									>
										<span class="material-symbols-outlined text-[16px] text-[#ff0101]">person</span>
										My Athlete Profile
									</a>

									<a
										href="/admin"
										onclick={() => (showUserMenu = false)}
										class="flex items-center justify-between px-2.5 py-2 rounded-xl hover:bg-[#2e2e32] text-xs text-white transition-colors"
									>
										<span class="flex items-center gap-2">
											<span class="material-symbols-outlined text-[16px] text-purple-400">terminal</span>
											Diagnostic Ops Center
										</span>
										{#if currentUser.role === 'admin'}
											<span class="text-[9px] px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 font-mono">ACTIVE</span>
										{/if}
									</a>
								</div>

								<!-- Quick Preset Switcher -->
								<div class="pt-1 border-t border-[#2e2e32] space-y-1">
									<p class="text-[9px] text-[#71717a] uppercase font-mono px-2">Quick Testing Switch</p>
									<div class="grid grid-cols-2 gap-1.5 px-1">
										<button
											type="button"
											onclick={() => switchAccount('user_alex_mercer')}
											class="py-1 px-2 rounded-lg bg-[#121212] border border-[#2e2e32] hover:border-[#ff0101] text-[10px] text-left text-white"
										>
											Athlete Alex
										</button>
										<button
											type="button"
											onclick={() => switchAccount('user_admin_ops')}
											class="py-1 px-2 rounded-lg bg-[#121212] border border-[#2e2e32] hover:border-purple-500 text-[10px] text-left text-white"
										>
											Ops Admin
										</button>
									</div>
								</div>

								<!-- Logout -->
								<div class="pt-1 border-t border-[#2e2e32]">
									<button
										type="button"
										onclick={handleLogout}
										class="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-red-950/40 text-xs text-red-400 transition-colors"
									>
										<span class="material-symbols-outlined text-[16px]">logout</span>
										Sign Out
									</button>
								</div>
							</div>
						{/if}
					{:else}
						<a
							href="/login"
							class="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#ff0101] to-[#cc0000] text-white text-xs font-bold hover:brightness-110 active:scale-95 transition-all shadow-md flex items-center gap-1"
						>
							<span class="material-symbols-outlined text-[16px]">login</span>
							Sign In
						</a>
					{/if}
				</div>
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
