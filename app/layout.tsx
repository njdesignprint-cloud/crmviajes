import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://travelclientpro.com"),
  applicationName: "TravelClientPro",
  title: "TravelClientPro — Operación profesional para agencias de viajes",
  description: "Clientes, cotizaciones, viajes, pagos y seguimiento para agencias de viajes.",
  alternates: { canonical: "/" },
  icons: {
    icon: "/favicon.svg?v=2",
    shortcut: "/favicon.svg?v=2",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer /></body>
    </html>
  );
}
