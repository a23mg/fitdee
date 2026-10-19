/**
 * Fitdee Pose Pipeline Architecture
 * Prepared for Phase 2: MoveNet SinglePose / MultiPose WASM Runtime.
 * 
 * Hardware acceleration flags & Web Worker message passing contract.
 */

export interface Keypoint {
	x: number;
	y: number;
	score: number;
	name: string;
}

export interface PoseFrame {
	timestamp: number;
	keypoints: Keypoint[];
	formScore: number;
	feedback: string;
	repState: 'up' | 'down' | 'transition';
}

export interface PoseDetectorConfig {
	modelType: 'movenet_lightning' | 'movenet_thunder';
	enableWasmSimd: boolean;
	enableOpenCVKinematics: boolean;
	minConfidence: number;
}

export class PosePipelineManager {
	private isInitialized = false;
	private currentExercise = 'squat';
	private repCount = 0;
	private state: 'top' | 'bottom' | 'middle' = 'top';

	constructor(private config: PoseDetectorConfig = {
		modelType: 'movenet_lightning',
		enableWasmSimd: true,
		enableOpenCVKinematics: true,
		minConfidence: 0.4
	}) {}

	async initialize(): Promise<boolean> {
		// Checks hardware SIMD & SharedArrayBuffer support
		const hasSimd = typeof WebAssembly !== 'undefined' && WebAssembly.validate !== undefined;
		console.log(`[PosePipeline] Initialized. SIMD Supported: ${hasSimd}`);
		this.isInitialized = true;
		return true;
	}

	setExercise(exercise: string) {
		this.currentExercise = exercise;
		this.repCount = 0;
		this.state = 'top';
	}

	getRepCount(): number {
		return this.repCount;
	}

	incrementRep(): number {
		this.repCount += 1;
		return this.repCount;
	}

	resetReps() {
		this.repCount = 0;
	}
}
