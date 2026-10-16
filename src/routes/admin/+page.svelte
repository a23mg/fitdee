<script lang="ts">
	import type { PageData } from './$types';
	import { invalidateAll } from '$app/navigation';

	let { data }: { data: PageData } = $props();

	let users = $derived(data.users ?? []);
	let sessions = $derived(data.sessions ?? []);
	let isAdmin = $derived(data.isAdmin);

	// Target user selection for live testing
	let selectedUserId = $state(data.users?.[0]?.id ?? 'user_alex_mercer');
	let selectedUser = $derived(users.find((u) => u.id === selectedUserId) ?? users[0]);

	// Live modification form state
	let modWeight = $state(74.5);
	let modTargetWeight = $state(72.0);
	let modBodyFat = $state(14.8);
	let modWaterAdd = $state(0);
	let modCurrentShakes = $state(18);
	let modShakeTarget = $state(30);
	let modCalories = $state(2400);

	// Sync when selected user changes
	$effect(() => {
		if (selectedUser) {
			modWeight = selectedUser.profile?.currentWeightKg ?? 74.5;
			modTargetWeight = selectedUser.profile?.targetWeightKg ?? 72.0;
			modBodyFat = selectedUser.profile?.bodyFatPercent ?? 14.8;
			modCalories = selectedUser.profile?.dailyCalorieTarget ?? 2400;
			modCurrentShakes = selectedUser.challenge?.currentShakes ?? 18;
			modShakeTarget = selectedUser.challenge?.shakeTarget ?? 30;
		}
	});

	// Notification form state
	let notifTarget = $state('all');
	let notifTitle = $state('Biomechanical Assessment');
	let notifMessage = $state('Great effort today! Keep core tight on bench press.');
	let notifType = $state<'info' | 'challenge' | 'warning' | 'critical'>('info');

	let isSaving = $state(false);
	let isSendingNotif = $state(false);
	let statusToast = $state<string | null>(null);

	function showStatus(msg: string) {
		statusToast = msg;
		setTimeout(() => {
			statusToast = null;
		}, 3500);
	}

	async function switchAccount(userId: string) {
		try {
			const res = await fetch('/api/auth/switch', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ userId })
			});
			const json = await res.json();
			if (json.success) {
				showStatus(`Switched session to ${json.user.name}`);
				await invalidateAll();
				window.location.reload();
			} else {
				showStatus(json.error || 'Failed to switch');
			}
		} catch (err: any) {
			showStatus('Switch error: ' + err.message);
		}
	}

	async function applyUserModifications() {
		isSaving = true;
		try {
			const res = await fetch('/api/admin/modify', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					targetUserId: selectedUserId,
					updates: {
						weightKg: modWeight,
						targetWeightKg: modTargetWeight,
						bodyFatPercent: modBodyFat,
						dailyCalorieTarget: modCalories,
						currentShakes: modCurrentShakes,
						shakeTarget: modShakeTarget,
						waterMl: modWaterAdd
					}
				})
			});
			const json = await res.json();
			if (json.success) {
				showStatus(`Updated telemetry for ${selectedUser?.name || 'user'}`);
				modWaterAdd = 0;
				await invalidateAll();
			} else {
				showStatus(json.error || 'Failed to update');
			}
		} catch (err: any) {
			showStatus('Update error: ' + err.message);
		} finally {
			isSaving = false;
		}
	}

	async function sendNotification() {
		isSendingNotif = true;
		try {
			const res = await fetch('/api/admin/notify', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					targetUserId: notifTarget,
					title: notifTitle,
					message: notifMessage,
					type: notifType
				})
			});
			const json = await res.json();
			if (json.success) {
				showStatus(`Dispatched notification to ${notifTarget === 'all' ? 'All Active Sessions' : notifTarget}`);
				// If browser notification permission is granted, display desktop notification locally too
				if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
					new Notification(notifTitle, {
						body: notifMessage,
						icon: '/favicon.png'
					});
				}
				await invalidateAll();
			} else {
				showStatus(json.error || 'Failed to dispatch notification');
			}
		} catch (err: any) {
			showStatus('Dispatch error: ' + err.message);
		} finally {
			isSendingNotif = false;
		}
	}

	function setNotificationPreset(title: string, message: string, type: 'info' | 'challenge' | 'warning' | 'critical') {
		notifTitle = title;
		notifMessage = message;
		notifType = type;
	}
</script>

<svelte:head>
	<title>Fitdee | Admin & Diagnostic Ops</title>
</svelte:head>

<!-- Toast alert -->
{#if statusToast}
	<div class="fixed top-20 right-4 z-50 bg-[#ff0101] text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
		<span class="material-symbols-outlined text-[16px]">info</span>
		{statusToast}
	</div>
{/if}

<div class="flex flex-col w-full space-y-6 pt-2 pb-16">
	<!-- Header -->
	<div class="flex items-center justify-between pb-4 border-b border-[#2e2e32]">
		<div class="space-y-1">
			<div class="flex items-center gap-2">
				<span class="material-symbols-outlined text-[#ff0101] text-[24px]">terminal</span>
				<h1 class="text-xl font-bold tracking-tight text-white">Diagnostic & Ops Center</h1>
			</div>
			<p class="text-xs text-[#a1a1aa]">Real-time user telemetry, session inspector, and push notification dispatcher</p>
		</div>
		<div class="flex items-center gap-2">
			<span class="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase {isAdmin ? 'bg-emerald-950/80 border border-emerald-600 text-emerald-400' : 'bg-red-950/80 border border-red-600 text-red-400'}">
				{isAdmin ? 'ADMIN AUTHENTICATED' : 'RESTRICTED ACCESS'}
			</span>
		</div>
	</div>

	{#if !isAdmin}
		<!-- Restrict Gate Screen -->
		<section class="rounded-2xl bg-[#1c1c1e] p-6 border border-[#2e2e32] shadow-xl text-center space-y-4">
			<div class="w-16 h-16 rounded-full bg-red-950/60 border border-red-800/60 flex items-center justify-center text-[#ff0101] mx-auto">
				<span class="material-symbols-outlined text-[36px]">lock</span>
			</div>
			<div class="space-y-1">
				<h2 class="text-lg font-bold text-white">Admin Privileges Required</h2>
				<p class="text-xs text-[#a1a1aa] max-w-sm mx-auto">
					You are currently signed in as <strong class="text-white">{data.currentUser?.name || 'Guest'}</strong> ({data.currentUser?.email || 'no session'}). To test telemetry and notification dispatching, switch to the admin profile.
				</p>
			</div>
			<div class="pt-2">
				<button
					type="button"
					onclick={() => switchAccount('user_admin_ops')}
					class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#ff0101] to-[#cc0000] text-white text-xs font-bold tracking-wide hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-red-950/50 cursor-pointer inline-flex items-center gap-2"
				>
					<span class="material-symbols-outlined text-[16px]">admin_panel_settings</span>
					⚡ Instant Switch to Fitdee Ops Admin
				</button>
			</div>
		</section>
	{:else}
		<!-- User & Session Selector Grid -->
		<section class="rounded-2xl bg-[#1c1c1e] p-5 border border-[#2e2e32] shadow-xl space-y-4">
			<div class="flex items-center justify-between">
				<h2 class="text-sm font-bold text-white flex items-center gap-2">
					<span class="material-symbols-outlined text-[#ff0101] text-[18px]">group</span>
					Target User & Session Inspector
				</h2>
				<span class="text-[10px] text-[#a1a1aa] font-mono">{users.length} Users Registered • {sessions.length} Active Sessions</span>
			</div>

			<!-- User Cards -->
			<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
				{#each users as u}
					<div
						class="p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between {selectedUserId === u.id ? 'bg-[#ff0101]/10 border-[#ff0101]' : 'bg-[#121212] border-[#2e2e32] hover:border-[#a1a1aa]/40'}"
						onclick={() => (selectedUserId = u.id)}
					>
						<div class="flex items-center gap-3">
							<img src={u.image} alt={u.name} class="w-10 h-10 rounded-full object-cover border border-[#2e2e32]" />
							<div>
								<div class="flex items-center gap-1.5">
									<p class="text-xs font-bold text-white">{u.name}</p>
									<span class="px-1.5 py-0.2 rounded text-[9px] font-mono {u.role === 'admin' ? 'bg-purple-950 text-purple-400 border border-purple-800' : 'bg-red-950 text-red-400 border border-red-800'}">
										{u.role.toUpperCase()}
									</span>
								</div>
								<p class="text-[11px] text-[#a1a1aa] font-mono">{u.email}</p>
								<p class="text-[10px] text-[#71717a] mt-0.5">
									Weight: {u.profile?.currentWeightKg}kg • Shakes: {u.challenge?.currentShakes}/{u.challenge?.shakeTarget}
								</p>
							</div>
						</div>

						<div class="flex flex-col items-end gap-1.5">
							<button
								type="button"
								onclick={(e) => {
									e.stopPropagation();
									switchAccount(u.id);
								}}
								class="px-2 py-1 rounded-lg bg-[#2e2e32] hover:bg-[#ff0101] text-[10px] text-white font-medium transition-colors"
								title="Log in as this user"
							>
								Switch In
							</button>
							{#if selectedUserId === u.id}
								<span class="text-[9px] text-[#ff3333] font-bold">● TARGET ACTIVE</span>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		</section>

		<!-- Live Data State Modifier Form -->
		<section class="rounded-2xl bg-[#1c1c1e] p-5 border border-[#2e2e32] shadow-xl space-y-4">
			<div class="flex items-center justify-between pb-2 border-b border-[#2e2e32]">
				<div>
					<h2 class="text-sm font-bold text-white flex items-center gap-2">
						<span class="material-symbols-outlined text-[#ff0101] text-[18px]">tune</span>
						Live Telemetry Override: <span class="text-[#ff3333]">{selectedUser?.name}</span>
					</h2>
					<p class="text-[11px] text-[#a1a1aa]">Modify biometrics and daily challenge states in real-time</p>
				</div>
				<button
					type="button"
					onclick={applyUserModifications}
					disabled={isSaving}
					class="px-4 py-2 rounded-xl bg-gradient-to-r from-[#ff0101] to-[#cc0000] text-white text-xs font-bold hover:brightness-110 active:scale-95 transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
				>
					<span class="material-symbols-outlined text-[16px]">{isSaving ? 'sync' : 'save'}</span>
					{isSaving ? 'Applying...' : 'Apply Live Changes'}
				</button>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<!-- Current Weight Slider -->
				<div class="space-y-1.5 p-3 rounded-xl bg-[#121212] border border-[#2e2e32]">
					<div class="flex justify-between text-xs">
						<span class="text-[#a1a1aa]">Current Weight (kg)</span>
						<span class="font-mono text-white font-bold">{modWeight} kg</span>
					</div>
					<input
						type="range"
						min="45"
						max="130"
						step="0.1"
						bind:value={modWeight}
						class="w-full accent-[#ff0101] cursor-pointer"
					/>
				</div>

				<!-- Target Weight Slider -->
				<div class="space-y-1.5 p-3 rounded-xl bg-[#121212] border border-[#2e2e32]">
					<div class="flex justify-between text-xs">
						<span class="text-[#a1a1aa]">Target Weight (kg)</span>
						<span class="font-mono text-white font-bold">{modTargetWeight} kg</span>
					</div>
					<input
						type="range"
						min="45"
						max="130"
						step="0.5"
						bind:value={modTargetWeight}
						class="w-full accent-[#ff0101] cursor-pointer"
					/>
				</div>

				<!-- Body Fat % -->
				<div class="space-y-1.5 p-3 rounded-xl bg-[#121212] border border-[#2e2e32]">
					<div class="flex justify-between text-xs">
						<span class="text-[#a1a1aa]">Body Fat %</span>
						<span class="font-mono text-white font-bold">{modBodyFat}%</span>
					</div>
					<input
						type="range"
						min="5"
						max="40"
						step="0.1"
						bind:value={modBodyFat}
						class="w-full accent-[#ff0101] cursor-pointer"
					/>
				</div>

				<!-- Daily Calorie Target -->
				<div class="space-y-1.5 p-3 rounded-xl bg-[#121212] border border-[#2e2e32]">
					<div class="flex justify-between text-xs">
						<span class="text-[#a1a1aa]">Daily Calorie Target (kcal)</span>
						<span class="font-mono text-white font-bold">{modCalories} kcal</span>
					</div>
					<input
						type="range"
						min="1200"
						max="4500"
						step="50"
						bind:value={modCalories}
						class="w-full accent-[#ff0101] cursor-pointer"
					/>
				</div>

				<!-- Shake Alarm Challenge Progress -->
				<div class="space-y-1.5 p-3 rounded-xl bg-[#121212] border border-[#2e2e32]">
					<div class="flex justify-between text-xs">
						<span class="text-[#a1a1aa]">Alarm Shakes Completed</span>
						<span class="font-mono text-white font-bold">{modCurrentShakes} / {modShakeTarget}</span>
					</div>
					<input
						type="range"
						min="0"
						max={modShakeTarget}
						step="1"
						bind:value={modCurrentShakes}
						class="w-full accent-[#ff0101] cursor-pointer"
					/>
					<div class="flex gap-2 pt-1">
						<button
							type="button"
							onclick={() => (modCurrentShakes = 0)}
							class="text-[10px] px-2 py-0.5 rounded bg-[#2e2e32] text-[#a1a1aa] hover:text-white"
						>
							Reset (0)
						</button>
						<button
							type="button"
							onclick={() => (modCurrentShakes = modShakeTarget)}
							class="text-[10px] px-2 py-0.5 rounded bg-red-950 text-[#ff3333] border border-red-800"
						>
							Complete ({modShakeTarget})
						</button>
					</div>
				</div>

				<!-- Quick Water Injection -->
				<div class="space-y-1.5 p-3 rounded-xl bg-[#121212] border border-[#2e2e32]">
					<div class="flex justify-between text-xs">
						<span class="text-[#a1a1aa]">Inject Water Intake (ml)</span>
						<span class="font-mono text-[#488fff] font-bold">+{modWaterAdd} ml</span>
					</div>
					<div class="grid grid-cols-3 gap-2 pt-1">
						<button
							type="button"
							onclick={() => (modWaterAdd += 250)}
							class="py-1.5 rounded-lg bg-[#1c1c1e] border border-[#2e2e32] hover:border-[#488fff] text-xs text-white"
						>
							+250 ml
						</button>
						<button
							type="button"
							onclick={() => (modWaterAdd += 500)}
							class="py-1.5 rounded-lg bg-[#1c1c1e] border border-[#2e2e32] hover:border-[#488fff] text-xs text-white"
						>
							+500 ml
						</button>
						<button
							type="button"
							onclick={() => (modWaterAdd = 0)}
							class="py-1.5 rounded-lg bg-[#1c1c1e] border border-[#2e2e32] hover:border-red-600 text-xs text-[#a1a1aa]"
						>
							Clear
						</button>
					</div>
				</div>
			</div>
		</section>

		<!-- Instant Push Notification Dispatcher -->
		<section class="rounded-2xl bg-[#1c1c1e] p-5 border border-[#2e2e32] shadow-xl space-y-4">
			<div class="flex items-center justify-between pb-2 border-b border-[#2e2e32]">
				<div>
					<h2 class="text-sm font-bold text-white flex items-center gap-2">
						<span class="material-symbols-outlined text-[#ff0101] text-[18px]">campaign</span>
						Real-Time Notification Dispatcher
					</h2>
					<p class="text-[11px] text-[#a1a1aa]">Broadcast in-app alerts and native push notifications to target user sessions</p>
				</div>
			</div>

			<!-- Quick Presets -->
			<div class="flex flex-wrap gap-2">
				<button
					type="button"
					onclick={() => setNotificationPreset('⚡ Biomechanical Depth Alert', 'Squat depth reached optimal 90° angle. Form is clean!', 'info')}
					class="px-2.5 py-1 rounded-lg bg-[#121212] border border-[#2e2e32] hover:border-[#ff0101] text-[11px] text-[#a1a1aa] hover:text-white transition-colors"
				>
					Preset: Depth Passed
				</button>
				<button
					type="button"
					onclick={() => setNotificationPreset('💧 Hydration Check Required', 'You are 750ml below your target for 03:00 PM.', 'warning')}
					class="px-2.5 py-1 rounded-lg bg-[#121212] border border-[#2e2e32] hover:border-amber-500 text-[11px] text-[#a1a1aa] hover:text-white transition-colors"
				>
					Preset: Water Low
				</button>
				<button
					type="button"
					onclick={() => setNotificationPreset('⏰ Wake-up Alarm Challenge', 'Alarm ringing! Shake your device 30 times to dismiss.', 'challenge')}
					class="px-2.5 py-1 rounded-lg bg-[#121212] border border-[#2e2e32] hover:border-red-500 text-[11px] text-[#a1a1aa] hover:text-white transition-colors"
				>
					Preset: Shake Alarm
				</button>
				<button
					type="button"
					onclick={() => setNotificationPreset('🚨 Form Warning: Knees Caving', 'Valgus collapse detected on rep 4. Push knees outward!', 'critical')}
					class="px-2.5 py-1 rounded-lg bg-[#121212] border border-[#2e2e32] hover:border-purple-500 text-[11px] text-[#a1a1aa] hover:text-white transition-colors"
				>
					Preset: Form Warning
				</button>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<!-- Target & Type -->
				<div class="space-y-3">
					<div>
						<label class="block text-[11px] text-[#a1a1aa] mb-1 font-mono uppercase">Target Recipient</label>
						<select
							bind:value={notifTarget}
							class="w-full px-3 py-2 rounded-xl bg-[#121212] border border-[#2e2e32] text-white text-xs focus:border-[#ff0101] focus:outline-none"
						>
							<option value="all">📢 Broadcast to All Active Users</option>
							{#each users as u}
								<option value={u.id}>{u.name} ({u.email})</option>
							{/each}
						</select>
					</div>

					<div>
						<label class="block text-[11px] text-[#a1a1aa] mb-1 font-mono uppercase">Notification Category</label>
						<div class="grid grid-cols-4 gap-2">
							{#each ['info', 'challenge', 'warning', 'critical'] as cat}
								<button
									type="button"
									onclick={() => (notifType = cat as any)}
									class="py-1.5 rounded-lg text-xs font-mono capitalize transition-all border {notifType === cat ? 'bg-[#ff0101] text-white border-[#ff0101]' : 'bg-[#121212] text-[#a1a1aa] border-[#2e2e32]'}"
								>
									{cat}
								</button>
							{/each}
						</div>
					</div>
				</div>

				<!-- Title & Message -->
				<div class="space-y-3">
					<div>
						<label class="block text-[11px] text-[#a1a1aa] mb-1 font-mono uppercase">Alert Title</label>
						<input
							type="text"
							bind:value={notifTitle}
							class="w-full px-3 py-2 rounded-xl bg-[#121212] border border-[#2e2e32] text-white text-xs focus:border-[#ff0101] focus:outline-none"
						/>
					</div>

					<div>
						<label class="block text-[11px] text-[#a1a1aa] mb-1 font-mono uppercase">Message Body</label>
						<textarea
							rows="2"
							bind:value={notifMessage}
							class="w-full px-3 py-2 rounded-xl bg-[#121212] border border-[#2e2e32] text-white text-xs focus:border-[#ff0101] focus:outline-none"
						></textarea>
					</div>
				</div>
			</div>

			<div class="flex justify-end pt-2">
				<button
					type="button"
					onclick={sendNotification}
					disabled={isSendingNotif}
					class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#ff0101] to-[#cc0000] text-white text-xs font-bold hover:brightness-110 active:scale-95 transition-all shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-50"
				>
					<span class="material-symbols-outlined text-[16px]">{isSendingNotif ? 'hourglass_top' : 'send'}</span>
					{isSendingNotif ? 'Dispatching...' : 'Dispatch Notification'}
				</button>
			</div>
		</section>
	{/if}
</div>
