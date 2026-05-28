import Redis from 'ioredis';

export default async function handler(request, response) {
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Content-Type', 'application/json');

    // ioredis se connecte instantanément avec votre variable unique KV_REDIS_URL
    const redis = new Redis(process.env.KV_REDIS_URL);

    try {
        const donnees = await redis.get('dates_reservees');
        // ioredis renvoie du texte brut, on le transforme en tableau JSON
        const dates = donnees ? JSON.parse(donnees) : [];
        
        await redis.quit(); // Ferme proprement la connexion
        return response.status(200).json(dates);
    } catch (error) {
        console.error("Erreur Redis Lire:", error);
        return response.status(500).json([]);
    }
}
