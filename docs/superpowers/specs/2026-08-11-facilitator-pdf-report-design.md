# Facilitator PDF Report

## Goal

Allow a facilitator to create an English-language, print-ready workshop report from the current session. The report is opened in a dedicated print view and uses the browser print dialog, where the facilitator can choose **Save as PDF**.

The report is a read-only rendering of data that the facilitator is already authorized to view. Creating or printing it must not create, update, delete, lock, or submit any assessment data, and it must not persist a PDF file or a report URL in Neon or Vercel Blob.

## Access and Language

Only a session facilitator can open the print report. A participant must not be able to retrieve the route or its report data.

All report labels, headings, empty states, chart legends, table headers, risk-level names, and generated timestamp wording are always English, independent of the application language currently selected by the facilitator.

## Entry Point and Print Behaviour

The facilitator Export area adds a **Print / Save as PDF** action. It opens a report-specific view for the active session in a new tab/window. That view loads the same facilitator-authorized session, membership, and anonymous live-result data used by the dashboard, then exposes a print action that calls the browser print dialog.

The report stylesheet uses print media rules:

- A4 portrait pages with predictable margins.
- Print-only header/footer metadata with the workshop name, session code, and generated timestamp.
- Screen-only controls hidden during printing.
- `break-before: page` for every top-level section and every FM result, with `break-inside: avoid` on score cards, charts, and short description groups where possible.
- Fixed printable dimensions for Recharts containers so responsive charts are fully rendered before the dialog opens.

If no printer is available, the standard browser dialog remains the supported path for saving a PDF. The application does not generate a server-side PDF binary.

## Report Structure

### Cover and Report Metadata

The first page identifies the report as **FMEA Workshop Report**, followed by the session/workshop name, session code, facilitator name when available, and a generated-at timestamp. It can also show compact totals such as participant count and imported FM count.

### Participants

This section prints the facilitator Participants data in a full table:

1. Participant name and email.
2. Field Work.
3. Experience.
4. Completed FM count / total imported FMs.
5. Completed FM numbers.
6. Incomplete FM numbers.

The report has no raw participant Likelihood, Consequence, individual weighted values, or individual final-risk data.

### Risk Overview

This section contains the complete contents of the existing Risk Overview, without any screen-only filter or pagination limiting the output:

1. The four final-risk count cards: Extreme, High, Moderate, and Low.
2. The final-FM risk-distribution pie chart and its legend/percentages.
3. The per-FM stacked bar chart that shows anonymous complete-response counts by Extreme, High, Moderate, and Low.
4. The global spider/radar chart for the final weighted FM risk scores.
5. The complete FM overview table, including FM number/title and all current risk score and level columns.

The report uses the canonical complete response and final weighted FM data. It does not use a user-selected search text, filter, sort order, hover state, or table pagination from the interactive Risk Overview screen. The table has a stable default order by FM number.

### Live Results by Failure Mode

The report creates one distinct page/section for every imported FM, in stable FM-number order. Each one includes the content of the facilitator Live Result detail view:

1. FM number, category, and potential failure mode title.
2. Category, potential failure mode, main trigger/detailed mechanism, initiation, continuation, progression, potential detection/monitoring, possible intervention/risk controls, potential effect/consequence, PFMA notes/workshop questions, and owner/action.
3. Four result cards: weighted average (Likelihood and Consequence), rounded Likelihood/Consequence pair, final score, and risk level.
4. Likelihood distribution bar chart.
5. Consequence distribution bar chart.
6. Likelihood x Consequence 5x5 heatmap.

The distribution and heatmap counts remain aggregate and anonymous. For FMs without complete assessments, the report shows an explicit **No complete assessments yet** state in place of unavailable scores/charts while retaining the FM description.

## Data Contracts

The report reuses existing facilitator-only contracts rather than introducing participant-level data:

- Session details and imported `fmList` for report metadata and FM descriptions.
- Facilitator membership response for participant profile/progress data.
- Facilitator live-results aggregation for final weighted values and anonymous Likelihood, Consequence, and combination distributions.
- Existing pure overview/distribution mappers for final-risk cards/charts and radar data.

No database schema change, Blob upload, report persistence, background job, or new calculation method is required.

## Error and Loading States

The print view shows an English loading state until all three required datasets are ready. It must disable the print command until the required charts have rendered. If a request fails or the user is not a facilitator, it shows an English access/error state and must not present stale or partial confidential report content.

## Verification

Automated coverage must verify:

- The report route/entry point is facilitator-only.
- Report data does not expose participant-level assessment values.
- All three report sections are present, and every imported FM is represented.
- The print model orders FMs and table data stably and does not consume interactive filters or sorting.
- A no-response FM renders its description with the explicit no-assessment state.

Manual visual verification must use browser Print Preview / Save as PDF in Chromium. Check that every report page is English, all Risk Overview cards, table, and charts appear, each FM begins cleanly, all three FM visualizations are legible, and no chart is clipped or left blank after print layout is applied.
