import { query } from './db';

/**
 * Store facilitator-provided bilingual FM field translations.
 * No automatic translation — both ID and EN values come from the Excel import.
 *
 * @param {number} failureModeId - The failure_modes.id
 * @param {Object} fields - Map of field_name → { id: string, en: string }
 */
export async function storeBilingualFields(failureModeId, fields) {
  for (const [fieldName, pair] of Object.entries(fields)) {
    const textId = pair?.id || '';
    const textEn = pair?.en || '';

    // Skip if both are empty (intentionally unused field)
    if (!textId.trim() && !textEn.trim()) continue;

    await query(
      `INSERT INTO failure_mode_translations
        (failure_mode_id, field_name, source_lang, source_text, text_id, text_en,
         translation_status, translation_provider, translated_at)
       VALUES ($1, $2, 'both', $3, $3, $4, 'provided', 'facilitator', NOW())
       ON CONFLICT (failure_mode_id, field_name) DO UPDATE SET
        source_lang = 'both',
        source_text = EXCLUDED.source_text,
        text_id = EXCLUDED.text_id,
        text_en = EXCLUDED.text_en,
        translation_status = 'provided',
        translation_provider = 'facilitator',
        translated_at = NOW()`,
      [failureModeId, fieldName, textId, textEn]
    );
  }
}
