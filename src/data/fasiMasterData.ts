/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Master Data FASI XIII Kota Yogyakarta
 * 14 Kemantren & 18 Cabang Lomba Resmi
 */

import { Kemantren, CompetitionCategory, Participant, MasterTpa } from '../types/fasi';

export const KEMANTREN_LIST: Kemantren[] = [
  { id: 'kab-yk', code: 'YK', name: 'Kota Yogyakarta', adminName: 'Admin Kota Yogyakarta', contactPerson: '081200000001', password: 'jogja123' },
  { id: 'kab-slm', code: 'SLM', name: 'Kabupaten Sleman', adminName: 'Admin Kab. Sleman', contactPerson: '081200000002', password: 'sleman123' },
  { id: 'kab-btl', code: 'BTL', name: 'Kabupaten Bantul', adminName: 'Admin Kab. Bantul', contactPerson: '081200000003', password: 'bantul123' },
  { id: 'kab-kp', code: 'KP', name: 'Kabupaten Kulon Progo', adminName: 'Admin Kab. Kulon Progo', contactPerson: '081200000004', password: 'kulonprogo123' },
  { id: 'kab-gk', code: 'GK', name: 'Kabupaten Gunungkidul', adminName: 'Admin Kab. Gunungkidul', contactPerson: '081200000005', password: 'gunungkidul123' },
];

export const CATEGORIES_LIST: CompetitionCategory[] = [
  // Kategori TKA (8 Cabang Lomba Resmi)
  {
    id: 'cat-tka-1',
    code: 'TKA-01',
    level: 'TKA',
    name: "Tartil Al-Qur'an (Putra)",
    genderRequirement: 'L',
    isGroup: false,
    maxParticipantsPerKemantren: 3,
    description: 'Membaca tartil maqra pilihan Al-Qur\'an dengan makhraj, tajwid, dan adab (Usia 4 - 7 thn)',
  },
  {
    id: 'cat-tka-2',
    code: 'TKA-02',
    level: 'TKA',
    name: "Tartil Al-Qur'an (Putri)",
    genderRequirement: 'P',
    isGroup: false,
    maxParticipantsPerKemantren: 3,
    description: 'Membaca tartil maqra pilihan Al-Qur\'an dengan makhraj, tajwid, dan adab (Usia 4 - 7 thn)',
  },
  {
    id: 'cat-tka-3',
    code: 'TKA-03',
    level: 'TKA',
    name: 'Adzan dan Iqomah (Putra)',
    genderRequirement: 'L',
    isGroup: false,
    maxParticipantsPerKemantren: 3,
    description: 'Melantunkan lafadz adzan & iqomah dengan fashahah dan lagu (Usia 4 - 7 thn)',
  },
  {
    id: 'cat-tka-4',
    code: 'TKA-04',
    level: 'TKA',
    name: 'Peragaan Shalat (Putra)',
    genderRequirement: 'L',
    isGroup: false,
    maxParticipantsPerKemantren: 3,
    description: 'Praktik gerakan & bacaan shalat fardhu secara tartil dan tertib (Usia 4 - 7 thn)',
  },
  {
    id: 'cat-tka-5',
    code: 'TKA-05',
    level: 'TKA',
    name: 'Peragaan Shalat (Putri)',
    genderRequirement: 'P',
    isGroup: false,
    maxParticipantsPerKemantren: 3,
    description: 'Praktik gerakan & bacaan shalat fardhu secara tartil dan tertib (Usia 4 - 7 thn)',
  },
  {
    id: 'cat-tka-6',
    code: 'TKA-06',
    level: 'TKA',
    name: "Ikrar & Puitisasi Tarjamah Al-Qur'an",
    genderRequirement: 'ALL',
    isGroup: true,
    groupMemberCount: 3,
    maxParticipantsPerKemantren: 9,
    description: 'Penampilan ikrar santri dan puitisasi terjemah Al-Qur\'an berkelompok (Usia 4 - 7 thn)',
  },
  {
    id: 'cat-tka-7',
    code: 'TKA-07',
    level: 'TKA',
    name: 'Nasyid Islami',
    genderRequirement: 'ALL',
    isGroup: true,
    groupMemberCount: 3,
    maxParticipantsPerKemantren: 9,
    description: 'Menyanyikan lagu wajib dan lagu pilihan FASI berkelompok (Usia 4 - 7 thn)',
  },
  {
    id: 'cat-tka-8',
    code: 'TKA-08',
    level: 'TKA',
    name: "Cerdas Cermat Al-Qur'an",
    genderRequirement: 'ALL',
    isGroup: true,
    groupMemberCount: 3,
    maxParticipantsPerKemantren: 9,
    description: 'Lomba cerdas cermat materi dasar Al-Qur\'an, Dinul Islam & doa harian (Usia 4 - 7 thn)',
  },
  {
    id: 'cat-tka-9',
    code: 'TKA-09',
    level: 'TKA',
    name: 'Mewarnai Gambar (Putra)',
    genderRequirement: 'L',
    isGroup: false,
    maxParticipantsPerKemantren: 3,
    description: 'Kreativitas pewarnaan tema Islami menggunakan krayon/pastel (Usia 4 - 7 thn)',
  },
  {
    id: 'cat-tka-10',
    code: 'TKA-10',
    level: 'TKA',
    name: 'Mewarnai Gambar (Putri)',
    genderRequirement: 'P',
    isGroup: false,
    maxParticipantsPerKemantren: 3,
    description: 'Kreativitas pewarnaan tema Islami menggunakan krayon/pastel (Usia 4 - 7 thn)',
  },
  {
    id: 'cat-tka-11',
    code: 'TKA-11',
    level: 'TKA',
    name: 'Ceramah Agama Islam Bhs. Indonesia (Putra)',
    genderRequirement: 'L',
    isGroup: false,
    maxParticipantsPerKemantren: 3,
    description: 'Pidato/khitobah da\'i cilik bertema adab kepada orang tua & guru (Usia 4 - 7 thn)',
  },
  {
    id: 'cat-tka-12',
    code: 'TKA-12',
    level: 'TKA',
    name: 'Ceramah Agama Islam Bhs. Indonesia (Putri)',
    genderRequirement: 'P',
    isGroup: false,
    maxParticipantsPerKemantren: 3,
    description: 'Pidato/khitobah da\'i cilik bertema adab kepada orang tua & guru (Usia 4 - 7 thn)',
  },

  // Kategori TPA (7 Cabang Lomba Resmi)
  {
    id: 'cat-tpa-1',
    code: 'TPA-01',
    level: 'TPA',
    name: "Tartil Al-Qur'an (Putra)",
    genderRequirement: 'L',
    isGroup: false,
    maxParticipantsPerKemantren: 3,
    description: 'Membaca tartil ayat pilihan Al-Qur\'an dengan kaidah tajwid lengkap (> 7 s.d. 12 thn)',
  },
  {
    id: 'cat-tpa-2',
    code: 'TPA-02',
    level: 'TPA',
    name: "Tartil Al-Qur'an (Putri)",
    genderRequirement: 'P',
    isGroup: false,
    maxParticipantsPerKemantren: 3,
    description: 'Membaca tartil ayat pilihan Al-Qur\'an dengan kaidah tajwid lengkap (> 7 s.d. 12 thn)',
  },
  {
    id: 'cat-tpa-3',
    code: 'TPA-03',
    level: 'TPA',
    name: 'Adzan dan Iqomah (Putra)',
    genderRequirement: 'L',
    isGroup: false,
    maxParticipantsPerKemantren: 3,
    description: 'Pengumandangan adzan subuh/umum dan doa sesudah adzan (> 7 s.d. 12 thn)',
  },
  {
    id: 'cat-tpa-4',
    code: 'TPA-04',
    level: 'TPA',
    name: "Ikrar & Puitisasi Tarjamah Al-Qur'an",
    genderRequirement: 'ALL',
    isGroup: true,
    groupMemberCount: 3,
    maxParticipantsPerKemantren: 9,
    description: 'Ikrar santri dan puitisasi terjemah Al-Qur\'an beregu (> 7 s.d. 12 thn)',
  },
  {
    id: 'cat-tpa-5',
    code: 'TPA-05',
    level: 'TPA',
    name: 'Nasyid Islami',
    genderRequirement: 'ALL',
    isGroup: true,
    groupMemberCount: 3,
    maxParticipantsPerKemantren: 9,
    description: 'Penampilan grup vocal akustik Islami 3 orang santri (> 7 s.d. 12 thn)',
  },
  {
    id: 'cat-tpa-6',
    code: 'TPA-06',
    level: 'TPA',
    name: "Cerdas Cermat Al-Qur'an",
    genderRequirement: 'ALL',
    isGroup: true,
    groupMemberCount: 3,
    maxParticipantsPerKemantren: 9,
    description: 'Lomba cerdas cermat materi Dinul Islam, Al-Qur\'an, Hadits, Fiqih (> 7 s.d. 12 thn)',
  },
  {
    id: 'cat-tpa-7',
    code: 'TPA-07',
    level: 'TPA',
    name: 'Menggambar (Putra)',
    genderRequirement: 'L',
    isGroup: false,
    maxParticipantsPerKemantren: 3,
    description: 'Menggambar bebas dengan tema Nilai-Nilai Luhur Islam (> 7 s.d. 12 thn)',
  },
  {
    id: 'cat-tpa-8',
    code: 'TPA-08',
    level: 'TPA',
    name: 'Menggambar (Putri)',
    genderRequirement: 'P',
    isGroup: false,
    maxParticipantsPerKemantren: 3,
    description: 'Menggambar bebas dengan tema Nilai-Nilai Luhur Islam (> 7 s.d. 12 thn)',
  },
  {
    id: 'cat-tpa-9',
    code: 'TPA-09',
    level: 'TPA',
    name: 'Ceramah Agama Islam Bhs. Indonesia (Putra)',
    genderRequirement: 'L',
    isGroup: false,
    maxParticipantsPerKemantren: 3,
    description: 'Pidato/khitobah da\'i cilik bertema Meneladani Akhlak Rasulullah (> 7 s.d. 12 thn)',
  },
  {
    id: 'cat-tpa-10',
    code: 'TPA-10',
    level: 'TPA',
    name: 'Ceramah Agama Islam Bhs. Indonesia (Putri)',
    genderRequirement: 'P',
    isGroup: false,
    maxParticipantsPerKemantren: 3,
    description: 'Pidato/khitobah da\'i cilik bertema Meneladani Akhlak Rasulullah (> 7 s.d. 12 thn)',
  },

  // Kategori TQA (7 Cabang Lomba Resmi)
  {
    id: 'cat-tqa-1',
    code: 'TQA-01',
    level: 'TQA',
    name: "Tilawati Al-Quran (Putra)",
    genderRequirement: 'L',
    isGroup: false,
    maxParticipantsPerKemantren: 3,
    description: 'Membaca Al-Qur\'an dengan lagu/naghom (Bayati, Shoba, Hijaz, dll) (> 12 s.d. 15 thn)',
  },
  {
    id: 'cat-tqa-2',
    code: 'TQA-02',
    level: 'TQA',
    name: "Tilawati Al-Quran (Putri)",
    genderRequirement: 'P',
    isGroup: false,
    maxParticipantsPerKemantren: 3,
    description: 'Membaca Al-Qur\'an dengan lagu/naghom (Bayati, Shoba, Hijaz, dll) (> 12 s.d. 15 thn)',
  },
  {
    id: 'cat-tqa-3',
    code: 'TQA-03',
    level: 'TQA',
    name: 'Tahfidz Juz Amma (Putra)',
    genderRequirement: 'L',
    isGroup: false,
    maxParticipantsPerKemantren: 3,
    description: 'Hafalan Al-Qur\'an Juz 30 lengkap beserta sambung ayat (> 12 s.d. 15 thn)',
  },
  {
    id: 'cat-tqa-4',
    code: 'TQA-04',
    level: 'TQA',
    name: 'Tahfidz Juz Amma (Putri)',
    genderRequirement: 'P',
    isGroup: false,
    maxParticipantsPerKemantren: 3,
    description: 'Hafalan Al-Qur\'an Juz 30 lengkap beserta sambung ayat (> 12 s.d. 15 thn)',
  },
  {
    id: 'cat-tqa-5',
    code: 'TQA-05',
    level: 'TQA',
    name: "Syarhil Quran",
    genderRequirement: 'ALL',
    isGroup: true,
    groupMemberCount: 3,
    maxParticipantsPerKemantren: 9,
    description: 'Pensyarahan isi kandungan Al-Qur\'an beregu (Tilawah, Terjemah, Pensyarah) (> 12 s.d. 15 thn)',
  },
  {
    id: 'cat-tqa-6',
    code: 'TQA-06',
    level: 'TQA',
    name: "Cerdas Cermat Al-Quran",
    genderRequirement: 'ALL',
    isGroup: true,
    groupMemberCount: 3,
    maxParticipantsPerKemantren: 9,
    description: 'Cerdas cermat pemahaman Al-Qur\'an, Hadits, Fiqih, dan Sejarah Islam (> 12 s.d. 15 thn)',
  },
  {
    id: 'cat-tqa-7',
    code: 'TQA-07',
    level: 'TQA',
    name: 'Kisah Islami (Putra)',
    genderRequirement: 'L',
    isGroup: false,
    maxParticipantsPerKemantren: 3,
    description: 'Menceritakan kisah keteladanan para Nabi, Sahabat, atau Pahlawan Islam (> 12 s.d. 15 thn)',
  },
  {
    id: 'cat-tqa-8',
    code: 'TQA-08',
    level: 'TQA',
    name: 'Kisah Islami (Putri)',
    genderRequirement: 'P',
    isGroup: false,
    maxParticipantsPerKemantren: 3,
    description: 'Menceritakan kisah keteladanan para Nabi, Sahabat, atau Pahlawan Islam (> 12 s.d. 15 thn)',
  },
  {
    id: 'cat-tqa-9',
    code: 'TQA-09',
    level: 'TQA',
    name: 'Kaligrafi (Putra)',
    genderRequirement: 'L',
    isGroup: false,
    maxParticipantsPerKemantren: 3,
    description: 'Seni penulisan ayat Al-Qur\'an khat naskhi dan hiasan mushaf (> 12 s.d. 15 thn)',
  },
  {
    id: 'cat-tqa-10',
    code: 'TQA-10',
    level: 'TQA',
    name: 'Kaligrafi (Putri)',
    genderRequirement: 'P',
    isGroup: false,
    maxParticipantsPerKemantren: 3,
    description: 'Seni penulisan ayat Al-Qur\'an khat naskhi dan hiasan mushaf (> 12 s.d. 15 thn)',
  },
  {
    id: 'cat-tqa-11',
    code: 'TQA-11',
    level: 'TQA',
    name: 'Ceramah Agama Islam Bhs. Indonesia (Putra)',
    genderRequirement: 'L',
    isGroup: false,
    maxParticipantsPerKemantren: 3,
    description: 'Pidato/khitobah da\'i remaja bertema Moderasi Beragama & Cinta Tanah Air (> 12 s.d. 15 thn)',
  },
  {
    id: 'cat-tqa-12',
    code: 'TQA-12',
    level: 'TQA',
    name: 'Ceramah Agama Islam Bhs. Indonesia (Putri)',
    genderRequirement: 'P',
    isGroup: false,
    maxParticipantsPerKemantren: 3,
    description: 'Pidato/khitobah da\'i remaja bertema Moderasi Beragama & Cinta Tanah Air (> 12 s.d. 15 thn)',
  },
];

export const INITIAL_PARTICIPANTS: Participant[] = [];
 
/**
 * Normalisasi input nama Rayon / Kemantren (case-insensitive & pembersihan variasi)
 * Menangani input seperti "KOTAGEDE", "Kotagede", "RAYON KOTAGEDE", "KG", "kem-6", dll.
 */
export function normalizeRayonToKemantren(rawInput: string): Kemantren | undefined {
  if (!rawInput) return undefined;
  const rawStr = String(rawInput).trim();
  if (!rawStr) return undefined;

  // Bersihkan prefiks umum & ubah ke UPPERCASE
  const cleaned = rawStr
    .toUpperCase()
    .replace(/^KABUPATEN\s+/i, '')
    .replace(/^KOTA\s+/i, '')
    .replace(/^KAB\.\s*/i, '')
    .replace(/^RAYON\s+/i, '')
    .replace(/^KEMANTREN\s+/i, '')
    .replace(/^KECAMATAN\s+/i, '')
    .replace(/[^A-Z0-9]/g, '');

  return KEMANTREN_LIST.find((k) => {
    const codeClean = k.code.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const nameClean = k.name.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const idClean = k.id.toUpperCase().replace(/[^A-Z0-9]/g, '');

    return (
      cleaned === codeClean ||
      cleaned === nameClean ||
      cleaned === idClean ||
      nameClean.includes(cleaned) ||
      cleaned.includes(nameClean)
    );
  });
}

/**
 * Data Master Awal Unit TPA se-Kota Yogyakarta (Kosong, dibaca murni dari tabel master_tpa Supabase)
 */
export const INITIAL_MASTER_TPA: MasterTpa[] = [];

/**
 * Pemetaan Default Lokasi Ruang & Majelis Lomba di Komplek SMK Muhammadiyah 3 Yogyakarta
 */
export const DEFAULT_ARENA_LOCATIONS: Record<string, string> = {
  // TKA
  'cat-tka-1': 'Ruang 01 (Gedung Barat Lt. 1)',
  'cat-tka-2': 'Ruang 02 (Gedung Barat Lt. 1)',
  'cat-tka-3': 'Masjid / Musholla Utama',
  'cat-tka-4': 'Panggung Utama (Hall Gedung Barat)',
  'cat-tka-5': 'Panggung Utama (Hall Gedung Barat)',
  'cat-tka-6': 'Ruang 03 (Gedung Barat Lt. 1)',
  'cat-tka-7': 'Ruang 04 (Gedung Barat Lt. 1)',
  'cat-tka-8': 'Ruang CCQ (Gedung Timur Lt. 2)',
  'cat-tka-9': 'Ruang Aula 1 (Gedung Timur Lt. 1)',
  'cat-tka-10': 'Ruang Aula 2 (Gedung Timur Lt. 1)',
  'cat-tka-11': 'Ruang 05 (Gedung Barat Lt. 2)',
  'cat-tka-12': 'Ruang 06 (Gedung Barat Lt. 2)',

  // TPA
  'cat-tpa-1': 'Ruang 07 (Gedung Barat Lt. 2)',
  'cat-tpa-2': 'Ruang 08 (Gedung Barat Lt. 2)',
  'cat-tpa-3': 'Masjid / Musholla Utama',
  'cat-tpa-4': 'Panggung Utama (Hall Gedung Barat)',
  'cat-tpa-5': 'Ruang CCQ (Gedung Timur Lt. 2)',
  'cat-tpa-6': 'Ruang Aula 3 (Gedung Timur Lt. 1)',
  'cat-tpa-7': 'Ruang Aula 4 (Gedung Timur Lt. 1)',
  'cat-tpa-8': 'Ruang 09 (Gedung Timur Lt. 2)',
  'cat-tpa-9': 'Ruang 10 (Gedung Timur Lt. 2)',
  'cat-tpa-10': 'Ruang 11 (Gedung Timur Lt. 2)',

  // TQA
  'cat-tqa-1': 'Ruang 12 (Gedung Barat Lt. 3)',
  'cat-tqa-2': 'Ruang 13 (Gedung Barat Lt. 3)',
  'cat-tqa-3': 'Ruang 14 (Gedung Barat Lt. 3)',
  'cat-tqa-4': 'Ruang 15 (Gedung Barat Lt. 3)',
  'cat-tqa-5': 'Ruang 16 (Gedung Barat Lt. 3)',
  'cat-tqa-6': 'Ruang 17 (Gedung Barat Lt. 3)',
  'cat-tqa-7': 'Ruang CCQ (Gedung Timur Lt. 2)',
  'cat-tqa-8': 'Ruang Kaligrafi 1 (Gedung Timur Lt. 3)',
  'cat-tqa-9': 'Ruang Kaligrafi 2 (Gedung Timur Lt. 3)',
  'cat-tqa-10': 'Ruang 18 (Gedung Timur Lt. 3)',
  'cat-tqa-11': 'Ruang 19 (Gedung Timur Lt. 3)',
  'cat-tqa-12': 'Laboratorium Bahasa (Gedung Barat Lt. 2)',
};

