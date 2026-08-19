import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import NavBar from "@/components/navBar";

export const metadata: Metadata = {
  title: "Elite | Cinema & Eventos",
  description: "Sistema de ingressos e eventos em uma paleta elegante em creme",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="bg-[#F9F6F0] text-stone-900 antialiased min-h-screen flex flex-col">
        <AuthProvider>
          <NavBar />
          <div className="flex-1">{children}</div>
        </AuthProvider>
      </body>
    </html>
  );
}