<script lang="ts">
	import type { PageData } from './$types';
	import { onMount } from 'svelte';

	let { data }: { data: PageData } = $props();

	let activeTab = $state<'scan' | 'manual' | 'coach'>('scan');
	let meals = $state<any[]>(data.meals ? [...data.meals] : []);
	let macros = $state(data.macros ? { ...data.macros } : { calories: 1350, protein: 110, carbs: 114, fat: 43 });
	let calorieTarget = $derived(data.profile?.dailyCalorieTarget ?? 2400);

	// Camera & scanning state
	let videoEl: HTMLVideoElement | null = $state(null);
	let isCameraActive = $state(false);
	let isScanning = $state(false);
	let scannedResult = $state<any>(null);
	let scanError = $state<string | null>(null);

	// Manual meal form inputs
	let manualName = $state('');
	let manualType = $state('lunch');
	let manualCalories = $state<number | ''>('');
	let manualProtein = $state<number | ''>('');
	let manualCarbs = $state<number | ''>('');
	let manualFat = $state<number | ''>('');

	// AI Coach chat
	let coachQuery = $state('');
	let coachMessages = $state([
		{ sender: 'coach', text: 'Protocol initialized. You have 1,050 kcal and 30g protein remaining today to hit your hypertrophy target.' }
	]);

	let caloriePercent = $derived(Math.min(100, Math.round((macros.calories / (calorieTarget || 1)) * 100)));

	async function startCamera() {
		scanError = null;
		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
			});
			if (videoEl) {
				videoEl.srcObject = stream;
				await videoEl.play();
				isCameraActive = true;
			}
		} catch (err: any) {
			scanError = 'Camera access denied or unavailable. You can upload an image instead.';
			isCameraActive = false;
		}
	}

	function stopCamera() {
		if (videoEl && videoEl.srcObject) {
			const stream = videoEl.srcObject as MediaStream;
			stream.getTracks().forEach((track) => track.stop());
			videoEl.srcObject = null;
		}
		isCameraActive = false;
	}

	async function handleFileUpload(e: Event) {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = async () => {
			const base64 = reader.result as string;
			await performScan(base64);
		};
		reader.readAsDataURL(file);
	}

	async function captureAndScan() {
		if (!videoEl || !isCameraActive) {
			// If camera isn't running, trigger standard scan simulation
			await performScan(null);
			return;
		}

		const canvas = document.createElement('canvas');
		canvas.width = videoEl.videoWidth || 640;
		canvas.height = videoEl.videoHeight || 480;
		const ctx = canvas.getContext('2d');
		if (ctx) {
			ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
			const base64 = canvas.toDataURL('image/jpeg', 0.8);
			await performScan(base64);
		}
	}

	async function performScan(base64: string | null) {
		isScanning = true;
		scanError = null;
		scannedResult = null;

		try {
			const res = await fetch('/api/nutrition/scan', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ imageBase64: base64 })
			});
			const json = await res.json();
			if (json.success && json.result) {
				scannedResult = json.result;
			} else {
				scanError = json.error || 'Failed to analyze food.';
			}
		} catch (err: any) {
			scanError = 'Scan network error: ' + err.message;
		} finally {
			isScanning = false;
		}
	}

	async function logScannedMeal() {
		if (!scannedResult) return;
		await addMealRecord({
			foodName: scannedResult.foodName,
			mealType: 'lunch',
			calories: scannedResult.calories,
			proteinGrams: scannedResult.proteinGrams,
			carbsGrams: scannedResult.carbsGrams,
			fatGrams: scannedResult.fatGrams,
			notes: scannedResult.summary || 'AI Vision Scan'
		});
		scannedResult = null;
		stopCamera();
	}

	async function submitManualMeal() {
		if (!manualName || !manualCalories) return;
		await addMealRecord({
			foodName: manualName,
			mealType: manualType,
			calories: Number(manualCalories),
			proteinGrams: Number(manualProtein) || 0,
			carbsGrams: Number(manualCarbs) || 0,
			fatGrams: Number(manualFat) || 0,
			notes: 'Manual entry'
		});
		manualName = '';
		manualCalories = '';
		manualProtein = '';
		manualCarbs = '';
		manualFat = '';
		activeTab = 'scan';
	}

	async function addMealRecord(mealData: any) {
		try {
			const res = await fetch('/api/nutrition/meal', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(mealData)
			});
			const json = await res.json();
			if (json.success && json.meal) {
				meals = [json.meal, ...meals];
				macros.calories += json.meal.calories;
				macros.protein += json.meal.proteinGrams;
				macros.carbs += json.meal.carbsGrams;
				macros.fat += json.meal.fatGrams;
			}
		} catch (err) {
			console.error('Failed to log meal:', err);
		}
	}

	async function deleteMeal(mealId: string) {
		const target = meals.find((m: any) => m.id === mealId);
		if (!target) return;
		meals = meals.filter((m: any) => m.id !== mealId);
		macros.calories = Math.max(0, macros.calories - target.calories);
		macros.protein = Math.max(0, macros.protein - target.proteinGrams);
		macros.carbs = Math.max(0, macros.carbs - target.carbsGrams);
		macros.fat = Math.max(0, macros.fat - target.fatGrams);

		try {
			await fetch('/api/nutrition/meal', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ mealId })
			});
		} catch (err) {
			console.error(err);
		}
	}

	async function sendCoachQuery() {
		if (!coachQuery.trim()) return;
		const query = coachQuery;
		coachMessages = [...coachMessages, { sender: 'user', text: query }];
		coachQuery = '';

		try {
			const res = await fetch('/api/nutrition/coach', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ message: query })
			});
			const json = await res.json();
			if (json.success && json.reply) {
				coachMessages = [...coachMessages, { sender: 'coach', text: json.reply }];
			}
		} catch (e) {
			coachMessages = [
				...coachMessages,
				{ sender: 'coach', text: 'Prioritize 30-40g whey protein isolate and 50g carbs within 45 minutes of training.' }
			];
		}
	}
</script>

<svelte:head>
	<title>Fitdee | AI Nutrition & Vision</title>
</svelte:head>

<div class="flex flex-col w-full space-y-4 pt-2">
	<!-- Tab Bar -->
	<div class="grid grid-cols-3 p-1 bg-[#18181e] border border-white/10 rounded-2xl shadow-lg gap-1">
		<button
			type="button"
			onclick={() => (activeTab = 'scan')}
			class="py-2 px-1 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer {activeTab === 'scan' ? 'bg-[#ff0101] text-white shadow-md' : 'text-[#a1a1aa] hover:text-white'}"
		>
			<span class="material-symbols-outlined text-[16px]">photo_camera</span>
			<span>Vision Scan</span>
		</button>
		<button
			type="button"
			onclick={() => (activeTab = 'manual')}
			class="py-2 px-1 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer {activeTab === 'manual' ? 'bg-[#ff0101] text-white shadow-md' : 'text-[#a1a1aa] hover:text-white'}"
		>
			<span class="material-symbols-outlined text-[16px]">edit_note</span>
			<span>Manual Log</span>
		</button>
		<button
			type="button"
			onclick={() => (activeTab = 'coach')}
			class="py-2 px-1 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer {activeTab === 'coach' ? 'bg-[#ff0101] text-white shadow-md' : 'text-[#a1a1aa] hover:text-white'}"
		>
			<span class="material-symbols-outlined text-[16px]">psychology</span>
			<span>AI Coach</span>
		</button>
	</div>

	<!-- TAB 1: VISION SCAN -->
	{#if activeTab === 'scan'}
		<!-- Camera Viewfinder -->
		<div class="relative w-full aspect-[4/4.5] rounded-2xl overflow-hidden bg-[#16161a] border border-[#2e2e32] shadow-2xl flex flex-col justify-between p-3.5">
			<!-- Video stream or preview placeholder -->
			<video
				bind:this={videoEl}
				autoplay
				playsinline
				muted
				class="absolute inset-0 w-full h-full object-cover {isCameraActive ? 'block' : 'hidden'}"
			></video>

			{#if !isCameraActive}
				<div class="absolute inset-0 bg-gradient-to-b from-[#18181e] via-[#121215] to-[#0a0a0a] flex flex-col items-center justify-center p-6 text-center">
					<div class="w-16 h-16 rounded-2xl bg-red-950/40 border border-red-800/50 flex items-center justify-center text-[#ff0101] mb-3 shadow-[0_0_15px_rgba(255,1,1,0.2)]">
						<span class="material-symbols-outlined text-[32px]">photo_camera</span>
					</div>
					<h3 class="text-sm font-bold text-white mb-1">AI Nutrition Optical Scanner</h3>
					<p class="text-xs text-[#a1a1aa] max-w-xs mb-4">
						Point camera at food or upload photo for instant biometric macro breakdown.
					</p>
					<button
						type="button"
						onclick={startCamera}
						class="py-2 px-4 bg-[#ff0101] hover:bg-red-700 active:scale-95 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg transition-all cursor-pointer"
					>
						<span class="material-symbols-outlined text-[18px]">videocam</span>
						<span>Launch Live Camera</span>
					</button>
				</div>
			{/if}

			<!-- Laser Scan Overlay when scanning -->
			{#if isScanning}
				<div class="absolute inset-0 z-20 pointer-events-none flex flex-col justify-center items-center bg-black/40 backdrop-blur-xs">
					<div class="w-full h-1 bg-gradient-to-r from-transparent via-[#ff0101] to-transparent shadow-[0_0_15px_#ff0101] animate-pulse"></div>
					<span class="mt-4 px-3 py-1 rounded-full bg-red-950/80 border border-red-700 text-xs font-mono font-bold text-white tracking-widest uppercase">
						Analyzing Spectral Macros...
					</span>
				</div>
			{/if}

			<!-- Reticle Corners Overlay -->
			<div class="absolute inset-4 pointer-events-none border border-white/10 rounded-xl flex flex-col justify-between p-2">
				<div class="flex justify-between">
					<div class="w-4 h-4 border-t-2 border-l-2 border-[#ff0101]"></div>
					<div class="w-4 h-4 border-t-2 border-r-2 border-[#ff0101]"></div>
				</div>
				<div class="flex justify-between">
					<div class="w-4 h-4 border-b-2 border-l-2 border-[#ff0101]"></div>
					<div class="w-4 h-4 border-b-2 border-r-2 border-[#ff0101]"></div>
				</div>
			</div>

			<!-- Top status header inside viewfinder -->
			<div class="relative z-10 flex items-center justify-between">
				<span class="px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md border border-white/20 text-[10px] font-mono text-[#ff3333] font-bold flex items-center gap-1">
					<span class="w-1.5 h-1.5 rounded-full bg-[#ff0101] animate-ping"></span>
					<span>NEURAL SCANNER</span>
				</span>
				{#if isCameraActive}
					<button
						type="button"
						onclick={stopCamera}
						class="w-7 h-7 rounded-full bg-black/70 text-[#a1a1aa] hover:text-white flex items-center justify-center cursor-pointer"
					>
						<span class="material-symbols-outlined text-[16px]">close</span>
					</button>
				{/if}
			</div>

			<!-- Bottom Viewfinder Controls -->
			<div class="relative z-10 flex items-center justify-between gap-2 pt-2">
				<label class="flex-1 py-2 px-3 bg-black/70 hover:bg-black/90 backdrop-blur-md border border-white/20 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-1.5 cursor-pointer transition-colors">
					<span class="material-symbols-outlined text-[17px] text-[#488fff]">upload_file</span>
					<span>Upload Photo</span>
					<input type="file" accept="image/*" onchange={handleFileUpload} class="hidden" />
				</label>

				<button
					type="button"
					onclick={captureAndScan}
					disabled={isScanning}
					class="flex-1 py-2 px-3 bg-[#ff0101] hover:bg-red-700 active:scale-95 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-lg transition-all cursor-pointer"
				>
					<span class="material-symbols-outlined text-[18px]">center_focus_strong</span>
					<span>{isScanning ? 'Scanning...' : 'Scan Dish'}</span>
				</button>
			</div>
		</div>

		<!-- Scan Result Card Modal / Drawer -->
		{#if scannedResult}
			<div class="bg-[#1c1c1e] border border-red-800/60 rounded-2xl p-4 shadow-2xl animate-in fade-in slide-in-from-bottom-2">
				<div class="flex items-start justify-between mb-3">
					<div>
						<div class="flex items-center gap-1.5 mb-1">
							<span class="px-2 py-0.5 rounded bg-red-950/80 border border-red-700 text-[10px] font-mono font-bold text-[#ff3333]">
								{scannedResult.confidence ?? 95}% MATCH
							</span>
							<span class="text-[10px] text-[#a1a1aa] font-mono">OPTICAL VERIFIED</span>
						</div>
						<h3 class="text-sm font-bold text-white">{scannedResult.foodName}</h3>
					</div>
					<button
						type="button"
						onclick={() => (scannedResult = null)}
						class="text-[#a1a1aa] hover:text-white p-1 cursor-pointer"
					>
						<span class="material-symbols-outlined text-[18px]">close</span>
					</button>
				</div>

				<!-- Macro Breakdown Grid -->
				<div class="grid grid-cols-4 gap-2 mb-2.5 bg-[#121212] p-2.5 rounded-xl border border-[#2e2e32]">
					<div class="text-center">
						<span class="text-[10px] text-[#a1a1aa] block font-mono">KCAL</span>
						<span class="text-xs font-bold text-white font-mono">{scannedResult.calories}</span>
					</div>
					<div class="text-center border-l border-[#2e2e32]">
						<span class="text-[10px] text-[#ff3333] block font-mono">PRO</span>
						<span class="text-xs font-bold text-white font-mono">{scannedResult.proteinGrams}g</span>
					</div>
					<div class="text-center border-l border-[#2e2e32]">
						<span class="text-[10px] text-[#488fff] block font-mono">CARB</span>
						<span class="text-xs font-bold text-white font-mono">{scannedResult.carbsGrams}g</span>
					</div>
					<div class="text-center border-l border-[#2e2e32]">
						<span class="text-[10px] text-orange-400 block font-mono">FAT</span>
						<span class="text-xs font-bold text-white font-mono">{scannedResult.fatGrams}g</span>
					</div>
				</div>

				<!-- Portion & Fiber details -->
				{#if scannedResult.portionSize || scannedResult.fiberGrams}
					<div class="flex items-center justify-between text-[11px] text-[#a1a1aa] mb-2 px-1">
						{#if scannedResult.portionSize}
							<span class="flex items-center gap-1 font-mono text-[10px]">
								<span class="material-symbols-outlined text-[13px] text-[#a1a1aa]">scale</span>
								{scannedResult.portionSize}
							</span>
						{/if}
						{#if scannedResult.fiberGrams}
							<span class="font-mono text-emerald-400 text-[10px] font-semibold">
								Fiber: {scannedResult.fiberGrams}g
							</span>
						{/if}
					</div>
				{/if}

				<!-- Ingredients Pills -->
				{#if scannedResult.ingredients && scannedResult.ingredients.length > 0}
					<div class="flex flex-wrap gap-1 mb-2.5">
						{#each scannedResult.ingredients as item}
							<span class="text-[9px] px-2 py-0.5 rounded-md bg-[#121212] border border-[#2e2e32] text-[#a1a1aa]">
								{item}
							</span>
						{/each}
					</div>
				{/if}

				<p class="text-[11px] text-[#a1a1aa] mb-3 leading-relaxed">{scannedResult.summary}</p>

				<button
					type="button"
					onclick={logScannedMeal}
					class="w-full py-2 bg-[#ff0101] hover:bg-red-700 active:scale-95 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
				>
					<span class="material-symbols-outlined text-[18px]">add_circle</span>
					<span>Log to Daily Protocol</span>
				</button>
			</div>
		{/if}

		{#if scanError}
			<div class="p-3 rounded-xl bg-red-950/50 border border-red-800 text-xs text-red-200">
				{scanError}
			</div>
		{/if}
	{/if}

	<!-- TAB 2: MANUAL MEAL ENTRY -->
	{#if activeTab === 'manual'}
		<form onsubmit={(e) => { e.preventDefault(); submitManualMeal(); }} class="bg-[#1c1c1e] border border-[#2e2e32] rounded-2xl p-4 shadow-xl space-y-3">
			<h3 class="text-sm font-bold text-white flex items-center gap-2">
				<span class="material-symbols-outlined text-[#ff0101] text-[20px]">restaurant</span>
				<span>Log Custom Meal</span>
			</h3>

			<div>
				<label class="block text-[11px] text-[#a1a1aa] mb-1">
					Meal Title
					<input
						type="text"
						bind:value={manualName}
						placeholder="e.g. Grass-Fed Ribeye with Roasted Sweet Potato"
						required
						class="w-full mt-1 bg-[#121212] border border-[#2e2e32] focus:border-[#ff0101] rounded-xl px-3 py-2 text-xs text-white outline-none"
					/>
				</label>
			</div>

			<div class="grid grid-cols-2 gap-2">
				<div>
					<label class="block text-[11px] text-[#a1a1aa] mb-1">
						Meal Timing
						<select
							bind:value={manualType}
							class="w-full mt-1 bg-[#121212] border border-[#2e2e32] rounded-xl px-2 py-2 text-xs text-white outline-none"
						>
							<option value="breakfast">Breakfast</option>
							<option value="lunch">Lunch</option>
							<option value="dinner">Dinner</option>
							<option value="snack">Snack / Post-Workout</option>
						</select>
					</label>
				</div>
				<div>
					<label class="block text-[11px] text-[#a1a1aa] mb-1">
						Total Calories (kcal)
						<input
							type="number"
							bind:value={manualCalories}
							placeholder="550"
							required
							class="w-full mt-1 bg-[#121212] border border-[#2e2e32] focus:border-[#ff0101] rounded-xl px-3 py-2 text-xs text-white outline-none"
						/>
					</label>
				</div>
			</div>

			<div class="grid grid-cols-3 gap-2">
				<div>
					<label class="block text-[11px] text-[#ff3333] mb-1">
						Protein (g)
						<input
							type="number"
							bind:value={manualProtein}
							placeholder="40"
							class="w-full mt-1 bg-[#121212] border border-[#2e2e32] rounded-xl px-2.5 py-2 text-xs text-white outline-none"
						/>
					</label>
				</div>
				<div>
					<label class="block text-[11px] text-[#488fff] mb-1">
						Carbs (g)
						<input
							type="number"
							bind:value={manualCarbs}
							placeholder="50"
							class="w-full mt-1 bg-[#121212] border border-[#2e2e32] rounded-xl px-2.5 py-2 text-xs text-white outline-none"
						/>
					</label>
				</div>
				<div>
					<label class="block text-[11px] text-orange-400 mb-1">
						Fat (g)
						<input
							type="number"
							bind:value={manualFat}
							placeholder="15"
							class="w-full mt-1 bg-[#121212] border border-[#2e2e32] rounded-xl px-2.5 py-2 text-xs text-white outline-none"
						/>
					</label>
				</div>
			</div>

			<button
				type="submit"
				class="w-full py-2.5 bg-[#ff0101] hover:bg-red-700 active:scale-95 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer mt-2"
			>
				<span class="material-symbols-outlined text-[18px]">save</span>
				<span>Save Meal into Database</span>
			</button>
		</form>
	{/if}

	<!-- TAB 3: AI COACH DIALOGUE -->
	{#if activeTab === 'coach'}
		<div class="bg-[#1c1c1e] border border-[#2e2e32] rounded-2xl p-4 shadow-xl flex flex-col h-80">
			<div class="flex items-center gap-2 pb-2 mb-2 border-b border-[#2e2e32]">
				<span class="material-symbols-outlined text-[#ff0101]">psychology</span>
				<span class="text-xs font-bold text-white">AI Biometric Coach</span>
			</div>
			
			<div class="flex-1 overflow-y-auto space-y-2.5 pr-1">
				{#each coachMessages as msg}
					<div class="flex flex-col {msg.sender === 'user' ? 'items-end' : 'items-start'}">
						<div class="max-w-[85%] p-2.5 rounded-2xl text-xs {msg.sender === 'user' ? 'bg-[#ff0101] text-white rounded-br-xs' : 'bg-[#121212] border border-[#2e2e32] text-white rounded-bl-xs'}">
							{msg.text}
						</div>
					</div>
				{/each}
			</div>

			<form onsubmit={(e) => { e.preventDefault(); sendCoachQuery(); }} class="flex gap-2 pt-2 border-t border-[#2e2e32]">
				<input
					type="text"
					bind:value={coachQuery}
					placeholder="Ask about macros, post-workout window..."
					class="flex-1 bg-[#121212] border border-[#2e2e32] rounded-xl px-3 py-1.5 text-xs text-white outline-none"
				/>
				<button
					type="submit"
					class="px-3 bg-[#ff0101] hover:bg-red-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center cursor-pointer"
				>
					<span class="material-symbols-outlined text-[16px]">send</span>
				</button>
			</form>
		</div>
	{/if}

	<!-- Daily Macro Target Card -->
	<section class="bg-[#1c1c1e] border border-[#2e2e32] rounded-2xl p-4 shadow-xl">
		<div class="flex items-center justify-between mb-2">
			<div>
				<span class="text-[10px] text-[#ff3333] uppercase font-bold tracking-wider font-mono">DAILY TARGET</span>
				<h4 class="text-xs font-bold text-white">Macro Protocol Distribution</h4>
			</div>
			<span class="text-xs font-mono font-bold text-white">{macros.calories} / {calorieTarget} kcal</span>
		</div>

		<!-- Calorie Progress Bar -->
		<div class="w-full h-2 bg-[#242426] rounded-full overflow-hidden p-0.5 border border-[#2e2e32] mb-3">
			<div
				class="h-full bg-gradient-to-r from-red-600 to-[#ff0101] rounded-full transition-all duration-300"
				style="width: {caloriePercent}%"
			></div>
		</div>

		<!-- Macro Pills -->
		<div class="grid grid-cols-3 gap-2">
			<div class="bg-[#121212] border border-[#2e2e32] rounded-xl p-2 text-center">
				<span class="text-[10px] text-[#ff3333] font-mono block">PROTEIN</span>
				<span class="text-xs font-bold text-white font-mono">{Math.round(macros.protein)}g</span>
			</div>
			<div class="bg-[#121212] border border-[#2e2e32] rounded-xl p-2 text-center">
				<span class="text-[10px] text-[#488fff] font-mono block">CARBS</span>
				<span class="text-xs font-bold text-white font-mono">{Math.round(macros.carbs)}g</span>
			</div>
			<div class="bg-[#121212] border border-[#2e2e32] rounded-xl p-2 text-center">
				<span class="text-[10px] text-orange-400 font-mono block">FAT</span>
				<span class="text-xs font-bold text-white font-mono">{Math.round(macros.fat)}g</span>
			</div>
		</div>
	</section>

	<!-- Today's Meal History -->
	<section class="flex flex-col space-y-2">
		<div class="flex items-center justify-between">
			<h4 class="text-xs font-bold text-white uppercase tracking-wider font-mono">Logged Meals ({meals.length})</h4>
		</div>

		{#each meals as meal}
			<div class="bg-[#1c1c1e] border border-[#2e2e32] rounded-xl p-3 flex items-center justify-between shadow-sm">
				<div class="min-w-0 pr-2">
					<div class="flex items-center gap-1.5">
						<span class="px-1.5 py-0.2 rounded bg-[#242426] text-[9px] uppercase font-mono text-[#a1a1aa] font-bold">
							{meal.mealType}
						</span>
						<h5 class="text-xs font-semibold text-white truncate">{meal.foodName}</h5>
					</div>
					<div class="flex items-center gap-2 mt-1 text-[11px] text-[#a1a1aa] font-mono">
						<span class="text-white font-bold">{meal.calories} kcal</span>
						<span>•</span>
						<span class="text-[#ff3333]">{meal.proteinGrams}g P</span>
						<span>•</span>
						<span class="text-[#488fff]">{meal.carbsGrams}g C</span>
						<span>•</span>
						<span class="text-orange-400">{meal.fatGrams}g F</span>
					</div>
				</div>
				<button
					type="button"
					onclick={() => deleteMeal(meal.id)}
					aria-label="Delete meal"
					class="w-7 h-7 rounded-lg bg-[#121212] hover:bg-red-950/80 border border-[#2e2e32] text-[#a1a1aa] hover:text-[#ff0101] flex items-center justify-center transition-colors flex-shrink-0 cursor-pointer"
				>
					<span class="material-symbols-outlined text-[16px]">delete</span>
				</button>
			</div>
		{/each}
	</section>
</div>
