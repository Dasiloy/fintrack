import 'server-only';
import { cache } from 'react';
import { auth as _auth, handlers, signIn, signOut } from '@fintrack/next_auth';

export const auth = cache(_auth);
export { handlers, signIn, signOut };
