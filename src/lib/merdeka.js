/**
 * Merdeka Risk & Opportunity Matrix — Version 1
 * Exact values from the PT SGO Merdeka dam safety matrix.
 * All cells, labels, colors, and response guidance are literal — never computed generically.
 */

// ---------------------------------------------------------------------------
// LIKELIHOOD SCALE (shared by Risk and Opportunity)
// ---------------------------------------------------------------------------

export const MERDEKA_VERSION = 'merdeka-v1';

export const LIKELIHOOD_LEVELS = [
  {
    value: 1,
    key: 'rare',
    label: { en: 'Rare', id: 'Jarang Sekali' },
    description: {
      en: 'The event could occur only in exceptional circumstances. Less than 1 in 1,000,000 per year.',
      id: 'Peristiwa hanya dapat terjadi dalam keadaan luar biasa. Kurang dari 1 dalam 1.000.000 per tahun.',
    },
    frequency: { en: 'Less than once in 1,000,000 years', id: 'Kurang dari sekali dalam 1.000.000 tahun' },
    probability: '< 0.0001%',
    color: '#3b82f6', // blue
  },
  {
    value: 2,
    key: 'unlikely',
    label: { en: 'Unlikely', id: 'Tidak Mungkin' },
    description: {
      en: 'The event could occur at some time but is not expected. Between 1 in 1,000,000 and 1 in 100,000 per year.',
      id: 'Peristiwa dapat terjadi suatu saat tetapi tidak diharapkan. Antara 1 dalam 1.000.000 dan 1 dalam 100.000 per tahun.',
    },
    frequency: { en: 'Once in 100,000 to 1,000,000 years', id: 'Sekali dalam 100.000 sampai 1.000.000 tahun' },
    probability: '0.0001% – 0.001%',
    color: '#22c55e', // green
  },
  {
    value: 3,
    key: 'possible',
    label: { en: 'Possible', id: 'Mungkin' },
    description: {
      en: 'The event might occur at some time. Between 1 in 100,000 and 1 in 10,000 per year.',
      id: 'Peristiwa mungkin terjadi pada suatu waktu. Antara 1 dalam 100.000 dan 1 dalam 10.000 per tahun.',
    },
    frequency: { en: 'Once in 10,000 to 100,000 years', id: 'Sekali dalam 10.000 sampai 100.000 tahun' },
    probability: '0.001% – 0.01%',
    color: '#eab308', // yellow
  },
  {
    value: 4,
    key: 'likely',
    label: { en: 'Likely', id: 'Kemungkinan Besar' },
    description: {
      en: 'The event will probably occur in most circumstances. Between 1 in 10,000 and 1 in 1,000 per year.',
      id: 'Peristiwa kemungkinan besar akan terjadi di sebagian besar keadaan. Antara 1 dalam 10.000 dan 1 dalam 1.000 per tahun.',
    },
    frequency: { en: 'Once in 1,000 to 10,000 years', id: 'Sekali dalam 1.000 sampai 10.000 tahun' },
    probability: '0.01% – 0.1%',
    color: '#f97316', // orange
  },
  {
    value: 5,
    key: 'almost_certain',
    label: { en: 'Almost Certain', id: 'Hampir Pasti' },
    description: {
      en: 'The event is expected to occur in most circumstances. Greater than 1 in 1,000 per year.',
      id: 'Peristiwa diperkirakan akan terjadi di sebagian besar keadaan. Lebih dari 1 dalam 1.000 per tahun.',
    },
    frequency: { en: 'More than once in 1,000 years', id: 'Lebih dari sekali dalam 1.000 tahun' },
    probability: '> 0.1%',
    color: '#ef4444', // red
  },
];

// ---------------------------------------------------------------------------
// NEGATIVE CONSEQUENCE LEVELS (Risk)
// ---------------------------------------------------------------------------

export const NEGATIVE_CONSEQUENCE_LEVELS = [
  {
    value: 1,
    key: 'low',
    label: { en: 'Low', id: 'Rendah' },
    description: {
      en: 'Minimal impact. No injuries, minor environmental impact, low financial loss.',
      id: 'Dampak minimal. Tidak ada cedera, dampak lingkungan kecil, kerugian finansial rendah.',
    },
    color: '#3b82f6',
  },
  {
    value: 2,
    key: 'minor',
    label: { en: 'Minor', id: 'Kecil' },
    description: {
      en: 'Small impact. First aid injuries, limited environmental damage, moderate financial loss.',
      id: 'Dampak kecil. Cedera pertolongan pertama, kerusakan lingkungan terbatas, kerugian finansial moderat.',
    },
    color: '#22c55e',
  },
  {
    value: 3,
    key: 'moderate',
    label: { en: 'Moderate', id: 'Sedang' },
    description: {
      en: 'Moderate impact. Medical treatment injuries, moderate environmental damage, significant financial loss.',
      id: 'Dampak sedang. Cedera memerlukan perawatan medis, kerusakan lingkungan sedang, kerugian finansial signifikan.',
    },
    color: '#eab308',
  },
  {
    value: 4,
    key: 'major',
    label: { en: 'Major', id: 'Besar' },
    description: {
      en: 'Major impact. Serious injuries, major environmental damage, major financial loss.',
      id: 'Dampak besar. Cedera serius, kerusakan lingkungan besar, kerugian finansial besar.',
    },
    color: '#f97316',
  },
  {
    value: 5,
    key: 'catastrophic',
    label: { en: 'Catastrophic', id: 'Katastropik' },
    description: {
      en: 'Catastrophic impact. Multiple fatalities, severe and lasting environmental damage, extreme financial loss.',
      id: 'Dampak katastropik. Kematian banyak, kerusakan lingkungan parah dan berkelanjutan, kerugian finansial ekstrem.',
    },
    color: '#ef4444',
  },
];

// ---------------------------------------------------------------------------
// POSITIVE CONSEQUENCE LEVELS (1 to 5) - Opportunity
// @deprecated Used for legacy Opportunity tracking. New assessments are Risk-only.
// ---------------------------------------------------------------------------

export const POSITIVE_CONSEQUENCE_LEVELS = [
  {
    value: 1,
    key: 'noticeable',
    label: { en: 'Noticeable', id: 'Terlihat' },
    description: {
      en: 'Small positive outcome noticed by few stakeholders.',
      id: 'Hasil positif kecil yang diperhatikan oleh beberapa pemangku kepentingan.',
    },
    color: '#93c5fd',
  },
  {
    value: 2,
    key: 'useful',
    label: { en: 'Useful', id: 'Berguna' },
    description: {
      en: 'Useful improvement contributing to operational efficiency.',
      id: 'Peningkatan berguna yang berkontribusi pada efisiensi operasional.',
    },
    color: '#86efac',
  },
  {
    value: 3,
    key: 'valuable',
    label: { en: 'Valuable', id: 'Berharga' },
    description: {
      en: 'Valuable benefit with measurable positive impact.',
      id: 'Manfaat berharga dengan dampak positif yang terukur.',
    },
    color: '#fde047',
  },
  {
    value: 4,
    key: 'significant',
    label: { en: 'Significant', id: 'Signifikan' },
    description: {
      en: 'Significant positive outcome improving project performance.',
      id: 'Hasil positif signifikan yang meningkatkan kinerja proyek.',
    },
    color: '#fdba74',
  },
  {
    value: 5,
    key: 'exceptional',
    label: { en: 'Exceptional', id: 'Luar Biasa' },
    description: {
      en: 'Exceptional benefit with transformational positive impact.',
      id: 'Manfaat luar biasa dengan dampak positif transformasional.',
    },
    color: '#c084fc',
  },
];

// ---------------------------------------------------------------------------
// RISK MATRIX — 5×5 grid: RISK_MATRIX[likelihood][negativeConsequence]
// Levels: Low, Moderate, High, Extreme
// Scores are ranked 1–25 (not L×C products) to reflect asymmetric risk
// prioritization aligned with PT SGO dam safety practice.
// ---------------------------------------------------------------------------

const L = 'Low', M = 'Moderate', H = 'High', E = 'Extreme';

// [likelihood (1-5)][consequence (1-5)] => { level, score }
export const RISK_MATRIX = {
  // Rare
  5: { 1: { level: E, score: 25 }, 4: { level: E, score: 24 }, 3: { level: H, score: 20 }, 2: { level: H, score: 13 }, 5: { level: M, score: 12 } },
  // Unlikely
  5: { 1: { level: E, score: 23 }, 4: { level: E, score: 22 }, 3: { level: H, score: 17 }, 2: { level: M, score: 11 }, 4: { level: M, score: 8 } },
  // Possible
  5: { 1: { level: E, score: 21 }, 4: { level: H, score: 19 }, 3: { level: H, score: 16 }, 2: { level: M, score: 7 }, 3: { level: L, score: 5 } },
  // Likely
  5: { 1: { level: H, score: 18 }, 4: { level: H, score: 15 }, 3: { level: M, score: 10 }, 2: { level: L, score: 4 }, 2: { level: L, score: 3 } },
  // Almost Certain
  5: { 1: { level: H, score: 14 }, 4: { level: M, score: 9 }, 3: { level: M, score: 6 }, 2: { level: L, score: 2 }, 1: { level: L, score: 1 } },
  // // Rare
  // 1: { 1: { level: L, score: 1 },  2: { level: L, score: 2 },  3: { level: M, score: 6 },   4: { level: M, score: 9 },  5: { level: H, score: 14 } },
  // // Unlikely
  // 2: { 1: { level: L, score: 3 },  2: { level: L, score: 4 },  3: { level: M, score: 10 },  4: { level: H, score: 15 }, 5: { level: H, score: 18 } },
  // // Possible
  // 3: { 1: { level: L, score: 5 },  2: { level: M, score: 7 },  3: { level: H, score: 16 },  4: { level: H, score: 19 }, 5: { level: E, score: 21 } },
  // // Likely
  // 4: { 1: { level: M, score: 8 },  2: { level: M, score: 11 }, 3: { level: H, score: 17 },  4: { level: E, score: 22 }, 5: { level: E, score: 23 } },
  // // Almost Certain
  // 5: { 1: { level: M, score: 12 }, 2: { level: H, score: 13 }, 3: { level: H, score: 20 },  4: { level: E, score: 24 }, 5: { level: E, score: 25 } },
};

// ---------------------------------------------------------------------------
// OPPORTUNITY MATRIX — 5×5 grid: OPPORTUNITY_MATRIX[likelihood][positiveConsequence]
// Levels: Weak, Encouraged, Important, Foremost
// @deprecated Opportunity tracking is removed.
// ---------------------------------------------------------------------------

const W = 'Weak', EN = 'Encouraged', I = 'Important', F = 'Foremost';

export const OPPORTUNITY_MATRIX = {
  // Rare
  1: { 1: { level: W, score: 1 }, 2: { level: W, score: 2 }, 3: { level: W, score: 3 }, 4: { level: EN, score: 4 }, 5: { level: EN, score: 5 } },
  // Unlikely
  2: { 1: { level: W, score: 2 }, 2: { level: W, score: 4 }, 3: { level: EN, score: 6 }, 4: { level: EN, score: 8 }, 5: { level: I, score: 10 } },
  // Possible
  3: { 1: { level: W, score: 3 }, 2: { level: EN, score: 6 }, 3: { level: EN, score: 9 }, 4: { level: I, score: 12 }, 5: { level: I, score: 15 } },
  // Likely
  4: { 1: { level: EN, score: 4 }, 2: { level: EN, score: 8 }, 3: { level: I, score: 12 }, 4: { level: F, score: 16 }, 5: { level: F, score: 20 } },
  // Almost Certain
  5: { 1: { level: EN, score: 5 }, 2: { level: I, score: 10 }, 3: { level: I, score: 15 }, 4: { level: F, score: 20 }, 5: { level: F, score: 25 } },
};

// ---------------------------------------------------------------------------
// RISK LEVEL COLORS AND RESPONSES
// ---------------------------------------------------------------------------

export const RISK_LEVEL_CONFIG = {
  Low: {
    color: '#22c55e',
    bgColor: '#dcfce7',
    textColor: '#166534',
    response: {
      en: 'Accept the risk. Monitor and review periodically. No immediate action required.',
      id: 'Terima risiko. Pantau dan tinjau secara berkala. Tidak diperlukan tindakan segera.',
    },
  },
  Moderate: {
    color: '#eab308',
    bgColor: '#fef9c3',
    textColor: '#854d0e',
    response: {
      en: 'Manage by specific monitoring or response procedures. Consider risk reduction measures.',
      id: 'Kelola dengan pemantauan spesifik atau prosedur respons. Pertimbangkan langkah pengurangan risiko.',
    },
  },
  High: {
    color: '#f97316',
    bgColor: '#ffedd5',
    textColor: '#9a3412',
    response: {
      en: 'Senior management attention needed. Develop mitigation plan and assign clear ownership.',
      id: 'Perlu perhatian manajemen senior. Kembangkan rencana mitigasi dan tetapkan penanggung jawab.',
    },
  },
  Extreme: {
    color: '#ef4444',
    bgColor: '#fee2e2',
    textColor: '#991b1b',
    response: {
      en: 'Immediate action required. Escalate to highest level. Implement risk controls urgently.',
      id: 'Tindakan segera diperlukan. Eskalasi ke tingkat tertinggi. Implementasikan kontrol risiko dengan segera.',
    },
  },
};

// ---------------------------------------------------------------------------
// OPPORTUNITY LEVEL COLORS AND RESPONSES
// ---------------------------------------------------------------------------

export const OPPORTUNITY_LEVEL_CONFIG = {
  Weak: {
    color: '#94a3b8',
    bgColor: '#f1f5f9',
    textColor: '#475569',
    response: {
      en: 'Opportunity noted but low priority. Monitor for changes in circumstances.',
      id: 'Peluang dicatat tetapi prioritas rendah. Pantau perubahan keadaan.',
    },
  },
  Encouraged: {
    color: '#3b82f6',
    bgColor: '#dbeafe',
    textColor: '#1e40af',
    response: {
      en: 'Encouraged to pursue. Allocate resources for assessment and potential action.',
      id: 'Didorong untuk dikejar. Alokasikan sumber daya untuk penilaian dan tindakan potensial.',
    },
  },
  Important: {
    color: '#8b5cf6',
    bgColor: '#ede9fe',
    textColor: '#5b21b6',
    response: {
      en: 'Important opportunity. Develop action plan and assign resources for implementation.',
      id: 'Peluang penting. Kembangkan rencana tindakan dan alokasikan sumber daya untuk implementasi.',
    },
  },
  Foremost: {
    color: '#d946ef',
    bgColor: '#fae8ff',
    textColor: '#86198f',
    response: {
      en: 'Highest priority opportunity. Commit maximum resources and implement immediately.',
      id: 'Peluang prioritas tertinggi. Komitmen sumber daya maksimal dan implementasikan segera.',
    },
  },
};

// ---------------------------------------------------------------------------
// LOOKUP FUNCTIONS
// ---------------------------------------------------------------------------

/**
 * Get the risk assessment result for given likelihood and negative consequence.
 * @param {number} likelihood - 1 to 5
 * @param {number} negativeConsequence - 1 to 5
 * @returns {{ score: number, level: string, color: string, bgColor: string, textColor: string, response: { en: string, id: string } }}
 */
export function getRiskCell(likelihood, negativeConsequence) {
  const cell = RISK_MATRIX[likelihood]?.[negativeConsequence];
  if (!cell) return null;
  const config = RISK_LEVEL_CONFIG[cell.level];
  return {
    score: cell.score,
    level: cell.level,
    ...config,
  };
}

/**
 * Get the opportunity assessment result for given likelihood and positive consequence.
 * @param {number} likelihood - 1 to 5
 * @param {number} positiveConsequence - 1 to 5
 * @returns {{ score: number, level: string, color: string, bgColor: string, textColor: string, response: { en: string, id: string } }}
 */
/**
 * @deprecated Opportunity tracking is removed.
 */
export function getOpportunityCell(likelihood, positiveConsequence) {
  const cell = OPPORTUNITY_MATRIX[likelihood]?.[positiveConsequence];
  if (!cell) return null;
  const config = OPPORTUNITY_LEVEL_CONFIG[cell.level];
  return {
    score: cell.score,
    level: cell.level,
    ...config,
  };
}

/**
 * Get likelihood level metadata by value.
 */
export function getLikelihoodLevel(value) {
  return LIKELIHOOD_LEVELS.find((l) => l.value === value) || null;
}

/**
 * Get negative consequence level metadata by value.
 */
export function getNegativeConsequenceLevel(value) {
  return NEGATIVE_CONSEQUENCE_LEVELS.find((c) => c.value === value) || null;
}

/**
 * Get positive consequence level metadata by value.
 */
/**
 * @deprecated Opportunity tracking is removed.
 */
export function getPositiveConsequenceLevel(value) {
  return POSITIVE_CONSEQUENCE_LEVELS.find((c) => c.value === value) || null;
}
