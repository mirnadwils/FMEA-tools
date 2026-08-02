# Live Result Distribution and Profile-Backed Membership

## Goal

Allow facilitators to cross-check participant Risk assessments by exposing anonymous per-failure-mode response distributions, and ensure participants join sessions using their persisted profile without being asked to re-enter or change their role or experience.

## Scope

This revision affects the authenticated Risk-only workflow only. It keeps participant identities private in Live Results and does not alter the existing weighted-average calculation.

## Live Results

For every failure mode with complete saved Risk drafts, the facilitator-only Live Results API returns:

- `count`: number of complete Risk responses.
- Existing weighted averages, rounded ratings, matrix score, and risk level.
- `likelihoodDistribution`: counts for ratings `1` through `5`.
- `consequenceDistribution`: counts for ratings `1` through `5`.
- `combinationDistribution`: a 5 by 5 count matrix indexed by likelihood and negative consequence. Each cell reports the number of respondents selecting that exact pair.

Only drafts that contain both `risk_likelihood` and `negative_consequence` count toward any distribution. No response can be attributed to a member, profile, name, email, or other personally identifying data.

The facilitator Results tab renders, for each failure mode:

1. Existing aggregate-risk summary.
2. A Likelihood table for ratings 1 to 5 and their response counts.
3. A Consequence table for ratings 1 to 5 and their response counts.
4. A labelled Likelihood by Consequence 5 by 5 matrix showing response counts in each pair.

The existing six-second refresh continues to update the data. The participant role remains prohibited from reading the Live Results endpoint.

## Participant Membership

The participant join screen contains only the session-code field and Join button. It no longer renders or validates role, custom role, or experience inputs.

When the participant joins, the server:

1. Gets the authenticated Clerk user ID.
2. Reads that user’s persisted Neon profile.
3. Rejects the join with a clear `400` error if the professional role or experience is missing.
4. Creates a membership from the persisted `professional_role_key`, `custom_role_text`, and `experience_level`.

The membership endpoint accepts no profile fields from the browser. On a repeat join to the same session, it preserves the membership’s original values rather than overwriting them. Profile changes can only occur through the dedicated profile-update flow, and they do not retroactively rewrite existing session memberships.

## API Contracts

`POST /api/sessions/[code]/membership`

- Request body: no profile attributes are required or used.
- Successful response: the persisted-or-created session membership.
- Missing profile role or experience: HTTP 400 with an actionable error.

`GET /api/sessions/[code]/live-results`

- Facilitator response adds the three anonymous distribution fields to each item in `aggregated`.
- Participant response remains HTTP 403.

## Testing

Automated tests must cover:

- Distribution counts for independent Likelihood and Consequence ratings.
- Correct 5 by 5 pairing counts and exclusion of incomplete drafts.
- Membership creation using stored profile data rather than request-body values.
- Rejoining does not overwrite an existing membership’s saved role or experience.
- Missing persisted profile attributes prevent joining.

## Error Handling

- The join screen surfaces the server’s missing-profile error instead of incorrectly reporting that the session code is invalid.
- The Live Results UI gracefully treats unavailable distribution fields as zero-count values while the API and UI are deployed together.
