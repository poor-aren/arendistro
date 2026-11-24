import type { Metadata } from "next";
import { ArrowUpRight, InstagramLogo, MapPin, WhatsappLogo } from "@phosphor-icons/react/dist/ssr";
import { Reveal, SplitTitle } from "@/components/Motion";
import { getData } from "@/db";
import { mapsEmbed, mapsLink, waLink } from "@/lib";

export const metadata: Metadata = { title: "Kontak" };

export default async function Kontak() {
  const { site } = await getData();
  const ROWS = [
    { Icon: WhatsappLogo, value: site.whatsapp_tampil, sub: "Pesan & tanya stok", href: waLink(site) },
    ...(site.instagram ? [{ Icon: InstagramLogo, value: site.instagram_tampil, sub: "Koleksi terbaru", href: site.instagram }] : []),
  ];
  return (
    <div className="page wrap">
      <header className="head">
        <SplitTitle text="Kontak" className="display italic" />
      </header>

      <div className="contact">
        <ul className="contacts">
          {ROWS.map(({ Icon, value, sub, href }, i) => (
            <Reveal key={value} as="li" delay={i * 0.08}>
              <a className="contact-row" href={href} target="_blank" rel="noopener">
                <Icon size={28} weight="light" className="c-icon" />
                <span>
                  <span className="c-main">{value}</span>
                  <span className="c-sub">{sub}</span>
                </span>
                <ArrowUpRight size={18} className="contact-arrow" />
              </a>
            </Reveal>
          ))}
        </ul>

        <Reveal className="map-card" delay={0.1}>
          <div className="map">
            <iframe src={mapsEmbed(site)} title={`Peta lokasi ${site.nama}`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
          </div>
          <a className="map-addr" href={mapsLink(site)} target="_blank" rel="noopener">
            <MapPin size={24} weight="light" className="c-icon" />
            <span className="c-sub">{site.alamat}</span>
            <ArrowUpRight size={18} className="contact-arrow" />
          </a>
        </Reveal>
      </div>
    </div>
  );
}
