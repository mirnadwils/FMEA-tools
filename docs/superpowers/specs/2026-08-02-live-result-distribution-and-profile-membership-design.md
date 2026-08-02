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

The final Likelihood and Consequence ratings use an experience-weighted average, not a simple average. The weight mapping is Beginner = 1, Experienced = 2, and Expert = 3. For each rating, the system computes `sum(rating × experienceWeight) / sum(experienceWeight)`, then rounds the result to the nearest whole rating from 1 through 5 before looking up the Merdeka risk cell. The existing display of the precise weighted average remains available for audit.

For example, three Likelihood responses of Beginner = 5, Beginner = 5, and Expert = 2 produce a simple average of `(5 + 5 + 2) / 3 = 4.0`, which would round to 4. The required weighted average is `(5 × 1 + 5 × 1 + 2 × 3) / (1 + 1 + 3) = 16 / 5 = 3.2`, which rounds to 3. Therefore, the Expert response has three times the influence of a Beginner response on the final rating, while the anonymous distribution still reports the unweighted count of selections: two choices of 5 and one choice of 2.

The facilitator Results tab renders, for each failure mode:

1. Existing aggregate-risk summary.
2. A Likelihood bar chart for ratings 1 to 5. Each bar shows its exact response count.
3. A Consequence bar chart for ratings 1 to 5. Each bar shows its exact response count.
4. A labelled Likelihood by Consequence 5 by 5 heatmap showing the response count in every pair. Every cell displays its exact count, including zero-count cells.

The charts must use the unweighted anonymous response counts so facilitators can reconcile them with participant choices. The aggregate summary separately displays the experience-weighted averages and rounded ratings used for the final Merdeka risk score. The charts and heatmap are visual cross-check aids, not replacements for the weighted final calculation.

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
