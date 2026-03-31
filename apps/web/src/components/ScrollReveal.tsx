'use client';

import { useEffect, useRef } from 'react';

export default function ScrollReveal({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e, i) => {
          if (e.isIntersecting) {
            setTimeout(() => e.target.classList.add('on'), i * 80);
          }
        });
      },
      { threshold: 0.08 },
    );

    root.querySelectorAll('.r').forEach((el) => io.observe(el));

    return () => io.disconnect();
  }, []);

  return <div ref={ref}>{children}</div>;
}
