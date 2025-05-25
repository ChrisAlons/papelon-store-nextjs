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
      },
      async authorize(credentials) {
        console.log("Authorize function called with credentials:", credentials);

        if (!credentials || !credentials.username || !credentials.password) {
          console.log("Missing credentials");
          return null;
        }

        try {
          const user = await prisma.user.findUnique({
            where: { username: credentials.username },
          });
          console.log("User found in DB:", user);

          if (user) {
            const passwordsMatch = bcrypt.compareSync(credentials.password, user.password);
            console.log("Passwords match:", passwordsMatch);

            if (passwordsMatch) {
              console.log("Login successful, returning user data");
              return {
                id: user.id,
                username: user.username,
                email: user.username, // use username as email fallback
                role: user.role,
              };
            }
          }
          console.log("Login failed: User not found or password incorrect");
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
    },
  },
  pages: {
    signIn: '/login', // Corregido a nuestra página de login personalizada
    // error: '/auth/error', // Puedes definir una página de error personalizada si lo deseas
  },
  session: {
    strategy: 'jwt', // Especificar la estrategia de sesión como JWT
  },
  secret: process.env.NEXTAUTH_SECRET, // Asegúrate de que esta variable de entorno esté configurada
}; // Corregido: Terminar el objeto authOptions con };

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }; // Exportaciones correctas para App Router

