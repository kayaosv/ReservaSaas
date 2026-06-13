import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata = {
  title: "RestoBook — Reservas sin complicaciones para tu restaurante",
  description:
    "Recibe y gestiona las reservas de tu restaurante desde un panel sencillo. Comparte tu enlace, reduce los no-shows y llena cada mesa. Prueba gratis.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="es"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>{children}</body>
    </html>
  );
}
