import { query } from './db';

const TRANSLATE_API_KEY = process.env.GOOGLE_TRANSLATE_API_KEY;

/**
 * Translates a given text using Google Cloud Translation API v2.
 * Falls back gracefully if no API key is provided.
 */
export async function translateText(text, targetLang) {
  if (!text || !text.trim()) return '';
  if (!TRANSLATE_API_KEY) {
    console.warn('GOOGLE_TRANSLATE_API_KEY is not set. Skipping translation.');
    return '';
  }

  try {
    const res = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${TRANSLATE_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: text,
        target: targetLang,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      console.error('Translation API error:', errorData);
      return '';
    }

    const data = await res.json();
    return data.data?.translations?.[0]?.translatedText || '';
  } catch (error) {
    console.error('Translation network error:', error);
    return '';
  }
}

/**
 * Batch translates imported FM fields and stores them in `failure_mode_translations`.
 * The system assumes imported excel files are in Indonesian (id) by default.
 */
export async function translateFMFields(failureModeId, fields, sourceLang = 'id') {
  const targetLang = sourceLang === 'id' ? 'en' : 'id';

  for (const [fieldName, sourceText] of Object.entries(fields)) {
    if (!sourceText || !sourceText.trim()) continue;

    let translatedText = '';
    let status = 'pending';

    // Attempt translation
    translatedText = await translateText(sourceText, targetLang);
    if (translatedText) {
      status = 'translated';
    } else {
      status = 'untranslated'; // Graceful fallback
    }

    // Insert or update translation record
    await query(
      `INSERT INTO failure_mode_translations 
        (failure_mode_id, field_name, source_lang, source_text, text_id, text_en, translation_status, translation_provider, translated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'google', NOW())
       ON CONFLICT (failure_mode_id, field_name) DO UPDATE SET
        source_text = EXCLUDED.source_text,
        text_id = EXCLUDED.text_id,
        text_en = EXCLUDED.text_en,
        translation_status = EXCLUDED.translation_status,
        translated_at = NOW()`,
      [
        failureModeId,
        fieldName,
        sourceLang,
        sourceText,
        sourceLang === 'id' ? sourceText : translatedText,
        sourceLang === 'en' ? sourceText : translatedText,
        status,
      ]
    );
  }
}
