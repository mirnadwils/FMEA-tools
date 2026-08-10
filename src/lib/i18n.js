/**
 * Bilingual dictionary for the FMEA Workshop Tool.
 * Supports Indonesian (id) and English (en).
 * All system-owned labels, buttons, validation messages, status text, tables, and help content.
 */

const dict = {
  // App Shell / Header
  'app.name': {
    en: 'FMEA Workshop',
    id: 'FMEA Workshop',
  },
  'app.company': {
    en: 'PT Solusi Geotek Optima',
    id: 'PT Solusi Geotek Optima',
  },
  'app.subtitle': {
    en: 'Dam Safety Risk Assessment',
    id: 'Penilaian Risiko Keselamatan Bendungan',
  },

  // Landing
  'landing.title': {
    en: 'FMEA Workshop',
    id: 'FMEA Workshop',
  },
  'landing.subtitle': {
    en: 'Collaborative risk assessment for dam safety failure modes.',
    id: 'Penilaian risiko kolaboratif untuk failure mode keselamatan bendungan.',
  },
  'landing.facilitator': {
    en: 'I am a Facilitator',
    id: 'Saya Fasilitator',
  },
  'landing.facilitator_desc': {
    en: 'Create a session, import failure modes, upload materials, and control the assessment workflow.',
    id: 'Buat sesi, import failure mode, unggah materi, dan kontrol alur penilaian.',
  },
  'landing.participant': {
    en: 'I am a Participant',
    id: 'Saya Peserta Workshop',
  },
  'landing.participant_desc': {
    en: 'Join a session with a code, then assess each failure mode for risk.',
    id: 'Gabung sesi dengan kode, lalu nilai setiap failure mode untuk risiko.',
  },
  'landing.start': {
    en: 'Start',
    id: 'Mulai',
  },
  'landing.join': {
    en: 'Join',
    id: 'Gabung',
  },

  // Auth
  'auth.signin': {
    en: 'Sign In',
    id: 'Masuk',
  },
  'auth.signup': {
    en: 'Sign Up',
    id: 'Daftar',
  },
  'auth.signout': {
    en: 'Sign Out',
    id: 'Keluar',
  },

  // Profile
  'profile.title': {
    en: 'Complete Your Profile',
    id: 'Lengkapi Profil Anda',
  },
  'profile.title_short': {
    en: 'Profile',
    id: 'Profil',
  },
  'profile.role': {
    en: 'Field Work',
    id: 'Bidang Pekerjaan',
  },
  'profile.experience': {
    en: 'Experience Level',
    id: 'Tingkat Pengalaman',
  },
  'profile.language': {
    en: 'Preferred Language',
    id: 'Bahasa Pilihan',
  },
  'profile.save': {
    en: 'Save Profile',
    id: 'Simpan Profil',
  },

  // Experience levels
  'experience.beginner': {
    en: 'Beginner (0–3 years in dam/geotechnical engineering)',
    id: 'Pemula (0–3 tahun pengalaman di bidang dam/geoteknik)',
  },
  'experience.beginner_short': {
    en: 'Beginner',
    id: 'Pemula',
  },
  'experience.experienced': {
    en: 'Experienced (3–10 years in dam/geotechnical engineering)',
    id: 'Berpengalaman (3–10 tahun pengalaman di bidang dam/geoteknik)',
  },
  'experience.experienced_short': {
    en: 'Experienced',
    id: 'Berpengalaman',
  },
  'experience.expert': {
    en: 'Expert (10+ years in dam/geotechnical engineering)',
    id: 'Ahli (10+ tahun pengalaman di bidang dam/geoteknik)',
  },
  'experience.expert_short': {
    en: 'Expert',
    id: 'Ahli',
  },

  // Session
  'session.create': {
    en: 'Create New Workshop Session',
    id: 'Buat Sesi Workshop Baru',
  },
  'session.name': {
    en: 'Session / Project Name',
    id: 'Nama Sesi / Proyek',
  },
  'session.name_placeholder': {
    en: 'e.g. PFMA Bypass TSF - Pani Gold Project',
    id: 'cth. PFMA Bypass TSF - Pani Gold Project',
  },
  'session.code': {
    en: 'Session Code',
    id: 'Kode Sesi',
  },
  'session.code_placeholder': {
    en: 'e.g. K7X9QM',
    id: 'cth. K7X9QM',
  },
  'session.create_btn': {
    en: 'Create Session',
    id: 'Buat Sesi',
  },
  'session.resume': {
    en: 'Resume Existing Session',
    id: 'Lanjutkan Sesi yang Sudah Ada',
  },
  'session.resume_btn': {
    en: 'Resume Session',
    id: 'Lanjutkan Sesi',
  },
  'session.join': {
    en: 'Join Workshop Session',
    id: 'Gabung Sesi Workshop',
  },
  'session.join_btn': {
    en: 'Join Session',
    id: 'Gabung Sesi',
  },
  'session.or': {
    en: '— or —',
    id: '— atau —',
  },
  'session.exit': {
    en: 'Exit',
    id: 'Keluar',
  },

  // Tabs
  'tab.fm_list': {
    en: 'Failure Mode List',
    id: 'Daftar FM',
  },
  'tab.import': {
    en: 'Import FM',
    id: 'Import FM',
  },
  'tab.control': {
    en: 'Session Control',
    id: 'Kontrol Sesi',
  },
  'tab.results': {
    en: 'Live Results',
    id: 'Hasil Live',
  },
  'tab.guideline': {
    en: 'Guideline',
    id: 'Panduan',
  },
  'tab.export': {
    en: 'Export',
    id: 'Ekspor',
  },

  // Assessment
  'assessment.risk_title': {
    en: 'Risk Assessment',
    id: 'Penilaian Risiko',
  },
  'assessment.risk_likelihood': {
    en: 'Risk Likelihood — How likely is this failure mode to occur?',
    id: 'Kemungkinan Risiko — Seberapa besar kemungkinan failure mode ini terjadi?',
  },
  'assessment.negative_consequence': {
    en: 'Negative Consequence — What is the severity if it occurs?',
    id: 'Konsekuensi Negatif — Seberapa besar dampak jika terjadi?',
  },
  'assessment.opp_title': {
    en: 'Opportunity Assessment',
    id: 'Penilaian Peluang',
  },
  'assessment.opp_likelihood': {
    en: 'Opportunity Likelihood — How likely is this positive outcome?',
    id: 'Kemungkinan Peluang — Seberapa besar kemungkinan hasil positif ini?',
  },
  'assessment.positive_consequence': {
    en: 'Positive Consequence — What is the benefit magnitude?',
    id: 'Konsekuensi Positif — Seberapa besar manfaatnya?',
  },
  'assessment.risk_result': {
    en: 'Risk Level',
    id: 'Tingkat Risiko',
  },
  'assessment.opp_result': {
    en: 'Opportunity Level',
    id: 'Tingkat Peluang',
  },
  'assessment.response': {
    en: 'Response Guidance',
    id: 'Panduan Respons',
  },
  'assessment.save_draft': {
    en: 'Save Draft',
    id: 'Simpan Draf',
  },
  'assessment.cancel': {
    en: 'Cancel',
    id: 'Batal',
  },
  'assessment.draft': {
    en: 'Draft',
    id: 'Draf',
  },
  'assessment.submitted': {
    en: 'Submitted',
    id: 'Terkirim',
  },

  // Submission
  'submit.title': {
    en: 'Submit Assessment',
    id: 'Kirim Penilaian',
  },
  'submit.btn': {
    en: 'Submit Assessment',
    id: 'Kirim Penilaian',
  },
  'submit.confirm_title': {
    en: 'Confirm Submission',
    id: 'Konfirmasi Pengiriman',
  },
  'submit.confirm_message': {
    en: 'Once submitted, all assessments in this session will be locked and cannot be modified. Are you sure?',
    id: 'Setelah dikirim, semua penilaian dalam sesi ini akan terkunci dan tidak dapat diubah. Apakah Anda yakin?',
  },
  'submit.confirm_btn': {
    en: 'Yes, Submit & Lock',
    id: 'Ya, Kirim & Kunci',
  },
  'submit.locked': {
    en: 'Assessment Submitted — Locked',
    id: 'Penilaian Terkirim — Terkunci',
  },
  'submit.checklist_incomplete': {
    en: 'Complete all open failure modes before submitting.',
    id: 'Selesaikan semua failure mode yang terbuka sebelum mengirim.',
  },

  // Reopen
  'reopen.title': {
    en: 'Reopen Assessment',
    id: 'Buka Kembali Penilaian',
  },
  'reopen.reason': {
    en: 'Reason for reopening (required)',
    id: 'Alasan pembukaan kembali (wajib)',
  },
  'reopen.btn': {
    en: 'Reopen',
    id: 'Buka Kembali',
  },

  // FM Status
  'fm.open': {
    en: 'Open',
    id: 'Terbuka',
  },
  'fm.locked': {
    en: 'Locked',
    id: 'Terkunci',
  },
  'fm.closed': {
    en: 'Closed',
    id: 'Ditutup',
  },
  'fm.not_opened': {
    en: 'Not yet opened',
    id: 'Belum dibuka',
  },
  'fm.assessed': {
    en: 'Assessed',
    id: 'Sudah dinilai',
  },
  'fm.assess': {
    en: 'Assess',
    id: 'Nilai',
  },
  'fm.edit': {
    en: 'Edit',
    id: 'Ubah',
  },
  'fm.no_fm': {
    en: 'No failure modes imported yet.',
    id: 'Belum ada failure mode yang diimpor.',
  },

  // Controls
  'control.open_all': {
    en: 'Open All',
    id: 'Buka Semua',
  },
  'control.lock_all': {
    en: 'Lock All',
    id: 'Kunci Semua',
  },

  // Results
  'results.participants': {
    en: 'Participants Joined',
    id: 'Peserta Bergabung',
  },
  'results.total_fm': {
    en: 'Total Failure Modes',
    id: 'Total Failure Mode',
  },
  'results.assessments': {
    en: 'Total Assessments',
    id: 'Total Penilaian',
  },
  'results.highest_risk': {
    en: 'Highest Risk Score',
    id: 'Skor Risiko Tertinggi',
  },
  'results.responses': {
    en: 'responses',
    id: 'respon',
  },
  'results.avg': {
    en: 'avg',
    id: 'rata²',
  },
  'results.no_data': {
    en: 'No assessments yet.',
    id: 'Belum ada penilaian masuk.',
  },
  'results.likelihood_dist': {
    en: 'Likelihood Distribution',
    id: 'Distribusi Likelihood',
  },
  'results.consequence_dist': {
    en: 'Consequence Distribution',
    id: 'Distribusi Consequence',
  },
  'results.combination_heatmap': {
    en: 'Likelihood × Consequence Heatmap',
    id: 'Heatmap Likelihood × Consequence',
  },
  'results.weighted_avg': {
    en: 'Weighted Avg',
    id: 'Rata² Tertimbang',
  },
  'results.rounded': {
    en: 'Rounded',
    id: 'Dibulatkan',
  },
  'results.rating': {
    en: 'Rating',
    id: 'Rating',
  },
  'results.count': {
    en: 'Count',
    id: 'Jumlah',
  },
  'error.profile_incomplete': {
    en: 'Your profile is incomplete. Please set your Field Work and experience level in your profile before joining.',
    id: 'Profil Anda belum lengkap. Silakan atur Bidang Pekerjaan dan tingkat pengalaman di profil Anda sebelum bergabung.',
  },

  // Guideline
  'guideline.title': {
    en: 'Assessment Guideline',
    id: 'Panduan Penilaian',
  },
  'guideline.download_material': {
    en: 'Open Reference Material',
    id: 'Buka Materi Referensi',
  },
  'guideline.no_material': {
    en: 'No material uploaded for this session.',
    id: 'Belum ada materi yang diunggah untuk sesi ini.',
  },
  'guideline.workflow': {
    en: 'Workshop Workflow',
    id: 'Alur Workshop',
  },
  'guideline.weighting': {
    en: 'Experience Weighting Policy',
    id: 'Kebijakan Bobot Pengalaman',
  },
  'guideline.weighting_desc': {
    en: 'Votes are weighted by experience level: Beginner = 1, Experienced = 3, Expert = 5.',
    id: 'Suara dibobotkan berdasarkan tingkat pengalaman: Pemula = 1, Berpengalaman = 3, Ahli = 5.',
  },
  'guideline.likelihood_table': {
    en: 'Likelihood Scale',
    id: 'Skala Kemungkinan',
  },
  'guideline.risk_matrix': {
    en: 'Risk Matrix',
    id: 'Matriks Risiko',
  },
  'guideline.opportunity_matrix': {
    en: 'Opportunity Matrix',
    id: 'Matriks Peluang',
  },
  'guideline.response_table': {
    en: 'Response Guidance',
    id: 'Panduan Respons',
  },

  // Import
  'import.title': {
    en: 'Import Failure Mode List (.xlsx)',
    id: 'Import Daftar Failure Mode (.xlsx)',
  },
  'import.columns_desc': {
    en: 'Auto-recognized columns: FM No., Category, Potential Failure Mode (Title), Main Trigger / Detailed Mechanism, Initiation, Continuation, Progression, Potential Detection / Monitoring, Possible Intervention / Risk Controls, Potential Effect / Consequence, PFMA Notes / Workshop Questions, Owner / Action.',
    id: 'Kolom yang dikenali otomatis: FM No., Category, Potential Failure Mode (Title), Main Trigger / Detailed Mechanism, Initiation, Continuation, Progression, Potential Detection / Monitoring, Possible Intervention / Risk Controls, Potential Effect / Consequence, PFMA Notes / Workshop Questions, Owner / Action.',
  },
  'import.preview': {
    en: 'Preview',
    id: 'Preview',
  },
  'import.confirm': {
    en: 'Use these Failure Modes',
    id: 'Gunakan Failure Mode Ini',
  },
  'import.existing': {
    en: 'This session already has failure modes. Re-import to replace.',
    id: 'Sesi ini sudah memiliki failure mode. Import ulang untuk mengganti.',
  },

  // Export
  'export.title': {
    en: 'Export Workshop Results',
    id: 'Ekspor Hasil Workshop',
  },
  'export.download': {
    en: 'Download Excel (.xlsx)',
    id: 'Download Excel (.xlsx)',
  },
  'export.print': {
    en: 'Print / Save as PDF',
    id: 'Cetak / Simpan sebagai PDF',
  },

  // Upload
  'upload.title': {
    en: 'Reference Material Link',
    id: 'Tautan Materi Referensi',
  },
  'upload.btn': {
    en: 'Upload PDF',
    id: 'Unggah PDF',
  },
  'upload.replace': {
    en: 'Replace existing material',
    id: 'Ganti materi yang ada',
  },

  // Common
  'common.back': {
    en: 'Back',
    id: 'Kembali',
  },
  'common.loading': {
    en: 'Loading...',
    id: 'Memuat...',
  },
  'common.error': {
    en: 'An error occurred',
    id: 'Terjadi kesalahan',
  },
  'common.creating': {
    en: 'Creating...',
    id: 'Membuat...',
  },
  'common.connecting': {
    en: 'Connecting...',
    id: 'Menghubungkan...',
  },
  'common.saving': {
    en: 'Saving...',
    id: 'Menyimpan...',
  },
  'common.saved': {
    en: 'Saved',
    id: 'Tersimpan',
  },
  'common.copied': {
    en: 'Copied!',
    id: 'Tersalin!',
  },
};

/**
 * Translate a key to the given language.
 * @param {string} lang - 'en' or 'id'
 * @param {string} key - Translation key
 * @returns {string}
 */
export function t(lang, key) {
  const entry = dict[key];
  if (!entry) return key;
  return entry[lang] || entry['en'] || key;
}

/**
 * Get all translations for a given language (useful for bulk rendering).
 * @param {string} lang
 * @returns {Object}
 */
export function getAllTranslations(lang) {
  const result = {};
  for (const [key, value] of Object.entries(dict)) {
    result[key] = value[lang] || value['en'] || key;
  }
  return result;
}

// ---------------------------------------------------------------------------
// PROFESSIONAL ROLES — From design spec
// ---------------------------------------------------------------------------

export const PROFESSIONAL_ROLES = [
  { key: 'owner', label: { en: 'Owner / Asset Owner', id: 'Pemilik / Pemilik Aset' } },
  { key: 'owners_engineer', label: { en: "Owner's Engineer", id: 'Insinyur Pemilik' } },
  { key: 'eor', label: { en: 'Engineer of Record', id: 'Engineer of Record' } },
  { key: 'dam_engineer', label: { en: 'Dam', id: 'Bidang Bendungan' } },
  { key: 'geotech', label: { en: 'Geotechnical', id: 'Bidang Geoteknik' } },
  { key: 'geologist', label: { en: 'Geology / Engineering Geology', id: 'Bidang Geologi / Geologi Teknik' } },
  { key: 'structural', label: { en: 'Structural', id: 'Bidang Struktur' } },
  { key: 'hydraulic', label: { en: 'Hydraulics / Hydrology', id: 'Bidang Hidraulik / Hidrologi' } },
  { key: 'seismic', label: { en: 'Seismic', id: 'Bidang Seismik' } },
  { key: 'instrumentation', label: { en: 'Instrumentation', id: 'Bidang Instrumentasi' } },
  { key: 'operations', label: { en: 'Operations & Maintenance', id: 'Operasi & Pemeliharaan' } },
  { key: 'construction', label: { en: 'Construction', id: 'Bidang Konstruksi' } },
  { key: 'environmental', label: { en: 'Environmental & Social', id: 'Bidang Lingkungan & Sosial' } },
  { key: 'emergency', label: { en: 'Emergency Preparedness / Dam Safety', id: 'Kesiapsiagaan Darurat / Keselamatan Bendungan' } },
  { key: 'itrb', label: { en: 'ITRB', id: 'ITRB' } },
  { key: 'regulator', label: { en: 'Regulator / Government', id: 'Regulator / Pemerintah' } },
  { key: 'risk_hse', label: { en: 'Risk / HSE', id: 'Risiko / HSE' } },
  { key: 'facilitator_role', label: { en: 'Facilitator', id: 'Fasilitator' } },
  { key: 'observer', label: { en: 'Observer', id: 'Pengamat' } },
  { key: 'other', label: { en: 'Other', id: 'Lainnya' } },
];

export const EXPERIENCE_LEVELS = [
  { key: 'beginner', weight: 1, label: { en: 'Beginner', id: 'Pemula' }, description: { en: '0–3 years in dam/geotechnical engineering', id: '0–3 tahun pengalaman di bidang dam/geoteknik' } },
  { key: 'experienced', weight: 3, label: { en: 'Experienced', id: 'Berpengalaman' }, description: { en: '3–10 years in dam/geotechnical engineering', id: '3–10 tahun pengalaman di bidang dam/geoteknik' } },
  { key: 'expert', weight: 5, label: { en: 'Expert', id: 'Ahli' }, description: { en: '10+ years in dam/geotechnical engineering', id: '10+ tahun pengalaman di bidang dam/geoteknik' } },
];

export const EXPERIENCE_WEIGHT = { beginner: 1, experienced: 3, expert: 5 };
