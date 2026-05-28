// Edge-compatible auth config (no Node.js imports like PrismaClient)
const authConfig = {
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.restaurantId = user.restaurantId
        token.subscriptionStatus = user.subscriptionStatus
      }
      return token
    },
    session({ session, token }) {
      session.user.id = token.id
      session.user.role = token.role
      session.user.restaurantId = token.restaurantId
      session.user.subscriptionStatus = token.subscriptionStatus
      return session
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: { strategy: "jwt" },
}

export default authConfig
