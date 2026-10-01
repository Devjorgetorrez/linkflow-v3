import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";

import { StoreProvider } from "@/lib/store";
import { AuthProvider } from "@/components/AuthProvider";
import "./globals.css";

// Fonte da marca do painel (wordmark "SiteFlow" na sidebar) — auto-hospedada
// pelo Next.js, sem chamada externa em runtime. Alimenta --font-marca, NUNCA
// --font-display: esse token é do cliente (tela Aparência > Personalizar,
// aplicado por cima via JS em lib/store.tsx) — reusar o mesmo nome faria a
// marca do painel mudar de fonte junto com a fonte que o cliente escolhe
// para o site dele.
const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-marca",
});

export const metadata: Metadata = {
  title: "SiteFlow — Painel",
  description: "Painel de gestão SiteFlow.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" data-theme="light" className={dmSans.variable}>
      <body>
        <AuthProvider>
          <StoreProvider>{children}</StoreProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
