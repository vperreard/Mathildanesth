import NextAuth, { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import axios from 'axios';

// Définir explicitement le type pour authOptions
export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        login: { label: 'Login', type: 'text', placeholder: 'jsmith' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        if (!credentials) {
          return null;
        }
        try {
          // IMPORTANT: Assurez-vous que NEXTAUTH_URL est bien défini dans vos variables d'environnement
          // et qu'il pointe vers la racine de votre application (ex: http://localhost:3000)
          const loginUrl = `${process.env.NEXTAUTH_URL}/api/auth/login`;
          console.log('NextAuth attempting to login with URL:', loginUrl);
          console.log('Credentials received by NextAuth authorize:', { login: credentials.login });

          const response = await axios.post(
            loginUrl,
            {
              login: credentials.login,
              password: credentials.password,
            },
            {
              headers: {
                'Content-Type': 'application/json',
              },
            }
          );

          if (response.data && response.data.user) {
            console.log('NextAuth authorize success, user data:', response.data.user);
            // Assurez-vous que l'objet utilisateur retourné par votre API
            // contient au moins un champ `id`.
            // NextAuth s'attend à ce que l'objet utilisateur ait une propriété `id`.
            // Si votre utilisateur a `userId` ou un autre nom, mappez-le ici.
            return {
              ...response.data.user,
              id: response.data.user.id || response.data.user.userId,
            };
          } else {
            console.log('NextAuth authorize failed, no user data in response:', response.data);
            return null;
          }
        } catch (error: any) {
          console.error('NextAuth authorize error:', error.response?.data || error.message);
          // Affichez l'URL pour le débogage si elle existe
          if (error.config && error.config.url) {
            console.error('Error occurred while calling:', error.config.url);
          }
          // Vous pouvez choisir de lever l'erreur ou de retourner null
          // Pour un meilleur feedback à l'utilisateur, vous pouvez jeter une erreur avec un message spécifique
          // throw new Error(error.response?.data?.message || "Authentication failed");
          return null; // Retourner null indique un échec d'authentification à NextAuth
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt', // Utilisation de JWT pour les sessions
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // `user` est passé uniquement lors de la connexion initiale
      if (account && user) {
        // `account` est présent lors de la connexion via un provider
        token.id = user.id;
        // token.accessToken = account.access_token; // Si vous utilisez OAuth et avez besoin du token d'accès
        // Ajoutez d'autres propriétés de l'utilisateur au token si nécessaire
        // Exemple : token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      // `token` contient les données du JWT (enrichi par le callback jwt)
      if (session.user && token.id) {
        session.user.id = token.id as string;
        // Ajoutez d'autres propriétés du token à la session si nécessaire
        // Exemple : session.user.role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/login', // Votre page de connexion personnalisée
    // signOut: '/auth/logout', // Si vous avez une page de déconnexion personnalisée
    // error: '/auth/error', // Page pour afficher les erreurs (ex: échec de connexion)
  },
  // Le secret est crucial pour la production et pour le chiffrement des JWT.
  // Assurez-vous que NEXTAUTH_SECRET est défini dans votre fichier .env.local
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development', // Active les logs de debug en développement
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
