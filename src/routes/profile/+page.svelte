<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let profile = $state(data.profile ?? {
		heightCm: 182,
		currentWeightKg: 74.5,
		targetWeightKg: 72.0,
		bodyFatPercent: 14.8,
		muscleMassKg: 36.2,
		dailyCalorieTarget: 2400,
		dailyWaterTargetMl: 3000,
		fitnessLevel: 'Hypertrophy Focus',
		activeTier: '1-Year Protocol'
	});

	let weightHistory = $state(data.weightHistory ?? []);
	let showEditModal = $state(false);
	let isSaving = $state(false);

	// Edit form model
	let editWeight = $state(profile.currentWeightKg);
	let editTargetWeight = $state(profile.targetWeightKg);
	let editHeight = $state(profile.heightCm);
	let editBodyFat = $state(profile.bodyFatPercent);
	let editMuscle = $state(profile.muscleMassKg);
	let editCalories = $state(profile.dailyCalorieTarget);
	let editWater = $state(profile.dailyWaterTargetMl);

	let bmi = $derived(
		((profile.currentWeightKg / ((profile.heightCm / 100) ** 2))).toFixed(1)
	);

	async function saveProfile() {
		isSaving = true;
		try {
			const res = await fetch('/api/profile/update', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					currentWeightKg: Number(editWeight),
					targetWeightKg: Number(editTargetWeight),
					heightCm: Number(editHeight),
					bodyFatPercent: Number(editBodyFat),
					muscleMassKg: Number(editMuscle),
					dailyCalorieTarget: Number(editCalories),
					dailyWaterTargetMl: Number(editWater)
				})
			});
			const json = await res.json();
			if (json.success && json.profile) {
				profile = json.profile;
				showEditModal = false;
			}
		} catch (err) {
			console.error('Failed to update profile:', err);
		} finally {
			isSaving = false;
		}
	}
</script>

<svelte:head>
	<title>Fitdee | Profile, Body Metrics & Plans</title>
</svelte:head>

<div class="flex flex-col w-full space-y-4 pt-2">
	<!-- Hero Identity Section -->
	<section class="flex flex-col items-center pt-2">
		<div class="relative mb-2.5">
			<div class="w-20 h-20 rounded-full p-0.5 bg-gradient-to-tr from-[#ff0101] via-[#2e2e32] to-[#ff0101] shadow-[0_4px_20px_rgba(255,1,1,0.35)]">
				<img
					class="w-full h-full object-cover rounded-full"
					alt={data.user?.name ?? 'Alex Mercer'}
					src={data.user?.image ?? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'}
				/>
			</div>
			<div class="absolute -bottom-1 -right-1 bg-[#1c1c1e] px-2 py-0.5 rounded-full flex items-center gap-1 border border-[#2e2e32] shadow-sm">
				<span class="w-1.5 h-1.5 rounded-full bg-[#ff0101] animate-pulse"></span>
				<span class="text-[9px] font-mono text-[#ff0101] uppercase font-bold">Active</span>
			</div>
		</div>

		<h2 class="text-sm font-bold text-white tracking-tight text-center">{data.user?.name ?? 'Alex Mercer'}</h2>
		<p class="text-xs text-[#a1a1aa] text-center mb-2 font-mono">
			{data.user?.email ?? 'alex@fitdee.app'} • ID #FTD-88219
		</p>

		<div class="flex items-center justify-center gap-1.5">
			<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-950/70 border border-red-800/60 text-[#ff5541] text-[10px] font-mono font-bold uppercase shadow-sm">
				<span class="material-symbols-outlined text-[12px]">verified</span>
				<span>{profile.activeTier}</span>
			</span>
			<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#1c1c1e] border border-[#2e2e32] text-[#a1a1aa] text-[10px] font-mono font-semibold uppercase">
				<span class="material-symbols-outlined text-[12px] text-[#ff5541]">bolt</span>
				<span>{profile.fitnessLevel}</span>
			</span>
		</div>
	</section>

	<!-- Body Metrics HUD Card -->
	<section class="bg-[#18181c] border border-white/10 rounded-2xl p-4 shadow-xl">
		<div class="flex items-center justify-between mb-3">
			<div class="flex items-center gap-1.5">
				<span class="material-symbols-outlined text-[#ff0101] text-[18px]">monitor_weight</span>
				<h3 class="text-xs font-bold text-white uppercase tracking-wider font-mono">Biometric Telemetry HUD</h3>
			</div>
			<button
				type="button"
				onclick={() => (showEditModal = true)}
				class="text-[11px] text-[#ff3333] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
			>
				<span class="material-symbols-outlined text-[14px]">edit</span>
				<span>Update</span>
			</button>
		</div>

		<!-- 4-Grid Telemetry Cluster -->
		<div class="grid grid-cols-2 gap-2 mb-3">
			<!-- Weight Tile -->
			<div class="bg-[#222228] border border-white/10 rounded-xl p-3 flex flex-col justify-between shadow-sm">
				<div class="flex items-center justify-between">
					<span class="text-[10px] font-mono uppercase text-[#a1a1aa]">Current Weight</span>
					<span class="material-symbols-outlined text-[15px] text-[#a1a1aa]">scale</span>
				</div>
				<div class="flex items-baseline gap-1 my-1">
					<span class="text-2xl font-bold font-mono text-white">{profile.currentWeightKg}</span>
					<span class="text-xs text-[#a1a1aa]">kg</span>
				</div>
				<div class="inline-flex items-center gap-1 text-[10px] font-mono text-[#ff0101] bg-red-950/60 px-1.5 py-0.5 rounded border border-red-800/40 w-fit">
					<span class="material-symbols-outlined text-[12px]">trending_down</span>
					<span>Target: {profile.targetWeightKg} kg</span>
				</div>
			</div>

			<!-- Height & BMI Tile -->
			<div class="bg-[#222228] border border-white/10 rounded-xl p-3 flex flex-col justify-between shadow-sm">
				<div class="flex items-center justify-between">
					<span class="text-[10px] font-mono uppercase text-[#a1a1aa]">Height & BMI</span>
					<span class="material-symbols-outlined text-[15px] text-[#a1a1aa]">straighten</span>
				</div>
				<div class="flex items-baseline gap-1 my-1">
					<span class="text-2xl font-bold font-mono text-white">{profile.heightCm}</span>
					<span class="text-xs text-[#a1a1aa]">cm</span>
				</div>
				<div class="inline-flex items-center gap-1 text-[10px] font-mono text-[#488fff] bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-800/40 w-fit">
					<span class="material-symbols-outlined text-[12px]">check_circle</span>
					<span>BMI {bmi} (Optimal)</span>
				</div>
			</div>

			<!-- Body Fat Tile -->
			<div class="bg-[#222228] border border-white/10 rounded-xl p-3 flex flex-col justify-between shadow-sm">
				<div class="flex items-center justify-between">
					<span class="text-[10px] font-mono uppercase text-[#a1a1aa]">Body Fat</span>
					<span class="material-symbols-outlined text-[15px] text-[#a1a1aa]">pie_chart</span>
				</div>
				<div class="flex items-baseline gap-1 my-1">
					<span class="text-2xl font-bold font-mono text-white">{profile.bodyFatPercent}</span>
					<span class="text-xs text-[#a1a1aa]">%</span>
				</div>
				<span class="text-[10px] font-mono text-emerald-400">Athletic Range</span>
			</div>

			<!-- Muscle Mass Tile -->
			<div class="bg-[#222228] border border-white/10 rounded-xl p-3 flex flex-col justify-between shadow-sm">
				<div class="flex items-center justify-between">
					<span class="text-[10px] font-mono uppercase text-[#a1a1aa]">Skeletal Muscle</span>
					<span class="material-symbols-outlined text-[15px] text-[#a1a1aa]">fitness_center</span>
				</div>
				<div class="flex items-baseline gap-1 my-1">
					<span class="text-2xl font-bold font-mono text-white">{profile.muscleMassKg}</span>
					<span class="text-xs text-[#a1a1aa]">kg</span>
				</div>
				<span class="text-[10px] font-mono text-[#ff5541]">Hypertrophic Gain</span>
			</div>
		</div>

		<!-- Progression History Timeline Bar -->
		<div class="bg-[#121215] border border-white/10 rounded-xl p-3">
			<span class="text-[10px] font-mono text-[#a1a1aa] uppercase block mb-2">Weight Delta History</span>
			<div class="flex items-end justify-between h-14 gap-2 pt-2">
				{#each weightHistory as entry}
					<div class="flex-1 flex flex-col items-center gap-1 h-full justify-end">
						<span class="text-[9px] font-mono text-[#ff3333] font-bold">{entry.weightKg}</span>
						<div
							class="w-full rounded-t-md bg-gradient-to-t from-red-900 to-[#ff0101]"
							style="height: {Math.max(15, Math.min(100, (entry.weightKg - 70) * 15))}%"
						></div>
						<span class="text-[8px] font-mono text-[#a1a1aa] truncate">{entry.date.slice(5)}</span>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- Subscription & Protocol Tier Status -->
	<section class="bg-[#1c1c1e] border border-[#2e2e32] rounded-2xl p-4 shadow-xl space-y-3">
		<div class="flex items-center justify-between">
			<div>
				<span class="text-[10px] font-mono text-[#ff3333] uppercase font-bold tracking-wider">YEAR 1 PRIORITY PASS</span>
				<h3 class="text-xs font-bold text-white">Full Protocol Unlimited Tier</h3>
			</div>
			<span class="px-2 py-0.5 rounded bg-red-950/80 border border-red-700 text-[10px] font-mono text-white font-bold">
				ACTIVE
			</span>
		</div>

		<div class="space-y-1.5 text-xs text-[#a1a1aa]">
			<div class="flex items-center gap-2">
				<span class="material-symbols-outlined text-[#ff0101] text-[16px]">check_circle</span>
				<span class="text-white">MoveNet Optical Biomechanical Tracking (WASM Ready)</span>
			</div>
			<div class="flex items-center gap-2">
				<span class="material-symbols-outlined text-[#ff0101] text-[16px]">check_circle</span>
				<span class="text-white">AI Nutrition Optical Scanner & Macro Analyzer</span>
			</div>
			<div class="flex items-center gap-2">
				<span class="material-symbols-outlined text-[#ff0101] text-[16px]">check_circle</span>
				<span class="text-white">Verified Coach 1-on-1 Direct Scheduling</span>
			</div>
			<div class="flex items-center gap-2">
				<span class="material-symbols-outlined text-[#ff0101] text-[16px]">check_circle</span>
				<span class="text-white">Continuous PostgreSQL Telemetry Sync</span>
			</div>
		</div>
	</section>

	<!-- Update Metrics Modal -->
	{#if showEditModal}
		<div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
			<div class="bg-[#1c1c1e] border border-[#2e2e32] rounded-3xl w-full max-w-sm p-5 shadow-2xl animate-in fade-in">
				<div class="flex items-start justify-between pb-3 mb-3 border-b border-[#2e2e32]">
					<div>
						<span class="text-[10px] text-[#ff3333] font-mono uppercase font-bold">BIOMETRIC CONFIG</span>
						<h3 class="text-sm font-bold text-white">Update Body Metrics & Goals</h3>
					</div>
					<button
						type="button"
						onclick={() => (showEditModal = false)}
						class="text-[#a1a1aa] hover:text-white p-1 cursor-pointer"
					>
						<span class="material-symbols-outlined text-[18px]">close</span>
					</button>
				</div>

				<form onsubmit={(e) => { e.preventDefault(); saveProfile(); }} class="space-y-3">
					<div class="grid grid-cols-2 gap-2">
						<div>
							<label class="block text-[11px] text-[#a1a1aa] mb-1">
								Current Weight (kg)
								<input
									type="number"
									step="0.1"
									bind:value={editWeight}
									required
									class="w-full mt-1 bg-[#121212] border border-[#2e2e32] focus:border-[#ff0101] rounded-xl px-3 py-2 text-xs text-white outline-none"
								/>
							</label>
						</div>
						<div>
							<label class="block text-[11px] text-[#a1a1aa] mb-1">
								Target Weight (kg)
								<input
									type="number"
									step="0.1"
									bind:value={editTargetWeight}
									required
									class="w-full mt-1 bg-[#121212] border border-[#2e2e32] focus:border-[#ff0101] rounded-xl px-3 py-2 text-xs text-white outline-none"
								/>
							</label>
						</div>
					</div>

					<div class="grid grid-cols-2 gap-2">
						<div>
							<label class="block text-[11px] text-[#a1a1aa] mb-1">
								Height (cm)
								<input
									type="number"
									bind:value={editHeight}
									required
									class="w-full mt-1 bg-[#121212] border border-[#2e2e32] rounded-xl px-3 py-2 text-xs text-white outline-none"
								/>
							</label>
						</div>
						<div>
							<label class="block text-[11px] text-[#a1a1aa] mb-1">
								Body Fat (%)
								<input
									type="number"
									step="0.1"
									bind:value={editBodyFat}
									class="w-full mt-1 bg-[#121212] border border-[#2e2e32] rounded-xl px-3 py-2 text-xs text-white outline-none"
								/>
							</label>
						</div>
					</div>

					<div class="grid grid-cols-2 gap-2">
						<div>
							<label class="block text-[11px] text-[#a1a1aa] mb-1">
								Daily Calorie Target
								<input
									type="number"
									bind:value={editCalories}
									class="w-full mt-1 bg-[#121212] border border-[#2e2e32] rounded-xl px-3 py-2 text-xs text-white outline-none"
								/>
							</label>
						</div>
						<div>
							<label class="block text-[11px] text-[#a1a1aa] mb-1">
								Daily Water Target (ml)
								<input
									type="number"
									bind:value={editWater}
									class="w-full mt-1 bg-[#121212] border border-[#2e2e32] rounded-xl px-3 py-2 text-xs text-white outline-none"
								/>
							</label>
						</div>
					</div>

					<div class="pt-2">
						<button
							type="submit"
							disabled={isSaving}
							class="w-full py-2.5 bg-[#ff0101] hover:bg-red-700 active:scale-95 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
						>
							<span class="material-symbols-outlined text-[18px]">save</span>
							<span>{isSaving ? 'Updating Database...' : 'Save Changes'}</span>
						</button>
					</div>
				</form>
			</div>
		</div>
	{/if}
</div>
