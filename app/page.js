import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { Button } from "@/components/ui/Button"

export default async function HomePage() {
  const session = await auth()

  if (session?.user?.restaurantId) redirect("/dashboard/hoy")
  if (session?.user) redirect("/onboarding")

  return (
    <div className="bg-white text-slate-900">
      <SiteNav />
      <Hero />
      <HowItWorks />
      <Benefits />
      <Pricing />
      <FinalCta />
      <SiteFooter />
    </div>
  )
}

/* ── Navegación ─────────────────────────────────────────── */
const SiteNav = () => (
  <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/80 backdrop-blur">
    <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
      <Logo />
      <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
        <a href="#como-funciona" className="hover:text-slate-900">Cómo funciona</a>
        <a href="#ventajas" className="hover:text-slate-900">Ventajas</a>
        <a href="#precio" className="hover:text-slate-900">Precio</a>
      </nav>
      <div className="flex items-center gap-3">
        <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900">
          Entrar
        </Link>
        <Link href="/register">
          <Button size="sm">Probar gratis</Button>
        </Link>
      </div>
    </div>
  </header>
)

const Logo = () => (
  <Link href="/" className="flex items-center gap-2">
    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
      R
    </span>
    <span className="text-lg font-bold tracking-tight text-slate-900">RestoBook</span>
  </Link>
)

/* ── Hero ───────────────────────────────────────────────── */
const Hero = () => (
  <section className="relative overflow-hidden">
    <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-brand-50/60 to-white" />
    <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 lg:grid-cols-2 lg:py-28">
      <div>
        <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
          Para restaurantes · Sin comisiones por cubierto
        </span>
        <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl">
          Reservas sin
          <br className="hidden sm:block" /> complicaciones.
        </h1>
        <p className="mt-5 max-w-md text-lg text-slate-600">
          Comparte tu enlace de reservas, recíbelas las 24 horas y gestiónalo todo
          desde un panel sencillo. Menos llamadas, menos no-shows, más mesas llenas.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link href="/register">
            <Button size="lg">Empieza gratis</Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="secondary">Ya tengo cuenta</Button>
          </Link>
        </div>
        <p className="mt-4 text-sm text-slate-500">
          14 días de prueba · Configúralo en minutos · Cancela cuando quieras
        </p>
      </div>

      <HeroWidgetMock />
    </div>
  </section>
)

// Mock visual del widget de reserva (no funcional) — muestra el producto sin imágenes.
const HeroWidgetMock = () => (
  <div className="relative mx-auto w-full max-w-sm">
    <div className="absolute -inset-4 -z-10 rounded-3xl bg-brand-100/50 blur-2xl" />
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
      <div className="mb-5 flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                s === 1 ? "bg-brand-600 text-white" : "bg-slate-200 text-slate-500"
              }`}
            >
              {s}
            </div>
            {s < 3 && <div className="h-0.5 w-6 bg-slate-200" />}
          </div>
        ))}
      </div>
      <p className="text-sm font-semibold text-slate-900">Elige hora · Sábado 21 jun</p>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {["13:00", "13:30", "14:00", "14:30", "15:00", "21:00"].map((t, i) => (
          <div
            key={t}
            className={`rounded-md border py-2 text-center text-sm font-medium ${
              i === 4
                ? "border-brand-600 bg-brand-600 text-white"
                : "border-slate-200 text-slate-700"
            }`}
          >
            {t}
          </div>
        ))}
      </div>
      <div className="mt-5 rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-800">
        ✅ Mesa para 2 · 15:00 · confirmada al instante
      </div>
    </div>
  </div>
)

/* ── Cómo funciona ──────────────────────────────────────── */
const HowItWorks = () => (
  <section id="como-funciona" className="border-t border-slate-100 bg-slate-50/60">
    <div className="mx-auto max-w-6xl px-6 py-20">
      <SectionHeading
        eyebrow="Cómo funciona"
        title="Empieza a recibir reservas hoy mismo"
        subtitle="Sin instalaciones ni integraciones complicadas. En tres pasos."
      />
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {[
          {
            n: "1",
            title: "Comparte tu enlace",
            body: "Te damos una página de reservas propia y un código QR para tu mesa, web o redes.",
          },
          {
            n: "2",
            title: "Recibe reservas 24/7",
            body: "Tus clientes reservan solos, a cualquier hora, según tu disponibilidad real.",
          },
          {
            n: "3",
            title: "Gestiónalo desde el panel",
            body: "Confirma, edita o cancela, y deja que los recordatorios automáticos reduzcan los no-shows.",
          },
        ].map((step) => (
          <div key={step.n} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-base font-bold text-white">
              {step.n}
            </div>
            <h3 className="mt-4 text-lg font-semibold text-slate-900">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.body}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
)

/* ── Ventajas ───────────────────────────────────────────── */
const Benefits = () => (
  <section id="ventajas" className="mx-auto max-w-6xl px-6 py-20">
    <SectionHeading
      eyebrow="Ventajas"
      title="Todo lo que necesitas para llenar tu sala"
      subtitle="Lo esencial, sin la complejidad ni las comisiones de las grandes plataformas."
    />
    <div className="mt-12 grid gap-6 sm:grid-cols-2">
      {[
        {
          icon: "💸",
          title: "Sin comisiones por cubierto",
          body: "Una tarifa plana mensual. Lo que reservas es tuyo, no pagas por comensal.",
        },
        {
          icon: "📅",
          title: "Panel en tiempo real",
          body: "Mira el servicio de hoy de un vistazo y gestiona cada reserva al instante.",
        },
        {
          icon: "🔔",
          title: "Recordatorios automáticos",
          body: "Emails de confirmación y recordatorio que reducen las ausencias de forma notable.",
        },
        {
          icon: "📊",
          title: "Analytics de tu sala",
          body: "Horas punta, canales, ocupación y no-shows para tomar mejores decisiones.",
        },
      ].map((b) => (
        <div key={b.title} className="flex gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-2xl">{b.icon}</div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">{b.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{b.body}</p>
          </div>
        </div>
      ))}
    </div>
  </section>
)

/* ── Precio ─────────────────────────────────────────────── */
const Pricing = () => (
  <section id="precio" className="border-t border-slate-100 bg-slate-50/60">
    <div className="mx-auto max-w-6xl px-6 py-20">
      <SectionHeading
        eyebrow="Precio"
        title="Un único plan, todo incluido"
        subtitle="Empieza con 14 días de prueba. Sin permanencia."
      />
      <div className="mx-auto mt-12 max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
        <p className="text-sm font-medium text-brand-700">Plan Restaurante</p>
        <div className="mt-3 flex items-baseline gap-1">
          <span className="text-5xl font-bold tracking-tight text-slate-900">29€</span>
          <span className="text-slate-500">/ mes</span>
        </div>
        <p className="mt-2 text-sm text-slate-500">14 días gratis · IVA no incluido</p>
        <ul className="mt-6 space-y-3 text-sm text-slate-700">
          {[
            "Reservas online ilimitadas",
            "Página de reservas y código QR propios",
            "Panel de gestión en tiempo real",
            "Emails de confirmación y recordatorio",
            "Analítica de ocupación y no-shows",
            "Facturación a clientes",
          ].map((f) => (
            <li key={f} className="flex items-start gap-2">
              <span className="mt-0.5 text-brand-600">✓</span>
              <span>{f}</span>
            </li>
          ))}
        </ul>
        <Link href="/register" className="mt-8 block">
          <Button size="lg" className="w-full">Empieza tus 14 días gratis</Button>
        </Link>
      </div>
    </div>
  </section>
)

/* ── CTA final ──────────────────────────────────────────── */
const FinalCta = () => (
  <section className="bg-slate-900">
    <div className="mx-auto max-w-4xl px-6 py-20 text-center">
      <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
        Llena cada mesa, sin llamadas.
      </h2>
      <p className="mx-auto mt-4 max-w-xl text-lg text-slate-300">
        Únete a los restaurantes que gestionan sus reservas con RestoBook.
      </p>
      <div className="mt-8 flex justify-center">
        <Link href="/register">
          <Button size="lg">Crear mi cuenta gratis</Button>
        </Link>
      </div>
    </div>
  </section>
)

/* ── Footer ─────────────────────────────────────────────── */
const SiteFooter = () => (
  <footer className="border-t border-slate-100 bg-white">
    <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-10 text-sm text-slate-500 sm:flex-row">
      <Logo />
      <p>© {new Date().getFullYear()} RestoBook · Reservas para restaurantes</p>
    </div>
  </footer>
)

/* ── Auxiliar ───────────────────────────────────────────── */
const SectionHeading = ({ eyebrow, title, subtitle }) => (
  <div className="mx-auto max-w-2xl text-center">
    <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">{eyebrow}</p>
    <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{title}</h2>
    {subtitle && <p className="mt-3 text-lg text-slate-600">{subtitle}</p>}
  </div>
)
