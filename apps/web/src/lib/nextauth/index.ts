import NextAuth from "next-auth";
import { cache } from "react";

import { authConfig } from "./config";

/**
 * Initialize NextAuth with our configuration
 * Returns: auth, handlers, signIn, signOut
 *
 * We rename 'auth' to 'uncachedAuth' because we'll wrap it with React's cache()
 */
const { auth: uncachedAuth, handlers, signIn, signOut } = NextAuth(authConfig);

/**
 * Wrap auth() with React's cache() for performance optimization
 *
 * Why? In Server Components, multiple components might call auth() in a single request.
 * Without cache: Each call = separate JWT verification (slow!)
 * With cache: First call verifies JWT, subsequent calls return cached result (fast!)
 *
 * Example:
 * - Page calls auth() → JWT verification (50ms)
 * - Header calls auth() → Returns cached result (0ms)
 * - Sidebar calls auth() → Returns cached result (0ms)
 *
 * Cache is automatically cleared between requests, so different users never share sessions.
 */
const auth = cache(uncachedAuth);

export { auth, handlers, signIn, signOut };
