"use client";
import { usePathname } from "next/navigation";
import { waLink, type Site } from "@/lib";
import { Wordmark } from "./Header";

export default function Footer({ site }: { site: Site }) {
  // beranda = jemuran layar penuh, tanpa footer; admin punya tampilan sendiri
  const path = usePathname();
  if (path === "/" || path.startsWith("/admin")) return null;
  return (
    <footer className="footer">
      <div className="wrap">
        <div>
          <Wordmark site={site} />
          <div className="links">
            <a className="ulink" href={waLink(site)} target="_blank" rel="noopener">WhatsApp</a>
            <a className="ulink" href={site.instagram} target="_blank" rel="noopener">Instagram</a>
          </div>
          <small>© {new Date().getFullYear()} {site.nama}, Banda Aceh</small>
        </div>
      </div>
    </footer>
  );
}
