/**
 * Fichier proxy pour le hook useAuth
 * Ce fichier réexporte simplement le hook depuis le contexte d'authentification
 * pour maintenir la compatibilité avec le code existant
 */

import { useAuth } from '@/context/AuthContext';

export { useAuth };
export default useAuth; 