import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getData } from "@/db";
import "./globals.css";

const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-serif",
});

export async function generateMetadata(): Promise<Metadata> {
  const { site } = await getData();
  return {
    title: { default: `${site.nama}, ${site.tagline}`, template: `%s · ${site.nama}` },
    description: "Kaos distro lokal: basic, graphic, oversize. Banda Aceh.",
  };
}

export const viewport: Viewport = { themeColor: "#012825" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { site } = await getData();
  return (
    <html lang="id" className={serif.variable}>
      <body>
        <Header site={site} />
        <main>{children}</main>
        <Footer site={site} />
      </body>
    </html>
  );
}
