import { DefaultSession, User as DefaultUser } from '@/lib/auth/migration-shim';
import { Role } from '@prisma/client';
import { JWT as DefaultJWT } from '@/lib/auth/migration-shim';

declare module 'next-auth' {
    /**
     * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
     */
    interface Session {
        user: {
            id: number;
            login: string;
            role: Role;
        } & DefaultSession['user'];
        accessToken?: string;
    }

    /**
     * The shape of the user object returned in the OAuth providers' `profile` callback,
     * or the second parameter of the `session` callback, when using a database.
     * N.B.: `id` type here should match `prisma.user.id` for the authorize callback.
     */
    interface User extends DefaultUser {
        id: number;
        login: string;
        role: Role;
        token?: string;
    }
}

declare module 'next-auth/jwt' {
    /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
    interface JWT extends DefaultJWT {
        id: number;
        login: string;
        role: Role;
    }
} 