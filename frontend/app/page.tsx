import Image from "next/image";
import Link from "next/link";
import { HomeMobileMenu } from "@/components/HomeMobileMenu";

const quickLinks = [
  "Online opwaarderen",
  "Rekening betalen",
  "Mobiel internet",
  "Telesur Fiber",
  "Openstaande rekening checken",
  "MyTelesur",
];

const serviceItems = ["Prepaid", "Postpaid", "Internet voor thuis", "Support"];

const menuItems = [
  {
    label: "Huis",
    links: [
      { label: "Internet", href: "https://www.telesur.sr/internet/" },
      {
        label: "Vast bellen",
        href: "https://www.telesur.sr/huis-vast-bellen/",
      },
    ],
  },
  {
    label: "Mobiel",
    links: [
      { label: "Prepaid", href: "https://www.telesur.sr/prepaid/" },
      { label: "Postpaid", href: "https://www.telesur.sr/postpaid/" },
      {
        label: "Roaming",
        href: "https://www.telesur.sr/roaming-bellen-smsen-en-internetten/",
      },
      {
        label: "Extra diensten",
        href: "https://www.telesur.sr/extra-diensten/",
      },
    ],
  },
  {
    label: "e-Shop",
    links: [
      { label: "Telefoons", href: "https://www.telesur.sr/winkel/" },
      { label: "SIM-kaart", href: "https://www.telesur.sr/sim-kaarten/" },
      {
        label: "Reload beltegoed",
        href: "https://www.telesur.sr/reload-beltegoed/",
      },
      {
        label: "Rekening betalen",
        href: "https://www.telesur.sr/rekening-betalen/",
      },
    ],
  },
  {
    label: "Entertainment",
    links: [{ label: "Telesur+", href: "https://info.telesurplus.sr/" }],
  },
  {
    label: "Over Telesur",
    links: [
      { label: "Het bedrijf", href: "https://www.telesur.sr/het-bedrijf/" },
      {
        label: "Werken bij Telesur",
        href: "https://www.telesur.sr/werken-bij-telesur/",
      },
      {
        label: "Telesur branches",
        href: "https://www.telesur.sr/telesur-branches/",
      },
      { label: "Telesur shops", href: "https://www.telesur.sr/telesur-shops/" },
      {
        label: "Jaarverslagen",
        href: "https://www.telesur.sr/jaarverslagen/",
      },
      {
        label: "Corporate Social Responsibility",
        href: "https://www.telesur.sr/corporate-social-responsibility/",
      },
    ],
  },
];

const phoneItems = [
  {
    name: "Postpaid deal: iPhone 16 (128GB)",
    price: "SRD 20.910,31",
    image: "/image-1772929014567.png",
  },
  {
    name: "Postpaid deal: Samsung Galaxy A15",
    price: "SRD 3.465,14",
    image: "/image-1772929018550.png",
  },
  {
    name: "Postpaid deal: Samsung Galaxy A35",
    price: "SRD 5.759,30",
    image: "/image-1772929022888.png",
  },
];

const newsItems = [
  {
    title: "Openbare Aanbesteding N.V. TELESUR",
    image: "/image-1772929571902.png",
  },
  {
    title: "Artificial Intelligence (AI): The pros & cons",
    image: "/image-1772929579080.png",
  },
  {
    title: "Telesur is Suriname aan het verglazen",
    image: "/image-1772929583011.png",
  },
];

const serviceIcons = [
  "/image-1772929430589.png",
  "/image-1772929437790.png",
  "/image-1772929444477.png",
  "/image-1772929456975.png",
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#dfdfe3] text-[#090c24]">
      <section className="bg-telesur-blue text-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-2 px-4 py-1.5 text-xs">
          <div className="flex overflow-hidden rounded-sm border border-white/25">
            <button className="bg-telesur-yellow px-3 py-1 font-semibold text-[#0f0a5a] sm:px-4">
              Prive
            </button>
            <button className="px-3 py-1 text-white/85 sm:px-4">Zakelijk</button>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <a
              href="https://www.telesur.sr/contact/"
              className="rounded-sm bg-telesur-yellow px-2 py-1 font-medium text-[#0f0a5a] sm:px-3"
            >
              <span className="hidden sm:inline">Klantenservice</span>
              <span className="sm:hidden">Service</span>
            </a>
            <a
              href="https://my.telesur.sr:15943/auth/realms/CERPROD_SELF/protocol/openid-connect/auth?client_id=selfserviceauth&redirect_uri=https%3A%2F%2Fmy.telesur.sr%2F&state=bc167835-a010-489f-98d6-998bdd04905e&response_mode=fragment&response_type=code&scope=openid&nonce=45c2ddeb-ddd2-47f9-8aec-66552cfe6cb1"
              className="rounded-sm bg-telesur-yellow px-3 py-1 font-medium text-[#0f0a5a]"
            >
              My Telesur
            </a>
          </div>
        </div>
      </section>

      <section className="bg-telesur-blue text-white shadow-sm">
        <div className="relative mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center">
            <Image
              src="/image-1772928438572.png"
              alt="Telesur - Keeping us in touch"
              width={183}
              height={56}
              className="h-auto w-[160px] sm:w-[183px]"
              priority
            />
          </div>

          <div className="hidden items-center gap-2 text-sm font-medium md:flex">
            {menuItems.map((item) => (
              <div key={item.label} className="group relative">
                <button className="px-3 py-2 transition group-hover:bg-telesur-yellow group-hover:text-telesur-blue">
                  {item.label}
                </button>
                <div className="invisible absolute left-0 top-full z-30 min-w-[220px] translate-y-1 bg-telesur-blue opacity-0 shadow-lg transition duration-150 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                  {item.links.map((menuLink) => (
                    <a
                      key={menuLink.label}
                      href={menuLink.href}
                      className="block whitespace-nowrap px-4 py-3 text-[14px] text-white transition hover:bg-telesur-yellow hover:text-telesur-blue"
                    >
                      {menuLink.label}
                    </a>
                  ))}
                </div>
              </div>
            ))}
            <Link
              href="/chat"
              className="ml-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs text-white transition hover:bg-white hover:text-telesur-blue"
            >
              TeleBot Chat
            </Link>
            <span className="px-2 text-xl">⌕</span>
            <span className="px-2 text-xl">🛒</span>
          </div>

          <HomeMobileMenu menuItems={menuItems} />
        </div>
      </section>

      <section className="bg-telesur-yellow">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-14 md:grid-cols-2 md:items-center md:py-16">
          <div className="animate-slide-up">
            <h1 className="font-display text-4xl font-bold text-telesur-blue sm:text-5xl">
              Meer data voor jou!
            </h1>
            <p className="mt-2 text-2xl font-medium text-telesur-blue">
              Ervaar high-speed mobiel internet
            </p>
            <a
              href="https://www.telesur.sr/prepaid/"
              className="mt-7 inline-flex rounded-full bg-telesur-blue px-9 py-3 text-sm font-semibold text-white transition hover:bg-telesur-blue-light"
            >
              Klik hier
            </a>
          </div>

          <div className="relative h-64 overflow-hidden rounded-2xl md:h-72">
            <Image
              src="/image-1772929154080.png"
              alt="Hero campaign"
              fill
              className="object-contain object-center"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        </div>
      </section>

      <section className="bg-[#dfdfe3] py-14">
        <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-lg bg-[#dfdfe3] p-6">
            <h2 className="font-display text-4xl font-semibold text-[#080b25]">
              Waar ben je naar op zoek?
            </h2>
            <div className="mt-7 grid gap-0 border-t border-[#c9c9d2] text-base text-telesur-blue sm:grid-cols-2">
              {quickLinks.map((item) => (
                <a
                  key={item}
                  href="#"
                  className="flex items-center justify-between border-b border-[#c9c9d2] px-1 py-4 font-medium transition hover:pl-2"
                >
                  <span>{item}</span>
                  <span className="text-telesur-yellow-dark">&rarr;</span>
                </a>
              ))}
            </div>
          </div>

          <div className="relative mx-auto aspect-square w-full max-w-[576px] overflow-hidden rounded-sm">
            <Image
              src="/image-1772929174882.png"
              alt="Openstaande saldo nodig"
              fill
              className="object-contain"
              sizes="(max-width: 1024px) 100vw, 40vw"
            />
          </div>
        </div>
      </section>

      <section className="bg-[#dfdfe3] pb-14">
        <div className="mx-auto w-full max-w-6xl px-4">
          <div className="relative aspect-[1362/400] overflow-hidden rounded-sm">
            <Image
              src="/image-1772929343631.png"
              alt="Total solutions"
              fill
              className="object-contain"
              sizes="100vw"
            />
          </div>

          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {serviceItems.map((item, idx) => (
              <div key={item} className="text-center">
                <div className="mx-auto h-40 w-40 rounded-full bg-[#efe8b3] p-4 shadow-sm">
                  <div className="h-full w-full overflow-hidden rounded-full bg-telesur-yellow">
                    <Image
                      src={serviceIcons[idx]}
                      alt={`${item} icon`}
                      width={512}
                      height={512}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>
                <p className="mt-5 text-lg font-medium text-[#0b0f2f]">{item}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 grid gap-4 rounded-sm bg-telesur-yellow p-6 md:grid-cols-[0.9fr_1fr_1fr_auto] md:items-end">
            <div>
              <h3 className="font-display text-5xl font-bold leading-[0.92] text-telesur-blue">
                Online opwaarderen
              </h3>
              <p className="mt-3 text-base text-[#0f0a5a]">Veilig en betrouwbaar met UNI5pay+</p>
            </div>
            <label className="text-sm font-semibold text-[#0f0a5a]">
              Bedrag
              <input
                type="text"
                placeholder="Max. SRD 1000 per keer"
                className="mt-2 w-full rounded-lg border border-[#cfc37a] bg-white px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm font-semibold text-[#0f0a5a]">
              Telefoonnummer
              <input
                type="text"
                placeholder="Voer uw telefoonnummer in"
                className="mt-2 w-full rounded-lg border border-[#cfc37a] bg-white px-3 py-2 text-sm"
              />
            </label>
            <button className="h-12 rounded-full bg-telesur-blue px-8 text-sm font-semibold text-white transition hover:bg-telesur-blue-light">
              Bestel
            </button>
          </div>
        </div>
      </section>

      <section className="bg-[#d8d8e2] py-14">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 md:grid-cols-2 md:items-center">
          <div>
            <h3 className="font-display text-5xl font-bold leading-[0.95] text-[#060a24]">
              Entertainment on demand!
            </h3>
            <p className="mt-4 max-w-lg text-lg leading-relaxed text-[#1f2140]">
              Telesur+ is Suriname&apos;s alles-in-een streamingplatform waar lokaal talent en internationaal topentertainment samenkomen.
            </p>
            <p className="mt-4 text-base font-medium text-[#1f2140]">Startend vanaf SRD 65.18</p>
            <button className="mt-6 rounded-full bg-telesur-blue px-8 py-3 text-sm font-semibold text-white transition hover:bg-telesur-blue-light">
              Klik hier
            </button>
          </div>

          <div className="relative min-h-[300px] overflow-hidden rounded-sm">
            <Image
              src="/image-1772929002512.png"
              alt="Telesur entertainment"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
        </div>
      </section>

      <section className="bg-[#dfdfe3] py-14">
        <div className="mx-auto w-full max-w-6xl px-4">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="font-display text-5xl font-bold text-[#080b25]">Bekijk onze smartphones</h3>
            <div className="flex items-center gap-3 text-3xl text-[#0f0a5a]">
              <button className="h-9 w-9 rounded-full border border-[#9f9fb6]">&lsaquo;</button>
              <button className="h-9 w-9 rounded-full border border-[#9f9fb6]">&rsaquo;</button>
            </div>
          </div>

          <div className="grid gap-7 md:grid-cols-3">
            {phoneItems.map((phone) => (
              <article key={phone.name} className="text-center">
                <div className="mx-auto flex h-80 w-full max-w-[290px] items-center justify-center overflow-hidden rounded-3xl bg-transparent">
                  <Image
                    src={phone.image}
                    alt={phone.name}
                    width={1000}
                    height={1000}
                    className="h-full w-full object-contain"
                  />
                </div>
                <p className="mt-4 text-2xl font-medium text-[#121533]">{phone.name}</p>
                <p className="mt-1 text-lg text-[#30335d]">{phone.price}</p>
              </article>
            ))}
          </div>

          <div className="mt-14 text-center">
            <button className="rounded-full bg-telesur-blue px-8 py-3 text-sm font-semibold text-white">
              Alle smartphones
            </button>
            <button className="ml-3 rounded-full border border-telesur-blue px-8 py-3 text-sm font-semibold text-telesur-blue">
              SIM kaarten
            </button>
          </div>
        </div>
      </section>

      <section className="bg-[#dfdfe3] pb-14">
        <div className="mx-auto w-full max-w-6xl px-4">
          <h3 className="font-display text-5xl font-bold text-[#080b25]">Het laatste Telesur nieuws</h3>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {newsItems.map((item) => (
              <article key={item.title} className="overflow-hidden rounded-sm bg-[#e9e9f0]">
                <div className="relative h-44">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 33vw"
                  />
                </div>
                <div className="p-5 text-xl font-semibold text-[#101335]">{item.title}</div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-telesur-blue pb-16 pt-12 text-white">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 md:grid-cols-[1.2fr_1fr_1fr_1fr]">
          <div>
            <h4 className="font-display text-4xl font-semibold">Download MyTelesur</h4>
            <div className="mt-5 flex gap-3">
              <a
                href="https://play.google.com/store/apps/details?id=com.cerillion.selfservice.telesurapp&hl=en&pli=1"
                aria-label="Download on Google Play"
                className="block"
              >
                <Image
                  src="/image-1772937125095.png"
                  alt="Download on Google Play"
                  width={146}
                  height={45}
                  className="h-auto w-[146px]"
                />
              </a>
              <a
                href="https://apps.apple.com/gy/app/my-telesur/id6451263674"
                aria-label="Download on the App Store"
                className="block"
              >
                <Image
                  src="/image-1772937128646.png"
                  alt="Download on the App Store"
                  width={146}
                  height={45}
                  className="h-auto w-[146px]"
                />
              </a>
            </div>
            <a 
              href="https://www.telesur.sr/wp-content/uploads/2024/11/BTW_Certificaat___TELECOMMUNICATIEBEDRIJF_SURINAME.pdf" 
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-block rounded-full border border-white/70 px-6 py-2 text-sm hover:bg-white/10 transition-colors"
            >
              BTW-certificaat
            </a>
          </div>
          <div>
            <p className="text-lg font-semibold">Thuis</p>
            <ul className="mt-3 space-y-2 text-sm text-white/80">
              <li>
                <a href="https://www.telesur.sr/internet/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  Internet
                </a>
              </li>
              <li>
                <a href="https://www.telesur.sr/huis-vast-bellen/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  Vast Bellen
                </a>
              </li>
            </ul>
            <p className="mt-6 text-lg font-semibold">Telesur</p>
            <ul className="mt-3 space-y-2 text-sm text-white/80">
              <li>
                <a href="https://www.telesur.sr/het-bedrijf/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  Over ons
                </a>
              </li>
              <li>
                <a href="https://www.telesur.sr/werken-bij-telesur/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  Werken bij Telesur
                </a>
              </li>
              <li>
                <a href="https://www.telesur.sr/corporate-social-responsibility/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  CSR
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-lg font-semibold">Mobiel</p>
            <ul className="mt-3 space-y-2 text-sm text-white/80">
              <li>
                <a href="https://www.telesur.sr/prepaid/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  Prepaid
                </a>
              </li>
              <li>
                <a href="https://www.telesur.sr/postpaid/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  Postpaid
                </a>
              </li>
              <li>
                <a href="https://www.telesur.sr/roaming-bellen-smsen-en-internetten/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  Roaming
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-lg font-semibold">e-Shop</p>
            <ul className="mt-3 space-y-2 text-sm text-white/80">
              <li>
                <a href="https://www.telesur.sr/winkel/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  Telefoons
                </a>
              </li>
              <li>
                <a href="https://www.telesur.sr/sim-kaarten/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  SIM-kaarten
                </a>
              </li>
              <li>
                <a href="https://www.telesur.sr/rekening-betalen/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  Rekening betalen
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mx-auto mt-10 w-full max-w-6xl border-t border-white/20 px-4 pt-6 text-sm text-white/70">
          <p>2026 © Telesur | Alle rechten voorbehouden</p>
        </div>
      </footer>
    </main>
  );
}
