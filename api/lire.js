import { createClient } from '@vercel/kv';

export default async function handler(request, response) {
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Content-Type', 'application/json');

    // Connexion directe en utilisant la vraie variable visible sur votre image : KV_REDIS_URL
    const kv = createClient({
        url: process.env.KV_REDIS_URL
    });

    try {
        const dates = await kv.get('dates_reservees');
        return response.status(200).json(dates || []);
    } catch (error) {
        console.error("Erreur de lecture Redis :", error);
        return response.status(500).json({ error: error.message });
    }
}
