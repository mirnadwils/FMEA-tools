# FMEA Workshop Modernization Design

## Purpose

Modernize the PT Solusi Geotek Optima FMEA Workshop Tool so authenticated users can resume saved assessments, assess both risk and opportunity under the Merdeka matrix, submit immutable assessments, and access one session-wide bypass justification document.

## Confirmed Decisions

- Authentication uses Clerk email login. Neon PostgreSQL remains the application's system of record.
- Existing anonymous participants and votes are not migrated. All participants start with new Clerk accounts.
- The application has only two account roles: `facilitator` and `participant`.
- PT SGO administrators assign a user's account role in the Clerk Dashboard before the user enters the application. An administrator dashboard is not part of this scope.
- Professional roles are profile attributes, not application permissions. The initial list includes Owner / Asset Owner, Owner's Engineer, Engineer of Record, Dam Engineer, Geotechnical Engineer, Geological Engineer / Engineering Geologist, Structural Engineer, Hydraulic / Hydrology Engineer, Seismic Engineer, Instrumentation Engineer, Operations & Maintenance, Construction Engineer, Environmental & Social Specialist, Emergency Preparedness / Dam Safety, ITRB, Regulator / Government, Risk / HSE, Facilitator, Observer, and Other / Lainnya. A facilitator may add session-specific professional roles.
- The interface is bilingual: Indonesian and English. The user's selected interface language is saved in their profile.
- Experience levels are Beginner (0–3 years), Experienced (3–10 years), and Expert (10+ years) in dam/geotechnical engineering, with Indonesian and English descriptions.
- Each failure mode receives two independent assessments from each participant: Risk and Opportunity.
- The facilitator uploads one PDF bypass justification document for the whole session; it is available to all members of that session from the Guideline tab.
- The assessment is mutable only in Draft status. After a participant submits, it becomes immutable. A facilitator can reopen it only with a mandatory reason recorded in the audit log.

## Architecture

Clerk manages email authentication and authenticated sessions. A signed-in Clerk user is represented by a Neon `users` row keyed by Clerk's immutable user ID. Clerk role metadata is the source for the two application roles; every privileged server route verifies the Clerk session and role rather than trusting data sent by the browser.

Neon stores all FMEA domain data. One user may be a member of many sessions and one session has many members. Per-session membership stores the participant's professional role and experience level so historical workshop records remain correct even if the user later edits their global profile.

The PDF itself is stored in private object storage. Neon stores its title, storage object key, version, uploaded timestamp, and uploader. A protected download route verifies active session membership before issuing a download response or time-limited URL.

## Data Model

### Identity and membership

- `users`: Clerk user ID (unique), email, display name, preferred language, app role, timestamps.
- `professional_roles`: organization-managed initial roles and optional session-specific additions.
- `sessions`: existing workshop session fields plus lifecycle and assessment-template version.
- `session_members`: session ID, user ID, professional role ID or custom role text, experience level, joined timestamp, membership status.

The old `participants.participant_key` is retired for new sessions. Existing records remain untouched unless a later archival decision is made.

### Assessment

- `failure_modes`: remain session-scoped.
- `assessment_drafts`: one row per session member and failure mode; risk likelihood, negative consequence, opportunity likelihood, positive consequence, timestamps.
- `assessment_submissions`: one row per session member; submitted timestamp, template version, and immutable assessment snapshot.
- `assessment_reopens`: submission ID, facilitator user ID, reason, reopened timestamp.
- `audit_logs`: actor user ID, session ID, action, entity type, entity ID, timestamp, and safe structured metadata.

Risk and Opportunity values use separate likelihood fields even though their descriptions come from the same five-level Merdeka likelihood scale. This keeps the two participant judgments independent as required.

### Session document and assessment template

- `session_documents`: one active bypass-justification PDF per session, with historical versions retained.
- `assessment_templates`, `likelihood_levels`, `consequence_levels`, and `matrix_cells`: versioned definitions of the Merdeka tables. A session references a single fixed template version once assessment begins.

The application seeds the following Merdeka configuration from the supplied images:

- Likelihood: Almost Certain, Likely, Possible, Unlikely, Rare, including the supplied description, frequency, and probability.
- Risk: likelihood crossed with Negative Consequence (Catastrophic, Major, Moderate, Minor, Low), producing Low, Moderate, High, or Extreme according to the supplied matrix.
- Opportunity: likelihood crossed with Positive Consequence (Noticeable, Useful, Valuable, Significant, Exceptional), producing Weak, Encouraged, Important, or Foremost according to the supplied matrix.
- Risk and opportunity response guidance follows the supplied response table.

The values in the supplied matrix, including labels, scores, colors, and response guidance, are preserved exactly in seed data and display tables; they are not recomputed from a generic multiplication formula.

## User Flows

### Sign in and profile

1. User signs in through Clerk email authentication.
2. The server creates or updates their Neon user profile using the Clerk user ID.
3. A first-time participant completes professional role, experience level, and preferred language.
4. The user sees sessions they can access. Closing the browser does not lose Draft assessments.

### Facilitator setup

1. A facilitator creates a session, retains the existing session join code, and selects the current Merdeka assessment template.
2. Before opening assessment, the facilitator imports/creates failure modes, uploads the one session PDF, and optionally adds session-specific professional roles.
3. An authenticated participant joins using the session code; the system then creates their session membership.
4. The facilitator opens the relevant failure modes for assessment.

### Participant assessment and submission

1. The participant opens a failure mode and sees its context plus a link to the session PDF.
2. The participant selects Risk likelihood and Negative Consequence; the system displays the resulting risk level, score, and response.
3. The participant separately selects Opportunity likelihood and Positive Consequence; the system displays the resulting opportunity level, score, and response.
4. The draft saves to Neon and remains editable while the assessment has Draft status.
5. Once every required open failure mode has both completed assessment parts, the participant may choose `Submit Assessment / Kirim Penilaian`.
6. The confirmation clearly states that submission locks all assessments in that session.
7. The server atomically creates the immutable submission snapshot and refuses later changes.
8. A facilitator may reopen a participant's assessment by recording a reason; the action appears in the audit trail.

### Guideline and materials

The participant navigation contains `Failure Mode List / Daftar FM`, `Live Results / Hasil Live`, and `Guideline / Panduan`. Guideline includes the secure Download Material button, workflow explanation, the fixed experience-weighting policy (Beginner 1, Experienced 2, Expert 3), the full bilingual Merdeka Likelihood table, risk and opportunity matrices, and response guidance.

## Permissions

| Action | Facilitator | Participant |
| --- | --- | --- |
| Create and configure session | Yes | No |
| Upload or replace session PDF before assessment | Yes | No |
| Add session professional roles | Yes | No |
| Open and close failure modes | Yes | No |
| View live aggregate results | Yes | Yes, after joining the session; individual participant identities and individual votes are never exposed to other participants |
| Save own assessment draft | No | Yes |
| Submit own assessment | No | Yes |
| Modify submitted assessment | Reopen only, with reason | No |
| Download session PDF | Yes | Yes, if an active session member |

## Bilingual and Brand Requirements

All system-owned labels, buttons, validation messages, status text, tables, and help content exist in Indonesian and English. Project data entered by facilitators is shown as entered; bilingual project-data entry is out of scope for this phase.

The global header displays the official PT Solusi Geotek Optima logo, application name, active session name when applicable, language selector, and account menu. The official logo asset must be supplied before production branding is finalized.

## Non-Functional Requirements

- Every API mutation authenticates the Clerk session server-side and authorizes the requester against Neon membership data and Clerk role metadata.
- Browser-provided user IDs, roles, participant keys, and submission status are never trusted.
- PDF uploads are type- and size-validated, stored privately, and never exposed through a public permanent URL.
- Submissions are immutable at the database and API levels, not merely disabled in the user interface.
- Each assessment result records the exact matrix template version used.
- All timestamps use UTC in storage and are presented in the user's local time zone.

## Delivery Sequence

1. Clerk integration, Neon user/profile schema, role authorization, and protected routes.
2. Session membership, professional role and experience capture, and draft persistence/resume.
3. Versioned Merdeka template, separate Risk and Opportunity assessment fields, and result aggregation.
4. Atomic submission lock, controlled reopen, and audit logging.
5. Private session PDF upload/download and Guideline tab.
6. Complete bilingual copy, PT SGO header/logo, automated tests, security review, and deployment checklist.

## Out of Scope for This Phase

- Migration of previous anonymous participant or vote data.
- An in-app PT SGO administrator console.
- More than one active bypass-justification PDF per session.
- Offline-first synchronization.
- Editing a locked session's assessment template after assessments have begun.
