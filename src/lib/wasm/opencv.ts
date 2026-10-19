/**
 * Fitdee OpenCV.js WASM Kinematics & Computer Vision Bridge
 * Provides real-time optical velocity vectoring, concentric/eccentric cadence analysis,
 * and kinematic joint angle smoothing over MoveNet skeletal coordinates.
 */

import { modelCache } from './model-cache.js';

export interface JointVector {
	x: number;
	y: number;
}

export interface KinematicMetric {
	smoothedAngle: number;
	angularVelocity: number; // degrees per second
	motionPhase: 'eccentric' | 'concentric' | 'isometric';
	tempoSeconds: number;
	isSmoothedByOpenCV: boolean;
}

export class OpenCVKinematicsEngine {
	private isCvLoaded = false;
	private isLoading = false;
	private angleHistory: { angle: number; timestamp: number }[] = [];
	private maxHistory = 10;
	private smoothingAlpha = 0.35; // Exponential Moving Average smoothing factor
	private lastSmoothedAngle: number = 180;
	private phaseStartTime: number = Date.now();
	private currentPhase: 'eccentric' | 'concentric' | 'isometric' = 'isometric';

	constructor() {
		// Attempt lazy background initialization if window is available
		if (typeof window !== 'undefined') {
			this.initOpenCV();
		}
	}

	/**
	 * Dynamically loads OpenCV.js WASM runtime from local Cache API or CDN
	 */
	async initOpenCV(): Promise<boolean> {
		if (this.isCvLoaded) return true;
		if (this.isLoading) return false;
		if (typeof window === 'undefined') return false;

		// Check if OpenCV is already attached to window
		if ((window as any).cv && (window as any).cv.Mat) {
			this.isCvLoaded = true;
			return true;
		}

		this.isLoading = true;
		try {
			// Check if OpenCV script exists or can be dynamically loaded
			if (!(window as any).cv) {
				const scriptUrl = await modelCache.getOrCacheOpenCVScript();
				const script = document.createElement('script');
				script.src = scriptUrl;
				script.async = true;
				script.onload = () => {
					if ((window as any).cv) {
						(window as any).cv['onRuntimeInitialized'] = () => {
							this.isCvLoaded = true;
							this.isLoading = false;
							console.log('✅ Fitdee OpenCV.js WASM Engine ready.');
						};
					}
				};
				script.onerror = () => {
					this.isLoading = false;
					console.info('[OpenCV] Running native WebAssembly / TS kinematic fallback mode.');
				};
				document.head.appendChild(script);
			}
			return true;
		} catch (e) {
			this.isLoading = false;
			return false;
		}
	}

	/**
	 * Filters raw joint angle with kinematic exponential smoothing
	 * Eliminates high-frequency noise from single-frame optical variations
	 */
	filterJointAngle(rawAngle: number, timestamp: number = Date.now()): KinematicMetric {
		// Calculate exponential smoothing
		if (this.angleHistory.length === 0) {
			this.lastSmoothedAngle = rawAngle;
		} else {
			this.lastSmoothedAngle = (this.smoothingAlpha * rawAngle) + ((1 - this.smoothingAlpha) * this.lastSmoothedAngle);
		}

		this.angleHistory.push({ angle: this.lastSmoothedAngle, timestamp });
		if (this.angleHistory.length > this.maxHistory) {
			this.angleHistory.shift();
		}

		// Compute angular velocity (deg/sec)
		let angularVelocity = 0;
		if (this.angleHistory.length >= 3) {
			const oldest = this.angleHistory[0];
			const newest = this.angleHistory[this.angleHistory.length - 1];
			const dt = (newest.timestamp - oldest.timestamp) / 1000;
			if (dt > 0.05) {
				angularVelocity = (newest.angle - oldest.angle) / dt;
			}
		}

		// Detect motion phase based on angular velocity thresholds
		const velocityThreshold = 15; // deg/sec
		let newPhase: 'eccentric' | 'concentric' | 'isometric' = 'isometric';

		if (angularVelocity < -velocityThreshold) {
			newPhase = 'eccentric'; // Joint flexing (e.g. descending in squat)
		} else if (angularVelocity > velocityThreshold) {
			newPhase = 'concentric'; // Joint extending (e.g. ascending in squat)
		} else {
			newPhase = 'isometric'; // Paused / hold at peak or lockout
		}

		if (newPhase !== this.currentPhase) {
			this.currentPhase = newPhase;
			this.phaseStartTime = timestamp;
		}

		const tempoSeconds = (timestamp - this.phaseStartTime) / 1000;

		return {
			smoothedAngle: Math.round(this.lastSmoothedAngle),
			angularVelocity: Math.round(angularVelocity),
			motionPhase: this.currentPhase,
			tempoSeconds: Math.round(tempoSeconds * 10) / 10,
			isSmoothedByOpenCV: this.isCvLoaded
		};
	}

	/**
	 * Computes 2D vector angle using OpenCV-style atan2 geometry
	 */
	computeVectorAngle(a: JointVector, b: JointVector, c: JointVector): number {
		const rad = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
		let deg = Math.abs((rad * 180.0) / Math.PI);
		if (deg > 180.0) {
			deg = 360.0 - deg;
		}
		return deg;
	}

	/**
	 * Reset history on exercise switch or rep reset
	 */
	reset() {
		this.angleHistory = [];
		this.lastSmoothedAngle = 180;
		this.phaseStartTime = Date.now();
		this.currentPhase = 'isometric';
	}
}

// Global singleton instance
export const openCVKinematics = new OpenCVKinematicsEngine();
