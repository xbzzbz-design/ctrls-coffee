// Tiny doodle-style cat SVGs as React components.
// CatBase is highly configurable: body color, accent (ear/blush), eyes (color & expression),
// and an optional prop (hat / glasses / etc.).

const EXPRESSIONS = [
  'sparkle', 'happy', 'sleepy', 'star',
  'wink', 'heart', 'closed', 'lol',
  'shy', 'grumpy', 'smug', 'shocked',
  // CTRL+S animated
  'star-pulse', 'heart-float',
];

// Body silhouette — shared by the fill and the pattern clip-path.
const BODY_PATH = "M 22 58 C 18 50, 20 38, 26 32 L 30 24 L 38 32 C 44 30, 56 30, 62 32 L 70 24 L 74 32 C 80 38, 82 50, 78 58 C 80 66, 76 78, 70 80 L 30 80 C 24 78, 20 66, 22 58 Z";

// Coat patterns — overlaid on the body color, clipped to the silhouette.
const PATTERNS = ['solid', 'tabby', 'gray-tabby', 'calico', 'tortie', 'cow', 'tuxedo', 'siamese'];

// Accessories grouped by body slot — one item per slot can be worn at once.
const HATS  = ['none', 'headband', 'beret', 'beanie', 'cap', 'flower', 'bucket', 'headphones', 'tophat', 'layers', 'crown', 'party-hat', 'halo', 'wizard'];
const FACES = ['none', 'glasses', 'sunglasses', 'monocle', 'eyepatch'];
const NECKS = ['none', 'bow', 'collar', 'scarf', 'bowtie', 'necktie', 'bandana'];
const HANDS = ['none', 'coffee', 'pencil', 'boba', 'balloon', 'eyedropper', 'fish'];
const AURAS = ['none', 'cursor', 'pentool', 'sparkle-aura', 'rainbow', 'cmd-key'];

const SLOTS = [
  { key: 'hat',  label: 'hat',  items: HATS },
  { key: 'face', label: 'face', items: FACES },
  { key: 'neck', label: 'neck', items: NECKS },
  { key: 'hand', label: 'item', items: HANDS },
  { key: 'aura', label: 'aura', items: AURAS },
];

// Flat list of every accessory (legacy + full set).
const PROPS = ['none', ...HATS.slice(1), ...FACES.slice(1), ...NECKS.slice(1), ...HANDS.slice(1), ...AURAS.slice(1)];

const BODY_COLORS = [
  { id: 'cream',     fill: '#F6F1E8' },
  { id: 'beige',     fill: '#EADFCB' },
  { id: 'sand',      fill: '#D9C49E' },
  { id: 'caramel',   fill: '#B8895A' },
  { id: 'rosy',      fill: '#F0CBC2' },
  { id: 'mint',      fill: '#CDE0CC' },
  { id: 'sky',       fill: '#C6D4E2' },
  { id: 'charcoal',  fill: '#3A3A3A' },
];

const ACCENT_COLORS = [
  { id: 'mustard',    fill: '#D5A23B' },
  { id: 'terracotta', fill: '#C97B5F' },
  { id: 'pink',       fill: '#E7A2AC' },
  { id: 'sage',       fill: '#8FA287' },
  { id: 'plum',       fill: '#9F6B8B' },
  { id: 'navy',       fill: '#3C5878' },
];

const EYE_COLORS = [
  { id: 'black',  fill: '#2B2B2B' },
  { id: 'brown',  fill: '#6B4E3D' },
  { id: 'blue',   fill: '#3C5878' },
  { id: 'green',  fill: '#5E8050' },
  { id: 'amber',  fill: '#C97B2F' },
  { id: 'violet', fill: '#7B5B8E' },
];

const CatBase = ({
  size = 80,
  fill = '#F6F1E8',           // body color
  stroke = '#2B2B2B',          // outline (also default eye color)
  accent = '#D5A23B',          // ear inner + cheek blush
  eyeColor,                    // overrides stroke for eye fill
  expression = 'sparkle',
  prop = 'none',               // legacy single accessory
  hat = 'none',
  face = 'none',
  neck = 'none',
  hand = 'none',
  aura = 'none',
  pattern = 'solid',
  bg = 'transparent',
}) => {
  const isDark = fill === '#3A3A3A' || fill === '#2B2B2B';
  // Dark body: switch outline + eyes to light cream so they're visible.
  const out = isDark ? '#E8E0D4' : stroke;
  const DARK_EYE_COLORS = ['#2B2B2B', '#1A1A1A', '#3A3A3A', '#6B4E3D'];
  const eye = isDark
    ? (eyeColor && !DARK_EYE_COLORS.includes(eyeColor) ? eyeColor : '#E8E0D4')
    : (eyeColor || stroke);

  // Merge every worn accessory (slots + legacy prop) into one active set.
  const activeProps = [hat, face, neck, hand, aura, prop].filter((p) => p && p !== 'none');
  const has = (n) => activeProps.includes(n);

  const uidRef = React.useRef(null);
  if (!uidRef.current) uidRef.current = Math.random().toString(36).slice(2, 8);
  const clipId = 'catclip-' + uidRef.current;

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      {/* body — wobbly outline */}
      <path
        d={BODY_PATH}
        fill={fill}
        stroke={out}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* === Coat pattern (clipped to body) === */}
      {pattern && pattern !== 'solid' && (
        <>
          <defs><clipPath id={clipId}><path d={BODY_PATH} /></clipPath></defs>
          <g clipPath={`url(#${clipId})`}>
            {(pattern === 'tabby' || pattern === 'gray-tabby') && (() => {
              const c = pattern === 'tabby' ? '#B5703A' : '#6E6E6E';
              return (
                <g stroke={c} strokeWidth="2.4" fill="none" opacity="0.5" strokeLinecap="round">
                  <path d="M 42 30 L 45 40 M 50 28 L 50 40 M 58 30 L 55 40" />
                  <path d="M 24 42 Q 32 44, 24 50" />
                  <path d="M 76 42 Q 68 44, 76 50" />
                  <path d="M 26 60 Q 34 62, 26 68" />
                  <path d="M 74 60 Q 66 62, 74 68" />
                  <path d="M 44 74 L 44 80 M 50 74 L 50 80 M 56 74 L 56 80" />
                </g>
              );
            })()}
            {pattern === 'calico' && (
              <>
                <path d="M 20 30 Q 42 26, 46 30 Q 48 50, 30 56 Q 18 48, 20 30 Z" fill="#E8923A" opacity="0.9" />
                <path d="M 58 28 Q 80 30, 80 50 Q 70 58, 56 48 Q 54 34, 58 28 Z" fill="#3A3A3A" opacity="0.85" />
                <path d="M 60 64 Q 74 64, 76 76 Q 64 80, 58 72 Z" fill="#E8923A" opacity="0.85" />
              </>
            )}
            {pattern === 'tortie' && (
              [[30,40,'#3A3A3A'],[60,36,'#E8923A'],[40,60,'#E8923A'],[66,58,'#3A3A3A'],[50,72,'#3A3A3A'],[28,66,'#E8923A']].map(([x,y,c],i) => (
                <ellipse key={i} cx={x} cy={y} rx="9" ry="8" fill={c} opacity="0.7" />
              ))
            )}
            {pattern === 'cow' && (
              <>
                <path d="M 24 34 Q 40 30, 42 44 Q 36 54, 24 50 Z" fill="#2B2B2B" opacity="0.9" />
                <path d="M 58 50 Q 76 48, 78 62 Q 68 74, 56 66 Q 52 56, 58 50 Z" fill="#2B2B2B" opacity="0.9" />
                <ellipse cx="40" cy="71" rx="7" ry="5" fill="#2B2B2B" opacity="0.9" />
              </>
            )}
            {pattern === 'tuxedo' && (
              <>
                <path d="M 50 54 Q 42 60, 40 80 L 60 80 Q 58 60, 50 54 Z" fill="#F6F1E8" />
                <ellipse cx="50" cy="64" rx="11" ry="8" fill="#F6F1E8" />
                <path d="M 30 24 L 38 32 L 34 34 Z" fill="#F6F1E8" opacity="0.9" />
              </>
            )}
            {pattern === 'siamese' && (
              <>
                <path d="M 26 32 L 30 24 L 38 32 Z" fill="#5A4636" opacity="0.75" />
                <path d="M 74 32 L 70 24 L 62 32 Z" fill="#5A4636" opacity="0.75" />
                <ellipse cx="50" cy="56" rx="15" ry="13" fill="#6B5443" opacity="0.4" />
                <path d="M 22 72 Q 50 68, 78 72 L 78 80 L 22 80 Z" fill="#5A4636" opacity="0.6" />
              </>
            )}
          </g>
        </>
      )}

      {/* inner ears */}
      <path d="M 30 24 L 32 30 L 36 30 Z" fill={accent} opacity="0.7" />
      <path d="M 70 24 L 68 30 L 64 30 Z" fill={accent} opacity="0.7" />

      {/* cheek blush */}
      {!['grumpy','shocked'].includes(expression) && (
        <>
          <ellipse cx="34" cy="62" rx="3" ry="1.6" fill={accent} opacity="0.45" />
          <ellipse cx="66" cy="62" rx="3" ry="1.6" fill={accent} opacity="0.45" />
        </>
      )}

      {/* === Eyes by expression === */}
      {expression === 'sparkle' && (
        <>
          <circle cx="40" cy="52" r="3.6" fill={eye} />
          <circle cx="41.5" cy="50.5" r="1.1" fill="#fff" />
          <circle cx="60" cy="52" r="3.6" fill={eye} />
          <circle cx="61.5" cy="50.5" r="1.1" fill="#fff" />
        </>
      )}
      {expression === 'happy' && (
        <>
          <path d="M 36 54 Q 40 47, 44 54" stroke={eye} strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M 56 54 Q 60 47, 64 54" stroke={eye} strokeWidth="2" fill="none" strokeLinecap="round" />
        </>
      )}
      {expression === 'sleepy' && (
        <>
          {/* flat closed eyes with little lash */}
          <path d="M 35 53 L 45 53" stroke={eye} strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M 55 53 L 65 53" stroke={eye} strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M 44 53 L 46 56" stroke={eye} strokeWidth="1.2" fill="none" strokeLinecap="round" />
          <path d="M 64 53 L 66 56" stroke={eye} strokeWidth="1.2" fill="none" strokeLinecap="round" />
          {/* Zzz */}
          <text x="74" y="38" fontSize="9" fontFamily="Caveat, cursive" fontWeight="700" fill={eye}>z</text>
        </>
      )}
      {expression === 'star' && (
        <>
          {[40, 60].map((cx) => (
            <g key={cx} transform={`translate(${cx} 52)`}>
              <path d="M 0 -4.5 L 1.2 -1.2 L 4.5 0 L 1.2 1.2 L 0 4.5 L -1.2 1.2 L -4.5 0 L -1.2 -1.2 Z" fill={eye} />
            </g>
          ))}
        </>
      )}
      {expression === 'wink' && (
        <>
          <circle cx="40" cy="52" r="3.6" fill={eye} />
          <circle cx="41.5" cy="50.5" r="1.1" fill="#fff" />
          <path d="M 56 53 Q 60 50, 64 53" stroke={eye} strokeWidth="2" fill="none" strokeLinecap="round" />
        </>
      )}
      {expression === 'heart' && (
        <>
          {[40, 60].map((cx) => (
            <path key={cx} d={`M ${cx} 56 C ${cx-4} 52, ${cx-4} 48, ${cx-2} 48 C ${cx-1} 48, ${cx} 49, ${cx} 50 C ${cx} 49, ${cx+1} 48, ${cx+2} 48 C ${cx+4} 48, ${cx+4} 52, ${cx} 56 Z`} fill="#E7536E" />
          ))}
        </>
      )}
      {expression === 'closed' && (
        <>
          {/* > < content eyes */}
          <path d="M 36 50 L 40 53 L 36 56" stroke={eye} strokeWidth="2" fill="none" strokeLinejoin="round" strokeLinecap="round" />
          <path d="M 64 50 L 60 53 L 64 56" stroke={eye} strokeWidth="2" fill="none" strokeLinejoin="round" strokeLinecap="round" />
        </>
      )}
      {expression === 'lol' && (
        <>
          {/* ^ ^ laughing eyes */}
          <path d="M 36 54 L 40 49 L 44 54" stroke={eye} strokeWidth="2" fill="none" strokeLinejoin="round" strokeLinecap="round" />
          <path d="M 56 54 L 60 49 L 64 54" stroke={eye} strokeWidth="2" fill="none" strokeLinejoin="round" strokeLinecap="round" />
        </>
      )}
      {expression === 'shy' && (
        <>
          {/* small dot eyes looking down */}
          <circle cx="40" cy="54" r="1.6" fill={eye} />
          <circle cx="60" cy="54" r="1.6" fill={eye} />
          {/* blush extra */}
          <ellipse cx="34" cy="62" rx="4" ry="2.2" fill="#E7A2AC" opacity="0.65" />
          <ellipse cx="66" cy="62" rx="4" ry="2.2" fill="#E7A2AC" opacity="0.65" />
        </>
      )}
      {expression === 'grumpy' && (
        <>
          {/* angry V brows + slits */}
          <path d="M 35 48 L 44 51" stroke={eye} strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M 65 48 L 56 51" stroke={eye} strokeWidth="2" fill="none" strokeLinecap="round" />
          <circle cx="41" cy="54" r="1.8" fill={eye} />
          <circle cx="59" cy="54" r="1.8" fill={eye} />
        </>
      )}
      {expression === 'smug' && (
        <>
          {/* half-closed look — top eyelid */}
          <path d="M 36 52 Q 40 50, 44 52" stroke={eye} strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M 56 52 Q 60 50, 64 52" stroke={eye} strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <ellipse cx="40" cy="54" rx="1.8" ry="1.2" fill={eye} />
          <ellipse cx="60" cy="54" rx="1.8" ry="1.2" fill={eye} />
        </>
      )}
      {expression === 'shocked' && (
        <>
          <circle cx="40" cy="52" r="4" fill="#fff" stroke={eye} strokeWidth="1.5" />
          <circle cx="40" cy="52" r="2" fill={eye} />
          <circle cx="60" cy="52" r="4" fill="#fff" stroke={eye} strokeWidth="1.5" />
          <circle cx="60" cy="52" r="2" fill={eye} />
        </>
      )}
      {expression === 'star-pulse' && (
        <>
          {[40, 60].map((cx) => (
            <g key={cx} transform={`translate(${cx} 52)`}>
              <g className="cat-eye-star-pulse">
                <path d="M 0 -4.5 L 1.2 -1.2 L 4.5 0 L 1.2 1.2 L 0 4.5 L -1.2 1.2 L -4.5 0 L -1.2 -1.2 Z" fill={eye} />
                <circle cx="0" cy="0" r="1" fill="#fff" opacity="0.7" />
              </g>
            </g>
          ))}
        </>
      )}
      {expression === 'heart-float' && (
        <>
          {[{cx:40, d:'0s'}, {cx:60, d:'0.35s'}].map(({cx, d}) => (
            <g key={cx} transform={`translate(${cx} 52)`}>
              <g className="cat-eye-heart-float" style={{ animationDelay: d }}>
                <path d={`M 0 2 C -4 -2, -7 1, -4 4 C -2 6, 0 7, 0 7 C 0 7, 2 6, 4 4 C 7 1, 4 -2, 0 2 Z`} fill="#E7536E" />
              </g>
            </g>
          ))}
          {/* tiny floating heart above */}
          <path d="M 50 38 C 49 36, 47 37, 48 39 C 49 40.5, 50 41, 50 41 C 50 41, 51 40.5, 52 39 C 53 37, 51 36, 50 38 Z"
            fill="#E7536E" opacity="0.6" className="cat-heart-mini" />
        </>
      )}

      {/* nose + mouth */}
      {expression === 'grumpy' ? (
        <>
          <path d="M 49 62 L 51 62 L 50 64 Z" fill={out} />
          {/* frown mouth */}
          <path d="M 46 70 Q 50 67, 54 70" stroke={out} strokeWidth="1.4" fill="none" strokeLinecap="round" />
        </>
      ) : expression === 'shocked' ? (
        <>
          <path d="M 49 62 L 51 62 L 50 64 Z" fill={out} />
          {/* O mouth */}
          <ellipse cx="50" cy="69" rx="2" ry="2.5" fill="#fff" stroke={out} strokeWidth="1.2" />
        </>
      ) : expression === 'lol' ? (
        <>
          <path d="M 49 60 L 51 60 L 50 62 Z" fill={out} />
          {/* big open smile */}
          <path d="M 42 64 Q 50 73, 58 64 Z" fill="#fff" stroke={out} strokeWidth="1.4" strokeLinejoin="round" />
        </>
      ) : (
        <>
          <path d="M 49 60 L 51 60 L 50 62 Z" fill={out} />
          <path d="M 50 62 Q 47 65, 45 64 M 50 62 Q 53 65, 55 64" stroke={out} strokeWidth="1.2" fill="none" strokeLinecap="round" />
        </>
      )}

      {/* whiskers */}
      <path d="M 30 60 L 38 60 M 30 64 L 38 63" stroke={out} strokeWidth="1" strokeLinecap="round" opacity="0.55" />
      <path d="M 70 60 L 62 60 M 70 64 L 62 63" stroke={out} strokeWidth="1" strokeLinecap="round" opacity="0.55" />

      {/* === Props === */}
      {has('beret') && (
        <g>
          <ellipse cx="44" cy="22" rx="18" ry="6" fill="#C97B5F" stroke={out} strokeWidth="1.2" />
          <circle cx="32" cy="18" r="3" fill="#C97B5F" stroke={out} strokeWidth="1.2" />
        </g>
      )}
      {has('beanie') && (
        <g>
          <path d="M 24 28 Q 24 12, 50 10 Q 76 12, 76 28 Z" fill="#8FA287" stroke={out} strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M 22 26 L 78 26 L 78 32 L 22 32 Z" fill="#5E8050" stroke={out} strokeWidth="1.2" />
          <circle cx="50" cy="10" r="3" fill="#F6F1E8" stroke={out} strokeWidth="1" />
        </g>
      )}
      {has('bow') && (
        <g transform="translate(50, 20)">
          <path d="M -10 0 Q -14 -5, -14 0 Q -14 5, -10 0 Z" fill="#E7536E" stroke={out} strokeWidth="1.2" />
          <path d="M 10 0 Q 14 -5, 14 0 Q 14 5, 10 0 Z" fill="#E7536E" stroke={out} strokeWidth="1.2" />
          <circle cx="0" cy="0" r="2.4" fill="#E7536E" stroke={out} strokeWidth="1.2" />
        </g>
      )}
      {has('glasses') && (
        <g>
          <circle cx="40" cy="52" r="6.5" fill="none" stroke={out} strokeWidth="1.5" />
          <circle cx="60" cy="52" r="6.5" fill="none" stroke={out} strokeWidth="1.5" />
          <line x1="46.5" y1="52" x2="53.5" y2="52" stroke={out} strokeWidth="1.5" />
        </g>
      )}
      {has('sunglasses') && (
        <g>
          <path d="M 33 49 L 47 49 L 47 56 Q 47 58, 45 58 L 35 58 Q 33 58, 33 56 Z" fill="#1A1A1A" stroke={out} strokeWidth="1" />
          <path d="M 53 49 L 67 49 L 67 56 Q 67 58, 65 58 L 55 58 Q 53 58, 53 56 Z" fill="#1A1A1A" stroke={out} strokeWidth="1" />
          <line x1="47" y1="51" x2="53" y2="51" stroke={out} strokeWidth="1.5" />
          {/* shine */}
          <path d="M 36 51 L 39 53" stroke="#fff" strokeWidth="1" opacity="0.6" />
          <path d="M 56 51 L 59 53" stroke="#fff" strokeWidth="1" opacity="0.6" />
        </g>
      )}
      {has('headphones') && (
        <g>
          <path d="M 22 50 Q 22 18, 50 18 Q 78 18, 78 50" fill="none" stroke={out} strokeWidth="3.5" strokeLinecap="round" />
          <rect x="16" y="44" width="10" height="14" rx="3" fill={out} stroke={out} strokeWidth="1" />
          <rect x="74" y="44" width="10" height="14" rx="3" fill={out} stroke={out} strokeWidth="1" />
          <rect x="18" y="46" width="6" height="10" rx="2" fill={accent} />
        </g>
      )}
      {has('scarf') && (
        <g>
          <path d="M 22 76 Q 50 70, 78 76 L 78 84 L 22 84 Z" fill="#C97B5F" stroke={out} strokeWidth="1.2" strokeLinejoin="round" />
          <path d="M 30 78 L 32 80 M 38 77 L 40 79 M 46 76 L 48 78 M 54 76 L 56 78 M 62 77 L 64 79 M 70 78 L 72 80" stroke={out} strokeWidth="0.7" opacity="0.5" />
          {/* knot */}
          <path d="M 56 80 Q 60 85, 56 90 Q 62 88, 64 84 Z" fill="#C97B5F" stroke={out} strokeWidth="1" />
        </g>
      )}
      {has('headband') && (
        <g>
          <path d="M 24 30 Q 50 22, 76 30 L 76 36 Q 50 30, 24 36 Z" fill="#D5A23B" stroke={out} strokeWidth="1.2" strokeLinejoin="round" />
          <path d="M 50 22 L 50 18 Q 47 16, 50 14 Q 53 16, 50 18 Z" fill="#D5A23B" stroke={out} strokeWidth="1" />
        </g>
      )}

      {/* === New props — CTRL+N tier === */}
      {has('collar') && (
        <g>
          <path d="M 30 74 Q 50 70, 70 74" stroke={accent} strokeWidth="5" fill="none" strokeLinecap="round" />
          <path d="M 30 74 Q 50 70, 70 74" stroke={out} strokeWidth="0.8" fill="none" strokeLinecap="round" opacity="0.4" />
          <circle cx="50" cy="74" r="3.5" fill="#D5A23B" stroke={out} strokeWidth="1" />
          <path d="M 49 74 L 49 77 L 51 77 L 51 74" fill={out} opacity="0.35" />
        </g>
      )}

      {/* === New props — CTRL+C tier === */}
      {has('pencil') && (
        <g transform="translate(72, 20) rotate(18)">
          <rect x="-2.5" y="-16" width="5" height="4" rx="1" fill="#FFB3BA" stroke={out} strokeWidth="0.9" />
          <rect x="-2.5" y="-12" width="5" height="2" fill="#BBBEC4" stroke={out} strokeWidth="0.5" />
          <rect x="-2.5" y="-10" width="5" height="17" rx="0.5" fill="#F5D155" stroke={out} strokeWidth="0.9" />
          <line x1="0" y1="-10" x2="0" y2="7" stroke={out} strokeWidth="0.5" opacity="0.2" />
          <path d="M -2.5 7 L 0 13 L 2.5 7 Z" fill="#D9C49E" stroke={out} strokeWidth="0.9" />
          <path d="M -0.6 9.5 L 0 13 L 0.6 9.5 Z" fill="#555" />
        </g>
      )}
      {has('coffee') && (
        <g transform="translate(73, 62)">
          <path d="M -6 -8 L -6 5 Q -6 8, -3 8 L 3 8 Q 6 8, 6 5 L 6 -8 Z" fill={fill} stroke={out} strokeWidth="1.2" />
          <path d="M 6 -3 Q 10 -3, 10 1 Q 10 4, 6 4" fill="none" stroke={out} strokeWidth="1.2" />
          <ellipse cx="0" cy="-6" rx="5" ry="1.5" fill="#6B4E3D" opacity="0.55" />
          <path d="M -2 -10 Q -1.5 -13, -1 -10 M 1 -10 Q 1.5 -13, 2 -10" stroke={out} strokeWidth="0.9" fill="none" strokeLinecap="round" opacity="0.45" />
        </g>
      )}

      {/* === New props — CTRL+V tier === */}
      {has('flower') && (
        <g>
          <path d="M 28 28 Q 50 21, 72 28" stroke="#7A9E7E" strokeWidth="2" fill="none" />
          {[{x:33,y:23,c:'#F0A8B8'},{x:50,y:17,c:'#F5D155'},{x:67,y:23,c:'#F0A8B8'}].map(({x,y,c}) => (
            <g key={x}>
              <ellipse cx={x} cy={y-4} rx="3.2" ry="2.4" fill={c} opacity="0.9" />
              <ellipse cx={x} cy={y+4} rx="3.2" ry="2.4" fill={c} opacity="0.9" />
              <ellipse cx={x-4} cy={y} rx="2.4" ry="3.2" fill={c} opacity="0.9" />
              <ellipse cx={x+4} cy={y} rx="2.4" ry="3.2" fill={c} opacity="0.9" />
              <circle cx={x} cy={y} r="2.8" fill={x===50 ? '#C97B5F' : '#F5D155'} />
            </g>
          ))}
          <path d="M 40 25 Q 43 20, 45 25 Z" fill="#7A9E7E" />
          <path d="M 55 25 Q 57 20, 60 25 Z" fill="#7A9E7E" />
        </g>
      )}
      {has('cap') && (
        <g>
          <path d="M 26 30 Q 26 13, 50 12 Q 74 13, 74 30 Z" fill={accent} stroke={out} strokeWidth="1.3" strokeLinejoin="round" />
          <path d="M 20 30 L 80 30 L 78 35 Q 50 38, 22 35 Z" fill={accent} stroke={out} strokeWidth="1.2" strokeLinejoin="round" />
          <line x1="50" y1="12" x2="50" y2="30" stroke={out} strokeWidth="0.7" opacity="0.25" />
          <circle cx="50" cy="12" r="2.2" fill={out} />
        </g>
      )}

      {/* === New props — CTRL+Z tier === */}
      {has('crown') && (
        <g>
          <path d="M 28 31 L 33 17 L 42 25 L 50 12 L 58 25 L 67 17 L 72 31 Z"
            fill="#D5A23B" stroke={out} strokeWidth="1.3" strokeLinejoin="round" />
          <rect x="28" y="29" width="44" height="6" rx="2" fill="#D5A23B" stroke={out} strokeWidth="1.2" />
          <circle cx="50" cy="14" r="3" fill="#E7536E" stroke={out} strokeWidth="0.8" />
          <circle cx="35" cy="21" r="2" fill="#8BA7B8" stroke={out} strokeWidth="0.8" />
          <circle cx="65" cy="21" r="2" fill="#8FA287" stroke={out} strokeWidth="0.8" />
          <circle cx="42" cy="27" r="1.5" fill="#D5A23B" opacity="0.6" />
          <circle cx="58" cy="27" r="1.5" fill="#D5A23B" opacity="0.6" />
        </g>
      )}
      {has('party-hat') && (
        <g>
          <path d="M 44 7 L 28 34 L 64 34 Z" fill="#E7A2AC" stroke={out} strokeWidth="1.3" strokeLinejoin="round" />
          <path d="M 36 25 L 57 25" stroke={out} strokeWidth="1" opacity="0.25" />
          <path d="M 31 31 L 61 31" stroke={out} strokeWidth="1" opacity="0.25" />
          <circle cx="43" cy="20" r="1.8" fill="#D5A23B" />
          <circle cx="51" cy="15" r="1.5" fill="#8FA287" />
          <circle cx="55" cy="25" r="1.2" fill="#8BA7B8" />
          <circle cx="44" cy="7" r="4" fill="#D5A23B" stroke={out} strokeWidth="1.1" />
          <path d="M 28 34 Q 46 40, 64 34" stroke={out} strokeWidth="0.9" fill="none" strokeDasharray="2.5,2" />
        </g>
      )}

      {/* === Tool-themed props — CTRL+C tier === */}
      {has('cursor') && (
        <g transform="translate(67, 8)">
          {/* Classic arrow cursor hovering above head */}
          <path d="M -7 -7 L -7 9 L -3 5.5 L -1 11 L 2 10 L 0 4.5 L 5 4.5 Z"
            fill={fill} stroke={out} strokeWidth="1.2" strokeLinejoin="round" />
          {/* Shadow dot */}
          <ellipse cx="-1" cy="14" rx="5" ry="1.5" fill={out} opacity="0.12" />
        </g>
      )}

      {/* === Tool-themed props — CTRL+V tier === */}
      {has('eyedropper') && (
        <g transform="translate(74, 20) rotate(-25)">
          <rect x="-3" y="-15" width="6" height="18" rx="2.5" fill="#8BA7B8" stroke={out} strokeWidth="1" />
          <path d="M -2 3 L 0 9 L 2 3 Z" fill="#8BA7B8" stroke={out} strokeWidth="1" />
          <circle cx="0" cy="-10" r="3" fill="#E7536E" stroke={out} strokeWidth="0.8" />
          <rect x="-2.2" y="-5" width="4.4" height="2.5" rx="1" fill={out} opacity="0.25" />
        </g>
      )}
      {has('layers') && (
        <g>
          {/* Stacked layers panel badge on head */}
          {[{y:30,c:'#8BA7B8',op:0.7},{y:23,c:'#D5A23B',op:0.85},{y:16,c:'#E7A2AC',op:1}].map(({y,c,op},i) => (
            <g key={i}>
              <rect x="29" y={y} width="42" height="9" rx="2" fill={c} stroke={out} strokeWidth="0.9" opacity={op} />
              <circle cx="34" cy={y+4.5} r="2" fill={out} opacity="0.3" />
              <rect x="38" y={y+2.5} width="18" height="1.5" rx="0.8" fill={out} opacity="0.25" />
            </g>
          ))}
        </g>
      )}

      {/* === Tool-themed props — CTRL+Z tier === */}
      {has('pentool') && (
        <g>
          {/* Pen nib pointing up */}
          <g transform="translate(50, 6)">
            <path d="M 0 18 L -4 4 L 4 4 Z" fill={accent} stroke={out} strokeWidth="1" />
            <path d="M -4 4 L -5 -12 Q -5 -16, 0 -16 Q 5 -16, 5 -12 L 4 4 Z"
              fill={fill} stroke={out} strokeWidth="1.2" />
            <rect x="-1.5" y="-16" width="3" height="5" rx="1" fill={accent} opacity="0.6" />
            {/* plus cursor */}
            <path d="M 9 0 L 13 0 M 11 -2 L 11 2" stroke={out} strokeWidth="1.4" strokeLinecap="round" />
          </g>
          {/* Bezier anchor squares */}
          {[{x:22,y:78},{x:78,y:78},{x:50,y:28}].map(({x,y}) => (
            <rect key={`${x}${y}`} x={x-3.5} y={y-3.5} width="7" height="7"
              fill="#fff" stroke="#8BA7B8" strokeWidth="1.5" rx="0.8" />
          ))}
          {/* Dotted bezier path */}
          <path d="M 22 78 C 22 46, 78 46, 78 78"
            fill="none" stroke="#8BA7B8" strokeWidth="1" strokeDasharray="3,2.5" opacity="0.55" />
        </g>
      )}

      {/* === Animated props — CTRL+S tier === */}
      {has('halo') && (
        <g>
          <ellipse cx="50" cy="13" rx="21" ry="5" fill="none" stroke="#F6C850" strokeWidth="8" opacity="0.18" className="cat-halo-glow" />
          <ellipse cx="50" cy="13" rx="21" ry="5" fill="none" stroke="#D5A23B" strokeWidth="2.8" className="cat-halo" />
          <path d="M 32 11 Q 33 8.5, 37 11" stroke="#fff" strokeWidth="1.4" opacity="0.65" strokeLinecap="round" />
        </g>
      )}
      {has('sparkle-aura') && (
        <g>
          {[
            {x:13,y:34,s:3.5,d:'0s'},{x:87,y:38,s:3,d:'0.55s'},
            {x:15,y:57,s:3,d:'1.1s'},{x:85,y:54,s:3.8,d:'1.6s'},
            {x:50,y:5,s:2.8,d:'0.8s'},{x:25,y:14,s:2.2,d:'1.3s'},
            {x:75,y:14,s:2.2,d:'0.3s'},{x:20,y:76,s:2.5,d:'0.9s'},
            {x:80,y:74,s:2.5,d:'1.8s'},
          ].map(({x,y,s,d}) => (
            <path key={`${x}-${y}`}
              d={`M ${x} ${y-s} L ${x+s*0.38} ${y-s*0.38} L ${x+s} ${y} L ${x+s*0.38} ${y+s*0.38} L ${x} ${y+s} L ${x-s*0.38} ${y+s*0.38} L ${x-s} ${y} L ${x-s*0.38} ${y-s*0.38} Z`}
              fill="#D5A23B" className="cat-sparkle-star" style={{ animationDelay: d }}
            />
          ))}
        </g>
      )}
      {has('rainbow') && (
        <g className="cat-rainbow">
          {[
            {offset:0, color:'#E7536E'},
            {offset:5, color:'#F5A623'},
            {offset:10, color:'#8FA287'},
            {offset:15, color:'#8BA7B8'},
          ].map(({offset, color}) => (
            <path key={offset}
              d={`M ${19+offset} ${32-offset*0.3} Q 50 ${4+offset}, ${81-offset} ${32-offset*0.3}`}
              fill="none" stroke={color} strokeWidth="3.8" strokeLinecap="round" opacity="0.88"
            />
          ))}
        </g>
      )}
      {has('cmd-key') && (
        <g className="cat-cmd-float">
          {/* Key cap */}
          <rect x="30" y="4" width="40" height="22" rx="6"
            fill={isDark ? '#E8E0D4' : '#2B2B2B'} stroke="#D5A23B" strokeWidth="2" />
          {/* Inner bevel */}
          <rect x="33" y="7" width="34" height="16" rx="4"
            fill="none" stroke="#D5A23B" strokeWidth="0.8" opacity="0.4" />
          {/* ⌘ drawn as SVG — 4 loops around a center square */}
          {[{r:0},{r:90},{r:180},{r:270}].map(({r}) => (
            <g key={r} transform={`translate(50,15) rotate(${r})`}>
              <path d="M -2 -2 L -5 -2 Q -8 -2, -8 -5 Q -8 -8, -5 -8 Q -2 -8, -2 -5 Z"
                fill="#D5A23B" />
            </g>
          ))}
          <rect x="47" y="12" width="6" height="6" fill={isDark ? '#E8E0D4' : '#2B2B2B'} />
        </g>
      )}

      {/* === New hats === */}
      {has('bucket') && (
        <g>
          <path d="M 30 28 Q 30 14, 50 14 Q 70 14, 70 28 Z" fill="#8FA287" stroke={out} strokeWidth="1.3" strokeLinejoin="round" />
          <path d="M 24 28 Q 50 35, 76 28 Q 73 33, 50 34 Q 27 33, 24 28 Z" fill="#7A9070" stroke={out} strokeWidth="1.2" strokeLinejoin="round" />
        </g>
      )}
      {has('tophat') && (
        <g>
          <rect x="36" y="6" width="28" height="21" rx="2" fill="#2B2B2B" stroke={out} strokeWidth="1.2" />
          <rect x="36" y="20" width="28" height="4" fill="#C97B5F" />
          <rect x="27" y="26" width="46" height="5" rx="2.5" fill="#2B2B2B" stroke={out} strokeWidth="1.2" />
        </g>
      )}
      {has('wizard') && (
        <g>
          <path d="M 50 2 L 30 32 L 70 32 Z" fill="#3C5878" stroke={out} strokeWidth="1.3" strokeLinejoin="round" />
          <path d="M 26 32 Q 50 38, 74 32 L 73 35 Q 50 40, 27 35 Z" fill="#2E4660" stroke={out} strokeWidth="1.1" strokeLinejoin="round" />
          <path d="M 49 15 L 50.2 18 L 53 19 L 50.2 20 L 49 23 L 47.8 20 L 45 19 L 47.8 18 Z" fill="#F5D155" />
          <circle cx="44" cy="27" r="1" fill="#F5D155" />
          <circle cx="56" cy="23" r="1.2" fill="#F6F1E8" />
        </g>
      )}

      {/* === New face === */}
      {has('monocle') && (
        <g>
          <circle cx="60" cy="52" r="6.5" fill="#C6D4E2" opacity="0.25" />
          <circle cx="60" cy="52" r="6.5" fill="none" stroke={out} strokeWidth="1.6" />
          <path d="M 60 58.5 Q 60 66, 56 70" stroke={out} strokeWidth="1" fill="none" />
        </g>
      )}
      {has('eyepatch') && (
        <g>
          <path d="M 34 50 Q 50 36, 66 48" stroke={out} strokeWidth="1.4" fill="none" />
          <ellipse cx="40" cy="52" rx="6" ry="7" fill="#2B2B2B" stroke={out} strokeWidth="1.2" />
        </g>
      )}

      {/* === New neckwear === */}
      {has('bowtie') && (
        <g transform="translate(50, 76)">
          <path d="M -2 0 L -12 -5 L -12 5 Z" fill="#E7536E" stroke={out} strokeWidth="1.1" strokeLinejoin="round" />
          <path d="M 2 0 L 12 -5 L 12 5 Z" fill="#E7536E" stroke={out} strokeWidth="1.1" strokeLinejoin="round" />
          <rect x="-2.5" y="-3" width="5" height="6" rx="1.5" fill="#C13F58" stroke={out} strokeWidth="1" />
        </g>
      )}
      {has('necktie') && (
        <g>
          <path d="M 47 72 L 53 72 L 51 76 L 49 76 Z" fill="#3C5878" stroke={out} strokeWidth="0.9" strokeLinejoin="round" />
          <path d="M 49 76 L 51 76 L 53 88 L 50 92 L 47 88 Z" fill="#3C5878" stroke={out} strokeWidth="0.9" strokeLinejoin="round" />
        </g>
      )}
      {has('bandana') && (
        <g>
          <path d="M 32 74 Q 50 70, 68 74 L 62 78 Q 50 75, 38 78 Z" fill="#C97B5F" stroke={out} strokeWidth="1.1" strokeLinejoin="round" />
          <path d="M 44 77 L 50 90 L 56 77 Z" fill="#C97B5F" stroke={out} strokeWidth="1.1" strokeLinejoin="round" />
          <circle cx="43" cy="75" r="0.8" fill="#fff" opacity="0.6" />
          <circle cx="57" cy="75" r="0.8" fill="#fff" opacity="0.6" />
          <circle cx="50" cy="73.5" r="0.8" fill="#fff" opacity="0.6" />
        </g>
      )}

      {/* === New held items === */}
      {has('balloon') && (
        <g>
          <path d="M 80 38 Q 76 52, 72 64" stroke={out} strokeWidth="0.8" fill="none" />
          <ellipse cx="80" cy="24" rx="9" ry="11" fill="#E7536E" stroke={out} strokeWidth="1.2" />
          <path d="M 80 35 L 78 38 L 82 38 Z" fill="#E7536E" stroke={out} strokeWidth="1" />
          <ellipse cx="77" cy="20" rx="2.4" ry="3.4" fill="#fff" opacity="0.4" />
        </g>
      )}
      {has('boba') && (
        <g transform="translate(74, 60)">
          <path d="M -6 -7 L 6 -7 L 5 9 Q 5 11, 3 11 L -3 11 Q -5 11, -5 9 Z" fill="#EAD9C0" stroke={out} strokeWidth="1.1" strokeLinejoin="round" />
          <rect x="-6.5" y="-9" width="13" height="3" rx="1" fill="#F6F1E8" stroke={out} strokeWidth="1" />
          <line x1="2" y1="-14" x2="0" y2="8" stroke={out} strokeWidth="1.4" strokeLinecap="round" />
          <circle cx="-2" cy="7" r="1.2" fill="#3A2A1A" />
          <circle cx="1.6" cy="8" r="1.2" fill="#3A2A1A" />
          <circle cx="-0.4" cy="4.5" r="1.2" fill="#3A2A1A" />
        </g>
      )}
      {has('fish') && (
        <g transform="translate(75, 64)">
          <path d="M -6 0 Q 0 -6, 8 0 Q 0 6, -6 0 Z" fill="#8BA7B8" stroke={out} strokeWidth="1" strokeLinejoin="round" />
          <path d="M -6 0 L -11 -4 L -11 4 Z" fill="#8BA7B8" stroke={out} strokeWidth="1" strokeLinejoin="round" />
          <circle cx="4" cy="-1" r="1" fill={out} />
        </g>
      )}
    </svg>
  );
};

// Named characters for the brand — backward-compatible shortcuts.
const CatApprove = ({ size = 80 }) => (
  <CatBase size={size} fill="#F6F1E8" stroke="#2B2B2B" expression="star" accent="#D5A23B" />
);
const CatWFH = ({ size = 80 }) => (
  <CatBase size={size} fill="#EADFCB" stroke="#2B2B2B" expression="happy" accent="#E7A2AC" />
);
const CatASAP = ({ size = 80 }) => (
  <CatBase size={size} fill="#2B2B2B" stroke="#2B2B2B" expression="sparkle" accent="#F6F1E8" />
);
const CatSleepy = ({ size = 60 }) => (
  <CatBase size={size} fill="#EADFCB" stroke="#2B2B2B" expression="sleepy" accent="#8FA287" />
);

// Render an avatar config object into a cat.
const CatAvatar = ({ avatar, size = 64 }) => {
  const a = avatar || {};
  const body = BODY_COLORS.find((c) => c.id === a.body)?.fill || '#F6F1E8';
  const accent = ACCENT_COLORS.find((c) => c.id === a.accent)?.fill || '#D5A23B';
  const eye = EYE_COLORS.find((c) => c.id === a.eyeColor)?.fill;
  return (
    <CatBase
      size={size}
      fill={body}
      accent={accent}
      stroke="#2B2B2B"
      eyeColor={eye}
      expression={a.expression || 'happy'}
      pattern={a.pattern || 'solid'}
      hat={a.hat || 'none'}
      face={a.face || 'none'}
      neck={a.neck || 'none'}
      hand={a.hand || 'none'}
      aura={a.aura || 'none'}
      prop={a.prop || 'none'}
    />
  );
};

// Cute cursor (matches CTRL+S brand mark)
const CursorArrow = ({ size = 18, color = '#2B2B2B' }) => (
  <svg width={size} height={size} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <path d="M 2 1 L 2 14 L 6 11 L 8 16 L 11 15 L 9 10 L 14 10 Z" fill={color} stroke={color} strokeWidth="1" strokeLinejoin="round" />
  </svg>
);

const PawPrint = ({ size = 16, color = '#2B2B2B' }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="6" cy="6" rx="2" ry="2.5" fill={color} />
    <ellipse cx="14" cy="6" rx="2" ry="2.5" fill={color} />
    <ellipse cx="3" cy="11" rx="1.6" ry="2" fill={color} />
    <ellipse cx="17" cy="11" rx="1.6" ry="2" fill={color} />
    <path d="M 10 9 C 6 9, 5 14, 7 16 C 9 18, 11 18, 13 16 C 15 14, 14 9, 10 9 Z" fill={color} />
  </svg>
);

const Bean = ({ size = 14, color = '#6B4E3D' }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
    <path d="M 5 4 Q 14 2, 16 10 Q 16 17, 8 17 Q 2 14, 5 4 Z" fill={color} stroke={color} strokeWidth="1" />
    <path d="M 8 5 Q 10 10, 9 16" stroke={color === '#6B4E3D' ? '#F6F1E8' : '#2B2B2B'} strokeWidth="1" fill="none" />
  </svg>
);

const Sparkle = ({ size = 14, color = '#D5A23B' }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg">
    <path d="M 7 0 L 8 6 L 14 7 L 8 8 L 7 14 L 6 8 L 0 7 L 6 6 Z" fill={color} />
  </svg>
);

const Mug = ({ size = 22, color = '#2B2B2B', fill = '#E7A2AC' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M 5 8 L 5 18 Q 5 21, 8 21 L 15 21 Q 18 21, 18 18 L 18 8 Z" fill={fill} stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M 18 10 Q 22 10, 22 14 Q 22 17, 18 17" fill="none" stroke={color} strokeWidth="1.5" />
    <circle cx="11.5" cy="13" r="1.5" fill={color} />
    <path d="M 9 16 Q 11.5 18, 14 16" stroke={color} strokeWidth="1" fill="none" />
  </svg>
);

const Pouch = ({ size = 50, color = '#2B2B2B', label = '' }) => (
  <svg width={size} height={size} viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
    <path d="M 10 8 L 40 8 L 38 44 Q 38 47, 35 47 L 15 47 Q 12 47, 12 44 Z" fill="#F6F1E8" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M 12 8 L 12 12 L 38 12 L 38 8" fill={color} opacity="0.15" />
    <circle cx="20" cy="26" r="6" fill={color} opacity="0.1" />
    <text x="25" y="28" textAnchor="middle" fontSize="8" fontFamily="Caveat, cursive" fontWeight="700" fill={color}>{label}</text>
  </svg>
);

const FileTag = ({ size = 22, color = '#2B2B2B' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path d="M 5 3 L 15 3 L 19 7 L 19 20 Q 19 21, 18 21 L 5 21 Q 4 21, 4 20 L 4 4 Q 4 3, 5 3 Z" fill="none" stroke={color} strokeWidth="1.4" strokeLinejoin="round" />
    <path d="M 14 3 L 14 8 L 19 8" fill="none" stroke={color} strokeWidth="1.4" />
    <path d="M 7 12 L 16 12 M 7 15 L 14 15 M 7 18 L 12 18" stroke={color} strokeWidth="1.2" />
  </svg>
);

Object.assign(window, {
  CatBase, CatAvatar, CatApprove, CatWFH, CatASAP, CatSleepy,
  CursorArrow, PawPrint, Bean, Sparkle, Mug, Pouch, FileTag,
  EXPRESSIONS, PROPS, PATTERNS, SLOTS, BODY_COLORS, ACCENT_COLORS, EYE_COLORS,
});
