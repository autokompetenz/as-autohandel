import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCompareStore, useLangStore } from '../store';
import { useBreakpoint } from '../hooks/useBreakpoint';

/* Barre flottante « Comparateur » — apparaît dès qu'un véhicule est coché ⇄,
   masquée sur la page /comparateur elle-même. Centrée pour éviter le chatbot. */
export default function CompareBar() {
  const ids = useCompareStore(s => s.ids);
  const clear = useCompareStore(s => s.clear);
  const { lang } = useLangStore();
  const { pathname } = useLocation();
  const { isMobile } = useBreakpoint();
  const show = ids.length > 0 && pathname !== '/comparateur';

  const l = lang || 'fr';
  const label = (fr, en, de, es, it, pt, ro) => ({ fr, en, de, es, it, pt, ro }[l] || fr);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: 'fixed',
            left: '50%',
            transform: 'translateX(-50%)',
            bottom: isMobile ? 'calc(78px + env(safe-area-inset-bottom))' : 24,
            zIndex: 9000,
            display: 'flex', alignItems: 'center', gap: 14,
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-pill)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            padding: isMobile ? '8px 10px 8px 18px' : '10px 12px 10px 22px',
            maxWidth: 'calc(100vw - 32px)',
          }}
        >
          <span style={{
            fontFamily: 'var(--font)', fontSize: 13, fontWeight: 700, color: 'var(--text)',
            whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 8,
          }}>
            ⇄ {ids.length}/3
            {!isMobile && (
              <span style={{ fontWeight: 500, color: 'var(--text-3)' }}>
                {label('véhicules sélectionnés', 'vehicles selected', 'Fahrzeuge ausgewählt', 'vehículos seleccionados', 'veicoli selezionati', 'veículos selecionados', 'vehicule selectate')}
              </span>
            )}
          </span>

          <div style={{ display: 'flex', gap: 8 }}>
            <Link to="/comparateur" className="btn-primary" style={{ fontSize: 13, padding: '9px 20px' }}>
              {label('Comparer', 'Compare', 'Vergleichen', 'Comparar', 'Confronta', 'Comparar', 'Compară')}
            </Link>
            <button
              onClick={clear}
              aria-label="Vider"
              style={{
                width: 34, height: 34, borderRadius: '50%', border: '1px solid var(--border)',
                background: 'transparent', color: 'var(--text-3)', cursor: 'pointer',
                fontSize: 14, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
              ✕
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
