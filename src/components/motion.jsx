import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';

// ── Titre révélé mot à mot au scroll ─────────────────────────────────────────
// Chaque mot monte depuis un masque, avec stagger. Gère les retours à la ligne \n.
export function RevealTitle({ children, className, style, delay = 0, as: Tag = 'h2' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.35 });
  const lines = String(children ?? '').split('\n');

  return (
    <Tag ref={ref} className={className} style={style}>
      {lines.map((line, li) => (
        <span key={li} style={{ display: 'block', overflow: 'hidden', paddingBottom: '0.06em' }}>
          {line.split(' ').map((w, wi, arr) => (
            <span
              key={wi}
              style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'bottom', paddingBottom: '0.12em', marginBottom: '-0.12em' }}
            >
              <motion.span
                initial={{ y: '118%' }}
                animate={inView ? { y: '0%' } : { y: '118%' }}
                transition={{ duration: 0.65, delay: delay + li * 0.1 + wi * 0.055, ease: [0.16, 1, 0.3, 1] }}
                style={{ display: 'inline-block' }}
              >
                {w}
              </motion.span>
              {wi < arr.length - 1 ? '\u00A0' : ''}
            </span>
          ))}
        </span>
      ))}
    </Tag>
  );
}

// ── Compteur animé (chiffres qui s'incrémentent au scroll) ──────────────────
export function CountUp({ value, duration = 1600, style }) {
  const str = String(value);
  const m = str.match(/^(\d+(?:\.\d+)?)/);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const [n, setN] = useState(0);
  const target = m ? parseFloat(m[1]) : 0;
  const decimals = m && m[1].includes('.') ? m[1].split('.')[1].length : 0;

  useEffect(() => {
    if (!m || !inView) return;
    let raf;
    let start = null;
    const step = (t) => {
      if (start === null) start = t;
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(target * eased);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [inView, target, duration, m]);

  if (!m) return <span style={style}>{str}</span>;
  const prefix = str.slice(0, m.index || 0);
  const suffix = str.slice(m[0].length);
  return (
    <span ref={ref} style={style}>
      {prefix}
      {n.toFixed(decimals)}
      {suffix}
    </span>
  );
}

// ── Bouton magnétique : légère attraction vers le curseur ────────────────────
// Usage : <Link {...magnetProps(0.3)} className="btn-primary" ...>
export function magnetProps(strength = 0.3) {
  return {
    onMouseMove: (e) => {
      const el = e.currentTarget;
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2;
      const y = e.clientY - r.top - r.height / 2;
      el.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
    },
    onMouseLeave: (e) => {
      e.currentTarget.style.transform = 'translate(0px, 0px)';
    },
  };
}

// ── Carte en tilt 3D : inclinaison selon la position du curseur ─────────────
// Usage : <Link {...tiltProps(9)} ...>
export function tiltProps(maxDeg = 9, extraTransition = '') {
  const pre = extraTransition ? extraTransition + ', ' : '';
  return {
    onMouseMove: (e) => {
      const el = e.currentTarget;
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      el.style.transition = `${pre}transform 0.1s linear`;
      el.style.transform = `perspective(700px) rotateX(${(-py * maxDeg).toFixed(2)}deg) rotateY(${(px * maxDeg).toFixed(2)}deg) translateY(-3px)`;
    },
    onMouseLeave: (e) => {
      const el = e.currentTarget;
      el.style.transition = `${pre}transform 0.5s cubic-bezier(0.16,1,0.3,1)`;
      el.style.transform = 'none';
    },
  };
}
