import { createClient } from '@vercel/kv';

export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Méthode non autorisée' });
    }

    // Connexion directe en utilisant la vraie variable visible sur votre image : KV_REDIS_URL
    const kv = createClient({
        url: process.env.KV_REDIS_URL
    });

    const ip = request.headers['x-forwarded-for'] || request.socket.remoteAddress || 'unknown';
    const keyLock = `brute:${ip}`;

    try {
        const tentatives = await kv.get(keyLock);

        if (tentatives && tentatives >= 5) {
            return response.status(429).json({ 
                error: "Trop de tentatives. Votre accès est bloqué pendant 1 minute." 
            });
        }

        const { password, dates } = request.body;
        const motDePasseAttendu = process.env.ADMIN_PASSWORD;

        // Correction de la variable (attendu)
        if (password !== motDePasseAttendu) {
            if (!tentatives) {
                await kv.set(keyLock, 1, { ex: 60 });
            } else {
                await kv.incr(keyLock);
            }
            return response.status(401).json({ error: 'Code secret incorrect.' });
        }

        await kv.del(keyLock);
        await kv.set('dates_reservees', dates);
        return response.status(200).json({ success: true });
        
    } catch (error) {
        console.error("Erreur de sauvegarde Redis :", error);
        return response.status(500).json({ error: 'Erreur de base de données.' });
    }
}
