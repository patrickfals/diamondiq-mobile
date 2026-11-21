export const COLORS = {
  // ── Backgrounds (new palette) ────────────────────────────────────────────────
  bg: '#070F24',
  card: '#0E1C3D',
  inset: '#0A1631',
  divider: '#1B2C52',

  // ── Text (new palette) ───────────────────────────────────────────────────────
  text: '#EEF3FB',
  body: '#DCE5F4',
  muted: '#8193B8',
  label: '#6F82AA',

  // ── Accent / brand (new palette) ────────────────────────────────────────────
  accent: '#3D95FF',
  teal: '#1FC7A6',
  violet: '#A98BFF',

  // ── Result colors ────────────────────────────────────────────────────────────
  resultStrike: '#F0525A',
  resultBall: '#34B576',
  resultFoul: '#F5A524',
  resultInplay: '#3D95FF',
  resultOther: '#8A99B3',

  // ── Type-code colors (FF / SL / CH) ─────────────────────────────────────────
  typeFF: '#3D95FF',
  typeSL: '#A98BFF',
  typeCH: '#F5A524',
  typeOther: '#8A99B3',

  // ── Legacy keys preserved so old components still compile ───────────────────
  surface: 'rgba(14,28,61,0.85)',        // was rgba(14,30,62,0.85)
  surfaceElevated: '#0E1C3D',            // was #0f2040 → mapped to card
  surfaceSolid: '#0a1631',               // was #0e1e3e → mapped to inset
  subtle: '#8193B8',                     // was #9FB3D3 → mapped to muted
  accentDim: 'rgba(61,149,255,0.15)',
  accentBorder: 'rgba(61,149,255,0.45)',
  tealDim: 'rgba(31,199,166,0.15)',
  border: 'rgba(61,149,255,0.45)',
  borderSubtle: '#1B2C52',               // was #1e2d45 → mapped to divider
  zoneStroke: 'rgba(255,255,255,0.06)',
  zoneBackground: 'rgba(14,28,61,0.4)',
  success: '#1FC7A6',                    // was #10b981 → mapped to teal
  warning: '#F5A524',                    // was #f59e0b → mapped to resultFoul
  danger: '#F0525A',                     // was #ef4444 → mapped to resultStrike
};
