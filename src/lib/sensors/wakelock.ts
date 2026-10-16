/**
 * Screen Wake Lock Manager
 * Keeps mobile screen awake during workouts and camera pose tracking.
 */

export class WakeLockManager {
	private sentinel: any = null;
	private isSupported = false;

	constructor() {
		if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
			this.isSupported = true;
		}
	}

	async request(): Promise<boolean> {
		if (!this.isSupported) return false;
		try {
			this.sentinel = await (navigator as any).wakeLock.request('screen');
			this.sentinel.addEventListener('release', () => {
				this.sentinel = null;
			});
			return true;
		} catch (err) {
			console.warn('WakeLock request failed:', err);
			return false;
		}
	}

	release() {
		if (this.sentinel) {
			this.sentinel.release().catch(() => {});
			this.sentinel = null;
		}
	}

	isActive(): boolean {
		return this.sentinel !== null;
	}
}
