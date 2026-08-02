# Vercel Blob, Bilingual FM Import, and FMEA Workshop Branding

## Goal

Make session PDF uploads durable on Vercel, require facilitator-provided Indonesian and English failure-mode data during Excel import, show the authenticated user’s role and experience in the application header, and simplify all primary branding to FMEA Workshop.

## Scope

This work covers document storage, bilingual import validation and persistence, header presentation, and title/logo updates. It does not change Risk assessment calculations, live-result aggregation, or session permissions beyond document storage access checks already required by the existing workflow.

## PDF Storage with Vercel Blob

The document API replaces the local `.storage/documents` filesystem with `@vercel/blob`.

- `POST /api/sessions/[code]/documents` remains facilitator-only.
- The route validates an uploaded `application/pdf` file and keeps the 20 MB limit before calling `put()` from `@vercel/blob`.
- Blob paths use a session- and version-scoped name such as `session-documents/<code>/v<version>-<timestamp>.pdf`.
- The database stores the Blob URL in the existing `session_documents.storage_key` column. No Blob access token is persisted in Neon.
- New upload versions deactivate prior database records, as before. Blob deletion of prior versions is out of scope so historical document records remain recoverable.
- `GET /api/sessions/[code]/documents` first performs the existing authenticated membership/facilitator authorization, then redirects the authorized caller to the active Blob URL. The `?info=true` response remains metadata-only.
- `BLOB_READ_WRITE_TOKEN` is server-only. It must be configured in the Vercel project environment and local `.env.local`; it is never sent to the browser, committed, or logged. `BLOB_STORE_ID` is configuration metadata and is not required by the runtime API when the read/write token is available.

## Required Bilingual Excel Import

The facilitator provides both Indonesian and English values in the source spreadsheet. Automatic Google translation is removed from the import path.

The import sheet has one shared FM number column and paired `*_id` and `*_en` columns for every translatable field:

| Field | Required spreadsheet columns |
| --- | --- |
| Category | `category_id`, `category_en` |
| Potential Failure Mode | `title_id`, `title_en` |
| Main Trigger / Detailed Mechanism | `mechanism_id`, `mechanism_en` |
| Initiation | `initiation_id`, `initiation_en` |
| Continuation | `continuation_id`, `continuation_en` |
| Progression | `progression_id`, `progression_en` |
| Potential Detection / Monitoring | `detection_monitoring_id`, `detection_monitoring_en` |
| Possible Intervention / Risk Controls | `intervention_id`, `intervention_en` |
| Potential Effect / Consequence | `effect_id`, `effect_en` |
| PFMA Notes / Workshop Questions | `notes_id`, `notes_en` |
| Owner / Action | `owner_action_id`, `owner_action_en` |

`fm_no` is required. All paired columns are required in the template header; a pair may have empty values only when the corresponding FM field is intentionally unused, in which case both ID and EN values must be empty. If one member of a pair is present while the other is blank, client preview blocks import and identifies the row and column pair. The server repeats this validation and rejects invalid requests before it deletes or writes any existing FM data.

The server continues to store the active operational FM text in `failure_modes` using the Indonesian values for compatibility with existing queries. It writes each paired value to `failure_mode_translations.text_id` and `text_en`, with `source_lang = 'manual'`, `source_text` set to the Indonesian value, `translation_status = 'provided'`, `translation_provider = 'facilitator'`, and `translated_at` set when imported. Existing translation review can edit either language as before.

The import screen displays the required paired-column contract and previews the Indonesian title and English title for each accepted row. The client does not call Google Translation; the translation service is removed from the import route.

## Header Account Information and Branding

The application header displays the signed-in user’s display name, professional role label, and experience label next to the Clerk avatar. It reads the persisted Neon profile through the existing `/api/me` response; the role and experience are not editable in the header.

The header uses the supplied image at `public/logo.png`, rendered with an accessible `alt` label. The existing `public/Logo.png` asset is renamed to the requested lowercase filename so it works consistently on case-sensitive deployment filesystems.

The primary application title and browser metadata become `FMEA Workshop`. Primary headings, landing copy, and metadata must no longer call the application Merdeka Matrix. The Risk Matrix remains available as an assessment and guideline concept, so its explanatory table and risk-level labels are not removed.

## Testing

Automated tests must cover:

- Document-upload storage metadata uses the returned Vercel Blob URL, while request authorization, PDF-only validation, size limit, and version deactivation remain enforced.
- Authorized document download redirects to the stored Blob URL; unauthorized users remain denied.
- Valid bilingual FM input creates matching Indonesian and English translation records without calling automatic translation.
- A missing Excel bilingual header and a mismatched non-empty ID/EN pair prevent import before destructive replacement of existing FMs.
- Header profile formatting produces a role and experience label from persisted profile keys and tolerates an incomplete profile without crashing.

## Error Handling

- If Blob credentials are absent or Vercel Blob fails, the upload API returns a clear upload failure and does not create or deactivate database document records.
- Missing, malformed, or mismatched bilingual Excel fields produce row-specific errors and leave existing FMs intact.
- The header falls back to the Clerk user name and hides unavailable profile labels while the profile is loading.
