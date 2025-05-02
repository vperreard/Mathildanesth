import { DefaultSession } from 'next-auth';
import { Role } from '@prisma/client';

declare module 'next-auth' {
    interface Session {
        user: {
            id: string;
            role: Role;
        } & DefaultSession['user'];
        accessToken: string;
    }

    interface User {
        id: string;
        role: Role;
        token: string;
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        id: string;
        role: Role;
        accessToken: string;
    }
} 