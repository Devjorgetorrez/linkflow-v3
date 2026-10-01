/**
 * app/api/auth/[...nextauth]/route.ts
 * Apenas exporta GET e POST — nada mais pode ser exportado daqui
 * no Next.js App Router. A configuração fica em lib/auth-options.ts.
 */

import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth-options";

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
