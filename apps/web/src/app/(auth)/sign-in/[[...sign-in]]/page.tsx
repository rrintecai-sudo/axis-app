import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-[#080808] flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 border-r border-white/[0.06]">
        <span className="text-2xl font-bold tracking-widest text-indigo-400">AXIS</span>

        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-indigo-400/70">
              Bienvenido de vuelta
            </p>
            <h1 className="text-4xl font-light text-white leading-snug">
              Tu socio<br />
              <span className="italic text-indigo-300">te espera.</span>
            </h1>
            <p className="text-sm text-white/40 leading-relaxed max-w-xs">
              AXIS recuerda todo lo que conversaron. Entra a tu dashboard y sigue donde lo dejaste.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {[
              { n: '01', t: 'Guía del día', d: 'Cada mañana las 3 cosas más importantes que debes hacer hoy.' },
              { n: '02', t: 'Siempre disponible', d: 'Cuando no sabes por dónde empezar, escríbele. Está ahí.' },
              { n: '03', t: 'Aprende de ti', d: 'Cada noche un cierre. AXIS mejora contigo día a día.' },
            ].map((item) => (
              <div key={item.n} className="flex gap-4 items-start">
                <span className="text-xs font-mono text-indigo-400/50 mt-0.5 w-5 shrink-0">{item.n}</span>
                <div>
                  <p className="text-sm font-medium text-white/80">{item.t}</p>
                  <p className="text-xs text-white/35 leading-relaxed">{item.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-white/20">Beta privada · 2025</p>
      </div>

      {/* Right panel — clerk */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 gap-8">
        <div className="lg:hidden">
          <span className="text-2xl font-bold tracking-widest text-indigo-400">AXIS</span>
        </div>
        <SignIn
          appearance={{
            variables: {
              colorBackground: '#111111',
              colorText: '#F5F5F5',
              colorTextSecondary: '#71717A',
              colorPrimary: '#6366F1',
              colorInputBackground: '#1A1A1A',
              colorInputText: '#F5F5F5',
              borderRadius: '0.5rem',
            },
            elements: {
              card: 'border border-white/[0.08] shadow-none',
              headerTitle: 'text-[#F5F5F5]',
              headerSubtitle: 'text-[#71717A]',
              socialButtonsBlockButton: 'border-white/[0.08] bg-white/5 hover:bg-white/10 text-[#F5F5F5]',
              formFieldInput: 'border-white/[0.08]',
              footerAction: 'text-[#71717A]',
            },
          }}
        />
      </div>
    </div>
  );
}
