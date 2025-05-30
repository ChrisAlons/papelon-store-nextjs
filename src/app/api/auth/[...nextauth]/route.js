import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import prisma from '@/lib/prisma'; // Importar la instancia centralizada de Prisma
import bcrypt from 'bcryptjs';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: "Username", type: "text", placeholder: "tu_usuario" },
        password: { label: "Password", type: "password" }
      },      async authorize(credentials) {
        if (!credentials || !credentials.username || !credentials.password) {
          return null;
        }

        try {
          const user = await prisma.user.findUnique({
            where: { username: credentials.username },
          });

          if (user) {
            const passwordsMatch = bcrypt.compareSync(credentials.password, user.password);

            if (passwordsMatch) {
              return {
                id: user.id,
                username: user.username,
                email: user.username, // use username as email fallback
                role: user.role,
              };
            }
          }
          return null; // Login fallido
        } catch (error) {
          console.error("Error during authorization:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.username = user.username;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.name = token.username;
        session.user.email = token.email ?? token.username;
      }
      return session;
    },  },
  pages: {
    signIn: '/login', // Página de login personalizada
    signOut: '/login', // Redirect to login after sign out
    error: '/login', // Error pages redirect to login
  },
  session: {
    strategy: 'jwt', // Usar JWT para sesiones
    maxAge: 24 * 60 * 60, // 24 horas
  },
  jwt: {
    maxAge: 24 * 60 * 60, // 24 horas para JWT
  },
  secret: process.env.NEXTAUTH_SECRET, // Secret para firmar JWT
}; // Corregido: Terminar el objeto authOptions con };

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }; // Exportaciones correctas para App Router

