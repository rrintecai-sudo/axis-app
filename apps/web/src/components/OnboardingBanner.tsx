import Link from 'next/link';

export default function OnboardingBanner() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
      padding: '14px 20px',
      borderRadius: 12,
      background: 'rgba(34,197,94,0.07)',
      border: '1px solid rgba(34,197,94,0.25)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 18, flexShrink: 0 }}>📱</span>
        <div>
          <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: '#f0fdf4' }}>
            Conecta tu WhatsApp para activar AXIS
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: 'rgba(240,253,244,0.45)' }}>
            Sin tu número, AXIS no puede enviarte la guía del día ni reconocerte cuando le escribas.
          </p>
        </div>
      </div>
      <Link
        href="/onboarding"
        style={{
          flexShrink: 0,
          padding: '8px 18px',
          borderRadius: 8,
          background: '#22c55e',
          color: '#000',
          fontSize: 13,
          fontWeight: 700,
          textDecoration: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        Conectar →
      </Link>
    </div>
  );
}
