// Collection of vector art avatars inspired by TP-Link Tether parental controls & family care apps

export interface AvatarPreset {
  id: string;
  label: string;
  category: 'adult' | 'kid' | 'senior' | 'pet' | 'other';
  svgUrl: string;
  bgColor: string;
}

// Helpers to encode SVG cleanly into a data URI
const createSvgAvatar = (bgGradient: [string, string], innerSvg: string) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bgGradient[0]}" />
        <stop offset="100%" stop-color="${bgGradient[1]}" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="48" fill="url(#g)" />
    ${innerSvg}
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const AVATAR_PRESETS: AvatarPreset[] = [
  // --- ADULTS ---
  {
    id: 'dad',
    label: 'Father / Dad',
    category: 'adult',
    bgColor: '#0284c7',
    svgUrl: createSvgAvatar(['#38bdf8', '#0284c7'], `
      <!-- Hair -->
      <path d="M30 40 C30 26 40 20 50 20 C60 20 70 26 70 40 C68 34 62 30 50 30 C38 30 32 34 30 40 Z" fill="#1e293b" />
      <!-- Head -->
      <circle cx="50" cy="46" r="18" fill="#fde047" />
      <!-- Glasses -->
      <rect x="36" y="42" width="11" height="8" rx="2" fill="none" stroke="#0f172a" stroke-width="2.5" />
      <rect x="53" y="42" width="11" height="8" rx="2" fill="none" stroke="#0f172a" stroke-width="2.5" />
      <line x1="47" y1="46" x2="53" y2="46" stroke="#0f172a" stroke-width="2" />
      <!-- Smile -->
      <path d="M44 56 Q50 60 56 56" fill="none" stroke="#b45309" stroke-width="2" stroke-linecap="round" />
      <!-- Shoulders/Shirt -->
      <path d="M22 92 C22 72 34 68 50 68 C66 68 78 72 78 92 Z" fill="#0369a1" />
      <!-- Collar -->
      <polygon points="50,75 42,68 58,68" fill="#f8fafc" />
      <polygon points="50,84 46,75 54,75" fill="#f43f5e" />
    `)
  },
  {
    id: 'mom',
    label: 'Mother / Mom',
    category: 'adult',
    bgColor: '#ec4899',
    svgUrl: createSvgAvatar(['#f472b6', '#db2777'], `
      <!-- Hair Bun -->
      <circle cx="50" cy="20" r="10" fill="#451a03" />
      <!-- Hair Back -->
      <circle cx="50" cy="44" r="23" fill="#451a03" />
      <!-- Head -->
      <circle cx="50" cy="46" r="17" fill="#fde047" />
      <!-- Eyes & Lashes -->
      <circle cx="43" cy="44" r="2.2" fill="#0f172a" />
      <circle cx="57" cy="44" r="2.2" fill="#0f172a" />
      <path d="M40 41 Q43 39 46 41" fill="none" stroke="#451a03" stroke-width="1.5" />
      <path d="M54 41 Q57 39 60 41" fill="none" stroke="#451a03" stroke-width="1.5" />
      <!-- Smile -->
      <path d="M44 54 Q50 60 56 54" fill="none" stroke="#e11d48" stroke-width="2.5" stroke-linecap="round" />
      <!-- Cheeks -->
      <circle cx="39" cy="51" r="3" fill="#f43f5e" opacity="0.4" />
      <circle cx="61" cy="51" r="3" fill="#f43f5e" opacity="0.4" />
      <!-- Shoulders/Dress -->
      <path d="M22 92 C22 72 34 68 50 68 C66 68 78 72 78 92 Z" fill="#9d174d" />
      <!-- Necklace -->
      <path d="M42 70 Q50 76 58 70" fill="none" stroke="#fef08a" stroke-width="2" />
    `)
  },
  {
    id: 'man_beard',
    label: 'Man / Brother',
    category: 'adult',
    bgColor: '#10b981',
    svgUrl: createSvgAvatar(['#34d399', '#059669'], `
      <!-- Hair -->
      <path d="M30 38 C30 22 42 18 50 18 C58 18 70 22 70 38 C65 32 58 28 50 28 C42 28 35 32 30 38 Z" fill="#78350f" />
      <!-- Head -->
      <circle cx="50" cy="45" r="18" fill="#fed7aa" />
      <!-- Eyes -->
      <circle cx="43" cy="42" r="2.2" fill="#1e293b" />
      <circle cx="57" cy="42" r="2.2" fill="#1e293b" />
      <!-- Beard & Mustache -->
      <path d="M38 48 C38 64 62 64 62 48 C60 54 55 58 50 58 C45 58 40 54 38 48 Z" fill="#78350f" />
      <path d="M42 50 Q50 48 58 50" fill="none" stroke="#78350f" stroke-width="3" stroke-linecap="round" />
      <!-- Shoulders -->
      <path d="M22 92 C22 72 34 68 50 68 C66 68 78 72 78 92 Z" fill="#047857" />
    `)
  },
  {
    id: 'woman_short',
    label: 'Woman / Sister',
    category: 'adult',
    bgColor: '#8b5cf6',
    svgUrl: createSvgAvatar(['#a78bfa', '#7c3aed'], `
      <!-- Hair Bob -->
      <path d="M27 48 C27 24 38 18 50 18 C62 18 73 24 73 48 C73 58 69 62 69 62 C69 50 67 30 50 30 C33 30 31 50 31 62 C31 62 27 58 27 48 Z" fill="#18181b" />
      <!-- Head -->
      <circle cx="50" cy="46" r="17" fill="#fed7aa" />
      <!-- Eyes -->
      <circle cx="43" cy="43" r="2.2" fill="#0f172a" />
      <circle cx="57" cy="43" r="2.2" fill="#0f172a" />
      <!-- Smile -->
      <path d="M44 54 Q50 59 56 54" fill="none" stroke="#e11d48" stroke-width="2.2" stroke-linecap="round" />
      <!-- Earrings -->
      <circle cx="31" cy="49" r="2" fill="#facc15" />
      <circle cx="69" cy="49" r="2" fill="#facc15" />
      <!-- Shoulders -->
      <path d="M22 92 C22 72 34 68 50 68 C66 68 78 72 78 92 Z" fill="#5b21b6" />
    `)
  },

  // --- SENIORS ---
  {
    id: 'grandpa',
    label: 'Grandfather',
    category: 'senior',
    bgColor: '#64748b',
    svgUrl: createSvgAvatar(['#94a3b8', '#475569'], `
      <!-- White Hair Sides -->
      <circle cx="30" cy="46" r="7" fill="#e2e8f0" />
      <circle cx="70" cy="46" r="7" fill="#e2e8f0" />
      <!-- Head Bald Top -->
      <circle cx="50" cy="45" r="18" fill="#fde047" />
      <!-- Glasses -->
      <circle cx="42" cy="42" r="6" fill="none" stroke="#334155" stroke-width="2" />
      <circle cx="58" cy="42" r="6" fill="none" stroke="#334155" stroke-width="2" />
      <line x1="48" y1="42" x2="52" y2="42" stroke="#334155" stroke-width="2" />
      <!-- Big White Mustache -->
      <path d="M39 52 Q45 56 50 52 Q55 56 61 52 Q50 60 39 52 Z" fill="#f1f5f9" />
      <!-- Shoulders / Cardigan -->
      <path d="M22 92 C22 72 34 68 50 68 C66 68 78 72 78 92 Z" fill="#334155" />
      <!-- Cardigan Trim -->
      <line x1="50" y1="68" x2="50" y2="92" stroke="#e2e8f0" stroke-width="3" />
    `)
  },
  {
    id: 'grandma',
    label: 'Grandmother',
    category: 'senior',
    bgColor: '#f59e0b',
    svgUrl: createSvgAvatar(['#fbbf24', '#d97706'], `
      <!-- Silver Curly Hair -->
      <circle cx="50" cy="22" r="10" fill="#e2e8f0" />
      <circle cx="36" cy="30" r="10" fill="#e2e8f0" />
      <circle cx="64" cy="30" r="10" fill="#e2e8f0" />
      <circle cx="30" cy="44" r="9" fill="#e2e8f0" />
      <circle cx="70" cy="44" r="9" fill="#e2e8f0" />
      <!-- Head -->
      <circle cx="50" cy="47" r="17" fill="#fde047" />
      <!-- Cat-eye Glasses -->
      <polygon points="36,40 48,42 45,49 37,47" fill="none" stroke="#7c2d12" stroke-width="2" />
      <polygon points="64,40 52,42 55,49 63,47" fill="none" stroke="#7c2d12" stroke-width="2" />
      <line x1="48" y1="42" x2="52" y2="42" stroke="#7c2d12" stroke-width="2" />
      <!-- Gentle Smile -->
      <path d="M44 56 Q50 60 56 56" fill="none" stroke="#c2410c" stroke-width="2" stroke-linecap="round" />
      <!-- Pearl Necklace -->
      <circle cx="42" cy="71" r="2" fill="#ffffff" />
      <circle cx="46" cy="73" r="2" fill="#ffffff" />
      <circle cx="50" cy="74" r="2" fill="#ffffff" />
      <circle cx="54" cy="73" r="2" fill="#ffffff" />
      <circle cx="58" cy="71" r="2" fill="#ffffff" />
      <!-- Shoulders -->
      <path d="M22 92 C22 72 34 68 50 68 C66 68 78 72 78 92 Z" fill="#92400e" />
    `)
  },

  // --- KIDS / TEENS ---
  {
    id: 'boy_cap',
    label: 'Son / Boy',
    category: 'kid',
    bgColor: '#06b6d4',
    svgUrl: createSvgAvatar(['#22d3ee', '#0891b2'], `
      <!-- Backward / Forward Cap -->
      <path d="M30 38 C30 22 45 18 56 18 C66 18 72 24 72 34 L78 35 L78 39 L70 39 C70 39 65 30 50 30 C35 30 30 38 30 38 Z" fill="#e11d48" />
      <!-- Head -->
      <circle cx="50" cy="48" r="16" fill="#fde047" />
      <!-- Sparkle Eyes -->
      <circle cx="43" cy="46" r="2.5" fill="#0f172a" />
      <circle cx="57" cy="46" r="2.5" fill="#0f172a" />
      <circle cx="44" cy="45" r="0.8" fill="#ffffff" />
      <circle cx="58" cy="45" r="0.8" fill="#ffffff" />
      <!-- Big Kid Smile -->
      <path d="M42 55 Q50 63 58 55 Z" fill="#e11d48" />
      <!-- Shoulders / Hoodie -->
      <path d="M22 92 C22 72 34 68 50 68 C66 68 78 72 78 92 Z" fill="#0e7490" />
      <circle cx="50" cy="78" r="4" fill="#fde047" />
    `)
  },
  {
    id: 'girl_pigtails',
    label: 'Daughter / Girl',
    category: 'kid',
    bgColor: '#a855f7',
    svgUrl: createSvgAvatar(['#c084fc', '#9333ea'], `
      <!-- Pigtails -->
      <circle cx="22" cy="40" r="10" fill="#78350f" />
      <circle cx="78" cy="40" r="10" fill="#78350f" />
      <circle cx="28" cy="42" r="4" fill="#f43f5e" />
      <circle cx="72" cy="42" r="4" fill="#f43f5e" />
      <!-- Hair Top -->
      <path d="M30 40 C30 24 40 20 50 20 C60 20 70 24 70 40 Z" fill="#78350f" />
      <!-- Head -->
      <circle cx="50" cy="46" r="16" fill="#fed7aa" />
      <!-- Eyes with sparkle -->
      <circle cx="43" cy="44" r="2.5" fill="#0f172a" />
      <circle cx="57" cy="44" r="2.5" fill="#0f172a" />
      <circle cx="44" cy="43" r="0.8" fill="#ffffff" />
      <circle cx="58" cy="43" r="0.8" fill="#ffffff" />
      <!-- Cheeks -->
      <circle cx="38" cy="50" r="3" fill="#fb7185" opacity="0.5" />
      <circle cx="62" cy="50" r="3" fill="#fb7185" opacity="0.5" />
      <!-- Smile -->
      <path d="M44 54 Q50 60 56 54" fill="none" stroke="#be123c" stroke-width="2.5" stroke-linecap="round" />
      <!-- Shoulders / T-shirt -->
      <path d="M22 92 C22 72 34 68 50 68 C66 68 78 72 78 92 Z" fill="#f43f5e" />
    `)
  },
  {
    id: 'baby',
    label: 'Baby / Infant',
    category: 'kid',
    bgColor: '#f43f5e',
    svgUrl: createSvgAvatar(['#fda4af', '#f43f5e'], `
      <!-- Head -->
      <circle cx="50" cy="48" r="22" fill="#fed7aa" />
      <!-- Baby Hair Curl -->
      <path d="M50 26 C47 20 55 18 52 14" fill="none" stroke="#b45309" stroke-width="3" stroke-linecap="round" />
      <!-- Big Baby Eyes -->
      <circle cx="42" cy="46" r="3.5" fill="#0f172a" />
      <circle cx="58" cy="46" r="3.5" fill="#0f172a" />
      <circle cx="43.5" cy="44.5" r="1.2" fill="#ffffff" />
      <circle cx="59.5" cy="44.5" r="1.2" fill="#ffffff" />
      <!-- Rosy Cheeks -->
      <circle cx="35" cy="53" r="4" fill="#fb7185" opacity="0.6" />
      <circle cx="65" cy="53" r="4" fill="#fb7185" opacity="0.6" />
      <!-- Pacifier -->
      <circle cx="50" cy="57" r="6" fill="#38bdf8" />
      <circle cx="50" cy="57" r="3" fill="#0284c7" />
      <path d="M47 62 C47 67 53 67 53 62" fill="none" stroke="#38bdf8" stroke-width="2" />
      <!-- Onesie Shoulders -->
      <path d="M22 92 C22 76 34 72 50 72 C66 72 78 76 78 92 Z" fill="#38bdf8" />
    `)
  },

  // --- PETS ---
  {
    id: 'pet_dog',
    label: 'Dog / Pet',
    category: 'pet',
    bgColor: '#f97316',
    svgUrl: createSvgAvatar(['#fdba74', '#ea580c'], `
      <!-- Floppy Ears -->
      <ellipse cx="28" cy="44" rx="8" ry="16" fill="#78350f" transform="rotate(-15 28 44)" />
      <ellipse cx="72" cy="44" rx="8" ry="16" fill="#78350f" transform="rotate(15 72 44)" />
      <!-- Head -->
      <circle cx="50" cy="48" r="20" fill="#fde047" />
      <ellipse cx="50" cy="56" rx="12" ry="9" fill="#ffffff" />
      <!-- Eyes -->
      <circle cx="42" cy="44" r="3" fill="#1e293b" />
      <circle cx="58" cy="44" r="3" fill="#1e293b" />
      <circle cx="43" cy="43" r="1" fill="#ffffff" />
      <circle cx="59" cy="43" r="1" fill="#ffffff" />
      <!-- Cute Nose & Tongue -->
      <ellipse cx="50" cy="53" rx="4" ry="3" fill="#0f172a" />
      <path d="M50 56 L50 60" stroke="#0f172a" stroke-width="2" />
      <path d="M47 60 Q50 65 53 60" fill="#f43f5e" />
      <!-- Collar -->
      <path d="M30 76 Q50 82 70 76" fill="none" stroke="#dc2626" stroke-width="6" stroke-linecap="round" />
      <circle cx="50" cy="80" r="3" fill="#fbbf24" />
      <!-- Body -->
      <path d="M25 92 C25 78 35 74 50 74 C65 74 75 78 75 92 Z" fill="#fde047" />
    `)
  },
  {
    id: 'pet_cat',
    label: 'Cat / Pet',
    category: 'pet',
    bgColor: '#14b8a6',
    svgUrl: createSvgAvatar(['#5eead4', '#0d9488'], `
      <!-- Pointy Ears -->
      <polygon points="28,40 34,18 46,32" fill="#334155" />
      <polygon points="32,36 36,24 43,33" fill="#f472b6" />
      <polygon points="72,40 66,18 54,32" fill="#334155" />
      <polygon points="68,36 64,24 57,33" fill="#f472b6" />
      <!-- Head -->
      <circle cx="50" cy="48" r="19" fill="#475569" />
      <!-- Eyes (Green Cat Eyes) -->
      <ellipse cx="41" cy="45" rx="3.5" ry="4.5" fill="#84cc16" />
      <ellipse cx="59" cy="45" rx="3.5" ry="4.5" fill="#84cc16" />
      <ellipse cx="41" cy="45" rx="1.2" ry="3.8" fill="#0f172a" />
      <ellipse cx="59" cy="45" rx="1.2" ry="3.8" fill="#0f172a" />
      <!-- Nose & Mouth -->
      <polygon points="48,53 52,53 50,55" fill="#f472b6" />
      <path d="M46 56 Q50 59 54 56" fill="none" stroke="#e2e8f0" stroke-width="1.5" stroke-linecap="round" />
      <!-- Whiskers -->
      <line x1="38" y1="52" x2="22" y2="50" stroke="#cbd5e1" stroke-width="1.5" />
      <line x1="38" y1="55" x2="22" y2="57" stroke="#cbd5e1" stroke-width="1.5" />
      <line x1="62" y1="52" x2="78" y2="50" stroke="#cbd5e1" stroke-width="1.5" />
      <line x1="62" y1="55" x2="78" y2="57" stroke="#cbd5e1" stroke-width="1.5" />
      <!-- Collar -->
      <path d="M32 74 Q50 80 68 74" fill="none" stroke="#f59e0b" stroke-width="4" stroke-linecap="round" />
      <circle cx="50" cy="78" r="2.5" fill="#ffffff" />
      <!-- Body -->
      <path d="M26 92 C26 78 36 74 50 74 C64 74 74 78 74 92 Z" fill="#334155" />
    `)
  },

  // --- CAREGIVER / SPECIAL ---
  {
    id: 'caregiver',
    label: 'Caregiver / Nurse',
    category: 'other',
    bgColor: '#3b82f6',
    svgUrl: createSvgAvatar(['#60a5fa', '#2563eb'], `
      <!-- Hair Cap -->
      <path d="M28 40 C28 22 40 18 50 18 C60 18 72 22 72 40 Z" fill="#0284c7" />
      <circle cx="50" cy="46" r="17" fill="#fed7aa" />
      <!-- Eyes & Smile -->
      <circle cx="43" cy="43" r="2.2" fill="#0f172a" />
      <circle cx="57" cy="43" r="2.2" fill="#0f172a" />
      <path d="M44 54 Q50 59 56 54" fill="none" stroke="#059669" stroke-width="2.5" stroke-linecap="round" />
      <!-- Scrubs Body -->
      <path d="M22 92 C22 72 34 68 50 68 C66 68 78 72 78 92 Z" fill="#0284c7" />
      <!-- Stethoscope -->
      <path d="M38 68 C38 82 62 82 62 68" fill="none" stroke="#e2e8f0" stroke-width="2.5" />
      <circle cx="50" cy="83" r="4" fill="#e2e8f0" />
      <circle cx="50" cy="83" r="2" fill="#38bdf8" />
    `)
  },
  {
    id: 'super_kid',
    label: 'Hero / Gamer',
    category: 'other',
    bgColor: '#e11d48',
    svgUrl: createSvgAvatar(['#fb7185', '#be123c'], `
      <!-- Spiky Hair -->
      <polygon points="30,35 34,16 42,28 50,14 58,28 66,16 70,35" fill="#ea580c" />
      <circle cx="50" cy="46" r="17" fill="#fed7aa" />
      <!-- Mask -->
      <path d="M33 42 C33 36 43 38 50 42 C57 38 67 36 67 42 C67 48 57 50 50 46 C43 50 33 48 33 42 Z" fill="#1e293b" />
      <!-- Mask Eye Holes -->
      <ellipse cx="42" cy="43" rx="3.5" ry="2" fill="#ffffff" />
      <ellipse cx="58" cy="43" rx="3.5" ry="2" fill="#ffffff" />
      <!-- Confident Smirk -->
      <path d="M46 55 Q52 58 57 53" fill="none" stroke="#9a3412" stroke-width="2.5" stroke-linecap="round" />
      <!-- Hero Cape / Suit -->
      <path d="M20 92 C20 70 34 66 50 66 C66 66 80 70 80 92 Z" fill="#dc2626" />
      <!-- Emblem -->
      <polygon points="50,72 55,80 45,80" fill="#facc15" />
    `)
  }
];

export const getAvatarPresetById = (id: string): AvatarPreset | undefined => {
  return AVATAR_PRESETS.find(p => p.id === id);
};

export const getDefaultAvatarForRelation = (relation: string): string => {
  const rel = relation.toLowerCase().trim();
  if (rel.includes('father') || rel.includes('dad') || rel.includes('papa')) {
    return AVATAR_PRESETS.find(p => p.id === 'dad')?.svgUrl || AVATAR_PRESETS[0].svgUrl;
  }
  if (rel.includes('mother') || rel.includes('mom') || rel.includes('mama')) {
    return AVATAR_PRESETS.find(p => p.id === 'mom')?.svgUrl || AVATAR_PRESETS[1].svgUrl;
  }
  if (rel.includes('grandpa') || rel.includes('grandfather') || rel.includes('granddad')) {
    return AVATAR_PRESETS.find(p => p.id === 'grandpa')?.svgUrl || AVATAR_PRESETS[4].svgUrl;
  }
  if (rel.includes('grandma') || rel.includes('grandmother') || rel.includes('granny')) {
    return AVATAR_PRESETS.find(p => p.id === 'grandma')?.svgUrl || AVATAR_PRESETS[5].svgUrl;
  }
  if (rel.includes('son') || rel.includes('boy')) {
    return AVATAR_PRESETS.find(p => p.id === 'boy_cap')?.svgUrl || AVATAR_PRESETS[6].svgUrl;
  }
  if (rel.includes('daughter') || rel.includes('girl')) {
    return AVATAR_PRESETS.find(p => p.id === 'girl_pigtails')?.svgUrl || AVATAR_PRESETS[7].svgUrl;
  }
  if (rel.includes('baby') || rel.includes('infant') || rel.includes('toddler')) {
    return AVATAR_PRESETS.find(p => p.id === 'baby')?.svgUrl || AVATAR_PRESETS[8].svgUrl;
  }
  if (rel.includes('dog') || rel.includes('puppy')) {
    return AVATAR_PRESETS.find(p => p.id === 'pet_dog')?.svgUrl || AVATAR_PRESETS[9].svgUrl;
  }
  if (rel.includes('cat') || rel.includes('kitten')) {
    return AVATAR_PRESETS.find(p => p.id === 'pet_cat')?.svgUrl || AVATAR_PRESETS[10].svgUrl;
  }
  if (rel.includes('care') || rel.includes('nurse') || rel.includes('doctor')) {
    return AVATAR_PRESETS.find(p => p.id === 'caregiver')?.svgUrl || AVATAR_PRESETS[11].svgUrl;
  }
  if (rel.includes('sister')) {
    return AVATAR_PRESETS.find(p => p.id === 'woman_short')?.svgUrl || AVATAR_PRESETS[3].svgUrl;
  }
  if (rel.includes('brother')) {
    return AVATAR_PRESETS.find(p => p.id === 'man_beard')?.svgUrl || AVATAR_PRESETS[2].svgUrl;
  }
  return AVATAR_PRESETS[0].svgUrl;
};
