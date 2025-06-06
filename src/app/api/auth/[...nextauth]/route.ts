import NextAuth from 'next-auth/next';
import { authOptions } from '@/lib/auth/migration-shim';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
