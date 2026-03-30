import NextAuth, { type NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';

const config: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env['GOOGLE_CLIENT_ID']!,
      clientSecret: process.env['GOOGLE_CLIENT_SECRET']!,
    }),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    jwt({ token, user }) {
      if (user?.id != null) {
        token['userId'] = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (
        typeof token['userId'] === 'string' &&
        session.user != null
      ) {
        (session.user as { id?: string }).id = token['userId'];
      }
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(config);
