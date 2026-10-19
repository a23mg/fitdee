import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://127.0.0.1:5173';
const OUTPUT_DIR = path.resolve('example');

if (!fs.existsSync(OUTPUT_DIR)) {
	fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Clean up previous test files if any
const testFile = path.join(OUTPUT_DIR, 'test_home.png');
if (fs.existsSync(testFile)) {
	fs.unlinkSync(testFile);
}

async function preparePage(page) {
	// Set iPhone 16 viewport: 393 x 852 at 3x DPR = 1179 x 2556 pixels
	await page.setViewport({
		width: 393,
		height: 852,
		deviceScaleFactor: 3,
		isMobile: true,
		hasTouch: true
	});

	await page.setUserAgent(
		'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
	);
}

async function waitForAssets(page) {
	await page.evaluate(async () => {
		try {
			await document.fonts.load('24px "Material Symbols Outlined"');
			await document.fonts.ready;
		} catch (e) {}

		const imgs = Array.from(document.images);
		await Promise.all(
			imgs.map((img) => {
				if (img.complete) return Promise.resolve();
				return new Promise((resolve) => {
					img.addEventListener('load', resolve);
					img.addEventListener('error', resolve);
				});
			})
		);
	});
	await new Promise((r) => setTimeout(r, 1200));
}

async function captureScreen(page, filename, alias) {
	const filePath = path.join(OUTPUT_DIR, filename);
	await page.screenshot({ path: filePath, fullPage: false });
	console.log(`✓ Saved: ${filename}`);

	if (alias) {
		const aliasPath = path.join(OUTPUT_DIR, alias);
		fs.copyFileSync(filePath, aliasPath);
		console.log(`  (Copied to ${alias})`);
	}
}

async function run() {
	console.log('🚀 Launching Chrome for iPhone 16 captures...');
	const browser = await puppeteer.launch({
		executablePath: CHROME_PATH,
		headless: true,
		args: [
			'--no-sandbox',
			'--disable-setuid-sandbox',
			'--disable-web-security',
			'--hide-scrollbars',
			'--font-render-hinting=none'
		]
	});

	const page = await browser.newPage();
	await preparePage(page);

	// Ensure default athlete account (Alex Mercer)
	console.log('\n--- Setting Alex Mercer session ---');
	await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle0' });
	await page.evaluate(async () => {
		await fetch('/api/auth/switch', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ userId: 'user_alex_mercer' })
		});
	});

	// 1. Home Page (Top Screen)
	console.log('\n1. Capturing Home Page...');
	await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle0' });
	await waitForAssets(page);
	await captureScreen(page, '01-home.png', 'home.png');

	// 1b. Home Page (Scrolled Screen: Workout Checklist & Hydration)
	console.log('\n1b. Capturing Home Page (Scrolled)...');
	await page.evaluate(() => window.scrollTo({ top: 380, behavior: 'instant' }));
	await new Promise((r) => setTimeout(r, 600));
	await captureScreen(page, '01-home-scrolled.png', 'home-workout-routine.png');

	// 2. Nutrition Vision (Scan Tab)
	console.log('\n2. Capturing Nutrition Vision Page...');
	await page.goto(`${BASE_URL}/nutrition`, { waitUntil: 'networkidle0' });
	await waitForAssets(page);
	await captureScreen(page, '02-nutrition.png', 'nutrition.png');

	// 2b. Nutrition AI Coach Tab
	console.log('\n2b. Capturing Nutrition AI Coach Tab...');
	await page.evaluate(() => {
		const buttons = Array.from(document.querySelectorAll('button'));
		const coachBtn = buttons.find((b) => b.textContent && b.textContent.includes('AI Coach'));
		if (coachBtn) coachBtn.click();
	});
	await new Promise((r) => setTimeout(r, 800));
	await waitForAssets(page);
	await captureScreen(page, '02-nutrition-coach.png', 'nutrition-coach.png');

	// 3. Pose Trainer HUD
	console.log('\n3. Capturing Pose Trainer HUD Page...');
	await page.goto(`${BASE_URL}/pose`, { waitUntil: 'networkidle0' });
	await waitForAssets(page);
	await captureScreen(page, '03-pose.png', 'pose.png');

	// 3b. Pose Trainer (Active Session)
	console.log('\n3b. Capturing Active Pose Trainer Session...');
	await page.evaluate(() => {
		const buttons = Array.from(document.querySelectorAll('button'));
		const startBtn = buttons.find((b) => b.textContent && b.textContent.includes('Start Workout HUD'));
		if (startBtn) startBtn.click();
	});
	await new Promise((r) => setTimeout(r, 600));
	await captureScreen(page, '03-pose-active.png', 'pose-active.png');

	// 4. Coaches & Gyms Directory
	console.log('\n4. Capturing Coaches & Gyms Page...');
	await page.goto(`${BASE_URL}/trainers`, { waitUntil: 'networkidle0' });
	await waitForAssets(page);
	await captureScreen(page, '04-trainers.png', 'trainers.png');

	// 4b. Coaches & Gyms (Scrolled to Partner Gyms)
	console.log('\n4b. Capturing Partner Gyms...');
	await page.evaluate(() => window.scrollTo({ top: 480, behavior: 'instant' }));
	await new Promise((r) => setTimeout(r, 600));
	await captureScreen(page, '04-trainers-gyms.png', 'trainers-gyms.png');

	// 5. Athlete Profile & Body Metrics
	console.log('\n5. Capturing Athlete Profile Page...');
	await page.goto(`${BASE_URL}/profile`, { waitUntil: 'networkidle0' });
	await waitForAssets(page);
	await captureScreen(page, '05-profile.png', 'profile.png');

	// 5b. Athlete Profile (Scrolled to Body Breakdown & Charts)
	console.log('\n5b. Capturing Profile Metrics & History...');
	await page.evaluate(() => window.scrollTo({ top: 380, behavior: 'instant' }));
	await new Promise((r) => setTimeout(r, 600));
	await captureScreen(page, '05-profile-measurements.png', 'profile-measurements.png');

	// 6. Sign In Page
	console.log('\n6. Capturing Sign In Page...');
	await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle0' });
	await waitForAssets(page);
	await captureScreen(page, '06-login.png', 'login.png');

	// 7. Create Account Page
	console.log('\n7. Capturing Register Page...');
	await page.goto(`${BASE_URL}/register`, { waitUntil: 'networkidle0' });
	await waitForAssets(page);
	await captureScreen(page, '07-register.png', 'register.png');

	// 8. Admin Diagnostic & Ops Center (Switch to Admin Account)
	console.log('\n8. Switching to Admin Ops account and capturing Admin Page...');
	await page.evaluate(async () => {
		await fetch('/api/auth/switch', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ userId: 'user_admin_ops' })
		});
	});
	await page.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle0' });
	await waitForAssets(page);
	await captureScreen(page, '08-admin.png', 'admin.png');

	console.log('\n🎉 All screenshots successfully generated in iPhone 16 ratio (1179 x 2556)!');
	await browser.close();
}

run().catch((err) => {
	console.error('Error during capture:', err);
	process.exit(1);
});
