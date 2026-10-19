/**
 * Fitdee Client-Side Model & WASM Cache Manager
 * Uses IndexedDB & Cache API to store MoveNet weights and OpenCV WASM binaries locally
 * for instantaneous (<100ms) startup and offline execution without network overhead.
 */

export interface CacheStatus {
	isIndexedDBAvailable: boolean;
	isCacheApiAvailable: boolean;
	isMoveNetCached: boolean;
	isOpenCVCached: boolean;
	estimatedStorageUsageMb?: number;
}

const CACHE_NAME = 'fitdee-wasm-models-v1';
const MOVENET_IDB_KEY = 'indexeddb://fitdee-movenet-lightning-v1';
const OPENCV_CDN_URL = 'https://docs.opencv.org/4.8.0/opencv.js';

export class ModelCacheManager {
	private isIdbSupported = false;
	private isCacheSupported = false;

	constructor() {
		if (typeof window !== 'undefined') {
			this.isIdbSupported = 'indexedDB' in window;
			this.isCacheSupported = 'caches' in window;
		}
	}

	/**
	 * Inspect local storage status and quota
	 */
	async getCacheStatus(): Promise<CacheStatus> {
		if (typeof window === 'undefined') {
			return {
				isIndexedDBAvailable: false,
				isCacheApiAvailable: false,
				isMoveNetCached: false,
				isOpenCVCached: false
			};
		}

		let isMoveNetCached = false;
		let isOpenCVCached = false;
		let estimatedStorageUsageMb: number | undefined;

		try {
			if (navigator.storage && navigator.storage.estimate) {
				const estimate = await navigator.storage.estimate();
				if (estimate.usage) {
					estimatedStorageUsageMb = Math.round((estimate.usage / (1024 * 1024)) * 10) / 10;
				}
			}

			// Check Cache API for OpenCV
			if (this.isCacheSupported) {
				const cache = await caches.open(CACHE_NAME);
				const match = await cache.match(OPENCV_CDN_URL);
				isOpenCVCached = !!match;
			}

			// Check IndexedDB databases
			if (this.isIdbSupported && (window.indexedDB as any).databases) {
				const dbs = await (window.indexedDB as any).databases();
				isMoveNetCached = dbs.some((db: any) => db.name && db.name.includes('fitdee-movenet'));
			}
		} catch (e) {
			console.debug('[ModelCache] Error querying cache status:', e);
		}

		return {
			isIndexedDBAvailable: this.isIdbSupported,
			isCacheApiAvailable: this.isCacheSupported,
			isMoveNetCached,
			isOpenCVCached,
			estimatedStorageUsageMb
		};
	}

	/**
	 * Loads OpenCV script from local Cache API, or fetches from CDN and caches for next time
	 * Returns a Blob object URL suitable for zero-latency script execution
	 */
	async getOrCacheOpenCVScript(): Promise<string> {
		if (!this.isCacheSupported) {
			return OPENCV_CDN_URL;
		}

		try {
			const cache = await caches.open(CACHE_NAME);
			const cachedResponse = await cache.match(OPENCV_CDN_URL);

			if (cachedResponse) {
				console.log('⚡ [ModelCache] Loaded OpenCV.js WASM from local Cache API (0ms network).');
				const blob = await cachedResponse.blob();
				return URL.createObjectURL(blob);
			}

			console.log('🌐 [ModelCache] Downloading OpenCV.js WASM from CDN & caching locally...');
			const networkResponse = await fetch(OPENCV_CDN_URL);
			if (networkResponse.ok) {
				await cache.put(OPENCV_CDN_URL, networkResponse.clone());
				console.log('💾 [ModelCache] OpenCV.js WASM stored in Cache API for offline persistence.');
				const blob = await networkResponse.blob();
				return URL.createObjectURL(blob);
			}
		} catch (err) {
			console.warn('[ModelCache] Cache API load failed, falling back to direct CDN:', err);
		}

		return OPENCV_CDN_URL;
	}

	/**
	 * Caches an arbitrary binary asset (e.g. WASM binary) into the Cache API
	 */
	async cacheBinary(url: string, data: ArrayBuffer | Blob): Promise<boolean> {
		if (!this.isCacheSupported) return false;
		try {
			const cache = await caches.open(CACHE_NAME);
			const response = new Response(data, {
				headers: { 'Content-Type': 'application/wasm' }
			});
			await cache.put(url, response);
			return true;
		} catch (err) {
			console.warn('[ModelCache] Failed to cache binary:', err);
			return false;
		}
	}

	/**
	 * Retrieves cached binary as ArrayBuffer if present
	 */
	async getCachedBinary(url: string): Promise<ArrayBuffer | null> {
		if (!this.isCacheSupported) return null;
		try {
			const cache = await caches.open(CACHE_NAME);
			const match = await cache.match(url);
			if (match) {
				return await match.arrayBuffer();
			}
		} catch (err) {
			console.warn('[ModelCache] Cache lookup error:', err);
		}
		return null;
	}

	/**
	 * Clears Fitdee model caches
	 */
	async clearAllCaches(): Promise<boolean> {
		try {
			if (this.isCacheSupported) {
				await caches.delete(CACHE_NAME);
			}
			if (this.isIdbSupported) {
				indexedDB.deleteDatabase('tensorflowjs');
				indexedDB.deleteDatabase('fitdee-movenet-lightning-v1');
			}
			console.log('🧹 [ModelCache] All local model and WASM caches cleared.');
			return true;
		} catch (err) {
			console.warn('[ModelCache] Error clearing caches:', err);
			return false;
		}
	}
}

export const modelCache = new ModelCacheManager();
