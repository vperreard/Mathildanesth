import { User } from './user';
import 'next-auth';

declare module 'next-auth' {
    interface Session {
        user: User;
    }
} 