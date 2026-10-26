<script lang="ts">
	import type { PageData } from './$types';
	import { invalidateAll } from '$app/navigation';

	let { data }: { data: PageData } = $props();

	let users = $derived(data.users ?? []);
	let sessions = $derived(data.sessions ?? []);
	let isAdmin = $derived(data.isAdmin);
	let dbCounts = $derived(
		data.dbCounts ?? {
			totalUsers: 0,
			totalSessions: 0,
			totalRoutines: 0,
			totalExercises: 0,
			totalMeals: 0,
			totalBookings: 0,
			totalTrainers: 0,
			totalChallenges: 0,
			dbLatencyMs: 24
		}
	);

	// Active Tab State
	type AdminTab = 'overview' | 'athletes' | 'sessions' | 'telemetry' | 'notifications' | 'database';
	let currentTab = $state<AdminTab>('overview');

	// Search & Filter State
	let searchQuery = $state('');
	let roleFilter = $state<'all' | 'user' | 'admin'>('all');

	let filteredUsers = $derived(
		users.filter((u) => {
			const matchesSearch =
				u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
				u.id.toLowerCase().includes(searchQuery.toLowerCase());
			const matchesRole = roleFilter === 'all' || u.role === roleFilter;
			return matchesSearch && matchesRole;
		})
	);

	// Target user selection for live testing / modifier
	let selectedUserId = $state(data.users?.[0]?.id ?? '');
	let selectedUser = $derived(users.find((u) => u.id === selectedUserId) ?? users[0]);

	// Live modification form state
	let modWeight = $state(74.5);
	let modTargetWeight = $state(72.0);
	let modBodyFat = $state(14.8);
	let modCalories = $state(2400);
	let modWaterTarget = $state(3000);
	let modCurrentShakes = $state(18);
	let modShakeTarget = $state(30);

	// Sync when selected user changes
	$effect(() => {
		if (selectedUser) {
			modWeight = selectedUser.profile?.currentWeightKg ?? 74.5;
			modTargetWeight = selectedUser.profile?.targetWeightKg ?? 72.0;
			modBodyFat = selectedUser.profile?.bodyFatPercent ?? 14.8;
			modCalories = selectedUser.profile?.dailyCalorieTarget ?? 2400;
			modWaterTarget = selectedUser.profile?.dailyWaterTargetMl ?? 3000;
			modCurrentShakes = selectedUser.challenge?.currentShakes ?? 18;
			modShakeTarget = selectedUser.challenge?.shakeTarget ?? 30;
		}
	});

	// Notification form state
	let notifTarget = $state('all');
	let notifTitle = $state('Biomechanical Assessment');
	let notifMessage = $state('Great form on bench press today! Posture angle was 94.2%.');
	let notifType = $state<'info' | 'challenge' | 'warning' | 'critical'>('info');

	// In-place Modal for editing specific athlete
	let editingUser = $state<any | null>(null);
	let editFormWeight = $state(74.5);
	let editFormTargetWeight = $state(72.0);
	let editFormCalories = $state(2400);
	let editFormRole = $state('user');

	function openEditModal(u: any) {
		editingUser = u;
		editFormWeight = u.profile?.currentWeightKg ?? 74.5;
		editFormTargetWeight = u.profile?.targetWeightKg ?? 72.0;
		editFormCalories = u.profile?.dailyCalorieTarget ?? 2400;
		editFormRole = u.role ?? 'user';
	}

	let isSaving = $state(false);
	let isSendingNotif = $state(false);
	let statusToast = $state<string | null>(null);

	function showStatus(msg: string) {
		statusToast = msg;
		setTimeout(() => {
			statusToast = null;
		}, 4000);
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
		if (!selectedUser) return;
		isSaving = true;
		try {
			const res = await fetch('/api/admin/modify', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					targetUserId: selectedUser.id,
					updates: {
						currentWeightKg: modWeight,
						targetWeightKg: modTargetWeight,
						bodyFatPercent: modBodyFat,
						dailyCalorieTarget: modCalories,
						dailyWaterTargetMl: modWaterTarget,
						currentShakes: modCurrentShakes,
						shakeTarget: modShakeTarget
					}
				})
			});
			const json = await res.json();
			if (json.success) {
				showStatus(`Telemetry updated for ${selectedUser.name}`);
				await invalidateAll();
			} else {
				showStatus(json.error || 'Update failed');
			}
		} catch (err: any) {
			showStatus('Save error: ' + err.message);
		} finally {
			isSaving = false;
		}
	}

	async function saveModalEdits() {
		if (!editingUser) return;
		isSaving = true;
		try {
			const res = await fetch('/api/admin/modify', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					targetUserId: editingUser.id,
					updates: {
						currentWeightKg: editFormWeight,
						targetWeightKg: editFormTargetWeight,
						dailyCalorieTarget: editFormCalories,
						role: editFormRole
					}
				})
			});
			const json = await res.json();
			if (json.success) {
				showStatus(`Updated metrics for ${editingUser.name}`);
				editingUser = null;
				await invalidateAll();
			} else {
				showStatus(json.error || 'Update failed');
			}
		} catch (err: any) {
			showStatus('Update error: ' + err.message);
		} finally {
			isSaving = false;
		}
	}

	async function sendNotification() {
		if (!notifTitle || !notifMessage) return;
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
				showStatus(`Broadcasted: "${notifTitle}"`);
				await invalidateAll();
			} else {
				showStatus(json.error || 'Dispatch failed');
			}
		} catch (err: any) {
			showStatus('Dispatch error: ' + err.message);
		} finally {
			isSendingNotif = false;
		}
	}

	async function revokeSession(sessionId: string, token: string) {
		try {
			const res = await fetch('/api/admin/revoke', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ sessionId, token })
			});
			const json = await res.json();
			if (json.success) {
				showStatus('Session revoked successfully');
				await invalidateAll();
			} else {
				showStatus(json.error || 'Failed to revoke');
			}
		} catch (err: any) {
			showStatus('Revoke error: ' + err.message);
		}
	}
</script>

<svelte:head>
	<title>Fitdee | Mission Control Ops Dashboard</title>
</svelte:head>

<!-- Status Toast Pill -->
{#if statusToast}
	<div class="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-[#18181b] border border-[#3f3f46] text-white text-xs shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200">
		<span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
		<span>{statusToast}</span>
	</div>
{/if}

{#if !isAdmin}
	<!-- Restrict Gate Screen -->
	<div class="max-w-md mx-auto pt-16 pb-20 text-center space-y-6">
		<div class="w-16 h-16 rounded-3xl bg-red-950/60 border border-red-800/60 flex items-center justify-center text-[#ff0101] mx-auto shadow-2xl shadow-red-950/50">
			<span class="material-symbols-outlined text-[36px]">shield_lock</span>
		</div>
		<div class="space-y-2">
			<h1 class="text-2xl font-bold tracking-tight text-white">Ops Admin Authorization Required</h1>
			<p class="text-xs text-[#a1a1aa] leading-relaxed">
				Current session: <strong class="text-white">{data.currentUser?.name}</strong> ({data.currentUser?.email}). This command center is restricted to Ops Administrators.
			</p>
		</div>
		<div class="pt-2">
			<button
				type="button"
				onclick={() => switchAccount('admin@fitdee.app')}
				class="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#ff0101] to-[#cc0000] text-white text-xs font-bold tracking-wide hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-red-950/60 cursor-pointer inline-flex items-center justify-center gap-2"
			>
				<span class="material-symbols-outlined text-[18px]">verified_user</span>
				Authorize & Switch to Fitdee Ops Admin
			</button>
		</div>
	</div>
{:else}
	<!-- DESKTOP MISSION CONTROL DASHBOARD -->
	<div class="-mx-4 -my-4 min-h-[calc(100vh-4rem)] flex flex-col bg-[#09090b] text-[#f4f4f5]">
		<!-- Top Executive Sub-Header Bar -->
		<header class="h-14 border-b border-[#27272a]/80 bg-[#0e0e11]/90 backdrop-blur-xl px-6 flex items-center justify-between z-20 sticky top-0">
			<div class="flex items-center gap-4">
				<div class="flex items-center gap-2.5">
					<div class="w-7 h-7 rounded-lg bg-gradient-to-br from-[#ff0101] to-[#990000] flex items-center justify-center shadow-[0_0_12px_rgba(255,1,1,0.5)]">
						<span class="material-symbols-outlined text-white text-[16px] font-bold">terminal</span>
					</div>
					<div>
						<div class="flex items-center gap-2">
							<span class="text-xs font-black tracking-wider uppercase text-white font-mono">Fitdee Mission Control</span>
							<span class="px-1.5 py-0.2 rounded text-[9px] font-mono font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800/80">LIVE v2.4</span>
						</div>
					</div>
				</div>

				<div class="hidden md:flex items-center gap-1.5 pl-4 border-l border-[#27272a] text-[11px] text-[#71717a] font-mono">
					<span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
					<span class="text-emerald-400 font-medium">Neon Pool</span>
					<span>•</span>
					<span>{dbCounts.dbLatencyMs}ms ping</span>
					<span>•</span>
					<span>{data.serverInfo.vercelRegion}</span>
				</div>
			</div>

			<div class="flex items-center gap-3">
				<button
					type="button"
					onclick={() => invalidateAll()}
					class="px-2.5 py-1.5 rounded-lg bg-[#18181b] border border-[#27272a] text-[11px] text-[#a1a1aa] hover:text-white hover:border-[#3f3f46] transition-all flex items-center gap-1.5 cursor-pointer font-mono"
				>
					<span class="material-symbols-outlined text-[14px]">refresh</span>
					Sync
				</button>

				<button
					type="button"
					onclick={() => switchAccount('alex@fitdee.app')}
					class="px-3 py-1.5 rounded-lg bg-[#18181b] border border-[#27272a] text-[11px] text-white hover:border-[#ff0101] transition-all flex items-center gap-1.5 cursor-pointer font-medium"
				>
					<span class="material-symbols-outlined text-[#ff0101] text-[14px]">sports_gymnastics</span>
					Switch to Athlete View
				</button>
			</div>
		</header>

		<!-- Main Workspace Layout: Desktop Sidebar + Content -->
		<div class="flex-1 flex overflow-hidden">
			<!-- Desktop Command Sidebar -->
			<aside class="w-60 border-r border-[#27272a]/80 bg-[#0c0c0f] flex flex-col justify-between py-4 px-3 flex-shrink-0">
				<nav class="space-y-1">
					<div class="px-3 pb-2 text-[10px] font-mono uppercase tracking-widest text-[#71717a]">Navigation</div>

					<button
						type="button"
						onclick={() => (currentTab = 'overview')}
						class="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer {currentTab === 'overview' ? 'bg-[#ff0101]/15 text-[#ff4444] border border-[#ff0101]/30 font-semibold' : 'text-[#a1a1aa] hover:text-white hover:bg-[#18181b]'}"
					>
						<span class="material-symbols-outlined text-[18px]">dashboard</span>
						Command Overview
					</button>

					<button
						type="button"
						onclick={() => (currentTab = 'athletes')}
						class="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer {currentTab === 'athletes' ? 'bg-[#ff0101]/15 text-[#ff4444] border border-[#ff0101]/30 font-semibold' : 'text-[#a1a1aa] hover:text-white hover:bg-[#18181b]'}"
					>
						<div class="flex items-center gap-2.5">
							<span class="material-symbols-outlined text-[18px]">badge</span>
							Athletes Directory
						</div>
						<span class="px-1.5 py-0.2 rounded text-[10px] font-mono bg-[#18181b] text-[#71717a] border border-[#27272a]">{users.length}</span>
					</button>

					<button
						type="button"
						onclick={() => (currentTab = 'sessions')}
						class="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer {currentTab === 'sessions' ? 'bg-[#ff0101]/15 text-[#ff4444] border border-[#ff0101]/30 font-semibold' : 'text-[#a1a1aa] hover:text-white hover:bg-[#18181b]'}"
					>
						<div class="flex items-center gap-2.5">
							<span class="material-symbols-outlined text-[18px]">key</span>
							Active Sessions
						</div>
						<span class="px-1.5 py-0.2 rounded text-[10px] font-mono bg-[#18181b] text-[#71717a] border border-[#27272a]">{sessions.length}</span>
					</button>

					<button
						type="button"
						onclick={() => (currentTab = 'telemetry')}
						class="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer {currentTab === 'telemetry' ? 'bg-[#ff0101]/15 text-[#ff4444] border border-[#ff0101]/30 font-semibold' : 'text-[#a1a1aa] hover:text-white hover:bg-[#18181b]'}"
					>
						<span class="material-symbols-outlined text-[18px]">tune</span>
						Telemetry Lab
					</button>

					<button
						type="button"
						onclick={() => (currentTab = 'notifications')}
						class="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer {currentTab === 'notifications' ? 'bg-[#ff0101]/15 text-[#ff4444] border border-[#ff0101]/30 font-semibold' : 'text-[#a1a1aa] hover:text-white hover:bg-[#18181b]'}"
					>
						<span class="material-symbols-outlined text-[18px]">campaign</span>
						Alert Dispatcher
					</button>

					<button
						type="button"
						onclick={() => (currentTab = 'database')}
						class="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer {currentTab === 'database' ? 'bg-[#ff0101]/15 text-[#ff4444] border border-[#ff0101]/30 font-semibold' : 'text-[#a1a1aa] hover:text-white hover:bg-[#18181b]'}"
					>
						<div class="flex items-center gap-2.5">
							<span class="material-symbols-outlined text-[18px]">database</span>
							Neon Postgres
						</div>
						<span class="w-2 h-2 rounded-full bg-emerald-400"></span>
					</button>
				</nav>

				<!-- Sidebar Footer: Current Ops User Card -->
				<div class="p-2.5 rounded-2xl bg-[#141418] border border-[#27272a] space-y-2">
					<div class="flex items-center gap-2">
						<div class="w-8 h-8 rounded-xl bg-purple-950 border border-purple-800/80 flex items-center justify-center text-purple-300 font-bold text-xs">
							OP
						</div>
						<div class="min-w-0 flex-1">
							<p class="text-xs font-bold text-white truncate">{data.currentUser?.name}</p>
							<p class="text-[10px] text-[#71717a] font-mono truncate">{data.currentUser?.email}</p>
						</div>
					</div>
					<div class="pt-1 flex items-center justify-between text-[10px] text-[#a1a1aa]">
						<span class="inline-block px-1.5 py-0.2 rounded bg-purple-950 text-purple-400 font-mono font-semibold border border-purple-800/60">MASTER ADMIN</span>
						<a href="/login" class="text-red-400 hover:text-red-300 transition-colors">Sign Out</a>
					</div>
				</div>
			</aside>

			<!-- Primary Content Canvas -->
			<main class="flex-1 p-6 lg:p-8 overflow-y-auto max-w-7xl">
				<!-- TAB 1: OVERVIEW -->
				{#if currentTab === 'overview'}
					<div class="space-y-6">
						<div>
							<h1 class="text-xl font-bold tracking-tight text-white flex items-center gap-2">
								<span class="material-symbols-outlined text-[#ff0101]">monitoring</span>
								Operational Health & Activity
							</h1>
							<p class="text-xs text-[#a1a1aa]">Real-time system telemetry from Neon PostgreSQL and Vercel serverless runtime</p>
						</div>

						<!-- KPI Bento Cards -->
						<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
							<div class="p-4 rounded-2xl bg-[#131316] border border-[#27272a] shadow-lg relative overflow-hidden group">
								<div class="flex items-center justify-between">
									<span class="text-[11px] font-mono text-[#a1a1aa] uppercase tracking-wider">Registered Athletes</span>
									<span class="material-symbols-outlined text-[#ff0101] text-[18px]">group</span>
								</div>
								<div class="mt-2 flex items-baseline gap-2">
									<span class="text-2xl font-black text-white font-mono">{dbCounts.totalUsers}</span>
									<span class="text-[10px] text-emerald-400 font-mono">+100% Neon DB</span>
								</div>
								<p class="text-[11px] text-[#71717a] mt-1 truncate">All verified athlete accounts</p>
							</div>

							<div class="p-4 rounded-2xl bg-[#131316] border border-[#27272a] shadow-lg relative overflow-hidden group">
								<div class="flex items-center justify-between">
									<span class="text-[11px] font-mono text-[#a1a1aa] uppercase tracking-wider">Active Sessions</span>
									<span class="material-symbols-outlined text-purple-400 text-[18px]">lock</span>
								</div>
								<div class="mt-2 flex items-baseline gap-2">
									<span class="text-2xl font-black text-white font-mono">{dbCounts.totalSessions}</span>
									<span class="text-[10px] text-purple-400 font-mono">Better-Auth</span>
								</div>
								<p class="text-[11px] text-[#71717a] mt-1 truncate">Current valid tokens in Neon</p>
							</div>

							<div class="p-4 rounded-2xl bg-[#131316] border border-[#27272a] shadow-lg relative overflow-hidden group">
								<div class="flex items-center justify-between">
									<span class="text-[11px] font-mono text-[#a1a1aa] uppercase tracking-wider">Workout Protocols</span>
									<span class="material-symbols-outlined text-amber-400 text-[18px]">fitness_center</span>
								</div>
								<div class="mt-2 flex items-baseline gap-2">
									<span class="text-2xl font-black text-white font-mono">{dbCounts.totalRoutines}</span>
									<span class="text-[10px] text-amber-400 font-mono">{dbCounts.totalExercises} exercises</span>
								</div>
								<p class="text-[11px] text-[#71717a] mt-1 truncate">Active biomechanical blocks</p>
							</div>

							<div class="p-4 rounded-2xl bg-[#131316] border border-[#27272a] shadow-lg relative overflow-hidden group">
								<div class="flex items-center justify-between">
									<span class="text-[11px] font-mono text-[#a1a1aa] uppercase tracking-wider">Neon DB Ping</span>
									<span class="material-symbols-outlined text-emerald-400 text-[18px]">speed</span>
								</div>
								<div class="mt-2 flex items-baseline gap-2">
									<span class="text-2xl font-black text-white font-mono">{dbCounts.dbLatencyMs}<span class="text-sm">ms</span></span>
									<span class="text-[10px] text-emerald-400 font-mono">Online</span>
								</div>
								<p class="text-[11px] text-[#71717a] mt-1 truncate">Connection pooler healthy</p>
							</div>
						</div>

						<!-- Two Column Overview Grid -->
						<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
							<!-- Left 2 Cols: Recent Registered Athletes Table preview -->
							<div class="lg:col-span-2 rounded-2xl bg-[#131316] border border-[#27272a] p-5 shadow-lg space-y-4">
								<div class="flex items-center justify-between">
									<h2 class="text-sm font-bold text-white flex items-center gap-2">
										<span class="material-symbols-outlined text-[#ff0101] text-[18px]">recent_actors</span>
										Recent Athlete Registrations
									</h2>
									<button
										type="button"
										onclick={() => (currentTab = 'athletes')}
										class="text-xs text-[#ff4444] hover:underline font-mono"
									>
										View All ({users.length}) →
									</button>
								</div>

								<div class="divide-y divide-[#27272a]/60">
									{#each users.slice(0, 5) as u}
										<div class="py-3 flex items-center justify-between gap-3">
											<div class="flex items-center gap-3 min-w-0">
												<img src={u.image} alt={u.name} class="w-8 h-8 rounded-full border border-[#27272a] object-cover flex-shrink-0" />
												<div class="min-w-0">
													<p class="text-xs font-bold text-white truncate">{u.name}</p>
													<p class="text-[11px] text-[#71717a] font-mono truncate">{u.email}</p>
												</div>
											</div>
											<div class="flex items-center gap-2 flex-shrink-0">
												<span class="px-2 py-0.5 rounded text-[10px] font-mono {u.role === 'admin' ? 'bg-purple-950 text-purple-300 border border-purple-800' : 'bg-red-950 text-red-300 border border-red-800'}">
													{u.role.toUpperCase()}
												</span>
												<button
													type="button"
													onclick={() => switchAccount(u.id)}
													class="px-2.5 py-1 rounded-lg bg-[#18181b] border border-[#27272a] text-[11px] text-[#a1a1aa] hover:text-white hover:border-[#ff0101] transition-colors cursor-pointer"
												>
													Impersonate
												</button>
											</div>
										</div>
									{/each}
								</div>
							</div>

							<!-- Right Col: System Diagnostics & Actions -->
							<div class="rounded-2xl bg-[#131316] border border-[#27272a] p-5 shadow-lg space-y-4">
								<h2 class="text-sm font-bold text-white flex items-center gap-2">
									<span class="material-symbols-outlined text-emerald-400 text-[18px]">settings_suggest</span>
									Infrastructure Diagnostics
								</h2>

								<div class="space-y-3 font-mono text-[11px]">
									<div class="p-3 rounded-xl bg-[#0c0c0f] border border-[#27272a] space-y-1.5">
										<div class="flex justify-between text-[#71717a]">
											<span>Runtime Engine</span>
											<span class="text-white">Node.js Serverless</span>
										</div>
										<div class="flex justify-between text-[#71717a]">
											<span>Database Driver</span>
											<span class="text-emerald-400">PostgreSQL (Neon PgBouncer)</span>
										</div>
										<div class="flex justify-between text-[#71717a]">
											<span>Auth Adapter</span>
											<span class="text-purple-400">Better-Auth / Drizzle</span>
										</div>
										<div class="flex justify-between text-[#71717a]">
											<span>Target Region</span>
											<span class="text-white">{data.serverInfo.vercelRegion}</span>
										</div>
									</div>

									<div class="space-y-2 pt-2">
										<button
											type="button"
											onclick={() => (currentTab = 'notifications')}
											class="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#ff0101] to-[#cc0000] text-white text-xs font-bold hover:brightness-110 active:scale-95 transition-all shadow-md shadow-red-950/40 flex items-center justify-center gap-2 cursor-pointer"
										>
											<span class="material-symbols-outlined text-[16px]">campaign</span>
											Broadcast System Notice
										</button>

										<button
											type="button"
											onclick={() => (currentTab = 'telemetry')}
											class="w-full py-2.5 rounded-xl bg-[#18181b] border border-[#27272a] text-white text-xs font-medium hover:border-[#3f3f46] transition-all flex items-center justify-center gap-2 cursor-pointer"
										>
											<span class="material-symbols-outlined text-[16px]">science</span>
											Launch Telemetry Lab
										</button>
									</div>
								</div>
							</div>
						</div>
					</div>

				<!-- TAB 2: ATHLETES DIRECTORY -->
				{:else if currentTab === 'athletes'}
					<div class="space-y-6">
						<div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
							<div>
								<h1 class="text-xl font-bold tracking-tight text-white flex items-center gap-2">
									<span class="material-symbols-outlined text-[#ff0101]">badge</span>
									Athlete & User Directory
								</h1>
								<p class="text-xs text-[#a1a1aa]">Manage athlete biometric profiles, target weights, and protocol credentials</p>
							</div>

							<!-- Search & Filters -->
							<div class="flex items-center gap-2">
								<div class="relative">
									<span class="material-symbols-outlined absolute left-3 top-2.5 text-[16px] text-[#71717a]">search</span>
									<input
										type="text"
										placeholder="Search name, email, id..."
										bind:value={searchQuery}
										class="w-56 pl-9 pr-3 py-1.5 rounded-xl bg-[#131316] border border-[#27272a] text-xs text-white placeholder-[#71717a] focus:border-[#ff0101] focus:outline-none font-mono"
									/>
								</div>

								<div class="flex rounded-xl bg-[#131316] border border-[#27272a] p-0.5 text-xs font-mono">
									<button
										type="button"
										onclick={() => (roleFilter = 'all')}
										class="px-2.5 py-1 rounded-lg transition-colors {roleFilter === 'all' ? 'bg-[#ff0101] text-white font-bold' : 'text-[#71717a] hover:text-white'}"
									>
										All
									</button>
									<button
										type="button"
										onclick={() => (roleFilter = 'user')}
										class="px-2.5 py-1 rounded-lg transition-colors {roleFilter === 'user' ? 'bg-[#ff0101] text-white font-bold' : 'text-[#71717a] hover:text-white'}"
									>
										Athletes
									</button>
									<button
										type="button"
										onclick={() => (roleFilter = 'admin')}
										class="px-2.5 py-1 rounded-lg transition-colors {roleFilter === 'admin' ? 'bg-[#ff0101] text-white font-bold' : 'text-[#71717a] hover:text-white'}"
									>
										Admins
									</button>
								</div>
							</div>
						</div>

						<!-- Athlete Table -->
						<div class="rounded-2xl bg-[#131316] border border-[#27272a] shadow-xl overflow-hidden">
							<table class="w-full text-left text-xs">
								<thead class="bg-[#0e0e11] border-b border-[#27272a] font-mono text-[11px] text-[#71717a] uppercase tracking-wider">
									<tr>
										<th class="py-3 px-4">Athlete</th>
										<th class="py-3 px-4">Role</th>
										<th class="py-3 px-4">Biometrics</th>
										<th class="py-3 px-4">Calorie Target</th>
										<th class="py-3 px-4">Challenge</th>
										<th class="py-3 px-4 text-right">Actions</th>
									</tr>
								</thead>
								<tbody class="divide-y divide-[#27272a]/60">
									{#each filteredUsers as u}
										<tr class="hover:bg-[#18181b]/50 transition-colors">
											<td class="py-3.5 px-4">
												<div class="flex items-center gap-3">
													<img src={u.image} alt={u.name} class="w-8 h-8 rounded-full border border-[#27272a] object-cover flex-shrink-0" />
													<div>
														<p class="font-bold text-white">{u.name}</p>
														<p class="text-[11px] text-[#71717a] font-mono">{u.email}</p>
													</div>
												</div>
											</td>
											<td class="py-3.5 px-4">
												<span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold {u.role === 'admin' ? 'bg-purple-950 text-purple-300 border border-purple-800' : 'bg-red-950 text-red-300 border border-red-800'}">
													{u.role.toUpperCase()}
												</span>
											</td>
											<td class="py-3.5 px-4 font-mono text-[#a1a1aa]">
												<div>{u.profile?.currentWeightKg ?? '--'} kg / {u.profile?.targetWeightKg ?? '--'} kg target</div>
												<div class="text-[10px] text-[#71717a]">{u.profile?.heightCm ?? '--'} cm • {u.profile?.bodyFatPercent ?? '--'}% fat</div>
											</td>
											<td class="py-3.5 px-4 font-mono text-[#a1a1aa]">
												<span class="text-white font-bold">{u.profile?.dailyCalorieTarget ?? 2400}</span> kcal
												<div class="text-[10px] text-[#71717a]">{u.profile?.dailyWaterTargetMl ?? 3000} ml H₂O</div>
											</td>
											<td class="py-3.5 px-4 font-mono">
												<span class="{u.challenge?.isCompleted ? 'text-emerald-400' : 'text-amber-400'}">
													{u.challenge?.currentShakes ?? 0}/{u.challenge?.shakeTarget ?? 30} shakes
												</span>
											</td>
											<td class="py-3.5 px-4 text-right space-x-1.5">
												<button
													type="button"
													onclick={() => openEditModal(u)}
													class="px-2.5 py-1 rounded-lg bg-[#18181b] border border-[#27272a] text-[11px] text-white hover:border-[#ff0101] transition-colors cursor-pointer"
												>
													Edit Metrics
												</button>
												<button
													type="button"
													onclick={() => switchAccount(u.id)}
													class="px-2.5 py-1 rounded-lg bg-red-950/40 border border-red-800 text-[11px] text-red-300 hover:bg-red-900/60 transition-colors cursor-pointer"
												>
													Impersonate
												</button>
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					</div>

				<!-- TAB 3: ACTIVE SESSIONS -->
				{:else if currentTab === 'sessions'}
					<div class="space-y-6">
						<div>
							<h1 class="text-xl font-bold tracking-tight text-white flex items-center gap-2">
								<span class="material-symbols-outlined text-purple-400">key</span>
								Session Inspector & Security
							</h1>
							<p class="text-xs text-[#a1a1aa]">Live active JWT and Better-Auth session tokens with instant revocation capabilities</p>
						</div>

						<div class="rounded-2xl bg-[#131316] border border-[#27272a] shadow-xl overflow-hidden">
							<table class="w-full text-left text-xs">
								<thead class="bg-[#0e0e11] border-b border-[#27272a] font-mono text-[11px] text-[#71717a] uppercase tracking-wider">
									<tr>
										<th class="py-3 px-4">Session Token</th>
										<th class="py-3 px-4">Athlete User</th>
										<th class="py-3 px-4">Issued At</th>
										<th class="py-3 px-4">Expires</th>
										<th class="py-3 px-4 text-right">Revocation</th>
									</tr>
								</thead>
								<tbody class="divide-y divide-[#27272a]/60">
									{#if sessions.length === 0}
										<tr>
											<td colspan="5" class="py-8 text-center text-[#71717a] font-mono">No active database sessions found.</td>
										</tr>
									{:else}
										{#each sessions as s}
											<tr class="hover:bg-[#18181b]/50 transition-colors">
												<td class="py-3.5 px-4 font-mono text-purple-300">
													<div class="flex items-center gap-2">
														<span class="material-symbols-outlined text-[14px] text-purple-400">vpn_key</span>
														<span>{s.token.substring(0, 16)}...</span>
													</div>
												</td>
												<td class="py-3.5 px-4">
													<p class="font-bold text-white">{s.userName}</p>
													<p class="text-[11px] text-[#71717a] font-mono">{s.userEmail}</p>
												</td>
												<td class="py-3.5 px-4 font-mono text-[#a1a1aa]">
													{new Date(s.createdAt).toLocaleDateString()} {new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
												</td>
												<td class="py-3.5 px-4 font-mono text-emerald-400">
													{new Date(s.expiresAt).toLocaleDateString()}
												</td>
												<td class="py-3.5 px-4 text-right">
													<button
														type="button"
														onclick={() => revokeSession(s.id, s.token)}
														class="px-2.5 py-1 rounded-lg bg-red-950/60 border border-red-800 text-[11px] text-red-300 hover:bg-red-900 transition-colors cursor-pointer"
													>
														Revoke Token
													</button>
												</td>
											</tr>
										{/each}
									{/if}
								</tbody>
							</table>
						</div>
					</div>

				<!-- TAB 4: TELEMETRY LAB -->
				{:else if currentTab === 'telemetry'}
					<div class="space-y-6">
						<div>
							<h1 class="text-xl font-bold tracking-tight text-white flex items-center gap-2">
								<span class="material-symbols-outlined text-amber-400">tune</span>
								Biomechanical Telemetry Lab
							</h1>
							<p class="text-xs text-[#a1a1aa]">Live override and simulator for athlete weight curves, shake alarm challenges, and nutrition targets</p>
						</div>

						<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
							<!-- Target Athlete Picker -->
							<div class="rounded-2xl bg-[#131316] border border-[#27272a] p-5 shadow-lg space-y-3">
								<span class="text-xs font-bold text-white uppercase tracking-wider font-mono">1. Select Target Athlete</span>
								<div class="space-y-2">
									{#each users as u}
										<button
											type="button"
											onclick={() => (selectedUserId = u.id)}
											class="w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer {selectedUserId === u.id ? 'bg-[#ff0101]/15 border-[#ff0101] text-white' : 'bg-[#18181b] border-[#27272a] text-[#a1a1aa] hover:border-[#3f3f46]'}"
										>
											<div class="min-w-0">
												<p class="text-xs font-bold truncate">{u.name}</p>
												<p class="text-[10px] text-[#71717a] font-mono truncate">{u.email}</p>
											</div>
											<span class="text-[10px] font-mono uppercase {selectedUserId === u.id ? 'text-[#ff4444]' : 'text-[#71717a]'}">
												{selectedUserId === u.id ? 'ACTIVE' : 'SELECT'}
											</span>
										</button>
									{/each}
								</div>
							</div>

							<!-- Controls Canvas -->
							<div class="lg:col-span-2 rounded-2xl bg-[#131316] border border-[#27272a] p-6 shadow-lg space-y-6">
								<div class="flex items-center justify-between border-b border-[#27272a] pb-3">
									<div>
										<h2 class="text-sm font-bold text-white">Live Modifiers for: {selectedUser?.name}</h2>
										<p class="text-[11px] text-[#71717a] font-mono">Instantaneously syncs to Neon database</p>
									</div>
									<span class="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800">CONNECTED</span>
								</div>

								<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<label class="block text-[11px] text-[#a1a1aa] mb-1 font-mono uppercase">Current Weight (kg): {modWeight}</label>
										<input type="range" min="50" max="130" step="0.5" bind:value={modWeight} class="w-full accent-[#ff0101]" />
									</div>

									<div>
										<label class="block text-[11px] text-[#a1a1aa] mb-1 font-mono uppercase">Target Weight (kg): {modTargetWeight}</label>
										<input type="range" min="50" max="130" step="0.5" bind:value={modTargetWeight} class="w-full accent-[#ff0101]" />
									</div>

									<div>
										<label class="block text-[11px] text-[#a1a1aa] mb-1 font-mono uppercase">Body Fat (%): {modBodyFat}%</label>
										<input type="range" min="5" max="40" step="0.5" bind:value={modBodyFat} class="w-full accent-[#ff0101]" />
									</div>

									<div>
										<label class="block text-[11px] text-[#a1a1aa] mb-1 font-mono uppercase">Calorie Target: {modCalories} kcal</label>
										<input type="range" min="1500" max="4500" step="50" bind:value={modCalories} class="w-full accent-[#ff0101]" />
									</div>

									<div>
										<label class="block text-[11px] text-[#a1a1aa] mb-1 font-mono uppercase">Wake-Up Shake Target: {modShakeTarget}</label>
										<input type="range" min="10" max="100" step="5" bind:value={modShakeTarget} class="w-full accent-[#ff0101]" />
									</div>

									<div>
										<label class="block text-[11px] text-[#a1a1aa] mb-1 font-mono uppercase">Current Shakes Count: {modCurrentShakes}</label>
										<input type="range" min="0" max={modShakeTarget} step="1" bind:value={modCurrentShakes} class="w-full accent-[#ff0101]" />
									</div>
								</div>

								<div class="pt-4 flex justify-end">
									<button
										type="button"
										disabled={isSaving}
										onclick={applyUserModifications}
										class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#ff0101] to-[#cc0000] text-white text-xs font-bold tracking-wide hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-red-950/50 cursor-pointer disabled:opacity-50 flex items-center gap-2"
									>
										<span class="material-symbols-outlined text-[16px]">{isSaving ? 'hourglass_top' : 'bolt'}</span>
										{isSaving ? 'Synchronizing...' : 'Apply Telemetry To Neon DB'}
									</button>
								</div>
							</div>
						</div>
					</div>

				<!-- TAB 5: ALERT DISPATCHER -->
				{:else if currentTab === 'notifications'}
					<div class="space-y-6">
						<div>
							<h1 class="text-xl font-bold tracking-tight text-white flex items-center gap-2">
								<span class="material-symbols-outlined text-[#ff0101]">campaign</span>
								Push Alert & Notification Dispatcher
							</h1>
							<p class="text-xs text-[#a1a1aa]">Broadcast real-time coaching feedback and critical alarms to athlete dashboards</p>
						</div>

						<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
							<!-- Dispatch Composer -->
							<div class="rounded-2xl bg-[#131316] border border-[#27272a] p-6 shadow-xl space-y-4">
								<div>
									<label class="block text-[11px] text-[#a1a1aa] mb-1 font-mono uppercase">Target Audience</label>
									<select
										bind:value={notifTarget}
										class="w-full px-3.5 py-2.5 rounded-xl bg-[#0c0c0f] border border-[#27272a] text-white text-xs focus:border-[#ff0101] focus:outline-none font-mono"
									>
										<option value="all">⚡ Global Broadcast (All Athletes)</option>
										{#each users as u}
											<option value={u.id}>{u.name} ({u.email})</option>
										{/each}
									</select>
								</div>

								<div>
									<label class="block text-[11px] text-[#a1a1aa] mb-1 font-mono uppercase">Category Badge</label>
									<div class="grid grid-cols-4 gap-2">
										{#each ['info', 'challenge', 'warning', 'critical'] as cat}
											<button
												type="button"
												onclick={() => (notifType = cat as any)}
												class="py-2 rounded-xl text-xs font-mono uppercase tracking-wider transition-all border {notifType === cat ? 'bg-[#ff0101] text-white border-[#ff0101] font-bold' : 'bg-[#0c0c0f] text-[#a1a1aa] border-[#27272a]'}"
											>
												{cat}
											</button>
										{/each}
									</div>
								</div>

								<div>
									<label class="block text-[11px] text-[#a1a1aa] mb-1 font-mono uppercase">Alert Title</label>
									<input
										type="text"
										bind:value={notifTitle}
										class="w-full px-3.5 py-2.5 rounded-xl bg-[#0c0c0f] border border-[#27272a] text-white text-xs focus:border-[#ff0101] focus:outline-none"
									/>
								</div>

								<div>
									<label class="block text-[11px] text-[#a1a1aa] mb-1 font-mono uppercase">Message Body</label>
									<textarea
										rows="3"
										bind:value={notifMessage}
										class="w-full px-3.5 py-2.5 rounded-xl bg-[#0c0c0f] border border-[#27272a] text-white text-xs focus:border-[#ff0101] focus:outline-none"
									></textarea>
								</div>

								<button
									type="button"
									disabled={isSendingNotif}
									onclick={sendNotification}
									class="w-full py-3 rounded-xl bg-gradient-to-r from-[#ff0101] to-[#cc0000] text-white text-xs font-bold tracking-wide hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-red-950/50 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
								>
									<span class="material-symbols-outlined text-[16px]">{isSendingNotif ? 'hourglass_top' : 'send'}</span>
									{isSendingNotif ? 'Dispatching...' : 'Dispatch Alert To App'}
								</button>
							</div>

							<!-- Live In-App Preview Card -->
							<div class="rounded-2xl bg-[#131316] border border-[#27272a] p-6 shadow-xl space-y-4">
								<span class="text-xs font-bold text-white uppercase tracking-wider font-mono">Athlete In-App Preview</span>
								<div class="p-4 rounded-2xl bg-[#0c0c0f] border border-[#27272a] space-y-3">
									<div class="flex items-start gap-3">
										<div class="w-8 h-8 rounded-xl {notifType === 'challenge' ? 'bg-[#ff0101]/20 text-[#ff0101]' : notifType === 'warning' ? 'bg-amber-950 text-amber-400' : notifType === 'critical' ? 'bg-purple-950 text-purple-400' : 'bg-blue-950 text-blue-400'} flex items-center justify-center">
											<span class="material-symbols-outlined text-[18px]">
												{notifType === 'challenge' ? 'alarm_on' : notifType === 'warning' ? 'warning' : notifType === 'critical' ? 'emergency' : 'info'}
											</span>
										</div>
										<div class="flex-1 min-w-0">
											<div class="flex items-center justify-between">
												<p class="text-xs font-bold text-white">{notifTitle || 'Untitled Notice'}</p>
												<span class="w-1.5 h-1.5 rounded-full bg-[#ff0101]"></span>
											</div>
											<p class="text-[11px] text-[#a1a1aa] mt-1 leading-snug">{notifMessage || 'Notification message text will display here.'}</p>
											<span class="text-[9px] text-[#71717a] font-mono mt-2 block">Just now</span>
										</div>
									</div>
								</div>
								<p class="text-[11px] text-[#71717a] leading-relaxed">
									Dispatched notifications appear in the top athlete bell drawer and trigger local browser push notifications when enabled.
								</p>
							</div>
						</div>
					</div>

				<!-- TAB 6: NEON DATABASE STATS -->
				{:else if currentTab === 'database'}
					<div class="space-y-6">
						<div>
							<h1 class="text-xl font-bold tracking-tight text-white flex items-center gap-2">
								<span class="material-symbols-outlined text-emerald-400">database</span>
								Neon PostgreSQL Schema & Infrastructure
							</h1>
							<p class="text-xs text-[#a1a1aa]">Direct status from your serverless PostgreSQL database cluster</p>
						</div>

						<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
							<div class="p-4 rounded-2xl bg-[#131316] border border-[#27272a]">
								<span class="text-[10px] font-mono text-[#71717a] uppercase">Table: "user"</span>
								<p class="text-xl font-mono font-bold text-white mt-1">{dbCounts.totalUsers} rows</p>
							</div>
							<div class="p-4 rounded-2xl bg-[#131316] border border-[#27272a]">
								<span class="text-[10px] font-mono text-[#71717a] uppercase">Table: "session"</span>
								<p class="text-xl font-mono font-bold text-white mt-1">{dbCounts.totalSessions} rows</p>
							</div>
							<div class="p-4 rounded-2xl bg-[#131316] border border-[#27272a]">
								<span class="text-[10px] font-mono text-[#71717a] uppercase">Table: "routines"</span>
								<p class="text-xl font-mono font-bold text-white mt-1">{dbCounts.totalRoutines} rows</p>
							</div>
							<div class="p-4 rounded-2xl bg-[#131316] border border-[#27272a]">
								<span class="text-[10px] font-mono text-[#71717a] uppercase">Table: "exercises"</span>
								<p class="text-xl font-mono font-bold text-white mt-1">{dbCounts.totalExercises} rows</p>
							</div>
							<div class="p-4 rounded-2xl bg-[#131316] border border-[#27272a]">
								<span class="text-[10px] font-mono text-[#71717a] uppercase">Table: "meal_logs"</span>
								<p class="text-xl font-mono font-bold text-white mt-1">{dbCounts.totalMeals} rows</p>
							</div>
							<div class="p-4 rounded-2xl bg-[#131316] border border-[#27272a]">
								<span class="text-[10px] font-mono text-[#71717a] uppercase">Table: "trainers"</span>
								<p class="text-xl font-mono font-bold text-white mt-1">{dbCounts.totalTrainers} rows</p>
							</div>
							<div class="p-4 rounded-2xl bg-[#131316] border border-[#27272a]">
								<span class="text-[10px] font-mono text-[#71717a] uppercase">Table: "trainer_bookings"</span>
								<p class="text-xl font-mono font-bold text-white mt-1">{dbCounts.totalBookings} rows</p>
							</div>
							<div class="p-4 rounded-2xl bg-[#131316] border border-[#27272a]">
								<span class="text-[10px] font-mono text-[#71717a] uppercase">Table: "wake_up_challenges"</span>
								<p class="text-xl font-mono font-bold text-white mt-1">{dbCounts.totalChallenges} rows</p>
							</div>
						</div>
					</div>
				{/if}
			</main>
		</div>
	</div>

	<!-- Modal: Edit Athlete Metrics In-Place -->
	{#if editingUser}
		<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
			<div class="w-full max-w-md rounded-3xl bg-[#18181b] border border-[#27272a] p-6 shadow-2xl space-y-4">
				<div class="flex items-center justify-between border-b border-[#27272a] pb-3">
					<div class="flex items-center gap-2">
						<span class="material-symbols-outlined text-[#ff0101]">tune</span>
						<h2 class="text-sm font-bold text-white">Edit {editingUser.name}</h2>
					</div>
					<button
						type="button"
						onclick={() => (editingUser = null)}
						class="text-[#71717a] hover:text-white material-symbols-outlined text-[20px]"
					>
						close
					</button>
				</div>

				<div class="space-y-3">
					<div>
						<label class="block text-[11px] text-[#a1a1aa] mb-1 font-mono uppercase">User Role</label>
						<select
							bind:value={editFormRole}
							class="w-full px-3 py-2 rounded-xl bg-[#0c0c0f] border border-[#27272a] text-white text-xs focus:border-[#ff0101] focus:outline-none font-mono"
						>
							<option value="user">USER (Athlete)</option>
							<option value="admin">ADMIN (Ops Administrator)</option>
						</select>
					</div>

					<div>
						<label class="block text-[11px] text-[#a1a1aa] mb-1 font-mono uppercase">Current Weight (kg)</label>
						<input
							type="number"
							step="0.5"
							bind:value={editFormWeight}
							class="w-full px-3 py-2 rounded-xl bg-[#0c0c0f] border border-[#27272a] text-white text-xs focus:border-[#ff0101] focus:outline-none font-mono"
						/>
					</div>

					<div>
						<label class="block text-[11px] text-[#a1a1aa] mb-1 font-mono uppercase">Target Weight (kg)</label>
						<input
							type="number"
							step="0.5"
							bind:value={editFormTargetWeight}
							class="w-full px-3 py-2 rounded-xl bg-[#0c0c0f] border border-[#27272a] text-white text-xs focus:border-[#ff0101] focus:outline-none font-mono"
						/>
					</div>

					<div>
						<label class="block text-[11px] text-[#a1a1aa] mb-1 font-mono uppercase">Daily Calorie Target (kcal)</label>
						<input
							type="number"
							step="50"
							bind:value={editFormCalories}
							class="w-full px-3 py-2 rounded-xl bg-[#0c0c0f] border border-[#27272a] text-white text-xs focus:border-[#ff0101] focus:outline-none font-mono"
						/>
					</div>
				</div>

				<div class="pt-2 flex items-center justify-end gap-2">
					<button
						type="button"
						onclick={() => (editingUser = null)}
						class="px-4 py-2 rounded-xl bg-[#27272a] text-[#a1a1aa] text-xs font-medium hover:text-white transition-colors"
					>
						Cancel
					</button>
					<button
						type="button"
						disabled={isSaving}
						onclick={saveModalEdits}
						class="px-5 py-2 rounded-xl bg-gradient-to-r from-[#ff0101] to-[#cc0000] text-white text-xs font-bold hover:brightness-110 active:scale-95 transition-all shadow-md shadow-red-950/40 cursor-pointer disabled:opacity-50"
					>
						{isSaving ? 'Saving...' : 'Save Changes'}
					</button>
				</div>
			</div>
		</div>
	{/if}
{/if}
