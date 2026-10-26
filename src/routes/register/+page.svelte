<script lang="ts">
	let name = $state('');
	let email = $state('');
	let password = $state('');
	let error = $state<string | null>(null);
	let isLoading = $state(false);

	async function handleRegister() {
		isLoading = true;
		error = null;
		try {
			const res = await fetch('/api/auth/register', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name, email, password })
			});
			const json = await res.json();
			if (json.success) {
				window.location.href = '/';
			} else {
				error = json.error || 'Registration failed';
			}
		} catch (err: any) {
			error = err.message || 'Network error';
		} finally {
			isLoading = false;
		}
	}
</script>

<svelte:head>
	<title>Fitdee | Create Account</title>
</svelte:head>

<div class="max-w-md mx-auto pt-6 pb-16 space-y-6">
	<!-- Brand Header -->
	<div class="text-center space-y-2">
		<div class="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-br from-[#ff0101] to-[#990000] items-center justify-center shadow-[0_0_20px_rgba(255,1,1,0.5)] mb-1">
			<span class="material-symbols-outlined text-white text-[28px] font-bold">person_add</span>
		</div>
		<h1 class="text-2xl font-bold tracking-tight text-white">Join Fitdee Protocol</h1>
		<p class="text-xs text-[#a1a1aa]">Create an athlete account with AI vision & biomechanical tracking</p>
	</div>

	<!-- Register Form -->
	<form onsubmit={(e) => { e.preventDefault(); handleRegister(); }} class="rounded-2xl bg-[#1c1c1e] p-6 border border-[#2e2e32] shadow-xl space-y-4">
		{#if error}
			<div class="p-3 rounded-xl bg-red-950/60 border border-red-800/80 text-xs text-red-300 flex items-center gap-2">
				<span class="material-symbols-outlined text-[16px]">error</span>
				{error}
			</div>
		{/if}

		<div>
			<label for="name-input" class="block text-xs text-[#a1a1aa] mb-1 font-mono uppercase">Full Name</label>
			<input
				id="name-input"
				type="text"
				required
				bind:value={name}
				placeholder="Jordan Hayes"
				class="w-full px-3.5 py-2.5 rounded-xl bg-[#121212] border border-[#2e2e32] text-white text-xs focus:border-[#ff0101] focus:outline-none"
			/>
		</div>

		<div>
			<label for="reg-email-input" class="block text-xs text-[#a1a1aa] mb-1 font-mono uppercase">Email Address</label>
			<input
				id="reg-email-input"
				type="email"
				required
				bind:value={email}
				placeholder="jordan@fitdee.app"
				class="w-full px-3.5 py-2.5 rounded-xl bg-[#121212] border border-[#2e2e32] text-white text-xs focus:border-[#ff0101] focus:outline-none"
			/>
		</div>

		<div>
			<label for="reg-password-input" class="block text-xs text-[#a1a1aa] mb-1 font-mono uppercase">Password</label>
			<input
				id="reg-password-input"
				type="password"
				required
				minlength="6"
				bind:value={password}
				placeholder="Minimum 6 characters"
				class="w-full px-3.5 py-2.5 rounded-xl bg-[#121212] border border-[#2e2e32] text-white text-xs focus:border-[#ff0101] focus:outline-none"
			/>
		</div>

		<button
			type="submit"
			disabled={isLoading}
			class="w-full py-3 rounded-xl bg-gradient-to-r from-[#ff0101] to-[#cc0000] text-white text-xs font-bold tracking-wide hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-red-950/50 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
		>
			<span class="material-symbols-outlined text-[16px]">{isLoading ? 'hourglass_top' : 'check_circle'}</span>
			{isLoading ? 'Creating Protocol Account...' : 'Initialize Athlete Account'}
		</button>

		<div class="text-center pt-2">
			<a href="/login" class="text-xs text-[#a1a1aa] hover:text-white transition-colors">
				Already have an athlete account? <span class="text-[#ff3333] font-semibold underline underline-offset-4">Sign In</span>
			</a>
		</div>
	</form>
</div>
