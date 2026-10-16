/**
 * Fitdee Mobile Hardware Sensor Suite
 * Accelerometer Shake Detection with Haptic Vibration Feedback
 */

export interface MotionOptions {
	threshold?: number;
	debounceMs?: number;
	onShake: () => void;
}

export class ShakeDetector {
	private lastX: number | null = null;
	private lastY: number | null = null;
	private lastZ: number | null = null;
	private lastTime = 0;
	private threshold = 18; // Acceleration threshold (m/s^2)
	private debounceMs = 350;
	private onShakeCallback: () => void;
	private isListening = false;
	private handler: ((e: DeviceMotionEvent) => void) | null = null;

	constructor(options: MotionOptions) {
		if (options.threshold) this.threshold = options.threshold;
		if (options.debounceMs) this.debounceMs = options.debounceMs;
		this.onShakeCallback = options.onShake;
	}

	async requestPermission(): Promise<boolean> {
		if (typeof window === 'undefined') return false;

		// iOS 13+ requires explicit user gesture permission request
		if (
			typeof DeviceMotionEvent !== 'undefined' &&
			typeof (DeviceMotionEvent as any).requestPermission === 'function'
		) {
			try {
				const state = await (DeviceMotionEvent as any).requestPermission();
				return state === 'granted';
			} catch (e) {
				console.warn('iOS motion sensor permission denied:', e);
				return false;
			}
		}
		return true; // Android and standard browsers grant permission automatically
	}

	start(): boolean {
		if (typeof window === 'undefined' || this.isListening) return false;
		if (!('DeviceMotionEvent' in window)) return false;

		this.handler = (event: DeviceMotionEvent) => {
			const current = event.accelerationIncludingGravity || event.acceleration;
			if (!current || current.x === null || current.y === null || current.z === null) return;

			const now = Date.now();
			if (now - this.lastTime < this.debounceMs) return;

			if (this.lastX !== null && this.lastY !== null && this.lastZ !== null) {
				const deltaX = Math.abs(this.lastX - current.x);
				const deltaY = Math.abs(this.lastY - current.y);
				const deltaZ = Math.abs(this.lastZ - current.z);

				const speed = Math.sqrt(deltaX ** 2 + deltaY ** 2 + deltaZ ** 2);
				if (speed > this.threshold) {
					this.lastTime = now;
					this.triggerHaptic();
					this.onShakeCallback();
				}
			}

			this.lastX = current.x;
			this.lastY = current.y;
			this.lastZ = current.z;
		};

		window.addEventListener('devicemotion', this.handler, false);
		this.isListening = true;
		return true;
	}

	stop() {
		if (this.handler && typeof window !== 'undefined') {
			window.removeEventListener('devicemotion', this.handler, false);
			this.handler = null;
		}
		this.isListening = false;
		this.lastX = null;
		this.lastY = null;
		this.lastZ = null;
	}

	triggerHaptic(pattern: number[] = [45, 30, 45]) {
		if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
			try {
				navigator.vibrate(pattern);
			} catch (_) {}
		}
	}
}
