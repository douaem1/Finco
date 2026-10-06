import { Fragment, useEffect, useRef, useState } from 'react';
import {
  animate, motion, useInView, useMotionValue, useReducedMotion, useSpring, useTransform,
} from 'framer-motion';

/* ============================================================
   Boîte à outils d'animation de FinCo (visuel uniquement).
   Principes : springs fermes sans rebond visible, courbes
   ease-out-expo, aucune animation ne bloque un clic, et tout se
   désactive si l'utilisateur demande de réduire les animations.
   ============================================================ */

/** Courbe ease-out-expo : démarre vite, se pose lentement. */
export const EASE_EXPO = [0.16, 1, 0.3, 1];

/** Spring « ingénierie de précision » : ferme, rapide, sans rebond perceptible. */
export const SPRING_FERME = { type: 'spring', stiffness: 380, damping: 38, mass: 0.8 };
export const SPRING_DOUX = { type: 'spring', stiffness: 170, damping: 26, mass: 1 };

/**
 * Délai non linéaire : les premiers éléments s'enchaînent vite, les
 * suivants ralentissent (le délai suit une courbe, pas une constante).
 */
export function delaiNonLineaire(index, total, duree = 0.55) {
  if (total <= 1) return 0;
  const t = index / (total - 1);
  return duree * t ** 1.7;
}

/** Variantes « apparition » réutilisables (opacité + déplacement + flou). */
export const apparition = {
  cache: { opacity: 0, y: 26, filter: 'blur(8px)' },
  visible: (delai = 0) => ({
    opacity: 1, y: 0, filter: 'blur(0px)',
    transition: { ...SPRING_DOUX, delay: delai, filter: { duration: 0.6, ease: EASE_EXPO, delay: delai } },
  }),
};

/**
 * Bouton magnétique : l'enveloppe glisse de quelques pixels vers le curseur
 * et revient en spring à la sortie. Le lien/bouton à l'intérieur est intact.
 */
export function Magnetique({ children, force = 0.35, rayon = 10, className = '' }) {
  const reduit = useReducedMotion();
  const ref = useRef(null);
  const x = useSpring(0, SPRING_FERME);
  const y = useSpring(0, SPRING_FERME);
  const xInterne = useTransform(x, (v) => v * 0.45);
  const yInterne = useTransform(y, (v) => v * 0.45);

  function bouger(e) {
    if (reduit || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const dx = (e.clientX - (r.left + r.width / 2)) * force;
    const dy = (e.clientY - (r.top + r.height / 2)) * force;
    x.set(Math.max(-rayon, Math.min(rayon, dx)));
    y.set(Math.max(-rayon, Math.min(rayon, dy)));
  }
  function relacher() { x.set(0); y.set(0); }

  return (
    <motion.span ref={ref} className={`magnetique ${className}`} style={{ x, y }}
      onMouseMove={bouger} onMouseLeave={relacher} data-curseur="bouton">
      <motion.span className="magnetique-interne" style={{ x: xInterne, y: yInterne }}>{children}</motion.span>
    </motion.span>
  );
}

/**
 * Carte inclinable : légère rotation 3D (quelques degrés) qui suit le curseur,
 * avec un reflet discret. `as` choisit la balise (article, div…).
 */
export function Inclinable({ as = 'div', children, max = 5, className = '', ...props }) {
  const reduit = useReducedMotion();
  const Balise = motion[as];
  const rx = useSpring(0, SPRING_FERME);
  const ry = useSpring(0, SPRING_FERME);
  const lumiereX = useMotionValue(50);
  const lumiereY = useMotionValue(50);
  const reflet = useTransform([lumiereX, lumiereY], ([lx, ly]) =>
    `radial-gradient(420px circle at ${lx}% ${ly}%, rgba(255,255,255,0.18), transparent 45%)`);

  function bouger(e) {
    if (reduit) return;
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    ry.set((px - 0.5) * 2 * max);
    rx.set(-(py - 0.5) * 2 * max);
    lumiereX.set(px * 100);
    lumiereY.set(py * 100);
  }
  function relacher() { rx.set(0); ry.set(0); }

  return (
    <Balise className={`inclinable ${className}`} style={{ rotateX: rx, rotateY: ry, transformPerspective: 900 }}
      onMouseMove={bouger} onMouseLeave={relacher} {...props}>
      {children}
      {!reduit && <motion.span className="inclinable-reflet" style={{ backgroundImage: reflet }} aria-hidden="true" />}
    </Balise>
  );
}

/**
 * Nombre animé : passe de l'ancienne valeur à la nouvelle avec une courbe
 * ease-out-expo (accélère puis se pose). `formater` garde l'affichage métier.
 */
export function Compteur({ valeur, formater = (v) => String(Math.round(v)), duree = 1.2, className = '' }) {
  const reduit = useReducedMotion();
  const ref = useRef(null);
  const visible = useInView(ref, { once: true, margin: '-40px' });
  const precedent = useRef(0);
  const [affiche, setAffiche] = useState(reduit ? valeur : 0);

  useEffect(() => {
    if (reduit) { setAffiche(valeur); precedent.current = valeur; return undefined; }
    if (!visible) return undefined;
    const controle = animate(precedent.current, valeur, {
      duration: duree, ease: EASE_EXPO,
      onUpdate: (v) => setAffiche(v),
    });
    precedent.current = valeur;
    return () => controle.stop();
  }, [valeur, visible, reduit, duree]);

  return <span ref={ref} className={className}>{formater(affiche)}</span>;
}

/**
 * Titre révélé par un masque progressif (clip-path) au moment où il entre
 * à l'écran, au lieu d'un simple fondu.
 */
export function TitreRevele({ as = 'h2', children, className = '', delai = 0 }) {
  const reduit = useReducedMotion();
  const Balise = motion[as];
  if (reduit) return <Balise className={className}>{children}</Balise>;
  return (
    <Balise className={className}
      initial={{ clipPath: 'inset(0 100% 0 0)', opacity: 0.4 }}
      whileInView={{ clipPath: 'inset(0 0% 0 0)', opacity: 1 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 1, ease: EASE_EXPO, delay: delai }}>
      {children}
    </Balise>
  );
}

/**
 * Titre héros : chaque mot remonte derrière un masque, avec un délai non
 * linéaire. Le texte reste identique (lu d'un bloc par les lecteurs d'écran).
 */
export function TitreMots({ texte, className = '' }) {
  const reduit = useReducedMotion();
  const mots = texte.split(' ');
  if (reduit) return <h1 className={className}>{texte}</h1>;
  return (
    <h1 className={className} aria-label={texte}>
      {mots.map((mot, i) => (
        <Fragment key={`${mot}-${i}`}>
          <span className="mot-masque" aria-hidden="true">
            <motion.span className="mot"
              initial={{ y: '110%', rotate: 4 }}
              animate={{ y: '0%', rotate: 0 }}
              transition={{ duration: 1, ease: EASE_EXPO, delay: 0.1 + delaiNonLineaire(i, mots.length, 0.7) }}>
              {mot}
            </motion.span>
          </span>
          {i < mots.length - 1 && ' '}
        </Fragment>
      ))}
    </h1>
  );
}

/**
 * Curseur personnalisé : un point précis + un anneau qui suit avec un léger
 * retard (spring). Il grossit sur les éléments `data-curseur="bouton"` et
 * affiche « Voir » sur `data-curseur="voir"`. Désactivé sur écran tactile
 * et si l'utilisateur réduit les animations.
 */
export function CurseurPersonnalise() {
  const reduit = useReducedMotion();
  const [actif, setActif] = useState(false);
  const [mode, setMode] = useState('normal');
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const anneauX = useSpring(x, { stiffness: 420, damping: 36, mass: 0.6 });
  const anneauY = useSpring(y, { stiffness: 420, damping: 36, mass: 0.6 });

  useEffect(() => {
    if (reduit || !window.matchMedia('(pointer: fine)').matches) return undefined;
    setActif(true);
    document.documentElement.classList.add('curseur-perso');
    const bouger = (e) => {
      x.set(e.clientX); y.set(e.clientY);
      const cible = e.target.closest?.('[data-curseur], a, button');
      setMode(cible ? (cible.getAttribute('data-curseur') || 'bouton') : 'normal');
    };
    const sortir = () => { x.set(-100); y.set(-100); };
    window.addEventListener('mousemove', bouger);
    document.addEventListener('mouseleave', sortir);
    return () => {
      window.removeEventListener('mousemove', bouger);
      document.removeEventListener('mouseleave', sortir);
      document.documentElement.classList.remove('curseur-perso');
    };
  }, [reduit, x, y]);

  if (!actif) return null;
  return (
    <>
      <motion.div className={`curseur-anneau curseur-${mode}`} style={{ x: anneauX, y: anneauY }} aria-hidden="true">
        <span>Voir</span>
      </motion.div>
      <motion.div className="curseur-point" style={{ x, y }} aria-hidden="true" />
    </>
  );
}
