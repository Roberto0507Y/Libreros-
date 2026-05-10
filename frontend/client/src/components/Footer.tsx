export type FooterAction =
  | 'catalog'
  | 'brands'
  | 'categories'
  | 'recent'
  | 'secure-purchase'
  | 'home-delivery'
  | 'store-pickup'
  | 'support'
  | 'register'
  | 'login'
  | 'cart'
  | 'history'
  | 'about'
  | 'contact'
  | 'policies'
  | 'terms';

type FooterProps = {
  onAction: (action: FooterAction) => void;
};

const socialLinks = [
  {
    name: 'Facebook',
    href: 'https://www.facebook.com/',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
        <path d="M22 0H2C0.895 0 0 0.895 0 2v20c0 1.105 0.895 2 2 2h11v-9h-3v-4h3V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463 0.099 2.795 0.143v3.24l-1.918 0.001c-1.504 0-1.795 0.715-1.795 1.763V11h4.44l-1 4H17v9h5c1.105 0 2-0.895 2-2V2c0-1.105-0.895-2-2-2Z" />
      </svg>
    ),
  },
  {
    name: 'Instagram',
    href: 'https://www.instagram.com/',
    icon: (
      <svg viewBox="0 0 30 30" fill="currentColor" className="h-5 w-5">
        <circle cx="15" cy="15" r="4" />
        <path d="M19.999 3h-10C6.14 3 3 6.141 3 10.001v10C3 23.86 6.141 27 10.001 27h10C23.86 27 27 23.859 27 19.999v-10C27 6.14 23.859 3 19.999 3ZM15 21c-3.309 0-6-2.691-6-6s2.691-6 6-6 6 2.691 6 6-2.691 6-6 6Zm7-12c-.552 0-1-.448-1-1s.448-1 1-1 1 .448 1 1-.448 1-1 1Z" />
      </svg>
    ),
  },
  {
    name: 'TikTok',
    href: 'https://www.tiktok.com/',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
        <path d="M14.5 2h2.2c.2 1.8 1.2 3.5 2.8 4.5 1 .7 2.1 1 3.3 1v2.6c-1.4 0-2.9-.4-4.2-1.1-.5-.3-.9-.6-1.4-.9v7.3c0 1.2-.3 2.3-.9 3.3a6.55 6.55 0 0 1-5.6 3.3A6.62 6.62 0 0 1 4 15.4c0-3.6 2.9-6.6 6.6-6.6.4 0 .8 0 1.2.1v2.7c-.4-.1-.8-.2-1.2-.2-2.2 0-4 1.8-4 4s1.8 4 4 4c1.6 0 3-1 3.6-2.4.2-.5.3-1 .3-1.6V2Z" />
      </svg>
    ),
  },
  {
    name: 'WhatsApp',
    href: 'https://wa.me/50241201592',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
        <path d="M20.52 3.48A11.84 11.84 0 0 0 12.04 0C5.49 0 .16 5.32.16 11.87c0 2.09.54 4.13 1.56 5.92L0 24l6.38-1.67a11.82 11.82 0 0 0 5.66 1.44h.01c6.54 0 11.87-5.32 11.87-11.87 0-3.17-1.24-6.14-3.4-8.42ZM12.05 21.8h-.01a9.86 9.86 0 0 1-5.03-1.37l-.36-.21-3.79.99 1.01-3.69-.24-.38a9.84 9.84 0 0 1-1.51-5.27c0-5.44 4.43-9.87 9.88-9.87 2.63 0 5.09 1.02 6.95 2.89a9.79 9.79 0 0 1 2.89 6.98c0 5.44-4.43 9.87-9.79 9.87Zm5.41-7.38c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.37-1.47-.87-.77-1.46-1.72-1.63-2.02-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.48-.5-.67-.5h-.57c-.2 0-.52.08-.8.37-.27.3-1.05 1.02-1.05 2.5s1.08 2.9 1.23 3.1c.15.2 2.13 3.25 5.17 4.56.72.31 1.28.5 1.72.64.72.23 1.38.2 1.9.12.58-.09 1.77-.72 2.02-1.42.25-.69.25-1.29.17-1.42-.07-.13-.27-.2-.57-.35Z" />
      </svg>
    ),
  },
];

const footerSections: Array<{ title: string; links: Array<{ label: string; action: FooterAction }> }> = [
  {
    title: 'Compra',
    links: [
      { label: 'Explorar catálogo', action: 'catalog' },
      { label: 'Marcas destacadas', action: 'brands' },
      { label: 'Categorías', action: 'categories' },
      { label: 'Nuevos ingresos', action: 'recent' },
    ],
  },
  {
    title: 'Servicios',
    links: [
      { label: 'Compra segura', action: 'secure-purchase' },
      { label: 'Entrega a domicilio', action: 'home-delivery' },
      { label: 'Recoge en tienda', action: 'store-pickup' },
      { label: 'Soporte', action: 'support' },
    ],
  },
  {
    title: 'Cuenta',
    links: [
      { label: 'Crear cuenta', action: 'register' },
      { label: 'Iniciar sesión', action: 'login' },
      { label: 'Carrito', action: 'cart' },
      { label: 'Historial', action: 'history' },
    ],
  },
  {
    title: 'Empresa',
    links: [
      { label: 'Sobre nosotros', action: 'about' },
      { label: 'Contacto', action: 'contact' },
      { label: 'Políticas', action: 'policies' },
      { label: 'Términos', action: 'terms' },
    ],
  },
];

export const Footer = ({ onAction }: FooterProps) => {
  return (
    <footer
      className="relative mt-16 overflow-hidden bg-[linear-gradient(180deg,#10214a_0%,#0a1530_100%)] text-white"
      id="footer-root"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.22),transparent_26%)]" />

      <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-14 md:px-6">
        <div className="grid gap-10 rounded-[36px] border border-white/10 bg-white/[0.04] px-6 py-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl lg:grid-cols-[1.15fr_1fr] lg:px-8">
          <div className="grid gap-6">
            <div className="flex items-center gap-4">
              <div className="grid h-16 w-16 place-items-center rounded-[22px] border border-white/10 bg-white/[0.08]">
                <img alt="Librería Digital" className="h-10 w-auto object-contain" src="/libreria.png" />
              </div>
              <div>
                <h3 className="text-2xl font-extrabold tracking-[-0.03em]">Librería Digital Nexus</h3>
              </div>
            </div>

            <p className="max-w-xl text-sm leading-8 text-slate-200/88">
              Plataforma moderna para explorar productos escolares, tecnología, oficina y marcas
              destacadas con una experiencia de compra rápida, segura y bien organizada.
            </p>

            <div
              className="grid gap-5 rounded-[28px] border border-white/10 bg-white/[0.05] p-5"
              id="footer-contacto"
            >
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-200">
                  Contacto
                </p>
                <div className="mt-4 grid gap-3 text-sm text-slate-200/88">
                  <p>Guatemala</p>
                  <a
                    className="transition hover:text-white"
                    href="mailto:soporte@libreriadigitalnexus.com"
                  >
                    soporte@libreriadigitalnexus.com
                  </a>
                  <a className="transition hover:text-white" href="https://wa.me/50241201592">
                    WhatsApp
                  </a>
                  <p>Lunes a sábado · 8:00 a. m. a 6:00 p. m.</p>
                </div>
              </div>

              <div className="border-t border-white/10 pt-5">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-200">
                  Redes sociales
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  {socialLinks.map((link) => (
                    <a
                      key={link.name}
                      aria-label={link.name}
                      className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-2 text-sm text-slate-100 transition hover:-translate-y-0.5 hover:bg-white/[0.10]"
                      href={link.href}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {link.icon}
                      <span>{link.name}</span>
                    </a>
                  ))}
                </div>
              </div>

              <div className="rounded-[22px] border border-sky-300/10 bg-[linear-gradient(135deg,rgba(56,189,248,0.12),rgba(99,102,241,0.08))] px-4 py-4 text-sm leading-7 text-slate-100">
                Compra segura, entrega confiable y atención personalizada.
              </div>
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-2">
            {footerSections.map((section) => (
              <div key={section.title}>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-200">
                  {section.title}
                </p>
                <ul className="mt-4 space-y-3">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <button
                        className="text-left text-sm text-slate-200/85 transition hover:text-white"
                        onClick={() => onAction(link.action)}
                        type="button"
                      >
                        {link.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-300">
            © 2026 Librería Digital Nexus. Todos los derechos reservados.
          </p>

          <p className="text-sm text-slate-400">Librería Digital Nexus</p>
        </div>
      </div>
    </footer>
  );
};
