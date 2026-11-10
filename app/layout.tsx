import type { Metadata } from "next";
import { Epilogue, IBM_Plex_Mono } from "next/font/google";
import { connection } from "next/server";
import "./globals.css";

const epilogue = Epilogue({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["200", "400", "700", "900"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
});

export const metadata: Metadata = {
  title: "RASTRO — Personas Desaparecidas en México",
  description:
    "Dashboard open source de inteligencia civil para monitoreo de personas desaparecidas en México.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // La CSP de `proxy.ts` usa un nonce por petición; Next solo puede aplicarlo a
  // sus scripts si la página se renderiza en cada petición, no en el build.
  await connection();

  return (
    <html lang="es" className={`${epilogue.variable} ${ibmPlexMono.variable} h-full`}>
      <body className="min-h-full font-mono antialiased">{children}</body>
    </html>
  );
}
