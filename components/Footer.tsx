"use client";
import { usePathname } from "next/navigation";
import { site, waLink } from "@/lib";
import { Wordmark } from "./Header";

export default function Footer() {
  // beranda = jemuran layar penuh, tanpa footer
  if (usePathname() === "/") return null;
  return (
    <footer className="footer">
      <div className="wrap">
        <div>
          <Wordmark />
          <div className="links">
            <a className="ulink" href={waLink()} target="_blank" rel="noopener">WhatsApp</a>
            <a className="ulink" href={site.instagram} target="_blank" rel="noopener">Instagram</a>
                      </div>
          <small>© {new Date().getFullYear()} {site.nama}, Banda Aceh</small>
        </div>
      </div>
    </footer>
  );
}
