import * as jose from 'jose';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error('JWT_SECRET variable d\'environnement manquante!');
}

const secretKey = new TextEncoder().encode(JWT_SECRET);

interface TokenPayload {
    userId: number;
    login: string;
    role: string; // Ou utilisez l'enum Prisma.Role si importé ici
    // Ajoutez d'autres données si nécessaire
}

/**
 * Crée un token JWT signé.
 * @param payload - Les données à inclure dans le token.
 * @param expiresIn - La durée de validité (ex: '2h', '7d'). Défaut: '1h'.
 * @returns Le token JWT signé.
 */
export async function createToken(payload: TokenPayload, expiresIn: string | number | Date = '1h'): Promise<string> {
    const alg = 'HS256'; // Algorithme de signature

    return await new jose.SignJWT({ ...payload })
        .setProtectedHeader({ alg })
        .setIssuedAt() // Date d'émission
        .setExpirationTime(expiresIn) // Date d'expiration
        // .setSubject(String(payload.userId)) // Sujet (optionnel)
        // .setIssuer('urn:example:issuer') // Émetteur (optionnel)
        // .setAudience('urn:example:audience') // Audience (optionnel)
        .sign(secretKey);
}

/**
 * Vérifie un token JWT et retourne le payload décodé.
 * @param token - Le token JWT à vérifier.
 * @returns Le payload du token.
 * @throws {Error} Si le token est invalide, expiré ou malformé.
 */
export async function verifyToken(token: string): Promise<TokenPayload & jose.JWTVerifyResult['payload']> {
    const alg = 'HS256';

    try {
        const { payload } = await jose.jwtVerify(token, secretKey, {
            algorithms: [alg],
            // issuer: 'urn:example:issuer', // Optionnel: vérifier l'émetteur
            // audience: 'urn:example:audience', // Optionnel: vérifier l'audience
        });

        // Vérifier si le payload a la structure attendue (TokenPayload)
        if (typeof payload.userId !== 'number' || typeof payload.login !== 'string' || typeof payload.role !== 'string') {
            throw new Error('Payload du token invalide');
        }

        return payload as TokenPayload & jose.JWTVerifyResult['payload'];
    } catch (error: any) {
        // Gérer les erreurs spécifiques de jose (ex: JWTExpired, JWTInvalid)
        console.error("Erreur de vérification du token:", error.code || error.message);
        if (error instanceof jose.errors.JWTExpired) {
            throw new Error('Token expiré');
        }
        throw new Error('Token invalide ou malformé');
    }
} 