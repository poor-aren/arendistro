import type { Metadata } from "next";
import { ArrowUpRight, InstagramLogo, MapPin, WhatsappLogo } from "@phosphor-icons/react/dist/ssr";
import { Reveal, SplitTitle } from "@/components/Motion";
import { getData } from "@/db";
import { mapsEmbed, mapsLink, waLink } from "@/lib";

export const metadata: Metadata = { title: "Kontak" };

export default async function Kontak() {
  const { site } = await getData();
  return (
    <div className="page wrap">
      <header className="head">
        <SplitTitle text="Kontak" className="display italic" />
      </header>

      <div className="contact">
        <div className="contact-info">
          {/* WhatsApp = jalur utama pemesanan, jadi nomornya dibuat paling besar */}
          <Reveal>
            <a className="wa-hero" href={waLink(site)} target="_blank" rel="noopener">
              <span className="wa-label caps"><WhatsappLogo size={18} /> WhatsApp</span>
              <span className="wa-num">{site.whatsapp_tampil}</span>
              <span className="wa-sub">Pesan &amp; tanya stok <ArrowUpRight size={16} className="contact-arrow" /></span>
            </a>
          </Reveal>

          {site.instagram && (
            <Reveal delay={0.1}>
              <a className="contact-row" href={site.instagram} target="_blank" rel="noopener">
                <InstagramLogo size={26} weight="light" className="c-icon" />
                <span>
                  <span className="c-main">{site.instagram_tampil}</span>
                  <span className="c-sub">Koleksi terbaru</span>
                </span>
                <ArrowUpRight size={18} className="contact-arrow" />
              </a>
            </Reveal>
          )}
        </div>

        <Reveal className="map-card" delay={0.15}>
          <div className="map">
            <iframe src={mapsEmbed(site)} title={`Peta lokasi ${site.nama}`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
          </div>
          <a className="map-addr" href={mapsLink(site)} target="_blank" rel="noopener">
            <MapPin size={24} weight="light" className="c-icon" />
            <span>
              <span className="c-main small">{site.alamat}</span>
              <span className="c-sub">Buka di Google Maps</span>
            </span>
            <ArrowUpRight size={18} className="contact-arrow" />
          </a>
        </Reveal>
      </div>
    </div>
  );
}
