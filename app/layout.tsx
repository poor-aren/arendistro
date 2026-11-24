import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { site } from "@/lib";
import "./globals.css";

const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-serif",
});

export const metadata: Metadata = {
  title: { default: `${site.nama}, ${site.tagline}`, template: `%s · ${site.nama}` },
  description: "Kaos distro lokal: basic, graphic, oversize. Banda Aceh.",
};

export const viewport: Viewport = { themeColor: "#012825" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={serif.variable}>
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
