const FIELD_DEFINITIONS = [
  ['category', 'Category', 'Kategori'],
  ['title', 'Potential Failure Mode', 'Potensi Failure Mode'],
  ['mechanism', 'Main Trigger / Detailed Mechanism', 'Pemicu Utama / Mekanisme Detail'],
  ['initiation', 'Initiation', 'Inisiasi'],
  ['continuation', 'Continuation', 'Kelanjutan'],
  ['progression', 'Progression', 'Progresi'],
  ['detectionMonitoring', 'Potential Detection / Monitoring', 'Potensi Deteksi / Monitoring'],
  ['intervention', 'Possible Intervention / Risk Controls', 'Kemungkinan Intervensi / Kontrol Risiko'],
  ['effect', 'Potential Effect / Consequence', 'Potensi Efek / Konsekuensi'],
  ['notes', 'PFMA Notes / Workshop Questions', 'Catatan PFMA / Pertanyaan Workshop'],
  ['ownerAction', 'Owner / Action', 'Pemilik / Tindakan'],
];

export function resolveLocalizedValue(value, lang) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value[lang] || value.id || value.en || '';
}

export function getFailureModeContextFields(fm, lang) {
  return FIELD_DEFINITIONS.flatMap(([key, en, id]) => {
    const value = resolveLocalizedValue(fm[key], lang);
    return value ? [{ key, label: lang === 'id' ? id : en, value, highlighted: key === 'notes' }] : [];
  });
}
