/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sistem Informasi FASI XIII D.I. Yogyakarta
 * Generator PDF Lembar Penerimaan Honor Resmi (Dewan Yuri, Panitera, & Panitia Pelaksana)
 * Standar F4 Folio Landscape (330 x 215 mm) dengan KOP Resmi BADKO D.I. Yogyakarta,
 * Kolom Jumlah Nominal, & Format Tanda Tangan / Paraf Selang-Seling Rapi
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { IdCardCommitteeData } from '../types/fasi';
import { fetchImageAsBase64 } from './idCardPngGenerator';
import { sortCommitteesList } from './daftarHadirPdfGenerator';

const LOGO_LEFT_URL = 'https://gcligykrxdujlfapgkud.supabase.co/storage/v1/object/public/public-assets/logofasidiy.jpg';
const LOGO_RIGHT_URL = 'https://gcligykrxdujlfapgkud.supabase.co/storage/v1/object/public/public-assets/maskotfasidiy.jpeg';

// Dimensi Kertas F4 Folio Landscape (330 mm x 215 mm)
export const F4_FOLIO_LANDSCAPE: [number, number] = [330, 215];

export interface ExportHonorPdfOptions {
  categoryType: 'dewan_hakim' | 'panitera' | 'panitia' | 'all';
  committees: IdCardCommitteeData[];
  eventName?: string;
  eventDate?: string;
  venueName?: string;
  customTitle?: string;
  ketuaPanitiaName?: string;
  bendaharaName?: string;
}

/**
 * Nilai honorarium resmi per personel berdasarkan kategori
 * - Dewan Yuri: Rp 500.000
 * - Panitera: Rp 100.000
 * - Panitia: Rp 100.000
 */
export function getHonorNominal(categoryType: string): number {
  switch (categoryType) {
    case 'dewan_hakim':
      return 500000;
    case 'panitera':
      return 100000;
    case 'panitia':
    default:
      return 100000;
  }
}

/**
 * Format angka ke mata uang Rupiah Indonesia
 */
export function formatRupiah(amount: number): string {
  return 'Rp ' + amount.toLocaleString('id-ID');
}

/**
 * Metadata judul dan konfigurasi visual per kategori
 */
function getHonorMeta(categoryType: string) {
  switch (categoryType) {
    case 'dewan_hakim':
      return {
        title: 'PENERIMAAN HONOR DEWAN YURI',
        sub: 'FESTIVAL ANAK SHOLEH INDONESIA (FASI) XIII TAHUN 2026',
        roleLabel: 'Penugasan Cabang / Bidang',
        accessHeaderLabel: 'Instansi / Asal',
        nominalValue: 500000,
        nominalText: 'Rp 500.000',
        color: [136, 19, 55], // rose-900
        signatoryRightRole: 'Bendahara',
        signatoryRightDefault: 'H. Anas Yusuf, S.Sos.I.',
      };
    case 'panitera':
      return {
        title: 'PENERIMAAN HONOR PANITERA',
        sub: 'FESTIVAL ANAK SHOLEH INDONESIA (FASI) XIII TAHUN 2026',
        roleLabel: 'Arena Lomba / Meja Sidang',
        accessHeaderLabel: 'Hak Akses Ruang',
        nominalValue: 100000,
        nominalText: 'Rp 100.000',
        color: [15, 118, 110], // teal-700
        signatoryRightRole: 'Bendahara',
        signatoryRightDefault: 'H. Anas Yusuf, S.Sos.I.',
      };
    case 'panitia':
      return {
        title: 'PENERIMAAN HONOR PANITIA PELAKSANA',
        sub: 'FESTIVAL ANAK SHOLEH INDONESIA (FASI) XIII TAHUN 2026',
        roleLabel: 'Divisi / Seksi Kepanitiaan',
        accessHeaderLabel: 'Hak Akses Ruang',
        nominalValue: 100000,
        nominalText: 'Rp 100.000',
        color: [6, 78, 59], // emerald-900
        signatoryRightRole: 'Bendahara',
        signatoryRightDefault: 'H. Anas Yusuf, S.Sos.I.',
      };
    default:
      return {
        title: 'PENERIMAAN HONOR PERANGKAT RESMI FASI XIII',
        sub: 'FESTIVAL ANAK SHOLEH INDONESIA (FASI) XIII TAHUN 2026',
        roleLabel: 'Jabatan / Penugasan',
        accessHeaderLabel: 'Hak Akses Ruang',
        nominalValue: 100000,
        nominalText: 'Rp 100.000',
        color: [15, 23, 42], // slate-900
        signatoryRightRole: 'Bendahara',
        signatoryRightDefault: 'H. Anas Yusuf, S.Sos.I.',
      };
  }
}

/**
 * Render satu kategori lembar penerimaan honor ke dalam jsPDF (Format F4 Folio Landscape)
 */
async function renderSingleCategoryHonorSheet(
  pdfDoc: jsPDF,
  categoryType: 'dewan_hakim' | 'panitera' | 'panitia',
  items: IdCardCommitteeData[],
  options: ExportHonorPdfOptions,
  isFirstPage: boolean
) {
  // Dimensi Kertas F4 Folio Landscape (330 mm lebar x 215 mm tinggi)
  const pageWidth = 330;
  const pageHeight = 215;
  const marginX = 14;
  const contentWidth = pageWidth - (marginX * 2); // 302 mm
  const meta = getHonorMeta(categoryType);
  const nominalItem = meta.nominalValue;
  const totalAnggaran = items.length * nominalItem;

  if (!isFirstPage) {
    pdfDoc.addPage(F4_FOLIO_LANDSCAPE, 'landscape');
  }

  // Load logo (Logo FASI DIY kiri & Maskot FASI DIY kanan)
  let logoLeftBase64 = '';
  let logoRightBase64 = '';
  try {
    logoLeftBase64 = await fetchImageAsBase64(LOGO_LEFT_URL);
    logoRightBase64 = await fetchImageAsBase64(LOGO_RIGHT_URL);
  } catch {
    // ignore
  }

  // 1. KOP SURAT RESMI FASI XIII (Format Landscape)
  const topY = 8;
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
  const rectHeight = 4.8;
  pdfDoc.setFillColor(229, 9, 20); // Merah #E50914
  pdfDoc.rect(marginX, rectY, contentWidth, rectHeight, 'F');

  // Tulisan di dalam pita merah: jenis arial/helvetica size 7.5 warna putih
  pdfDoc.setFont('helvetica', 'normal');
  pdfDoc.setFontSize(7.5);
  pdfDoc.setTextColor(255, 255, 255); // Putih
  pdfDoc.text(
    'Sekretariatan: Kertopaten, Wirokerten, Banguntapan, Bantul, Daerah Istimewa Yogyakarta | HP : 0877 3904 7175',
    pageWidth / 2,
    rectY + 3.4,
    { align: 'center' }
  );

  // 2. JUDUL LEMBAR PENERIMAAN HONOR
  const titleY = rectY + rectHeight + 6;
  pdfDoc.setFont('helvetica', 'bold');
  pdfDoc.setFontSize(12.5);
  pdfDoc.setTextColor(meta.color[0], meta.color[1], meta.color[2]);
  pdfDoc.text(options.customTitle || meta.title, pageWidth / 2, titleY, { align: 'center' });

  pdfDoc.setFontSize(9.5);
  pdfDoc.setTextColor(51, 65, 85);
  pdfDoc.text(meta.sub, pageWidth / 2, titleY + 4.8, { align: 'center' });

  // 3. META INFORMASI ACARA & HONORARIUM
  const metaBoxY = titleY + 7.5;
  pdfDoc.setFillColor(248, 250, 252); // slate-50
  pdfDoc.setDrawColor(226, 232, 240); // slate-200
  pdfDoc.setLineWidth(0.3);
  pdfDoc.roundedRect(marginX, metaBoxY, contentWidth, 10, 2, 2, 'FD');

  pdfDoc.setFont('helvetica', 'bold');
  pdfDoc.setFontSize(8);
  pdfDoc.setTextColor(30, 41, 59);

  const eventDateText = options.eventDate || 'Ahad, 08 November 2026';
  const venueText = options.venueName || 'SMK Muhammadiyah 3 Yogyakarta';

  pdfDoc.text('Hari / Tanggal :', marginX + 4, metaBoxY + 4);
  pdfDoc.setFont('helvetica', 'normal');
  pdfDoc.text(eventDateText, marginX + 30, metaBoxY + 4);

  pdfDoc.setFont('helvetica', 'bold');
  pdfDoc.text('Tempat / Lokasi :', marginX + 4, metaBoxY + 8);
  pdfDoc.setFont('helvetica', 'normal');
  pdfDoc.text(venueText, marginX + 30, metaBoxY + 8);

  const colRightX = marginX + 160;
  pdfDoc.setFont('helvetica', 'bold');
  pdfDoc.text('Besaran Honor per Orang :', colRightX, metaBoxY + 4);
  pdfDoc.setFont('helvetica', 'bold');
  pdfDoc.setTextColor(meta.color[0], meta.color[1], meta.color[2]);
  pdfDoc.text(`${meta.nominalText} / personel`, colRightX + 44, metaBoxY + 4);

  pdfDoc.setFont('helvetica', 'bold');
  pdfDoc.setTextColor(30, 41, 59);
  pdfDoc.text('Total Penerima :', colRightX, metaBoxY + 8);
  pdfDoc.setFont('helvetica', 'normal');
  pdfDoc.text(`${items.length} Orang`, colRightX + 44, metaBoxY + 8);

  // 4. TABEL PENERIMAAN HONOR (Landscape 302 mm content width)
  const tableHeaders = [
    'No',
    'Nama Lengkap & Gelar',
    meta.roleLabel,
    meta.accessHeaderLabel,
    'Jumlah Nominal',
    'Tanda Tangan / Penerima',
  ];

  const tableBody = items.length === 0
    ? [[
        '-',
        'Belum ada data personel terdaftar pada kategori ini.',
        '-',
        '-',
        formatRupiah(nominalItem),
        '-',
      ]]
    : items.map((item, index) => {
        const no = index + 1;
        // Format paraf selang-seling: ganjil di kiri, genap di kanan
        const isOdd = no % 2 !== 0;
        const signatureText = isOdd
          ? `${no}. ..........................`
          : `            ${no}. ..........................`;

        const accessOrInstansiValue = item.accessLevel && item.accessLevel !== 'RUANG HAKIM & JURI' && item.accessLevel !== 'ALL ACCESS'
          ? item.accessLevel
          : (categoryType === 'dewan_hakim' ? (item.accessLevel === 'RUANG HAKIM & JURI' ? '-' : (item.accessLevel || '-')) : (item.accessLevel || 'ALL ACCESS'));

        return [
          String(no),
          item.name || '(Nama belum diisi)',
          item.division || '-',
          accessOrInstansiValue,
          formatRupiah(nominalItem),
          signatureText,
        ];
      });

  const startTableY = metaBoxY + 12;

  autoTable(pdfDoc, {
    startY: startTableY,
    head: [tableHeaders],
    body: tableBody,
    foot: [
      [
        { content: '', colSpan: 1 },
        { content: 'TOTAL KESELURUHAN PENERIMAAN HONOR', colSpan: 3, styles: { halign: 'right', fontStyle: 'bold' } },
        { content: formatRupiah(totalAnggaran), styles: { halign: 'right', fontStyle: 'bold', textColor: [6, 78, 59] } },
        { content: `${items.length} Penerima`, styles: { halign: 'center', fontStyle: 'bold' } },
      ],
    ],
    showFoot: 'lastPage',
    margin: { left: marginX, right: marginX, bottom: 35 },
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
    footStyles: {
      fillColor: [248, 250, 252],
      textColor: [15, 23, 42],
      fontSize: 8.5,
      fontStyle: 'bold',
      lineWidth: 0.2,
      lineColor: [148, 163, 184],
      valign: 'middle',
      minCellHeight: 8,
    },
    // Total Lebar: 12 + 82 + 80 + 42 + 38 + 48 = 302 mm
    columnStyles: {
      0: { halign: 'center', cellWidth: 12 }, // No
      1: { halign: 'left', cellWidth: 82, fontStyle: 'bold' }, // Nama Lengkap
      2: { halign: 'left', cellWidth: 80 }, // Jabatan / Penugasan
      3: { halign: 'center', cellWidth: 42, fontSize: 7.5 }, // Instansi / Hak Akses
      4: { halign: 'right', cellWidth: 38, fontStyle: 'bold' }, // Jumlah Nominal
      5: { halign: 'left', cellWidth: 48, fontStyle: 'normal' }, // Tanda Tangan
    },
    alternateRowStyles: {
      fillColor: [255, 255, 255],
    },
  });

  // 5. BLOK TANDA TANGAN PENGESAHAN RESMI (Ketua Panitia & Bendahara)
  const lastTableY = (pdfDoc as any).lastAutoTable?.finalY || startTableY + 40;
  let signatureY = lastTableY + 6;

  // Cek apakah halaman cukup menampung blok tanda tangan di kertas F4 Landscape (215mm)
  if (signatureY + 34 > pageHeight) {
    pdfDoc.addPage(F4_FOLIO_LANDSCAPE, 'landscape');
    signatureY = 20;
  }

  const signColWidth = 80;
  const leftSignX = marginX + 16;
  const rightSignX = pageWidth - marginX - signColWidth - 16;

  pdfDoc.setFont('helvetica', 'normal');
  pdfDoc.setFontSize(8.5);
  pdfDoc.setTextColor(71, 85, 105);

  // Kiri: Mengetahui Ketua Panitia
  pdfDoc.text('Mengetahui,', leftSignX, signatureY);
  pdfDoc.setFont('helvetica', 'bold');
  pdfDoc.text('Ketua Panitia FASI XIII', leftSignX, signatureY + 4.5);

  // Kanan: Titimangsa Yogyakarta & Bendahara Panitia
  pdfDoc.setFont('helvetica', 'normal');
  pdfDoc.text('Yogyakarta, 08 November 2026', rightSignX, signatureY);
  pdfDoc.setFont('helvetica', 'bold');
  pdfDoc.text(meta.signatoryRightRole, rightSignX, signatureY + 4.5);

  // Ruang Tanda Tangan
  const nameY = signatureY + 20;

  // Nama Pengesah Kiri: Ketua Panitia
  const ketuaName = options.ketuaPanitiaName || 'Endro Suwarno, A.Md., S.E.';
  pdfDoc.setFont('helvetica', 'bold');
  pdfDoc.setFontSize(8.5);
  pdfDoc.setTextColor(15, 23, 42);
  pdfDoc.text(ketuaName, leftSignX, nameY);
  pdfDoc.setLineWidth(0.2);
  pdfDoc.line(leftSignX, nameY + 0.8, leftSignX + signColWidth, nameY + 0.8);

  // Nama Pengesah Kanan: Bendahara Panitia
  const bendaharaName = options.bendaharaName || meta.signatoryRightDefault;
  pdfDoc.setFont('helvetica', 'bold');
  pdfDoc.setFontSize(8.5);
  pdfDoc.setTextColor(15, 23, 42);
  pdfDoc.text(bendaharaName, rightSignX, nameY);
  pdfDoc.setLineWidth(0.2);
  pdfDoc.line(rightSignX, nameY + 0.8, rightSignX + signColWidth, nameY + 0.8);
}

/**
 * Generate Dokumen PDF Penerimaan Honor Resmi
 * Format: Kertas F4 Folio Landscape (330 x 215 mm)
 */
export async function generateHonorPdf(options: ExportHonorPdfOptions): Promise<Blob> {
  const pdfDoc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: F4_FOLIO_LANDSCAPE,
    compress: true,
  });

  const { categoryType, committees } = options;

  if (categoryType === 'all') {
    // Render 3 lembar terpisah: Dewan Yuri, Panitera, Panitia (terurut rapi)
    const hakimList = sortCommitteesList(committees.filter((c) => c.cardCategory === 'dewan_hakim'));
    const paniteraList = sortCommitteesList(committees.filter((c) => c.cardCategory === 'panitera'));
    const panitiaList = sortCommitteesList(committees.filter((c) => !c.cardCategory || c.cardCategory === 'panitia'));

    await renderSingleCategoryHonorSheet(pdfDoc, 'dewan_hakim', hakimList, options, true);
    await renderSingleCategoryHonorSheet(pdfDoc, 'panitera', paniteraList, options, false);
    await renderSingleCategoryHonorSheet(pdfDoc, 'panitia', panitiaList, options, false);
  } else {
    const rawFiltered = committees.filter((c) => {
      if (categoryType === 'panitia') {
        return !c.cardCategory || c.cardCategory === 'panitia';
      }
      return c.cardCategory === categoryType;
    });

    const sortedFiltered = sortCommitteesList(rawFiltered);
    await renderSingleCategoryHonorSheet(pdfDoc, categoryType, sortedFiltered, options, true);
  }

  // Footer Nomor Halaman
  const totalPages = pdfDoc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdfDoc.setPage(i);
    pdfDoc.setFont('helvetica', 'normal');
    pdfDoc.setFontSize(7);
    pdfDoc.setTextColor(148, 163, 184); // slate-400
    pdfDoc.text(
      `Lembar Bukti Penerimaan Honor Resmi FASI XIII BADKO TKA-TPA D.I. YOGYAKARTA — Halaman ${i} dari ${totalPages}`,
      165,
      209,
      { align: 'center' }
    );
  }

  return pdfDoc.output('blob');
}

/**
 * Download langsung PDF Penerimaan Honor ke komputer pengguna
 */
export async function downloadHonorPdf(
  options: ExportHonorPdfOptions,
  filename?: string
): Promise<void> {
  const blob = await generateHonorPdf(options);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;

  let defaultFilename = 'Penerimaan_Honor_FASI_XIII.pdf';
  if (options.categoryType === 'dewan_hakim') {
    defaultFilename = 'Penerimaan_Honor_Dewan_Yuri_FASI_XIII.pdf';
  } else if (options.categoryType === 'panitera') {
    defaultFilename = 'Penerimaan_Honor_Panitera_FASI_XIII.pdf';
  } else if (options.categoryType === 'panitia') {
    defaultFilename = 'Penerimaan_Honor_Panitia_Pelaksana_FASI_XIII.pdf';
  } else {
    defaultFilename = 'Penerimaan_Honor_Lengkap_Dewan_Yuri_Panitera_Panitia_FASI_XIII.pdf';
  }

  a.download = filename || defaultFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
