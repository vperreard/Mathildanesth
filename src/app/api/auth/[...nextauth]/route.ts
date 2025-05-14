import NextAuth, { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import axios from 'axios';
import { Role } from '@prisma/client';

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
            const apiUser = response.data.user as { id?: string; userId?: string; role: Role; token: string;[key: string]: any };

            const finalId = apiUser.id || apiUser.userId;
            if (!finalId) {
              console.error('NextAuth authorize error: User ID is missing from API response.');
              return null; // ID manquant, échec de l'authentification
            }

            if (!apiUser.token) {
              console.warn("NextAuth authorize: User object from API is missing 'token'. Ensure your login API returns it.");
              // Vous pourriez aussi retourner null ici si le token est absolument requis
            }

            return {
              ...apiUser,
              id: finalId, // Garanti d'être une string ici
              role: apiUser.role,
              token: apiUser.token || 'dummy-token',
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
      if (account && user) {
        token.id = user.id; // user.id est maintenant garanti d'être une string
        if (user.role) {
          token.role = user.role;
        }
        if (user.token) {
          token.accessToken = user.token;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        if (token.role) {
          session.user.role = token.role as Role;
        }
        if (token.accessToken) {
          session.accessToken = token.accessToken as string;
        }
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
