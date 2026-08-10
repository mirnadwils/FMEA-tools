# Facilitator Participants Tab

## Goal

Replace the facilitator-facing Translation editor tab with a Participants tab that shows who has joined a session, their Field Work and experience, and their saved-FM completion progress without exposing individual Risk ratings.

## Scope and Privacy

The existing bilingual FM data and server translation endpoints remain unchanged; only the facilitator Translation tab is removed from the navigation and no longer renders its editor. The new Participants tab is facilitator-only.

Participants continue to receive only their own membership and aggregate member count. A participant cannot retrieve other participants’ identities, Field Work, experience, progress, FM lists, or individual assessment data.

## Membership API

`GET /api/sessions/[code]/membership` keeps its participant response unchanged. For an authenticated facilitator, each `members` item additionally includes:

- `completedFmNos`: FM numbers for which the member has saved both `risk_likelihood` and `negative_consequence`.
- `incompleteFmNos`: all other imported FM numbers in the session, including FMs with no draft or a partial draft.
- `completedCount`: `completedFmNos.length`.
- `totalFmCount`: total imported session FMs.

The facilitator response continues to include the existing `display_name`, `email`, `professional_role_key`, `custom_role_text`, `experience_level`, and joined timestamp. It must not include raw Likelihood/Consequence values, draft timestamps, assessment snapshots, submission data, or experience weighting.

The server computes progress in the membership query/response path. A complete FM requires both risk fields; a missing or partial draft is incomplete. Progress counts every imported FM, regardless of current open/locked/closed status.

## Participants Tab

The facilitator navigation replaces `Translations` with `Participants` and uses the existing users icon. The tab contains one row per session member with:

1. Display name and email.
2. Field Work label, resolved from the shared stable key; custom text is used for the `other` key.
3. Experience label.
4. Completion summary, for example `3 / 8 FM lengkap` in Indonesian or `3 / 8 FMs complete` in English.
5. An expand/collapse control.

Expanding a row reveals separate labelled lists of completed and incomplete FM numbers. Empty lists use an explicit empty-state message. The tab refreshes together with the existing facilitator six-second refresh; it does not make participant clients poll for membership detail.

## Testing

Automated tests must cover:

- Facilitator membership progress classifies a draft as complete only when both Risk fields are present.
- The response includes only participant identity/profile and FM-number progress, never raw Risk ratings or draft records.
- Participant membership responses omit the member list and all progress fields.
- The client labels Field Work, experience, counts, and empty lists correctly in both languages.
