# FMEA Risk-Only and Live Results Revision

## Goal

Revise the Clerk-authenticated PT SGO FMEA Workshop Tool into a risk-only assessment workflow. Every participant continues to select an experience level, all imported failure-mode context is shown in the selected language, and only facilitators can see live aggregate results from saved drafts.

## Confirmed Rules

- Opportunity assessment is removed. There is one assessment per failure mode: Risk Likelihood plus Negative Consequence.
- Detection is not a rating. `Potential Detection / Monitoring` remains descriptive FMEA context only.
- Every professional role selects Beginner, Experienced, or Expert. Experience weights remain Beginner = 1, Experienced = 2, Expert = 3.
- The participant cannot access Live Results. Only a Clerk user whose `publicMetadata.appRole` is `facilitator` can retrieve or view live aggregation.
- Saved drafts contribute to Live Results immediately; participants do not need to submit before their saved Risk rating is included.
- A profile is saved in Neon under the authenticated Clerk user ID and is reused after browser refresh and later sign-in.
- The facilitator role is assigned by PT SGO in Clerk. The application must authorize the real Clerk public metadata, not an absent/stale client token claim.
- Imported FMEA field content is automatically translated at import time and stored in both Indonesian and English. The source spreadsheet value is retained unchanged as the source-language version.

## Failure Mode Walkthrough

The assessment form displays these fields before the Risk controls, in this fixed order. Empty values are omitted; headings always use the selected UI language.

1. FM No.
2. Category
3. Potential Failure Mode
4. Main Trigger / Detailed Mechanism
5. Initiation
6. Continuation
7. Progression
8. Potential Detection / Monitoring
9. Possible Intervention / Risk Controls
10. Potential Effect / Consequence
11. PFMA Notes / Workshop Questions
12. Owner / Action

The facilitator imports the source-language spreadsheet. On import, the server sends non-empty textual fields to Google Cloud Translation API for the opposite language and persists both values. The review screen marks translated content as machine-generated and allows the facilitator to edit either language before the FM is opened. Automatic translation is never performed at participant page-render time.

## Root-Cause Corrections

### PDF upload receives `Forbidden: insufficient role`

The current authorization helper reads role data only from `auth().sessionClaims`, which does not necessarily include Clerk public metadata. The `/api/me` route already retrieves the Clerk user and demonstrates the authoritative source: `currentUser().publicMetadata.appRole`.

The replacement authorization service will fetch the authenticated Clerk user on the server, normalize the `appRole` to `facilitator` or `participant`, and use that same result in every protected API route. A Clerk session-token claim may be configured later for performance, but is not an authorization dependency.

### Profile setup repeats after refresh

`ProfileSetup` submits `experienceLevel`, while `PUT /api/me/profile` reads `experience`. The profile endpoint consequently stores the professional role but not experience, and the root component treats the profile as incomplete on every refresh.

The profile request contract becomes `{ preferredLanguage, professionalRoleKey, customRoleText, experienceLevel }` end-to-end. The update route upserts the user first if needed, saves all supplied profile values in Neon, and returns the persisted record. Initial load derives completion only from this returned Neon record.

### Live Results have no saved draft values

The facilitator dashboard requests membership data but replaces every member's drafts with an empty object. In addition, the membership query does not join `assessment_drafts`.

The facilitator-only Live Results endpoint will query session members and their saved Risk drafts in one authorized server response. It returns no participant names, emails, individual draft identities, or raw personal data to participants because participants cannot call the endpoint. The dashboard polls the endpoint while the Results tab is active and immediately after any participant draft save, so saved drafts are aggregated before submission.

## Data Changes

### Keep

- `users`, `sessions`, `failure_modes`, `fm_status`, `session_members`, `assessment_submissions`, `session_documents`, and `audit_logs`.
- `assessment_drafts.risk_likelihood` and `assessment_drafts.negative_consequence`.
- Experience level in user profile and session membership.

### Remove from active workflow

- `assessment_drafts.opp_likelihood` and `assessment_drafts.positive_consequence`.
- Opportunity matrix, labels, response text, form controls, result cards, exports, guideline tables, submission validation, and API fields.
- Legacy Detection rating behavior. Legacy `votes.detection` remains only in archived legacy data and is never read by new routes.

### Add

- A server-owned bilingual representation for the ten translatable FMEA fields: source text/language and Indonesian/English values. It may be implemented as paired `_id`/`_en` columns or a `failure_mode_translations` table keyed by FM and language; the preferred normalized design is a translation table to avoid schema expansion for every field.
- `translation_status`, `translation_provider`, and `translated_at` metadata to identify machine-generated translations and support retry/edit workflows.
- A facilitator-only aggregate result query or route; participant-facing session responses exclude aggregate result data.

## API and Permission Changes

| Area | Facilitator | Participant |
| --- | --- | --- |
| Import and machine-translate FMs | Allowed | Denied |
| Edit source or translated FM descriptions | Allowed before FM opens | Denied |
| Upload/download session PDF | Upload/download | Download if session member |
| Save own Risk draft | Denied | Allowed while not submitted |
| Submit own assessment | Denied | Allowed when every open FM has Likelihood and Negative Consequence |
| Read Live Results | Allowed, aggregate only | Denied with HTTP 403 |
| View own FM context and draft | Allowed | Allowed for session member |

## Action Sequence

1. Add regression tests for Clerk role lookup, profile persistence, participant Live Results denial, facilitator draft aggregation, Risk-only submission completeness, and translation persistence.
2. Replace the server authorization helper so it gets the current Clerk user and validates `publicMetadata.appRole`; apply it to session creation, FM import, status control, documents, submission reopen, export, and Live Results.
3. Repair profile API request names and upsert behavior; hydrate Profile Setup from Neon and bypass it only after a persisted complete profile is returned.
4. Create a Neon migration that removes Opportunity fields from the active draft path, updates submission snapshots to Risk-only, and preserves legacy records for audit rather than deleting historical tables.
5. Remove Opportunity imports, functions, translations, UI, export columns, Guideline content, and completion checks; keep the literal Merdeka Risk matrix.
6. Add `FailureModeWalkthrough` to render all twelve imported fields in order. Build bilingual source/translation storage and a Google Translation import service with facilitator review/edit before release.
7. Replace participant Results tab with only FM List and Guideline. Add a facilitator-only live aggregate API that includes saved drafts and poll it on the Results tab.
8. Verify server authorization, automatic profile resume, translation fallback/error behavior, draft-to-live update latency, participant API denial, Risk submission locking, lint, and production build.

## Error Handling and Safety

- Translation failure never discards source text; it flags the affected field as untranslated and prevents opening that FM until the facilitator supplies/corrects the target language.
- Google credentials remain server-only and are never exposed to the browser.
- Import requests are size-limited and translation calls are batched, rate-limited, and retried only for transient failures.
- Existing opportunity drafts and snapshots are archived/read-only. New Risk-only queries never include opportunity fields.
- Live results aggregate only saved drafts; unsaved values in an open browser are not counted.
