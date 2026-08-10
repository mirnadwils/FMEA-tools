# Field Work Terminology Revision

## Goal

Rename the user-profile attribute currently presented as Professional Role / Peran Profesional to Field Work / Bidang Pekerjaan, and apply the approved Indonesian and English labels to every selectable value.

## Compatibility

The internal `professional_role_key` property, database columns, API request names, session membership fields, audit-log metadata, and the twenty existing stable option keys remain unchanged. This is a presentation and copy revision only; existing user profiles and session memberships display their new label automatically without migration.

## UI Copy

The profile setup form, editable account panel in the header, persisted-profile summary, and profile-incomplete validation copy use:

- Indonesian: `Bidang Pekerjaan`
- English: `Field Work`

## Field Work Labels

| Stable key | Indonesian | English |
| --- | --- | --- |
| `owner` | Pemilik / Pemilik Aset | Owner / Asset Owner |
| `owners_engineer` | Insinyur Pemilik | Owner's Engineer |
| `eor` | Engineer of Record | Engineer of Record |
| `dam_engineer` | Bidang Bendungan | Dam |
| `geotech` | Bidang Geoteknik | Geotechnical |
| `geologist` | Bidang Geologi / Geologi Teknik | Geology / Engineering Geology |
| `structural` | Bidang Struktur | Structural |
| `hydraulic` | Bidang Hidraulik / Hidrologi | Hydraulics / Hydrology |
| `seismic` | Bidang Seismik | Seismic |
| `instrumentation` | Bidang Instrumentasi | Instrumentation |
| `operations` | Operasi & Pemeliharaan | Operations & Maintenance |
| `construction` | Bidang Konstruksi | Construction |
| `environmental` | Bidang Lingkungan & Sosial | Environmental & Social |
| `emergency` | Kesiapsiagaan Darurat / Keselamatan Bendungan | Emergency Preparedness / Dam Safety |
| `itrb` | ITRB | ITRB |
| `regulator` | Regulator / Pemerintah | Regulator / Government |
| `risk_hse` | Risiko / HSE | Risk / HSE |
| `facilitator_role` | Fasilitator | Facilitator |
| `observer` | Pengamat | Observer |
| `other` | Lainnya | Other |

## Data and Server Labels

`PROFESSIONAL_ROLES` remains the shared source for UI labels until a later, separately approved internal refactor. The migration seed values in `professional_roles` are updated to the same label text using `INSERT ... ON CONFLICT (key) DO UPDATE`, so an existing database receives current label values while preserving keys and session associations.

Server error messages and code comments that users can see must call the attribute Field Work / Bidang Pekerjaan. Internal database names may retain the word `professional_role` for backward compatibility.

## Testing

Automated tests must confirm all twenty stable keys remain available; labels for representative changed options in both languages match this table; the label translation returns Bidang Pekerjaan / Field Work; and no experience-weight constants change.
