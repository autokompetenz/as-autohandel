import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore, useLangStore, useThemeStore, useFavStore } from '../store';
import { t, LANGUAGES } from '../utils/i18n';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { createPortal } from 'react-dom';

export default function Navbar() {
  const { user, isAuthenticated, logout, isAdmin } = useAuthStore();
  const { lang, setLang } = useLangStore();
  const { theme, toggle } = useThemeStore();
  const { isMobile } = useBreakpoint();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [plusOpen, setPlusOpen] = useState(false);
  const menuRef = useRef(null);
  const plusRef = useRef(null);
  const isDark = theme === 'dark';
  const favCount = useFavStore(s => s.ids.length);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => {}, []);
  useEffect(() => { setMenuOpen(false); setPlusOpen(false); }, [location.pathname]);

  // Verrouille le scroll derrière la modale mobile
  useEffect(() => {
    if (!menuOpen || !isMobile) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [menuOpen, isMobile]);

  useEffect(() => {
    const h = (e) => {
      if (e.target && e.target.closest && e.target.closest('.nav-mobile-modal')) return; // modale mobile portée dans <body>
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
      if (plusRef.current && !plusRef.current.contains(e.target)) setPlusOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleLogout = () => { logout(); navigate('/'); setMenuOpen(false); };

  const F = "var(--font)";

  const iconColor = isDark ? 'rgba(255,255,255,0.85)' : '#222222';

  const navTextColor = isDark ? 'rgba(255,255,255,0.6)' : '#4A4D52';

  const btnBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(19,24,38,0.04)';

  const btnBorder = (open) => open
    ? 'var(--red)'
    : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(19,24,38,0.10)';

  const menuBg     = isDark ? '#0f0f0f'                 : '#ffffff';
  const menuText   = isDark ? '#ffffff'                 : '#111111';
  const menuText2  = isDark ? 'rgba(255,255,255,0.6)' : '#555555';
  const menuText3  = isDark ? 'rgba(255,255,255,0.3)' : '#999999';
  const menuBorder = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const menuHover  = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)';

  const NavLink = ({ to, label }) => {
    const active = location.pathname.startsWith(to) && to !== '/';
    return (
      <Link to={to} style={{
        fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em',
        color: active ? 'var(--red)' : navTextColor,
        textDecoration: 'none', transition: 'color 0.25s',
        position: 'relative', paddingBottom: 6,
      }}
        onMouseOver={e => e.currentTarget.style.color = 'var(--red)'}
        onMouseOut={e => e.currentTarget.style.color = active ? 'var(--red)' : navTextColor}>
        {label}
        {active && <span style={{ position:'absolute', bottom:0, left:0, right:0, height:1, background:'var(--red)' }} />}
      </Link>
    );
  };

  const itemStyle = (mobile) => ({
    display: 'flex', alignItems: 'center', gap: 10,
    padding: mobile ? '14px 0' : '10px 18px',
    fontSize: mobile ? 16 : 14,
    color: menuText2,
    textDecoration: 'none',
    transition: 'background 0.15s',
    fontWeight: mobile ? 600 : 400,
    fontFamily: F,
    background: 'transparent',
    border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left',
  });

  const menuContent = (
    <>
      {/* En-tête modale (mobile) */}
      {isMobile && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 6 }}>
          <div style={{ width: 36, height: 4, borderRadius: 100, background: menuBorder, marginBottom: 10 }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <span style={{ fontFamily: F, fontWeight: 700, fontSize: 16, color: menuText }}>
              {lang === 'fr' ? 'Menu' : lang === 'en' ? 'Menu' : lang === 'de' ? 'Menü' : 'Menú'}
            </span>
            <button onClick={() => setMenuOpen(false)} aria-label="Fermer le menu"
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 20, color: menuText2, lineHeight: 1, padding: 6, marginRight: -6 }}>
              ✕
            </button>
          </div>
        </div>
      )}

    {/* Mobile nav links */}
    {isMobile && (
      <div>
        {/* Appel direct */}
        <a href="https://wa.me/491636212318"
          target="_blank" rel="noopener noreferrer"
          onClick={() => setMenuOpen(false)}
          style={{
            display:'flex', alignItems:'center', justifyContent:'center', gap:10,
            padding:'13px 0', marginBottom:14, borderRadius:'var(--radius)',
            background:'#25D366', color:'#fff', fontFamily:F,
            fontSize:15, fontWeight:700, textDecoration:'none',
          }}>
          💬 WhatsApp
        </a>

        {[
          { to: '/catalog',    icon: '🚗', label: t('nav_vehicles', lang) },
          { to: '/simulation', icon: '💳', label: t('nav_financing', lang) },
          { to: '/track',      icon: '📍', label: t('nav_track', lang) },
          { to: '/contact',    icon: '📞', label: t('nav_contact', lang) },
          { to: '/faq',        icon: '❓', label: t('nav_faq', lang) },
          { to: '/favoris',    icon: '♥', label: lang==='fr'?'Mes favoris':lang==='en'?'My favorites':lang==='de'?'Meine Favoriten':lang==='es'?'Mis favoritos':lang==='it'?'I preferiti':lang==='pt'?'Meus favoritos':lang==='ro'?'Preferatele mele':'Favoris' },
          { to: '/comparateur', icon: '⇄', label: lang==='fr'?'Comparateur':lang==='en'?'Comparison':lang==='de'?'Vergleich':lang==='es'?'Comparador':lang==='it'?'Confronto':lang==='pt'?'Comparador':lang==='ro'?'Comparator':'Comparison' },
        ].map(({ to, icon, label }) => (
          <Link key={to} to={to} onClick={() => setMenuOpen(false)}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 0', fontSize: 14,
              color: menuText, textDecoration: 'none',
              borderBottom: `1px solid ${menuBorder}`,
              fontWeight: 500, fontFamily: F,
            }}>
            <span style={{ fontSize: 18, width: 22, textAlign: 'center' }}>{icon}</span> {label}
          </Link>
        ))}
      </div>
    )}

    {/* User info */}
    {isAuthenticated && (
      <div style={{
        padding: isMobile ? '0 0 16px' : '14px 18px',
        borderBottom: `1px solid ${menuBorder}`,
        background: isMobile ? 'transparent' : (isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)'),
      }}>
        <p style={{ fontSize: isMobile ? 16 : 13, fontWeight: 600, color: menuText, fontFamily: F }}>
          {user?.firstName} {user?.lastName}
        </p>
        <p style={{ fontSize: isMobile ? 13 : 11, color: menuText3, marginTop: 2 }}>{user?.email}</p>
      </div>
    )}

    {/* Account links */}
    {isAuthenticated && (
    <div style={{ padding: isMobile ? '16px 0' : '6px 0' }}>
      <Link to="/mes-commandes" onClick={() => setMenuOpen(false)}
        style={{ ...itemStyle(isMobile), display: 'flex', color: menuText2 }}
        onMouseOver={e => { if (!isMobile) e.currentTarget.style.background = menuHover; }}
        onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
        <span style={{ fontSize: isMobile ? 20 : 15, width: isMobile ? 28 : 20, textAlign: 'center' }}>📦</span>
        {lang==='fr'?'Mes commandes':lang==='en'?'My orders':lang==='de'?'Meine Bestellungen':'Mis pedidos'}
      </Link>
      {isAdmin() && (
        <Link to="/admin" onClick={() => setMenuOpen(false)}
          style={{ ...itemStyle(isMobile), display: 'flex', color: 'var(--red)' }}
          onMouseOver={e => { if (!isMobile) e.currentTarget.style.background = 'rgba(35,115,244,0.04)'; }}
          onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
          <span style={{ fontSize: isMobile ? 20 : 15, width: isMobile ? 28 : 20, textAlign: 'center' }}>⚙</span>
          {t('nav_admin', lang)}
        </Link>
      )}
    </div>
    )}

    <div style={{ height: 1, background: menuBorder, margin: isMobile ? '8px 0' : 0 }} />

    {/* Theme toggle */}
    <div style={{ padding: isMobile ? '8px 0' : '6px 0' }}>
      <button onClick={toggle} style={{ ...itemStyle(isMobile), width: '100%', color: menuText2 }}
        onMouseOver={e => { if (!isMobile) e.currentTarget.style.background = menuHover; }}
        onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
        <span style={{ fontSize: isMobile ? 20 : 15, width: isMobile ? 28 : 20, textAlign: 'center' }}>
          {isDark ? '☀️' : '🌙'}
        </span>
        {isDark ? t('light_mode', lang) : t('dark_mode', lang)}
      </button>
    </div>

    <div style={{ height: 1, background: menuBorder, margin: isMobile ? '8px 0' : 0 }} />

    {/* Language selector */}
    <div style={{ padding: isMobile ? '8px 0' : '8px 0' }}>
      <p style={{
        fontSize: 9, fontWeight: 700, letterSpacing: '0.25em',
        textTransform: 'uppercase', color: menuText3,
        padding: isMobile ? '4px 0 10px' : '4px 18px 8px',
      }}>
        {lang === 'fr' ? 'Langue' : lang === 'en' ? 'Language' : lang === 'de' ? 'Sprache' : 'Idioma'}
      </p>
      <div style={ isMobile
        ? { display:'flex', gap:6, flexWrap:'wrap' }
        : { display:'grid', gridTemplateColumns:'1fr 1fr', gap:4, padding:'0 10px 6px' } }>
        {LANGUAGES.map(l => (
          <button key={l.code} onClick={() => { setLang(l.code); setMenuOpen(false); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: isMobile ? '8px 10px' : '8px 10px',
              background: l.code === lang ? 'rgba(35,115,244,0.08)' : 'transparent',
              border: `1px solid ${l.code === lang ? 'rgba(35,115,244,0.2)' : 'var(--border)'}`,
              borderRadius: 6, cursor: 'pointer',
              fontSize: isMobile ? 16 : 12,
              color: l.code === lang ? 'var(--red)' : menuText2,
              fontFamily: F, fontWeight: l.code === lang ? 600 : 400,
              transition: 'all 0.15s',
            }}
            onMouseOver={e => { if (l.code !== lang) e.currentTarget.style.background = menuHover; }}
            onMouseOut={e => { if (l.code !== lang) e.currentTarget.style.background = 'transparent'; }}>
            <span style={{ fontSize: isMobile ? 16 : 14 }}>{l.flag}</span>
            {!isMobile && l.label}
          </button>
        ))}
      </div>
    </div>

    {/* Logout */}
    {isAuthenticated && (
      <>
        <div style={{ height: 1, background: menuBorder, margin: isMobile ? '8px 0' : 0 }} />
        <div style={{ padding: isMobile ? '8px 0' : '6px 0 8px' }}>
          <button onClick={handleLogout}
            style={{ ...itemStyle(isMobile), width: '100%', color: '#DC2626' }}
            onMouseOver={e => { if (!isMobile) e.currentTarget.style.background = 'rgba(239,68,68,0.04)'; }}
            onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
            <span style={{ fontSize: isMobile ? 20 : 15, width: isMobile ? 28 : 20, textAlign: 'center' }}>→</span>
            {t('nav_logout', lang)}
          </button>
        </div>
      </>
    )}
    </>
  );

  return (
    <>
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        background: isDark ? 'rgba(10,10,11,0.96)' : 'rgba(255,255,255,0.97)',
        backdropFilter: 'blur(16px) saturate(180%)',
        WebkitBackdropFilter: 'blur(16px) saturate(180%)',
        borderBottom: `1px solid ${menuBorder}`,
        transition: 'border-color 0.3s var(--ease)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: isMobile ? '0 4%' : '0 5%', height: 60,
      }}>

        {/* Logo */}
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'baseline', gap: 6, flexShrink: 0, position: 'relative', zIndex: 1 }}>
          <span style={{
            fontFamily: F, fontSize: 15, fontWeight: 800,
            color: isDark ? '#fff' : '#16171A',
            letterSpacing: '0.08em', transition: 'color 0.3s',
          }}>
            AS AUTOHANDEL
          </span>
          <span style={{ fontSize: 8, fontWeight: 500, letterSpacing: '0.25em', color: 'var(--red)', textTransform: 'uppercase', opacity: 0.7 }}>
            GmbH
          </span>
        </Link>

        {/* Desktop nav links */}
        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 32, position: 'relative', zIndex: 1 }}>
            <NavLink to="/catalog"     label={t('nav_vehicles', lang)} />
            <NavLink to="/simulation"  label={t('nav_financing', lang)} />
            <NavLink to="/contact"     label={t('nav_contact', lang)} />

            {/* Favoris — cœur avec compteur */}
            <Link to="/favoris"
              title={lang==='fr'?'Mes favoris':lang==='en'?'My favorites':lang==='de'?'Meine Favoriten':lang==='es'?'Mis favoritos':lang==='it'?'I preferiti':lang==='pt'?'Meus favoritos':lang==='ro'?'Preferatele mele':'Favoris'}
              style={{
                position:'relative', display:'flex', alignItems:'center', textDecoration:'none',
                fontSize:17, lineHeight:1, color: navTextColor, transition:'color 0.25s',
              }}
              onMouseOver={e => e.currentTarget.style.color = 'var(--red)'}
              onMouseOut={e => e.currentTarget.style.color = navTextColor}>
              {favCount > 0 ? '♥' : '♡'}
              {favCount > 0 && (
                <span style={{
                  position:'absolute', top:-7, right:-10, background:'var(--red)', color:'#fff',
                  fontSize:9, fontWeight:700, minWidth:15, height:15, padding:'0 4px',
                  borderRadius:100, display:'flex', alignItems:'center', justifyContent:'center',
                }}>{favCount}</span>
              )}
            </Link>

            {/* More dropdown */}
            <div style={{ position: 'relative' }} ref={plusRef}>
              <button
                onClick={() => setPlusOpen(!plusOpen)}
                style={{
                  fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em',
                  color: plusOpen ? 'var(--red)' : navTextColor,
                  textDecoration: 'none', transition: 'color 0.25s', cursor: 'pointer',
                  background: 'transparent', border: 'none', padding: 0, fontFamily: F,
                  display: 'flex', alignItems: 'center', gap: 5,
                }}
                onMouseOver={e => e.currentTarget.style.color = 'var(--red)'}
                onMouseOut={e => e.currentTarget.style.color = plusOpen ? 'var(--red)' : navTextColor}>
                {t('nav_more', lang)}
                <span style={{ fontSize: 8, opacity: 0.6, transform: plusOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.25s' }}>▼</span>
              </button>

              <AnimatePresence>
                {plusOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.97, x: '-50%' }}
                    animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
                    exit={{ opacity: 0, y: 6, scale: 0.97, x: '-50%' }}
                    transition={{ duration: 0.2, ease: [0.16,1,0.3,1] }}
                    style={{
                      position: 'absolute', top: 'calc(100% + 14px)', left: '50%',
                      background: menuBg, border: `1px solid ${menuBorder}`, borderRadius: 10,
                      boxShadow: '0 8px 40px rgba(0,0,0,0.20)', minWidth: 220, padding: 6, zIndex: 9999,
                    }}>
                    {[
                      { to: '/marques',     label: t('nav_brands', lang),      icon: '🏷️' },
                      { to: '/camping-car', label: 'Camping Car',                icon: '🚐' },
                      { to: '/warranty',    label: t('nav_warranty', lang),      icon: '🛡️' },
                      { to: '/insurance',   label: t('nav_insurance', lang),     icon: '📋' },
                      { to: '/livraison',   label: t('nav_delivery', lang),      icon: '🚚' },
                      { to: '/maintenance', label: t('nav_maintenance', lang),   icon: '🔧' },
                      { to: '/faq',         label: t('nav_faq', lang),           icon: '❓' },
                      { to: '/a-propos',    label: t('nav_about', lang),         icon: '🏛️' },
                      { to: '/blog',        label: 'Blog',                 icon: '📰' },
                      { to: '/avis',        label: t('reviews_label', lang),     icon: '⭐' },
                    ].map(({ to, label, icon }) => (
                      <Link key={to} to={to} onClick={() => setPlusOpen(false)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px',
                          fontSize: 13, color: menuText2, textDecoration: 'none', borderRadius: 7,
                          fontFamily: F, fontWeight: 500, transition: 'background 0.15s, color 0.15s',
                        }}
                        onMouseOver={e => { e.currentTarget.style.background = menuHover; e.currentTarget.style.color = 'var(--red)'; }}
                        onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = menuText2; }}>
                        <span style={{ fontSize: 15, width: 18, textAlign: 'center', flexShrink: 0 }}>{icon}</span>
                        {label}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative', zIndex: 1 }}>

          {/* CTA — téléphone */}
          {!isMobile && (
            <a href="https://wa.me/491636212318" target="_blank" rel="noopener noreferrer" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: '#25D366',
              color: '#fff',
              fontFamily: F, fontSize: 14, fontWeight: 600, letterSpacing: '0',
              textDecoration: 'none', padding: '9px 22px', borderRadius: 100,
              height: 38, transition: 'all 0.2s var(--ease)',
            }}
              onMouseOver={e => { e.currentTarget.style.background = '#128C7E'; }}
              onMouseOut={e => { e.currentTarget.style.background = '#25D366'; }}>
              💬 WhatsApp
            </a>
          )}

          {/* Menu button */}
          <div style={{ position: 'relative' }} ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: btnBg,
                border: `1px solid ${btnBorder(menuOpen)}`,
                borderRadius: 100,
                padding: isMobile ? '7px' : '6px 12px',
                cursor: 'pointer', transition: 'all 0.25s',
                height: 36, width: isMobile ? 36 : 'auto',
                justifyContent: 'center',
              }}>
              {isAuthenticated && !isMobile ? (
                <>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%',
                    background: 'linear-gradient(135deg,var(--red-dark),var(--red))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9, fontWeight: 700, color: '#fff', flexShrink: 0,
                  }}>
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 500, color: iconColor, maxWidth: 70, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user?.firstName}
                  </span>
                  <span style={{ fontSize: 9, color: iconColor, opacity: 0.5 }}>▾</span>
                </>
              ) : (
                <span style={{ fontSize: 18, lineHeight: 1, color: iconColor }}>
                  {menuOpen ? '✕' : '☰'}
                </span>
              )}
            </button>

            {/* Menu mobile → modale portée dans <body> (la <nav> a un backdrop-filter qui crée un containing block pour position:fixed) */}
            {isMobile && createPortal(
              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    key="menu-modal-overlay"
                    className="nav-mobile-modal"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.22 }}
                    onClick={() => setMenuOpen(false)}
                    style={{
                      position: 'fixed', top: 60, left: 0, right: 0, bottom: 0,
                      background: 'rgba(10,10,12,0.55)',
                      backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
                      zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      padding: '16px 16px 96px', overflow: 'hidden',
                    }}
                  >
                    <motion.div
                      initial={{ opacity: 0, y: 18, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 18, scale: 0.97 }}
                      transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
                      onClick={e => e.stopPropagation()}
                      style={{
                        width: '100%', maxWidth: 380, maxHeight: '100%', overflow: 'auto',
                        background: menuBg, border: `1px solid ${menuBorder}`,
                        borderRadius: 20, boxShadow: '0 24px 80px rgba(0,0,0,0.40)',
                        padding: '14px 18px 20px', WebkitOverflowScrolling: 'touch',
                      }}
                    >
                      {menuContent}
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>,
              document.body
            )}

            {/* Menu desktop → dropdown classique sous le bouton */}
            {!isMobile && (
              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    key="menu-desktop"
                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.97 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    style={{
                      position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                      background: menuBg, border: `1px solid ${menuBorder}`,
                      borderRadius: 10, boxShadow: '0 8px 40px rgba(0,0,0,0.20)',
                      overflow: 'auto', minWidth: 220, zIndex: 9999, padding: 0,
                    }}
                  >
                    {menuContent}
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}
