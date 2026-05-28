import { kv } from '@vercel/kv';

export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Méthode non autorisée' });
    }

    // 1. Récupération de l'IP du visiteur pour le rate limiting
    const ip = request.headers['x-forwarded-for'] || request.socket.remoteAddress || 'unknown';
    const keyLock = `brute:${ip}`;

    // 2. Vérification du nombre de tentatives
    const tentatives = await kv.get(keyLock);

    if (tentatives && tentatives >= 5) {
        return response.status(429).json({ 
            error: "Trop de tentatives. Votre accès est bloqué pendant 1 minute." 
        });
    }

    const { password, dates } = request.body;
    const motDePasseAttendu = process.env.ADMIN_PASSWORD;

    // 3. Validation du mot de passe
    if (password !== motDePasseAttendu) {
        // Incrémente le compteur d'échecs de 1, et fixe la durée de vie à 60 secondes (1m)
        if (!tentatives) {
            await kv.set(keyLock, 1, { ex: 60 });
        } else {
            await kv.incr(keyLock);
        }

        return response.status(401).json({ error: 'Code secret incorrect.' });
    }

    // 4. Si le mot de passe est correct, on réinitialise le verrou et on sauvegarde
    try {
        await kv.del(keyLock); // Reset des tentatives
        await kv.set('dates_reservees', dates);
        return response.status(200).json({ success: true });
    } catch (error) {
        return response.status(500).json({ error: 'Erreur de base de données.' });
    }
}
