<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let trainers = $state(data.trainers ?? []);
	let gyms = $state(data.gyms ?? []);
	let bookings = $state(data.bookings ?? []);
	let activeFilter = $state('all');
	let searchQuery = $state('');

	// Booking modal state
	let selectedTrainer = $state<any>(null);
	let bookingDate = $state('Tomorrow');
	let bookingTimeSlot = $state('10:00 AM - 11:00 AM');
	let bookingNotes = $state('');
	let isBooking = $state(false);
	let bookingSuccessMessage = $state<string | null>(null);

	const timeSlots = [
		'09:00 AM - 10:00 AM',
		'10:00 AM - 11:00 AM',
		'02:00 PM - 03:00 PM',
		'05:00 PM - 06:00 PM',
		'06:30 PM - 07:30 PM'
	];

	let filteredTrainers = $derived(
		trainers.filter((t: any) => {
			const matchesSearch =
				t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				t.specialty.toLowerCase().includes(searchQuery.toLowerCase());
			if (!matchesSearch) return false;
			if (activeFilter === 'all') return true;
			if (activeFilter === 'hypertrophy') return t.specialty.toLowerCase().includes('hypertrophy') || t.specialty.toLowerCase().includes('strength');
			if (activeFilter === 'mobility') return t.specialty.toLowerCase().includes('mobility') || t.specialty.toLowerCase().includes('weightlifting');
			if (activeFilter === 'conditioning') return t.specialty.toLowerCase().includes('conditioning') || t.specialty.toLowerCase().includes('calisthenics');
			return true;
		})
	);

	function openBookingModal(trainer: any) {
		selectedTrainer = trainer;
		bookingNotes = '';
		bookingSuccessMessage = null;
	}

	function closeBookingModal() {
		selectedTrainer = null;
	}

	async function submitBooking() {
		if (!selectedTrainer) return;
		isBooking = true;
		try {
			const res = await fetch('/api/trainers/book', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					trainerId: selectedTrainer.id,
					date: bookingDate,
					timeSlot: bookingTimeSlot,
					notes: bookingNotes
				})
			});
			const json = await res.json();
			if (json.success && json.booking) {
				bookings = [json.booking, ...bookings];
				bookingSuccessMessage = `Session booked with ${selectedTrainer.name} for ${bookingDate} at ${bookingTimeSlot}!`;
				setTimeout(() => {
					closeBookingModal();
				}, 2000);
			}
		} catch (err) {
			console.error('Booking failed:', err);
		} finally {
			isBooking = false;
		}
	}
</script>

<svelte:head>
	<title>Fitdee | Coaches & Performance Facilities</title>
</svelte:head>

<div class="flex flex-col w-full space-y-4 pt-2">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<span class="text-[10px] text-[#ff3333] uppercase font-bold tracking-wider font-mono">VERIFIED DIRECTORY</span>
			<h2 class="text-sm font-bold text-white">Athletic Coaches & Gyms</h2>
		</div>
		<span class="px-2 py-0.5 rounded-full bg-red-950/80 border border-red-700 text-[10px] font-mono text-[#ff3333] font-bold">
			{bookings.length} BOOKED
		</span>
	</div>

	<!-- Search bar -->
	<div class="relative w-full">
		<span class="material-symbols-outlined absolute left-3 top-2.5 text-[#a1a1aa] text-[18px]">search</span>
		<input
			type="text"
			bind:value={searchQuery}
			placeholder="Search by coach name, hypertrophy, mobility..."
			class="w-full bg-[#1c1c1e] border border-[#2e2e32] focus:border-[#ff0101] rounded-xl pl-9 pr-3 py-2 text-xs text-white outline-none"
		/>
	</div>

	<!-- Category Filters -->
	<div class="flex gap-2 overflow-x-auto pb-1">
		{#each [
			{ id: 'all', label: 'All Coaches' },
			{ id: 'hypertrophy', label: 'Hypertrophy' },
			{ id: 'mobility', label: 'Mobility & Rehab' },
			{ id: 'conditioning', label: 'Conditioning' }
		] as filter}
			<button
				type="button"
				onclick={() => (activeFilter = filter.id)}
				class="py-1.5 px-3 rounded-xl border text-xs font-semibold whitespace-nowrap transition-all cursor-pointer {activeFilter === filter.id ? 'bg-[#ff0101] border-[#ff0101] text-white shadow-md' : 'bg-[#1c1c1e] border-[#2e2e32] text-[#a1a1aa] hover:text-white'}"
			>
				{filter.label}
			</button>
		{/each}
	</div>

	<!-- Active Bookings Notice (if any) -->
	{#if bookings.length > 0}
		<section class="bg-[#1c1c1e] border border-red-800/60 rounded-xl p-3 shadow-md">
			<div class="flex items-center justify-between mb-2">
				<span class="text-[10px] font-mono uppercase text-[#ff3333] font-bold">UPCOMING APPOINTMENT</span>
				<span class="text-[10px] px-2 py-0.5 rounded bg-green-950 text-green-300 font-mono font-bold">CONFIRMED</span>
			</div>
			<div class="flex items-center gap-2">
				<span class="material-symbols-outlined text-[#ff0101] text-[20px]">event_available</span>
				<div class="min-w-0">
					<p class="text-xs font-semibold text-white truncate">{bookings[0].trainerName || 'Marcus Vance'} • {bookings[0].timeSlot}</p>
					<p class="text-[11px] text-[#a1a1aa]">{bookings[0].date} {bookings[0].notes ? `• ${bookings[0].notes}` : ''}</p>
				</div>
			</div>
		</section>
	{/if}

	<!-- Trainers List -->
	<section class="space-y-3">
		{#each filteredTrainers as trainer}
			<div class="bg-[#1c1c1e] border border-[#2e2e32] rounded-2xl p-4 shadow-xl hover:border-red-900/40 transition-all flex flex-col justify-between">
				<div class="flex items-start gap-3 mb-3">
					<img
						src={trainer.avatarUrl}
						alt={trainer.name}
						class="w-14 h-14 rounded-2xl object-cover border border-[#2e2e32] shadow-md flex-shrink-0"
					/>
					<div class="min-w-0 flex-1">
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-1.5">
								<h3 class="text-xs font-bold text-white truncate">{trainer.name}</h3>
								{#if trainer.isVerified}
									<span class="material-symbols-outlined text-[#ff0101] text-[16px]" title="Verified Coach">verified</span>
								{/if}
							</div>
							<div class="flex items-center gap-1 text-[11px] font-mono text-white">
								<span class="material-symbols-outlined text-amber-400 text-[14px]">star</span>
								<span>{trainer.rating}</span>
							</div>
						</div>
						<p class="text-[11px] text-[#ff3333] font-medium truncate mt-0.5">{trainer.roleTitle}</p>
						<p class="text-[10px] text-[#a1a1aa] truncate mt-0.5">{trainer.location}</p>
					</div>
				</div>

				<p class="text-[11px] text-[#a1a1aa] line-clamp-2 mb-3">{trainer.bio}</p>

				<div class="flex items-center justify-between pt-2 border-t border-[#2e2e32]">
					<div>
						<span class="text-[10px] text-[#a1a1aa] block font-mono">RATE</span>
						<span class="text-xs font-bold text-white font-mono">${trainer.hourlyRateUsd} / hr</span>
					</div>

					<button
						type="button"
						onclick={() => openBookingModal(trainer)}
						class="py-1.5 px-3 bg-[#ff0101] hover:bg-red-700 active:scale-95 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
					>
						<span class="material-symbols-outlined text-[16px]">calendar_add_on</span>
						<span>Book Session</span>
					</button>
				</div>
			</div>
		{/each}
	</section>

	<!-- Partner Gym Facilities -->
	<section class="space-y-2 pt-2">
		<h3 class="text-xs font-bold text-white uppercase tracking-wider font-mono">Affiliated Performance Centers</h3>
		{#each gyms as gym}
			<div class="bg-[#1c1c1e] border border-[#2e2e32] rounded-2xl overflow-hidden shadow-lg">
				<div class="relative h-28 w-full">
					<img src={gym.imageUrl} alt={gym.name} class="w-full h-full object-cover" />
					<div class="absolute inset-0 bg-gradient-to-t from-[#1c1c1e] via-[#1c1c1e]/40 to-transparent"></div>
					<div class="absolute bottom-2 left-3 right-3 flex items-center justify-between">
						<div>
							<h4 class="text-xs font-bold text-white">{gym.name}</h4>
							<p class="text-[10px] text-[#a1a1aa]">{gym.location}</p>
						</div>
						<span class="px-2 py-0.5 rounded bg-black/70 border border-white/20 text-[10px] font-mono text-white">
							★ {gym.rating}
						</span>
					</div>
				</div>
				<div class="p-3 pt-2">
					<p class="text-[10px] text-[#ff3333] font-mono">{gym.facilities}</p>
				</div>
			</div>
		{/each}
	</section>

	<!-- Booking Modal Popup -->
	{#if selectedTrainer}
		<div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-4">
			<div class="bg-[#1c1c1e] border border-[#2e2e32] rounded-3xl w-full max-w-sm p-5 shadow-2xl animate-in fade-in slide-in-from-bottom-4">
				<div class="flex items-start justify-between pb-3 mb-3 border-b border-[#2e2e32]">
					<div>
						<span class="text-[10px] text-[#ff3333] font-mono uppercase font-bold">1-ON-1 COACHING PROTOCOL</span>
						<h3 class="text-sm font-bold text-white">Schedule with {selectedTrainer.name}</h3>
					</div>
					<button
						type="button"
						onclick={closeBookingModal}
						class="text-[#a1a1aa] hover:text-white p-1 cursor-pointer"
					>
						<span class="material-symbols-outlined text-[18px]">close</span>
					</button>
				</div>

				{#if bookingSuccessMessage}
					<div class="p-4 rounded-xl bg-green-950/60 border border-green-700 text-xs font-semibold text-green-200 text-center">
						{bookingSuccessMessage}
					</div>
				{:else}
					<div class="space-y-3">
						<div>
							<label class="block text-[11px] text-[#a1a1aa] mb-1">Select Day</label>
							<div class="grid grid-cols-3 gap-2">
								{#each ['Today', 'Tomorrow', 'In 2 Days'] as day}
									<button
										type="button"
										onclick={() => (bookingDate = day)}
										class="py-1.5 px-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer {bookingDate === day ? 'bg-[#ff0101] border-[#ff0101] text-white' : 'bg-[#121212] border-[#2e2e32] text-[#a1a1aa]'}"
									>
										{day}
									</button>
								{/each}
							</div>
						</div>

						<div>
							<label class="block text-[11px] text-[#a1a1aa] mb-1">Select Time Slot</label>
							<select
								bind:value={bookingTimeSlot}
								class="w-full bg-[#121212] border border-[#2e2e32] rounded-xl px-3 py-2 text-xs text-white outline-none"
							>
								{#each timeSlots as slot}
									<option value={slot}>{slot}</option>
								{/each}
							</select>
						</div>

						<div>
							<label class="block text-[11px] text-[#a1a1aa] mb-1">Biomechanical Focus (Optional)</label>
							<input
								type="text"
								bind:value={bookingNotes}
								placeholder="e.g. Squat depth check & lower back fatigue"
								class="w-full bg-[#121212] border border-[#2e2e32] focus:border-[#ff0101] rounded-xl px-3 py-2 text-xs text-white outline-none"
							/>
						</div>

						<div class="pt-2">
							<button
								type="button"
								onclick={submitBooking}
								disabled={isBooking}
								class="w-full py-2.5 bg-[#ff0101] hover:bg-red-700 active:scale-95 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
							>
								<span class="material-symbols-outlined text-[18px]">verified</span>
								<span>{isBooking ? 'Securing Slot...' : `Confirm Session ($${selectedTrainer.hourlyRateUsd})`}</span>
							</button>
						</div>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>
