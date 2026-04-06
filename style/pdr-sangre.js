/* ============================================================
   PEREGRINOS DE LA RUINA — pdr-sangre.js
   Script de mundo: manchas de sangre aleatorias

   Archivo : worlds/peregrinos-de-la-ruina/style/pdr-sangre.js

   Para activar, añade en world.json:
     "scripts": ["style/pdr-sangre.js"]

   Autoinyecta pdr-styles.css (hook 'init') sin depender de la
   clave "styles" del world.json.
   Al hacer clic sobre un BOTÓN o una PESTAÑA, aparece una
   mancha de sangre aleatoria (sangre-1.png … sangre-9.png)
   centrada en el punto del clic, con rotación aleatoria y
   un fade-out suave.
   ============================================================ */

/* ══════════════════════════════════════════════════════════════
   §A · AUTOINYECCIÓN DEL CSS
   Hook 'init': el más temprano, garantiza que los estilos
   estén listos antes de que se rendericen las ventanas.
══════════════════════════════════════════════════════════════ */

Hooks.once('init', () => {
  const cssHref = `worlds/peregrinos-de-la-ruina/style/pdr-styles.css`;

  // Evitar duplicados si por algún motivo ya estuviera cargado
  if (document.querySelector(`link[href*="pdr-styles"]`)) return;

  const link = document.createElement('link');
  link.rel  = 'stylesheet';
  link.type = 'text/css';
  link.href = `${cssHref}?v=${Date.now()}`; // buster de caché
  document.head.appendChild(link);

  console.log('[PdR] CSS inyectado:', link.href);
});


/* ══════════════════════════════════════════════════════════════
   §B · MANCHAS DE SANGRE ALEATORIAS
══════════════════════════════════════════════════════════════ */

Hooks.once('ready', () => {

  /* ── Configuración ──────────────────────────────────────── */
  const NUM_SANGRE = 9;          // cuántos archivos sangre-N.png hay
  const TAMANYO    = 130;        // px de la mancha (ancho = alto)
  const DURACION   = 900;        // ms que permanece visible antes del fade
  const FADE       = 350;        // ms del fade-out

  /* Ruta absoluta desde la raíz del servidor Foundry */
  const BASE = `worlds/${game.world.id}/style/assets/`;

  console.log('[PdR] Script de sangre activo.');

  /* ── Helpers ────────────────────────────────────────────── */

  /** Devuelve la URL de una mancha aleatoria */
  function urlAleatoria() {
    const n = Math.ceil(Math.random() * NUM_SANGRE);
    return `${BASE}sangre-${n}.png`;
  }

  /**
   * Crea y anima la mancha de sangre centrada en (x, y).
   * La imagen se añade al <body>, es pointer-events:none
   * (no interfiere con ningún clic posterior) y se elimina sola.
   */
  function mostrarMancha(x, y) {
    const rotacion = Math.floor(Math.random() * 360);
    const escala   = (0.85 + Math.random() * 0.45).toFixed(3); // 0.85–1.30

    const img = document.createElement('img');
    img.src = urlAleatoria();
        img.onerror = () => console.error('[PdR] No se pudo cargar la imagen:', img.src);

    Object.assign(img.style, {
      position      : 'fixed',
      left          : `${x - TAMANYO / 2}px`,
      top           : `${y - TAMANYO / 2}px`,
      width         : `${TAMANYO}px`,
      height        : `${TAMANYO}px`,
      objectFit     : 'contain',
      pointerEvents : 'none',
      zIndex        : '99999',
      opacity       : '0',
      transform     : `rotate(${rotacion}deg) scale(${escala})`,
      transition    : `opacity ${FADE}ms ease`,
    });

    document.body.appendChild(img);

    /* Fade in: el doble rAF garantiza que el transition se dispara
       correctamente aunque el elemento se acabe de insertar       */
    requestAnimationFrame(() =>
      requestAnimationFrame(() => { img.style.opacity = '1'; })
    );

    /* Fade out → eliminar */
    setTimeout(() => {
      img.style.opacity = '0';
      setTimeout(() => img.remove(), FADE);
    }, DURACION);
  }

  /* ── Delegación de eventos ──────────────────────────────── */

  /*
   * Capturamos en fase de CAPTURE (tercer argumento = true)
   * para interceptar el clic antes de que lo maneje el sistema,
   * sin bloquear el comportamiento original del botón/pestaña.
   *
   * Selectores cubiertos:
   *   button               → cualquier botón HTML
   *   .tabs .item          → pestañas estándar Foundry / CSB
   *   .sheet-tabs .item    → variante de navegación en hojas
   *   nav.tabs a           → anclas de navegación en nav.tabs
   *   a.item[data-tab]     → pestañas CSB con atributo data-tab
   */
  document.body.addEventListener(
    'pointerdown',
    (evento) => {
      if (evento.button !== 0) return; // sólo botón izquierdo

      const zonaHoja = evento.target.closest('.window-content');
      if (!zonaHoja) return;

      mostrarMancha(evento.clientX, evento.clientY);
    },
    true
  );

  document.body.addEventListener(
    'click',
    (evento) => {
      if (evento.target.closest(SELECTOR_OBJETIVOS)) {
        mostrarMancha(evento.clientX, evento.clientY);
      }
    },
    true  // capture = true: no bloquea el clic, solo añade el efecto
  );

});
