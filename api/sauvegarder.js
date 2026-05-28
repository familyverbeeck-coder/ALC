import Redis from 'ioredis';

export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Méthode non autorisée' });
    }

    const redis = new Redis(process.env.KV_REDIS_URL);
    const ip = request.headers['x-forwarded-for'] || request.socket.remoteAddress || 'unknown';
    const keyLock = `brute:${ip}`;

    try {
        const tentatives = await redis.get(keyLock);

        if (tentatives && parseInt(tentatives) >= 5) {
            await redis.quit();
            return response.status(429).json({ 
                error: "Trop de tentatives. Votre accès est bloqué pendant 1 minute." 
            });
        }

        const { password, dates } = request.body;
        const motDePasseAttendu = process.env.ADMIN_PASSWORD;

        if (password !== motDePasseAttendu) {
            if (!tentatives) {
                // Fixe la valeur à 1 et expire après 60 secondes
                await redis.set(keyLock, 1, 'EX', 60);
            } else {
                await redis.incr(keyLock);
            }
            await redis.quit();
            return response.status(401).json({ error: 'Code secret incorrect.' });
        }

        // Si tout est bon, on enregistre sous forme de chaîne de caractères
        await redis.del(keyLock);
        await redis.set('dates_reservees', JSON.stringify(dates));
        
        await redis.quit();
        return response.status(200).json({ success: true });
        
    } catch (error) {
        console.error("Erreur Redis Sauvegarder:", error);
        return response.status(500).json({ error: 'Erreur de base de données.' });
    }
}
