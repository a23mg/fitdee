import { json } from '@sveltejs/kit';
import { GoogleGenAI } from '@google/genai';
import type { RequestHandler } from './$types';

const COACH_SYSTEM_INSTRUCTION = `You are Fitdee AI, an elite athletic biometric and sports nutrition coach.
Give concise, authoritative, sports-science backed answers (maximum 2-3 sentences) on athletic nutrition, macros, pre/post workout nutrient timing, and muscle hypertrophy.`;

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { message } = await request.json();
		const apiKey = process.env.GEMINI_API_KEY;

		if (apiKey && message) {
			try {
				const ai = new GoogleGenAI({ apiKey });
				const response = await ai.models.generateContent({
					model: 'gemini-3.8-flash',
					contents: [
						{
							role: 'user',
							parts: [{ text: message }]
						}
					],
					config: {
						systemInstruction: COACH_SYSTEM_INSTRUCTION
					}
				});

				const reply = response.text?.trim();
				if (reply) {
					return json({ success: true, reply, isGemini: true });
				}
			} catch (e: any) {
				console.warn('Gemini chat error, fallback to expert advice:', e.message);
			}
		}

		// Fallback intelligent answers
		let fallback = 'Prioritize 30-40g of rapid-digesting whey protein isolate and 50g dextrose/maltodextrin within 45 minutes of training.';
		const lower = (message || '').toLowerCase();
		if (lower.includes('protein') || lower.includes('shake')) {
			fallback = 'Aim for 1.8-2.2g of protein per kg of body weight evenly distributed across 4-5 meals to optimize muscle protein synthesis.';
		} else if (lower.includes('carb') || lower.includes('energy')) {
			fallback = 'Time complex carbohydrates (oats, sweet potatoes, rice) 2-3 hours pre-workout, and rapid-digesting simple carbs immediately post-session.';
		} else if (lower.includes('fat') || lower.includes('cut')) {
			fallback = 'Maintain a controlled 300-400 kcal deficit while keeping protein high (2.2g/kg) and fats at 20-25% of total caloric intake to protect lean tissue.';
		}

		return json({
			success: true,
			reply: fallback,
			isGemini: false
		});
	} catch (err: any) {
		return json({ success: false, error: err.message }, { status: 500 });
	}
};
