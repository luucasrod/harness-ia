import { permanentRedirect } from 'next/navigation';

/**
 * `/auth/login` is the URL the middleware, the NextAuth config and the top nav
 * all link to, but the login experience lives in `app/(auth)/login/page.tsx`
 * (served at `/login`). This file used to hold a placeholder page that shadowed
 * the real one, so it now forwards to it.
 */
export default function LoginAliasPage() {
  permanentRedirect('/login');
}
