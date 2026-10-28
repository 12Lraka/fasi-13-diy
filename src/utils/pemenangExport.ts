/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sistem Informasi FASI XIII Kota Yogyakarta
 * Generator Ekspor Excel (.xlsx) & PDF untuk Hasil Pemenang / Rekapitulasi Kejuaraan
 */

import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BeritaAcaraKejuaraan, CompetitionCategory, WinnerSlot } from '../types/fasi';
import { fetchImageAsBase64 } from './idCardPngGenerator';

const LOGO_LEFT_URL = 'https://gcligykrxdujlfapgkud.supabase.co/storage/v1/object/public/public-assets/logofasidiy.jpg';
const LOGO_RIGHT_URL = 'https://gcligykrxdujlfapgkud.supabase.co/storage/v1/object/public/public-assets/maskotfasidiy.jpeg';

export const F4_FOLIO_LANDSCAPE: [number, number] = [330, 215];

export interface WinnerRow {
  no: number;
  cabangKode: string;
  cabangNama: string;
  jenjang: string;
  kategoriGender: string;
  isCabangUtama: boolean;
  peringkat: string; // Juara I, II, III
  namaPemenang: string;
  kontingenDaerah: string;
  rayon: string;
  unitTpa: string;
  totalNilai: number | string;
  tanggalPenetapan: string;
}

/**
 * Ekstraksi baris datar pemenang dari daftar Berita Acara
 * Diurutkan berdasarkan:
 * 1. Jenjang (TKA -> TPA -> TQA)
 * 2. Kode Cabang Lomba secara urut (TKA-01, TKA-02, ..., TPA-01, dst. sesuai Juknis)
 * 3. Peringkat Juara (Juara I -> Juara II -> Juara III)
 */
export function extractWinnerRows(
  categories: CompetitionCategory[],
  beritaAcaraMap: Map<string, BeritaAcaraKejuaraan>,
  onlyDisahkan: boolean = false
): WinnerRow[] {
  const rows: WinnerRow[] = [];
  let no = 1;

  const LEVEL_ORDER: Record<string, number> = {
    TKA: 1,
    TPA: 2,
    TQA: 3,
  };

  // Urutkan kategori berdasarkan Jenjang lalu Kode Cabang Lomba
  const sortedCategories = [...categories].sort((a, b) => {
    const levelRankA = a.level ? (LEVEL_ORDER[a.level] || 99) : 99;
    const levelRankB = b.level ? (LEVEL_ORDER[b.level] || 99) : 99;
    if (levelRankA !== levelRankB) {
      return levelRankA - levelRankB;
    }
    // Urutkan kode cabang (misal TKA-01, TKA-02, dst.)
    return (a.code || '').localeCompare(b.code || '', 'id', { numeric: true });
  });

  sortedCategories.forEach((cat) => {
    const ba = beritaAcaraMap.get(cat.id);
    if (onlyDisahkan && ba?.status !== 'Disahkan') return;

    const isUtama = ba?.isCabangUtama ?? (
      (cat.level === 'TKA' && cat.name.toLowerCase().includes('tartil')) ||
      (cat.level === 'TPA' && cat.name.toLowerCase().includes('tartil')) ||
      (cat.level === 'TQA' && (cat.name.toLowerCase().includes('tilawah') || cat.name.toLowerCase().includes('tilawati')))
    );

    const genderText = cat.genderRequirement === 'L'
      ? 'Putra'
      : cat.genderRequirement === 'P'
      ? 'Putri'
      : 'Campuran/Beregu';

    const tgl = ba?.tanggalPenetapan || '-';

    const checkAndAdd = (peringkat: string, slot?: WinnerSlot) => {
      if (slot && (slot.nama?.trim() || slot.totalNilai > 0)) {
        const cleanKontingen = slot.kemantren
          ? slot.kemantren.replace(/^Rayon\s+/i, '').replace(/^Kem\.\s+/i, '').trim()
          : (slot.unitTpa || '-');

        rows.push({
          no: no++,
          cabangKode: cat.code,
          cabangNama: cat.name,
          jenjang: cat.level,
          kategoriGender: genderText,
          isCabangUtama: isUtama,
          peringkat,
          namaPemenang: slot.nama || '-',
          kontingenDaerah: cleanKontingen || '-',
          rayon: cleanKontingen || '-',
          unitTpa: slot.unitTpa || '-',
          totalNilai: slot.totalNilai || 0,
          tanggalPenetapan: tgl,
        });
      }
    };

    // Peringkat diproses berurutan: Juara I -> Juara II -> Juara III
    if (ba?.pemenang) {
      checkAndAdd('Juara I', ba.pemenang.juara1);
      checkAndAdd('Juara II', ba.pemenang.juara2);
      checkAndAdd('Juara III', ba.pemenang.juara3);
    }
  });

  return rows;
}

/**
 * Ekspor Hasil Pemenang ke File Microsoft Excel Asli (.xlsx)
 */
export function exportPemenangToExcel(
  categories: CompetitionCategory[],
  beritaAcaraMap: Map<string, BeritaAcaraKejuaraan>,
  fileNamePrefix: string = 'Hasil_Pemenang_FASI_XIII_DIY'
) {
  const winnerRows = extractWinnerRows(categories, beritaAcaraMap, false);

  const titleRows = [
    ['FESTIVAL ANAK SHOLEH INDONESIA (FASI) XIII D.I. YOGYAKARTA'],
    ['BADKO TKA-TPA D.I. YOGYAKARTA'],
    ['Sekretariat : Kertopaten, Glondong, Wirokerten, Kec. Banguntapan, Bantul, DIY 55194'],
    [],
    ['DAFTAR RESMI PEMENANG KEJUARAAN PER CABANG LOMBA'],
    [
      `Waktu Unduh: ${new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })} | Total Data Pemenang: ${winnerRows.length} Peringkat`,
    ],
    [],
  ];

  const headers = [
    'No',
    'Kode Cabang',
    'Cabang Lomba',
    'Jenjang',
    'Kategori',
    'Peringkat / Juara',
    'Nama Lengkap Pemenang',
    'Kontingen / Kab. Kota',
    'Total Skor / Nilai',
    'Tanggal Penetapan',
    'Keterangan Bobot',
  ];

  const dataRows = winnerRows.map((r) => [
    r.no,
    r.cabangKode,
    r.cabangNama,
    r.jenjang,
    r.kategoriGender,
    r.peringkat,
    r.namaPemenang,
    r.kontingenDaerah,
    r.totalNilai,
    r.tanggalPenetapan,
    r.isCabangUtama ? 'Cabang Utama (7-5-3)' : 'Cabang Reguler (5-3-1)',
  ]);

  const wsData = [...titleRows, headers, ...dataRows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Lebar Kolom
  ws['!cols'] = [
    { wch: 6 },  // No
    { wch: 12 }, // Kode Cabang
    { wch: 32 }, // Cabang Lomba
    { wch: 10 }, // Jenjang
    { wch: 15 }, // Kategori
    { wch: 18 }, // Peringkat
    { wch: 32 }, // Nama Pemenang
    { wch: 22 }, // Rayon
    { wch: 28 }, // Unit TPA
    { wch: 14 }, // Total Nilai
    { wch: 18 }, // Tanggal
    { wch: 22 }, // Bobot
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Hasil Pemenang FASI XIII');

  const dateStr = new Date().toISOString().slice(0, 10);
  const fullFileName = `${fileNamePrefix}_${dateStr}.xlsx`;

  XLSX.writeFile(wb, fullFileName);
}

/**
 * Render Kop Surat Resmi FASI XIII untuk Dokumen PDF Landscape F4
 */
function renderLandscapeFasiKopSurat(
  doc: jsPDF,
  pageWidth: number,
  marginX: number,
  contentWidth: number,
  logoLeftBase64: string,
  logoRightBase64: string
): number {
  const topY = 10;
  const logoSize = 22;

  // 1. Logo Kiri: FASI XIII DIY
  if (logoLeftBase64 && logoLeftBase64.startsWith('data:')) {
    try {
      const format = logoLeftBase64.includes('image/png') ? 'PNG' : 'JPEG';
      doc.addImage(logoLeftBase64, format, marginX, topY, logoSize, logoSize);
    } catch {}
  }

  // 2. Logo Kanan: Maskot FASI XIII DIY
  if (logoRightBase64 && logoRightBase64.startsWith('data:')) {
    try {
      const format = logoRightBase64.includes('image/png') ? 'PNG' : 'JPEG';
      doc.addImage(logoRightBase64, format, pageWidth - marginX - logoSize, topY, logoSize, logoSize);
    } catch {}
  }

  // 3. Teks Kop Tengah (Warna Biru #0047AB, Font Helvetica Bold)
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 71, 171); // Biru #0047AB

  // Baris 1: PANITIA PELAKSANA
  doc.setFontSize(16);
  doc.text('PANITIA PELAKSANA', pageWidth / 2, topY + 4.5, { align: 'center' });

  // Baris 2: FESTIVAL ANAK SHOLEH INDONESIA XIII
  doc.setFontSize(12.5);
  doc.text('FESTIVAL ANAK SHOLEH INDONESIA XIII', pageWidth / 2, topY + 9.5, { align: 'center' });

  // Baris 3: BADAN KOORDINASI TKA-TPA DI.YOGYAKARTA
  doc.setFontSize(12.5);
  doc.text('BADAN KOORDINASI TKA-TPA DI.YOGYAKARTA', pageWidth / 2, topY + 14.5, { align: 'center' });

  // Baris 4: SK KEMENHUKAM Nomor AHU-0001522.AH.01.08.TAHUN 2026 (Hitam normal, size 8)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0); // Hitam
  doc.text('SK KEMENHUKAM Nomor AHU-0001522.AH.01.08.TAHUN 2026', pageWidth / 2, topY + 18.5, { align: 'center' });

  // 4. Garis Pembatas Persegi Panjang Berwarna Merah
  const rectY = topY + 21;
  const rectHeight = 5.5;
  doc.setFillColor(229, 9, 20); // Merah #E50914
  doc.rect(marginX, rectY, contentWidth, rectHeight, 'F');

  // Tulisan di dalam pita merah: jenis arial size 8 warna putih
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255); // Putih
  doc.text(
    'Sekretariatan: Kertopaten, Wirokerten, Banguntapan, Bantul, Daerah Istimewa Yogyakarta | HP : 0877 3904 7175',
    pageWidth / 2,
    rectY + 3.8,
    { align: 'center' }
  );

  return rectY + rectHeight;
}

/**
 * Ekspor Hasil Pemenang ke Dokumen PDF Resmi (Format F4 Folio Landscape Rapi dengan Kop Surat)
 */
export async function exportPemenangToPdf(
  categories: CompetitionCategory[],
  beritaAcaraMap: Map<string, BeritaAcaraKejuaraan>,
  fileNamePrefix: string = 'Hasil_Pemenang_FASI_XIII_DIY',
  onlyDisahkan: boolean = false
) {
  const winnerRows = extractWinnerRows(categories, beritaAcaraMap, onlyDisahkan);

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [215, 330], // F4 Folio Landscape (330mm x 215mm)
    compress: true,
  });

  const pageWidth = 330;
  const pageHeight = 215;
  const marginX = 14;
  const contentWidth = pageWidth - (marginX * 2); // 302 mm

  // Load logo images as Base64
  let logoLeftBase64 = '';
  let logoRightBase64 = '';
  try {
    logoLeftBase64 = await fetchImageAsBase64(LOGO_LEFT_URL);
    logoRightBase64 = await fetchImageAsBase64(LOGO_RIGHT_URL);
  } catch {
    // ignore
  }

  // 1. KOP SURAT RESMI FASI XIII
  const headerBottomY = renderLandscapeFasiKopSurat(
    doc,
    pageWidth,
    marginX,
    contentWidth,
    logoLeftBase64,
    logoRightBase64
  );

  // 2. JUDUL DOKUMEN
  const titleY = headerBottomY + 7;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('DAFTAR RESMI REKAPITULASI PEMENANG KEJUARAAN', pageWidth / 2, titleY, { align: 'center' });

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(
    'Dokumen Sah Penetapan Dewan Juri • Pelaksanaan: Ahad, 08 November 2026',
    pageWidth / 2,
    titleY + 4.5,
    { align: 'center' }
  );

  // 3. TABEL DATA
  const tableHeaders = [
    'No',
    'Kode',
    'Cabang Lomba',
    'Jenjang',
    'Peringkat',
    'Nama Lengkap Juara',
    'Kontingen / Kab. Kota',
    'Total Nilai',
  ];

  const tableBody = winnerRows.length === 0
    ? [['-', '-', 'Belum ada data pemenang yang disahkan.', '-', '-', '-', '-', '-']]
    : winnerRows.map((r) => [
        r.no,
        r.cabangKode,
        r.cabangNama,
        r.jenjang,
        r.peringkat,
        r.namaPemenang,
        r.kontingenDaerah,
        r.totalNilai,
      ]);

  autoTable(doc, {
    head: [tableHeaders],
    body: tableBody,
    startY: titleY + 8,
    margin: { left: marginX, right: marginX, bottom: 18 },
    styles: {
      fontSize: 8,
      cellPadding: 2.4,
      lineColor: [203, 213, 225],
      lineWidth: 0.15,
      textColor: [15, 23, 42],
      valign: 'middle',
    },
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'center',
      lineWidth: 0.2,
      lineColor: [148, 163, 184],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'center', cellWidth: 18, fontStyle: 'bold' },
      2: { cellWidth: 68 },
      3: { halign: 'center', cellWidth: 18 },
      4: { halign: 'center', cellWidth: 28, fontStyle: 'bold' },
      5: { cellWidth: 76, fontStyle: 'bold' },
      6: { cellWidth: 62 },
      7: { halign: 'center', cellWidth: 22, fontStyle: 'bold' },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    didDrawPage: () => {
      // Footer Halaman
      const pageCount = (doc as any).internal.getNumberOfPages();
      const currentPage = (doc as any).internal.getCurrentPageInfo().pageNumber;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `FASI XIII D.I. Yogyakarta — Hasil Pemenang Resmi (Kertas F4 Landscape) • Halaman ${currentPage} dari ${pageCount}`,
        pageWidth / 2,
        pageHeight - 6,
        { align: 'center' }
      );
    },
  });

  const dateStr = new Date().toISOString().slice(0, 10);
  doc.save(`${fileNamePrefix}_${dateStr}.pdf`);
}

/**
 * Ekspor 1 Cabang Lomba Spesifik ke PDF Lembar Keputusan Resmi F4 (Folio) Landscape
 */
export async function exportSingleCabangPdf(
  category: CompetitionCategory,
  beritaAcara?: BeritaAcaraKejuaraan
) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [215, 330], // F4 Folio Landscape (330mm x 215mm)
    compress: true,
  });

  const pageWidth = 330;
  const pageHeight = 215;
  const marginX = 16;
  const contentWidth = pageWidth - (marginX * 2); // 298 mm

  let logoLeftBase64 = '';
  let logoRightBase64 = '';
  try {
    logoLeftBase64 = await fetchImageAsBase64(LOGO_LEFT_URL);
    logoRightBase64 = await fetchImageAsBase64(LOGO_RIGHT_URL);
  } catch {}

  // 1. KOP SURAT RESMI FASI XIII
  const headerBottomY = renderLandscapeFasiKopSurat(
    doc,
    pageWidth,
    marginX,
    contentWidth,
    logoLeftBase64,
    logoRightBase64
  );

  // 2. JUDUL DOKUMEN & SUBJUDUL CABANG
  const titleY = headerBottomY + 7;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('BERITA ACARA PENETAPAN HASIL KEJUARAAN', pageWidth / 2, titleY, { align: 'center' });

  doc.setFontSize(10.5);
  doc.setTextColor(0, 71, 171); // Biru #0047AB
  doc.text(`CABANG LOMBA: [${category.code}] ${category.name.toUpperCase()}`, pageWidth / 2, titleY + 5.5, { align: 'center' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Jenjang: ${category.level} | Tanggal Penetapan: ${beritaAcara?.tanggalPenetapan || '08 November 2026'} | Status: ${
      beritaAcara?.status === 'Disahkan' ? 'RESMI DISAHKAN' : 'DRAFT'
    }`,
    pageWidth / 2,
    titleY + 10.5,
    { align: 'center' }
  );

  // 3. NARASI PEMBUKA
  const narasiY = titleY + 16;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  const narasi = `Pada hari ini, tanggal ${beritaAcara?.tanggalPenetapan || '08 November 2026'}, bertempat di lokasi pelaksanaan FASI XIII D.I. Yogyakarta, Dewan Juri Cabang Lomba [${category.code}] ${category.name} (${category.level}) telah melaksanakan penilaian dan menetapkan para pemenang kejuaraan sebagai berikut:`;
  const splitNarasi = doc.splitTextToSize(narasi, contentWidth);
  doc.text(splitNarasi, marginX, narasiY);

  // 4. DATA PEMENANG
  const p = beritaAcara?.pemenang;
  const getKontingenText = (slot?: WinnerSlot) => {
    if (!slot) return '-';
    const raw = slot.kemantren ? slot.kemantren.replace(/^Rayon\s+/i, '').replace(/^Kem\.\s+/i, '').trim() : (slot.unitTpa || '-');
    return raw || '-';
  };

  const tableData = [
    ['Juara I', p?.juara1?.nama || '-', getKontingenText(p?.juara1), p?.juara1?.unitTpa || '-', p?.juara1?.totalNilai || '-'],
    ['Juara II', p?.juara2?.nama || '-', getKontingenText(p?.juara2), p?.juara2?.unitTpa || '-', p?.juara2?.totalNilai || '-'],
    ['Juara III', p?.juara3?.nama || '-', getKontingenText(p?.juara3), p?.juara3?.unitTpa || '-', p?.juara3?.totalNilai || '-'],
  ];

  autoTable(doc, {
    head: [['Peringkat', 'Nama Lengkap Juara', 'Kabupaten / Kota', 'Asal Unit TPA', 'Total Nilai']],
    body: tableData,
    startY: narasiY + (splitNarasi.length * 4) + 2,
    margin: { left: marginX, right: marginX },
    styles: {
      fontSize: 8.5,
      cellPadding: 2.8,
      lineColor: [203, 213, 225],
      lineWidth: 0.15,
      textColor: [15, 23, 42],
      valign: 'middle',
    },
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'center',
      lineWidth: 0.2,
      lineColor: [148, 163, 184],
    },
    columnStyles: {
      0: { cellWidth: 36, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 82, fontStyle: 'bold' },
      2: { cellWidth: 70 },
      3: { cellWidth: 74 },
      4: { cellWidth: 36, halign: 'center', fontStyle: 'bold' },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  const tableEndY = (doc as any).lastAutoTable?.finalY || (narasiY + 36);
  let afterTableY = tableEndY + 5;

  // Catatan juri jika ada
  if (beritaAcara?.catatanJuri || (beritaAcara as any)?.catatan) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Catatan Dewan Juri: "${beritaAcara.catatanJuri || (beritaAcara as any).catatan}"`, marginX, afterTableY);
    afterTableY += 4.5;
  }

  // Narasi Penutup
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  const closingText = 'Demikian Berita Acara ini dibuat dengan sebenarnya dan ditandatangani oleh Dewan Juri untuk dipergunakan sebagaimana mestinya. Keputusan Dewan Juri bersifat mutlak dan tidak dapat diganggu gugat.';
  const splitClosing = doc.splitTextToSize(closingText, contentWidth);
  doc.text(splitClosing, marginX, afterTableY);

  afterTableY += 7;

  // 5. TANDA TANGAN DEWAN JURI
  const signColWidth = contentWidth / 2;
  const colLeftX = marginX + (signColWidth / 2);
  const colRightX = marginX + signColWidth + (signColWidth / 2);

  // Titimangsa di sisi kanan
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Yogyakarta, 08 November 2026', colRightX, afterTableY, { align: 'center' });

  // Tanda Tangan: Dewan Juri I (Kiri) & Dewan Juri II (Kanan)
  doc.text('Dewan Juri I (Ketua),', colLeftX, afterTableY + 4.5, { align: 'center' });
  doc.text('Dewan Juri II (Sekretaris),', colRightX, afterTableY + 4.5, { align: 'center' });

  const juri1 = beritaAcara?.juriSatu || beritaAcara?.namaKetuaJuri || '( ........................................ )';
  const juri2 = beritaAcara?.juriDua || beritaAcara?.namaAnggotaJuri || '( ........................................ )';

  const lineSignY = afterTableY + 22;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(juri1, colLeftX, lineSignY, { align: 'center' });
  doc.text(juri2, colRightX, lineSignY, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Ketua Dewan Juri', colLeftX, lineSignY + 4, { align: 'center' });
  doc.text('Anggota / Sekretaris Dewan Juri', colRightX, lineSignY + 4, { align: 'center' });

  const safeCategoryCode = category.code.replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`Berita_Acara_${safeCategoryCode}_${category.level}.pdf`);
}
