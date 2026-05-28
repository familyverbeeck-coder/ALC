import { kv } from '@vercel/kv';

export default async function handler(request, response) {
    // Autorise la lecture
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Content-Type', 'application/json');

    try {
        const dates = await kv.get('dates_reservees');
        return response.status(200).json(dates || []);
    } catch (error) {
        return response.status(500).json([]);
    }
}
