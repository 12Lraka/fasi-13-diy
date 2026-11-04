/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sistem Informasi FASI XIII Kota Yogyakarta
 * Generator PDF Lembar Presensi / Daftar Hadir Resmi (Dewan Hakim, Panitera, & Panitia)
 * Standar A4 Portrait dengan KOP Resmi BADKO Kota Yogyakarta & Format Paraf Selang-Seling
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { IdCardCommitteeData } from '../types/fasi';
import { fetchImageAsBase64 } from './idCardPngGenerator';

const LOGO_LEFT_URL = 'https://gcligykrxdujlfapgkud.supabase.co/storage/v1/object/public/public-assets/logofasidiy.jpg';
const LOGO_RIGHT_URL = 'https://gcligykrxdujlfapgkud.supabase.co/storage/v1/object/public/public-assets/maskotfasidiy.jpeg';

export const F4_FOLIO_FORMAT: [number, number] = [215, 330];

export interface ExportDaftarHadirPdfOptions {
  categoryType: 'dewan_hakim' | 'panitera' | 'panitia' | 'all';
  committees: IdCardCommitteeData[];
  eventName?: string;
  eventDate?: string;
  venueName?: string;
  customTitle?: string;
  ketuaPanitiaName?: string;
  koordinatorLombaName?: string;
}

/**
 * Format tanggal Indonesia resmi pelaksanaan FASI XIII: 08 November 2026
 */
function getIndonesianDate(): string {
  return '08 November 2026';
}

/**
 * Mendapatkan label judul formal berdasarkan cardCategory
 */
function getCategoryMeta(categoryType: string) {
  switch (categoryType) {
    case 'dewan_hakim':
      return {
        title: 'DAFTAR HADIR DEWAN HAKIM / JURI',
        sub: 'FESTIVAL ANAK SHOLEH INDONESIA (FASI) XIII TAHUN 2026',
        roleLabel: 'Penugasan Cabang / Bidang',
        accessHeaderLabel: 'Instansi',
        color: [136, 19, 55], // rose-900
        signatoryRightRole: 'Koordinator Sie Lomba',
        signatoryRightDefault: 'Nihayaturruhama, S.E.',
      };
    case 'panitera':
      return {
        title: 'DAFTAR HADIR PANITERA',
        sub: 'FESTIVAL ANAK SHOLEH INDONESIA (FASI) XIII TAHUN 2026',
        roleLabel: 'Arena Lomba / Meja Sidang',
        accessHeaderLabel: 'Hak Akses Ruang',
        color: [15, 118, 110], // teal-700
        signatoryRightRole: 'Koordinator Sie Lomba',
        signatoryRightDefault: 'Nihayaturruhama, S.E.',
      };
    case 'panitia':
      return {
        title: 'DAFTAR HADIR PANITIA PELAKSANA',
        sub: 'FESTIVAL ANAK SHOLEH INDONESIA (FASI) XIII TAHUN 2026',
        roleLabel: 'Divisi / Seksi Kepanitiaan',
        accessHeaderLabel: 'Hak Akses Ruang',
        color: [6, 78, 59], // emerald-900
        signatoryRightRole: 'Koordinator Sie Lomba',
        signatoryRightDefault: 'Nihayaturruhama, S.E.',
      };
    default:
      return {
        title: 'DAFTAR HADIR PERANGKAT RESMI FASI XIII',
        sub: 'FESTIVAL ANAK SHOLEH INDONESIA (FASI) XIII TAHUN 2026',
        roleLabel: 'Jabatan / Penugasan',
        accessHeaderLabel: 'Hak Akses Ruang',
        color: [15, 23, 42], // slate-900
        signatoryRightRole: 'Koordinator Sie Lomba',
        signatoryRightDefault: 'Nihayaturruhama, S.E.',
      };
  }
}

/**
 * Render satu kategori lembar daftar hadir ke dalam jsPDF (Format F4 Folio Portrait)
 */
async function renderSingleCategorySheet(
  pdfDoc: jsPDF,
  categoryType: 'dewan_hakim' | 'panitera' | 'panitia',
  items: IdCardCommitteeData[],
  options: ExportDaftarHadirPdfOptions,
  isFirstPage: boolean
) {
  if (!isFirstPage) {
    pdfDoc.addPage(F4_FOLIO_FORMAT, 'portrait');
  }

  // Dimensi Kertas F4 Folio (215 mm x 330 mm)
  const pageWidth = 215;
  const pageHeight = 330;
  const marginX = 12;
  const contentWidth = pageWidth - (marginX * 2);
  const meta = getCategoryMeta(categoryType);

  // Load logo persis seperti pada rekap peserta (Logo FASI DIY kiri & Maskot FASI DIY kanan)
  let logoLeftBase64 = '';
  let logoRightBase64 = '';
  try {
    logoLeftBase64 = await fetchImageAsBase64(LOGO_LEFT_URL);
    logoRightBase64 = await fetchImageAsBase64(LOGO_RIGHT_URL);
  } catch {
    // ignore
  }

  // 1. KOP SURAT RESMI FASI XIII (Sama persis seperti kop rekap peserta F4)
  const topY = 10;
  const logoSize = 18;

  if (logoLeftBase64 && logoLeftBase64.startsWith('data:')) {
    try {
      const format = logoLeftBase64.includes('image/png') ? 'PNG' : 'JPEG';
      pdfDoc.addImage(logoLeftBase64, format, marginX, topY, logoSize, logoSize);
    } catch {}
  }

  if (logoRightBase64 && logoRightBase64.startsWith('data:')) {
    try {
      const format = logoRightBase64.includes('image/png') ? 'PNG' : 'JPEG';
      pdfDoc.addImage(logoRightBase64, format, pageWidth - marginX - logoSize, topY, logoSize, logoSize);
    } catch {}
  }

  // Teks Kop Tengah (Warna Biru #0047AB)
  pdfDoc.setFont('helvetica', 'bold');
  pdfDoc.setTextColor(0, 71, 171); // Biru #0047AB

  // Baris 1: PANITIA PELAKSANA
  pdfDoc.setFontSize(14);
  pdfDoc.text('PANITIA PELAKSANA', pageWidth / 2, topY + 4.5, { align: 'center' });

  // Baris 2: FESTIVAL ANAK SHOLEH INDONESIA XIII
  pdfDoc.setFontSize(11);
  pdfDoc.text('FESTIVAL ANAK SHOLEH INDONESIA XIII', pageWidth / 2, topY + 9.5, { align: 'center' });

  // Baris 3: BADAN KOORDINASI TKA-TPA DI.YOGYAKARTA
  pdfDoc.setFontSize(11);
  pdfDoc.text('BADAN KOORDINASI TKA-TPA DI.YOGYAKARTA', pageWidth / 2, topY + 14.5, { align: 'center' });

  // Baris 4: SK KEMENHUKAM Nomor AHU-0001522.AH.01.08.TAHUN 2026
  pdfDoc.setFont('helvetica', 'normal');
  pdfDoc.setFontSize(7.5);
  pdfDoc.setTextColor(0, 0, 0); // Hitam
  pdfDoc.text('SK KEMENHUKAM Nomor AHU-0001522.AH.01.08.TAHUN 2026', pageWidth / 2, topY + 18.5, { align: 'center' });

  // Garis Pembatas Persegi Panjang Berwarna Merah
  const rectY = topY + 21;
  const rectHeight = 5;
  pdfDoc.setFillColor(229, 9, 20); // Merah #E50914
  pdfDoc.rect(marginX, rectY, contentWidth, rectHeight, 'F');

  // Tulisan di dalam pita merah: jenis arial/helvetica size 7 warna putih
  pdfDoc.setFont('helvetica', 'normal');
  pdfDoc.setFontSize(7);
  pdfDoc.setTextColor(255, 255, 255); // Putih
  pdfDoc.text(
    'Sekretariatan: Kertopaten, Wirokerten, Banguntapan, Bantul, Daerah Istimewa Yogyakarta | HP : 0877 3904 7175',
    pageWidth / 2,
    rectY + 3.5,
    { align: 'center' }
  );

  // 2. JUDUL LEMBAR PRESENSI / DAFTAR HADIR
  const titleY = rectY + rectHeight + 7;
  pdfDoc.setFont('helvetica', 'bold');
  pdfDoc.setFontSize(12);
  pdfDoc.setTextColor(meta.color[0], meta.color[1], meta.color[2]);
  pdfDoc.text(options.customTitle || meta.title, pageWidth / 2, titleY, { align: 'center' });

  pdfDoc.setFontSize(9.5);
  pdfDoc.setTextColor(51, 65, 85);
  pdfDoc.text(meta.sub, pageWidth / 2, titleY + 4.8, { align: 'center' });

  // 3. META INFORMASI ACARA (Hari/Tanggal, Tempat, Total Personel)
  const metaBoxY = titleY + 8;
  pdfDoc.setFillColor(248, 250, 252); // slate-50
  pdfDoc.setDrawColor(226, 232, 240); // slate-200
  pdfDoc.setLineWidth(0.3);
  pdfDoc.roundedRect(marginX, metaBoxY, contentWidth, 11, 2, 2, 'FD');

  pdfDoc.setFont('helvetica', 'bold');
  pdfDoc.setFontSize(8);
  pdfDoc.setTextColor(30, 41, 59);

  const eventDateText = options.eventDate || 'Ahad, 08 November 2026';
  const venueText = options.venueName || 'SMK Muhammadiyah 3 Yogyakarta';

  pdfDoc.text('Hari / Tanggal :', marginX + 3, metaBoxY + 4.2);
  pdfDoc.setFont('helvetica', 'normal');
  pdfDoc.text(eventDateText, marginX + 27, metaBoxY + 4.2);

  pdfDoc.setFont('helvetica', 'bold');
  pdfDoc.text('Tempat / Lokasi :', marginX + 3, metaBoxY + 8.5);
  pdfDoc.setFont('helvetica', 'normal');
  pdfDoc.text(venueText, marginX + 27, metaBoxY + 8.5);

  pdfDoc.setFont('helvetica', 'bold');
  pdfDoc.text('Total Personel :', pageWidth - marginX - 45, metaBoxY + 4.2);
  pdfDoc.setFont('helvetica', 'normal');
  pdfDoc.text(`${items.length} Orang`, pageWidth - marginX - 22, metaBoxY + 4.2);

  pdfDoc.setFont('helvetica', 'bold');
  pdfDoc.text('Status Presensi :', pageWidth - marginX - 45, metaBoxY + 8.5);
  pdfDoc.setFont('helvetica', 'normal');
  pdfDoc.setTextColor(4, 120, 87);
  pdfDoc.text('Verifikasi Meja', pageWidth - marginX - 22, metaBoxY + 8.5);

  // 4. TABEL PRESENSI (FORMAT PARAF SELANG-SELING INDONESIA)
  // Khusus Dewan Hakim: Kolom diganti menjadi "Instansi" sesuai permintaan
  const tableHeaders = [
    'No',
    'Nama Lengkap & Gelar',
    meta.roleLabel,
    meta.accessHeaderLabel,
    'Tanda Tangan / Paraf',
  ];

  const tableBody = items.length === 0
    ? [[
        '-',
        'Belum ada data personel terdaftar pada kategori ini.',
        '-',
        '-',
        '-',
      ]]
    : items.map((item, index) => {
        const no = index + 1;
        // Format paraf ganjil di kiri, genap di kanan
        const isOdd = no % 2 !== 0;
        const signatureText = isOdd
          ? `${no}. ..........................`
          : `            ${no}. ..........................`;

        // Untuk kolom akses/instansi:
        // Jika dewan_hakim, tampilkan nilai accessLevel jika sudah diisi instansi (atau strip jika default/kosong)
        const accessOrInstansiValue = item.accessLevel && item.accessLevel !== 'RUANG HAKIM & JURI' && item.accessLevel !== 'ALL ACCESS'
          ? item.accessLevel
          : (categoryType === 'dewan_hakim' ? (item.accessLevel === 'RUANG HAKIM & JURI' ? '-' : (item.accessLevel || '-')) : (item.accessLevel || 'ALL ACCESS'));

        return [
          String(no),
          item.name || '(Nama belum diisi)',
          item.division || '-',
          accessOrInstansiValue,
          signatureText,
        ];
      });

  const startTableY = metaBoxY + 13.5;

  autoTable(pdfDoc, {
    startY: startTableY,
    head: [tableHeaders],
    body: tableBody,
    margin: { left: marginX, right: marginX, bottom: 45 },
    theme: 'grid',
    headStyles: {
      fillColor: [241, 245, 249], // slate-100
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'center',
      valign: 'middle',
      lineWidth: 0.2,
      lineColor: [148, 163, 184],
    },
    bodyStyles: {
      textColor: [15, 23, 42],
      fontSize: 8,
      lineWidth: 0.15,
      lineColor: [203, 213, 225],
      valign: 'middle',
      minCellHeight: 8.5, // Ruang cukup tinggi untuk kenyamanan tanda tangan fisik
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 9 }, // No
      1: { halign: 'left', cellWidth: 59, fontStyle: 'bold' }, // Nama Lengkap
      2: { halign: 'left', cellWidth: 55 }, // Jabatan / Penugasan
      3: { halign: 'center', cellWidth: 28, fontSize: 7.5 }, // Instansi / Hak Akses
      4: { halign: 'left', cellWidth: 40, fontStyle: 'normal' }, // Tanda Tangan
    },
    alternateRowStyles: {
      fillColor: [255, 255, 255],
    },
  });

  // 5. BLOK TANDA TANGAN PENGESAHAN RESMI (Ketua Panitia & Koord Sie Lomba)
  const lastTableY = (pdfDoc as any).lastAutoTable?.finalY || startTableY + 40;
  let signatureY = lastTableY + 6;

  // Cek apakah halaman cukup menampung blok tanda tangan di kertas F4 (330mm)
  if (signatureY + 36 > pageHeight) {
    pdfDoc.addPage(F4_FOLIO_FORMAT, 'portrait');
    signatureY = 22;
  }

  const signColWidth = 72;
  const leftSignX = marginX + 6;
  const rightSignX = pageWidth - marginX - signColWidth - 6;

  pdfDoc.setFont('helvetica', 'normal');
  pdfDoc.setFontSize(8.5);
  pdfDoc.setTextColor(71, 85, 105);

  // Kiri: Mengetahui Ketua Panitia
  pdfDoc.text('Mengetahui,', leftSignX, signatureY);
  pdfDoc.setFont('helvetica', 'bold');
  pdfDoc.text('Ketua Panitia', leftSignX, signatureY + 4.5);

  // Kanan: Titimangsa Yogyakarta & Koordinator Sie Lomba
  pdfDoc.setFont('helvetica', 'normal');
  pdfDoc.text('Yogyakarta, 08 November 2026', rightSignX, signatureY);
  pdfDoc.setFont('helvetica', 'bold');
  pdfDoc.text('Koord Sie Lomba', rightSignX, signatureY + 4.5);

  // Ruang Tanda Tangan
  const nameY = signatureY + 23;

  // Nama Pengesah Kiri: Ketua Panitia
  const ketuaName = options.ketuaPanitiaName || 'Endro Suwarno, A.Md., S.E.';
  pdfDoc.setFont('helvetica', 'bold');
  pdfDoc.setFontSize(8.5);
  pdfDoc.setTextColor(15, 23, 42);
  pdfDoc.text(ketuaName, leftSignX, nameY);
  pdfDoc.setLineWidth(0.2);
  pdfDoc.line(leftSignX, nameY + 0.8, leftSignX + signColWidth, nameY + 0.8);

  // Nama Pengesah Kanan: Koord Sie Lomba untuk ketiga daftar hadir
  const coordLombaName = options.koordinatorLombaName || 'Nihayaturruhama, S.E.';
  pdfDoc.setFont('helvetica', 'bold');
  pdfDoc.setFontSize(8.5);
  pdfDoc.setTextColor(15, 23, 42);
  pdfDoc.text(coordLombaName, rightSignX, nameY);
  pdfDoc.setLineWidth(0.2);
  pdfDoc.line(rightSignX, nameY + 0.8, rightSignX + signColWidth, nameY + 0.8);
}

/**
 * Generate Dokumen PDF Daftar Hadir
 * Menggunakan Ukuran Kertas F4 Folio Portrait (215 x 330 mm)
 */
export async function generateDaftarHadirPdf(options: ExportDaftarHadirPdfOptions): Promise<Blob> {
  const pdfDoc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: F4_FOLIO_FORMAT,
    compress: true,
  });

  const { categoryType, committees } = options;

  if (categoryType === 'all') {
    // Render 3 lembar terpisah: Dewan Hakim, Panitera, Panitia
    const hakimList = committees.filter((c) => c.cardCategory === 'dewan_hakim');
    const paniteraList = committees.filter((c) => c.cardCategory === 'panitera');
    const panitiaList = committees.filter((c) => !c.cardCategory || c.cardCategory === 'panitia');

    await renderSingleCategorySheet(pdfDoc, 'dewan_hakim', hakimList, options, true);
    await renderSingleCategorySheet(pdfDoc, 'panitera', paniteraList, options, false);
    await renderSingleCategorySheet(pdfDoc, 'panitia', panitiaList, options, false);
  } else {
    const filtered = committees.filter((c) => {
      if (categoryType === 'panitia') {
        return !c.cardCategory || c.cardCategory === 'panitia';
      }
      return c.cardCategory === categoryType;
    });

    await renderSingleCategorySheet(pdfDoc, categoryType, filtered, options, true);
  }

  // Tambahkan nomor halaman di footer setiap lembar (Kertas F4 Folio Tinggi 330 mm)
  const totalPages = pdfDoc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdfDoc.setPage(i);
    pdfDoc.setFont('helvetica', 'normal');
    pdfDoc.setFontSize(7);
    pdfDoc.setTextColor(148, 163, 184); // slate-400
    pdfDoc.text(
      `Daftar Hadir Resmi FASI XIII BADKO TKA-TPA D.I. YOGYAKARTA — Halaman ${i} dari ${totalPages}`,
      107.5,
      323,
      { align: 'center' }
    );
  }

  return pdfDoc.output('blob');
}

/**
 * Download langsung PDF Daftar Hadir ke komputer pengguna
 */
export async function downloadDaftarHadirPdf(
  options: ExportDaftarHadirPdfOptions,
  filename?: string
): Promise<void> {
  const blob = await generateDaftarHadirPdf(options);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  
  let defaultFilename = 'Daftar_Hadir_FASI_XIII.pdf';
  if (options.categoryType === 'dewan_hakim') {
    defaultFilename = 'Daftar_Hadir_Dewan_Hakim_FASI_XIII.pdf';
  } else if (options.categoryType === 'panitera') {
    defaultFilename = 'Daftar_Hadir_Panitera_FASI_XIII.pdf';
  } else if (options.categoryType === 'panitia') {
    defaultFilename = 'Daftar_Hadir_Panitia_FASI_XIII.pdf';
  } else {
    defaultFilename = 'Daftar_Hadir_Lengkap_Panitia_Hakim_Panitera_FASI_XIII.pdf';
  }

  a.download = filename || defaultFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
