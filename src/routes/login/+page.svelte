<script lang="ts">
	let email = $state('alex@fitdee.app');
	let password = $state('password123');
	let error = $state<string | null>(null);
	let isLoading = $state(false);

	async function handleLogin() {
		isLoading = true;
		error = null;
		try {
			const res = await fetch('/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password })
			});
			const json = await res.json();
			if (json.success) {
				window.location.href = '/';
			} else {
				error = json.error || 'Authentication failed';
			}
		} catch (err: any) {
			error = err.message || 'Network error';
		} finally {
			isLoading = false;
		}
	}

	async function quickLogin(presetEmail: string, presetPass: string) {
		email = presetEmail;
		password = presetPass;
		await handleLogin();
	}
</script>

<svelte:head>
	<title>Fitdee | Sign In</title>
</svelte:head>

<div class="max-w-md mx-auto pt-6 pb-16 space-y-6">
	<!-- Brand Header -->
	<div class="text-center space-y-2">
		<div class="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-br from-[#ff0101] to-[#990000] items-center justify-center shadow-[0_0_20px_rgba(255,1,1,0.5)] mb-1">
			<span class="material-symbols-outlined text-white text-[28px] font-bold">bolt</span>
		</div>
		<h1 class="text-2xl font-bold tracking-tight text-white">Sign In to Fitdee</h1>
		<p class="text-xs text-[#a1a1aa]">Intelligent athletic protocol & biomechanical telemetry</p>
	</div>

	<!-- Quick Testing Presets Card -->
	<section class="rounded-2xl bg-[#1c1c1e] p-4 border border-[#2e2e32] shadow-xl space-y-3">
		<div class="flex items-center justify-between pb-1">
			<span class="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
				<span class="material-symbols-outlined text-[#ff0101] text-[16px]">speed</span>
				Instant Testing Presets
			</span>
			<span class="text-[10px] text-[#ff3333] font-mono">1-Click Sign In</span>
		</div>
		<div class="grid grid-cols-2 gap-2">
			<button
				type="button"
				onclick={() => quickLogin('alex@fitdee.app', 'password123')}
				class="p-2.5 rounded-xl bg-[#121212] border border-[#2e2e32] hover:border-[#ff0101] text-left transition-all group cursor-pointer"
			>
				<p class="text-xs font-bold text-white group-hover:text-[#ff3333] transition-colors">Alex Mercer</p>
				<p class="text-[10px] text-[#a1a1aa] font-mono">alex@fitdee.app</p>
				<span class="inline-block mt-1 px-1.5 py-0.2 rounded text-[8px] bg-red-950 text-red-400 border border-red-800">Demo Athlete</span>
			</button>

			<button
				type="button"
				onclick={() => quickLogin('admin@fitdee.app', 'adminpassword123')}
				class="p-2.5 rounded-xl bg-[#121212] border border-[#2e2e32] hover:border-purple-500 text-left transition-all group cursor-pointer"
			>
				<p class="text-xs font-bold text-white group-hover:text-purple-400 transition-colors">Ops Admin</p>
				<p class="text-[10px] text-[#a1a1aa] font-mono">admin@fitdee.app</p>
				<span class="inline-block mt-1 px-1.5 py-0.2 rounded text-[8px] bg-purple-950 text-purple-400 border border-purple-800">Admin Ops</span>
			</button>
		</div>
	</section>

	<!-- Standard Login Form -->
	<form onsubmit={(e) => { e.preventDefault(); handleLogin(); }} class="rounded-2xl bg-[#1c1c1e] p-6 border border-[#2e2e32] shadow-xl space-y-4">
		{#if error}
			<div class="p-3 rounded-xl bg-red-950/60 border border-red-800/80 text-xs text-red-300 flex items-center gap-2">
				<span class="material-symbols-outlined text-[16px]">error</span>
				{error}
			</div>
		{/if}

		<div>
			<label for="email-input" class="block text-xs text-[#a1a1aa] mb-1 font-mono uppercase">Email Address</label>
			<input
				id="email-input"
				type="email"
				required
				bind:value={email}
				placeholder="athlete@fitdee.app"
				class="w-full px-3.5 py-2.5 rounded-xl bg-[#121212] border border-[#2e2e32] text-white text-xs focus:border-[#ff0101] focus:outline-none"
			/>
		</div>

		<div>
			<label for="password-input" class="block text-xs text-[#a1a1aa] mb-1 font-mono uppercase">Password</label>
			<input
				id="password-input"
				type="password"
				required
				bind:value={password}
				placeholder="••••••••"
				class="w-full px-3.5 py-2.5 rounded-xl bg-[#121212] border border-[#2e2e32] text-white text-xs focus:border-[#ff0101] focus:outline-none"
			/>
		</div>

		<button
			type="submit"
			disabled={isLoading}
			class="w-full py-3 rounded-xl bg-gradient-to-r from-[#ff0101] to-[#cc0000] text-white text-xs font-bold tracking-wide hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-red-950/50 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
		>
			<span class="material-symbols-outlined text-[16px]">{isLoading ? 'hourglass_top' : 'login'}</span>
			{isLoading ? 'Authenticating...' : 'Sign In'}
		</button>

		<div class="text-center pt-2">
			<a href="/register" class="text-xs text-[#a1a1aa] hover:text-white transition-colors">
				Don't have an account? <span class="text-[#ff3333] font-semibold underline underline-offset-4">Create Account</span>
			</a>
		</div>
	</form>
</div>
