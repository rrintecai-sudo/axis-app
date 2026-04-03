import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-[#060f09] flex flex-col lg:flex-row">
      {/* Top/Left panel — branding */}
      <div className="flex flex-col justify-between p-8 lg:p-12 lg:w-1/2 border-b lg:border-b-0 lg:border-r border-[rgba(34,197,94,0.14)]">
        <span className="text-xl font-bold tracking-widest text-[#4ade80]">AXIS</span>

        <div className="flex flex-col gap-6 mt-6 lg:mt-0">
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[rgba(34,197,94,0.6)]">
              Bienvenido de vuelta
            </p>
            <h1 className="text-3xl lg:text-4xl font-light text-[#f0fdf4] leading-snug">
              Tu socio<br />
              <span className="italic text-[#4ade80]">te espera.</span>
            </h1>
            <p className="text-sm text-[rgba(240,253,244,0.45)] leading-relaxed max-w-xs">
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
                <span className="text-xs font-mono text-[rgba(34,197,94,0.45)] mt-0.5 w-5 shrink-0">{item.n}</span>
                <div>
                  <p className="text-sm font-medium text-[rgba(240,253,244,0.8)]">{item.t}</p>
                  <p className="text-xs text-[rgba(240,253,244,0.35)] leading-relaxed">{item.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-[rgba(240,253,244,0.2)] mt-6 lg:mt-0">Beta privada · 2025</p>
      </div>

      {/* Right panel — clerk */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10">
        <SignIn
          appearance={{
            variables: {
              colorBackground: '#0a1a0f',
              colorText: '#f0fdf4',
              colorTextSecondary: '#86efac',
              colorPrimary: '#22c55e',
              colorInputBackground: '#0f2416',
              colorInputText: '#f0fdf4',
              borderRadius: '0.5rem',
            },
            elements: {
              card: 'border border-[rgba(34,197,94,0.14)] shadow-none',
              headerTitle: 'text-[#f0fdf4]',
              headerSubtitle: 'text-[#86efac]',
              socialButtonsBlockButton: 'border-[rgba(34,197,94,0.14)] bg-[rgba(34,197,94,0.05)] hover:bg-[rgba(34,197,94,0.1)] text-[#f0fdf4]',
              formFieldInput: 'border-[rgba(34,197,94,0.14)]',
              footerAction: 'text-[#86efac]',
            },
          }}
        />
      </div>
    </div>
  );
}
