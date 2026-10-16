<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';
	import { onMount } from 'svelte';

	let { children } = $props();

	let isDark = $state(true);
	let showNotifications = $state(false);

	onMount(() => {
		isDark = document.documentElement.classList.contains('dark');
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

	const navItems = [
		{ label: 'Home', href: '/', icon: 'dashboard' },
		{ label: 'Vision', href: '/nutrition', icon: 'camera_alt' },
		{ label: 'Pose HUD', href: '/pose', icon: 'accessibility_new' },
		{ label: 'Coaches', href: '/trainers', icon: 'sports_gymnastics' },
		{ label: 'Profile', href: '/profile', icon: 'person' }
	];
</script>

<div class="min-h-screen flex flex-col bg-[#0a0a0a] text-white selection:bg-[#ff0101] selection:text-white transition-colors duration-200">
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
