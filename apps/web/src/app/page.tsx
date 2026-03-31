import ScrollReveal from '@/components/ScrollReveal';

const WA_NUMBER = '15551534745';
const WA_LINK = `https://wa.me/${WA_NUMBER}`;

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width={18} height={18} style={{ flexShrink: 0 }}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.557 4.126 1.528 5.858L.057 23.882l6.197-1.448A11.935 11.935 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.81 9.81 0 01-5.002-1.368l-.358-.213-3.722.869.936-3.625-.234-.373A9.818 9.818 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z" />
  </svg>
);

export default function HomePage() {
  return (
    <ScrollReveal>
      {/* NAV */}
      <nav>
        <div className="logo">AXIS</div>
        <div className="nav-pill">Beta privada · Solo invitados</div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-orb" />
        <div className="hero-grid" />
        <div className="hero-rule t" />
        <div className="hero-rule b" />

        <div className="eyebrow">Presentando AXIS</div>

        <h1 className="hero-title">
          Tu socio
          <span className="g">de vida.</span>
        </h1>

        <p className="hero-sub">No una app. No un bot. Alguien que piensa contigo.</p>

        <div className="hero-card">
          <p>
            <strong>Cada mañana sabes exactamente qué hacer.</strong>
            <br />
            Cada noche sabes si avanzaste.
            <br />
            Y cuando no sabes por dónde empezar — escríbele. Está ahí. Siempre.
          </p>
        </div>

        <div className="ctas">
          <a href={WA_LINK} className="cta" target="_blank" rel="noopener noreferrer">
            <WhatsAppIcon />
            Comenzar en WhatsApp
          </a>
          <span className="cta-note">Gratis durante la beta · Solo para invitados</span>
        </div>
      </section>

      {/* BANNER */}
      <div className="banner">
        <p>
          Estás viendo la <strong>beta privada de AXIS</strong>. Esta versión funciona 100% por
          WhatsApp. El dashboard web llega en la próxima versión.
        </p>
      </div>

      {/* EL PROBLEMA */}
      <div className="sec">
        <div className="lbl r">El problema</div>
        <h2 className="ttl r">
          Ocupado no es
          <br />
          <i>lo mismo que avanzar.</i>
        </h2>
        <p className="prose r">
          Tienes tareas en cinco apps, un calendario a punto de explotar, y al final del día la
          sensación de que corriste mucho sin llegar a ningún lado. No te falta disciplina. Te falta
          dirección.
          <br />
          <br />
          AXIS no te da más herramientas. Te ayuda a pensar.
        </p>
      </div>

      {/* CAPACIDADES */}
      <div className="sec" style={{ paddingTop: 0 }}>
        <div className="lbl r">Lo que hace AXIS</div>
        <h2 className="ttl r">
          Cinco formas de
          <br />
          <i>acompañarte.</i>
        </h2>
        <div className="caps r">
          {[
            {
              n: '01',
              t: 'Guía del día',
              d: 'Cada mañana recibes las 3 cosas más importantes que debes hacer hoy, basadas en quién eres y lo que realmente importa en tu vida.',
              tag: '7am · todos los días',
            },
            {
              n: '02',
              t: 'Siempre disponible',
              d: 'Cuando no sabes por dónde empezar o tienes demasiado en la cabeza, escríbele. AXIS no te pregunta qué quieres — te ayuda a decidir.',
              tag: 'Cualquier momento',
            },
            {
              n: '03',
              t: 'Tu espacio para pensar',
              d: 'Cuéntale lo que tienes en mente — una decisión, una preocupación, una idea. AXIS escucha, organiza y te devuelve claridad.',
              tag: 'Conversación libre',
            },
            {
              n: '04',
              t: 'Cierre del día',
              d: 'Cada noche una reflexión rápida: qué lograste, qué quedó pendiente, qué aprendiste. AXIS aprende de tu día para mejorar el siguiente.',
              tag: 'Noche · todos los días',
            },
            {
              n: '05',
              t: 'Te cuida la espalda',
              d: 'Cuando detecta que estás descuidando algo importante — familia, salud, lo que sea — te lo dice. Sin juzgar. Solo recordándote lo que importa.',
              tag: 'Proactivo',
            },
          ].map((c) => (
            <div className="cap" key={c.n}>
              <div className="cap-n">{c.n}</div>
              <div className="cap-t">{c.t}</div>
              <div className="cap-d">{c.d}</div>
              <div className="cap-tag">{c.tag}</div>
            </div>
          ))}
        </div>
      </div>

      {/* RITMO DEL DÍA */}
      <div className="rhythm-wrap">
        <div className="rhythm-inner">
          <div className="lbl r">El ritmo</div>
          <h2 className="ttl r">
            Así se siente un día
            <br />
            <i>con AXIS.</i>
          </h2>
          <div className="rhythm-cols r">
            <div className="rcol">
              <div className="rtime">7am</div>
              <div className="rt">Tu guía del día llega sola</div>
              <div className="rd">Sin que tengas que pedir nada. AXIS ya sabe lo que importa.</div>
              <div className="bubbles">
                <div className="bub a">
                  Buenos días, Oscar. Hoy lo más importante: 1) Llamar a Kike sobre el lanzamiento,
                  2) Revisar el contrato pendiente, 3) 30 min de ejercicio — llevas 4 días sin
                  hacerlo.
                </div>
              </div>
            </div>
            <div className="rcol">
              <div className="rtime">2pm</div>
              <div className="rt">Saturado. Le escribes.</div>
              <div className="rd">
                No te pregunta qué quieres. Piensa contigo y te da un paso concreto.
              </div>
              <div className="bubbles">
                <div className="bub">Tengo mil cosas y no sé por dónde empezar</div>
                <div className="bub a">
                  Empieza por la llamada con Kike. Es la que más desbloquea hoy. Las demás pueden
                  esperar hasta las 4pm. ¿Lo haces ahora?
                </div>
              </div>
            </div>
            <div className="rcol">
              <div className="rtime">10pm</div>
              <div className="rt">Cierre. Reflexión rápida.</div>
              <div className="rd">AXIS aprende de tu día para que mañana sea mejor.</div>
              <div className="bubbles">
                <div className="bub a">
                  ¿Cómo estuvo el día? Cuéntame qué lograste y qué quedó pendiente.
                </div>
                <div className="bub">Hablé con Kike. El ejercicio no lo hice.</div>
                <div className="bub a">
                  Anotado. Mañana lo agendo temprano, antes de que empiece el día.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ONBOARDING */}
      <div className="sec">
        <div className="lbl r">El proceso</div>
        <h2 className="ttl r">
          Antes de ayudarte,
          <br />
          <i>te conoce.</i>
        </h2>
        <p className="prose r">
          La primera vez que escribes, AXIS pasa 5 minutos conociéndote. No es un formulario — es
          una conversación.
        </p>
        <div className="ob r">
          {[
            {
              n: '1',
              lbl: 'Bienvenida',
              txt: <span>AXIS se presenta y te explica exactamente qué puede hacer por ti. Sin rodeos. Sin promesas vacías.</span>,
            },
            {
              n: '2',
              lbl: 'Áreas de vida',
              txt: <span>AXIS te muestra las áreas más comunes — <strong>fe, matrimonio, familia, trabajo, dinero, salud, crecimiento</strong> — y tú dices cuáles son activas. Puedes agregar las tuyas.</span>,
            },
            {
              n: '3',
              lbl: 'Una meta por área',
              txt: <span>Para cada área, AXIS te pide <strong>una sola cosa</strong> que necesita avanzar en los próximos 90 días. Esto guía todas las recomendaciones.</span>,
            },
            {
              n: '4',
              lbl: 'La pregunta honesta',
              txt: <span>AXIS te pregunta qué área has estado descuidando más. <strong>Esta respuesta importa.</strong> No te dejará ignorarla.</span>,
            },
            {
              n: '5',
              lbl: 'Tu hora',
              txt: <span>¿A qué hora quieres recibir tu guía del día? Eso es todo. AXIS tiene lo que necesita para empezar.</span>,
            },
          ].map((row) => (
            <div className="ob-row" key={row.n}>
              <div className="ob-n">{row.n}</div>
              <div className="ob-c">
                <div className="ob-lbl">{row.lbl}</div>
                <div className="ob-txt">{row.txt}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SCOPE */}
      <div className="scope-wrap">
        <div className="scope-inner">
          <div className="lbl r">Beta privada — qué incluye</div>
          <h2 className="ttl r">
            Esta versión es
            <br />
            <i>deliberadamente simple.</i>
          </h2>
          <p className="prose r" style={{ marginBottom: 0 }}>
            Lo que tienes hoy es el núcleo — la conversación. Todo lo demás viene después.
          </p>
          <div className="scope-cols r">
            <div className="scol y-col">
              <div className="scol-h y">Disponible hoy</div>
              <ul className="slist">
                {[
                  'Onboarding completo por WhatsApp',
                  'Guía del día personalizada cada mañana',
                  'Conversación libre durante el día',
                  'Cierre nocturno con reflexión',
                  'Recordatorios de compromisos importantes',
                  'Detección de áreas descuidadas',
                  'Memoria de conversaciones anteriores',
                ].map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="scol n-col">
              <div className="scol-h n">Próxima versión</div>
              <ul className="slist">
                {[
                  'Dashboard web para ver tu vida completa',
                  'Historial de guías y reflexiones',
                  'Análisis semanal automático',
                  'Modo verdad — feedback sin filtros',
                  'Integración con Google Calendar',
                  'Métricas de progreso por área',
                  'App móvil nativa',
                ].map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* FINAL CTA */}
      <section className="final">
        <div className="final-orb" />
        <h2 className="final-title r">
          ¿Listo para
          <br />
          <i>probarlo?</i>
        </h2>
        <p className="final-sub r">
          Beta privada. Solo invitados. Tu feedback va a dar forma al producto final.
        </p>
        <div className="ctas r">
          <a href={WA_LINK} className="cta" target="_blank" rel="noopener noreferrer">
            <WhatsAppIcon />
            Comenzar en WhatsApp
          </a>
          <span className="cta-note">Abre WhatsApp directamente · Gratis durante la beta</span>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="f-logo">AXIS</div>
        <div className="f-note">Beta privada · Solo invitados · 2025</div>
      </footer>
    </ScrollReveal>
  );
}
