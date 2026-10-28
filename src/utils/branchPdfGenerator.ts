/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sistem Informasi FASI XIII Kota Yogyakarta
 * Generator PDF Berita Acara & Rekapitulasi Cabang Lomba A4 Portrait Rapi
 * Mendukung Ekspor Satuan (1 Cabang) atau Batch Semua Cabang Lomba
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Participant, CompetitionCategory, Kemantren } from '../types/fasi';
import { fetchImageAsBase64 } from './idCardPngGenerator';

const LOGO_LEFT_URL = 'https://gcligykrxdujlfapgkud.supabase.co/storage/v1/object/public/public-assets/logofasidiy.jpg';
const LOGO_RIGHT_URL = 'https://gcligykrxdujlfapgkud.supabase.co/storage/v1/object/public/public-assets/maskotfasidiy.jpeg';

interface ExportBranchPdfOptions {
  category: CompetitionCategory;
  participants: Participant[];
  kemantrenList: Kemantren[];
  doc?: jsPDF;
  isFirstPage?: boolean;
}

/**
 * Render satu cabang lomba ke halaman dokumen jsPDF A4 Portrait
 */
export async function renderBranchToPdfPage({
  category,
  participants,
  kemantrenList,
  doc,
  isFirstPage = true,
}: ExportBranchPdfOptions): Promise<jsPDF> {
  const pdfDoc = doc || new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  if (!isFirstPage) {
    pdfDoc.addPage('a4', 'portrait');
  }

  const pageWidth = 210;
  const marginX = 12;
  const contentWidth = pageWidth - (marginX * 2);

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

  // Teks Kop Tengah (Warna Biru, Font Arial Black / Helvetica Bold)
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

  // Baris 4: SK KEMENHUKAM Nomor AHU-0001522.AH.01.08.TAHUN 2026 (Hitam, normal, size 8)
  pdfDoc.setFont('helvetica', 'normal');
  pdfDoc.setFontSize(7.5);
  pdfDoc.setTextColor(0, 0, 0); // Hitam
  pdfDoc.text('SK KEMENHUKAM Nomor AHU-0001522.AH.01.08.TAHUN 2026', pageWidth / 2, topY + 18.5, { align: 'center' });

  // Garis Pembatas Persegi Panjang Berwarna Merah
  const rectY = topY + 21;
  const rectHeight = 5;
  pdfDoc.setFillColor(229, 9, 20); // Merah #E50914
  pdfDoc.rect(marginX, rectY, contentWidth, rectHeight, 'F');

  // Tulisan di dalam pita merah: jenis arial size 8 warna putih
  pdfDoc.setFont('helvetica', 'normal');
  pdfDoc.setFontSize(7);
  pdfDoc.setTextColor(255, 255, 255); // Putih
  pdfDoc.text(
    'Sekretariatan: Kertopaten, Wirokerten, Banguntapan, Bantul, Daerah Istimewa Yogyakarta | HP : 0877 3904 7175',
    pageWidth / 2,
    rectY + 3.5,
    { align: 'center' }
  );

  // 2. JUDUL DOKUMEN & NAMA CABANG LOMBA
  const titleY = rectY + rectHeight + 7;
  pdfDoc.setFont('helvetica', 'bold');
  pdfDoc.setFontSize(11);
  pdfDoc.setTextColor(15, 23, 42);
  pdfDoc.text('REKAPITULASI PESERTA CABANG LOMBA', pageWidth / 2, titleY, { align: 'center' });

  pdfDoc.setFontSize(10);
  pdfDoc.setTextColor(4, 120, 87); // emerald-700
  pdfDoc.text(
    `CABANG: [${category.code}] ${category.name.toUpperCase()} — TINGKAT ${category.level}`,
    pageWidth / 2,
    titleY + 5,
    { align: 'center' }
  );

  // Filter and sort participants for this category
  const inCat = participants
    .filter((p) => p.categoryId === category.id)
    .sort((a, b) => {
      if (a.lotteryNumber && b.lotteryNumber) return a.lotteryNumber - b.lotteryNumber;
      if (a.lotteryNumber) return -1;
      if (b.lotteryNumber) return 1;
      return a.registrationNumber.localeCompare(b.registrationNumber);
    });

  const getKemName = (id: string) => {
    const k = kemantrenList.find((item) => item.id === id);
    return k ? k.name : id;
  };

  // 3. TABEL DATA
  // Kolom: No, Undian, No Registrasi, Nama Lengkap, L/P, Kabupaten / Kota, Juri I, Juri II, Total Nilai
  const tableHeaders = [
    'No',
    'Undian',
    'No Registrasi',
    'Nama Lengkap',
    'L/P',
    'Kabupaten / Kota',
    'Juri I',
    'Juri II',
    'Total Nilai',
  ];

  const tableBody = inCat.length === 0
    ? [['-', '-', '-', 'Belum ada santri terdaftar pada cabang lomba ini.', '-', '-', '-', '-', '-']]
    : inCat.map((p, index) => {
        const kemName = getKemName(p.kemantrenId);

        const totalNilai = p.averageScore != null
          ? Number(p.averageScore.toFixed(2))
          : ((p.scoreJury1 || 0) + (p.scoreJury2 || 0)) > 0
          ? ((p.scoreJury1 || 0) + (p.scoreJury2 || 0))
          : '-';

        return [
          String(index + 1),
          p.lotteryNumber ? String(p.lotteryNumber).padStart(2, '0') : '-',
          p.registrationNumber || '-',
          p.fullName || '-',
          p.gender || '-',
          kemName || '-',
          p.scoreJury1 != null ? String(p.scoreJury1) : '',
          p.scoreJury2 != null ? String(p.scoreJury2) : '',
          totalNilai !== '-' ? String(totalNilai) : '',
        ];
      });

  const startTableY = titleY + 7;

  autoTable(pdfDoc, {
    startY: startTableY,
    head: [tableHeaders],
    body: tableBody,
    margin: { left: marginX, right: marginX, bottom: 15 },
    theme: 'grid',
    headStyles: {
      fillColor: [241, 245, 249], // slate-100
      textColor: [15, 23, 42], // slate-900
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: { top: 2, bottom: 2, left: 1.5, right: 1.5 },
      halign: 'center',
      valign: 'middle',
      lineWidth: 0.2,
      lineColor: [148, 163, 184], // slate-400
    },
    bodyStyles: {
      textColor: [15, 23, 42],
      fontSize: 7.5,
      cellPadding: { top: 1.8, bottom: 1.8, left: 1.5, right: 1.5 },
      lineWidth: 0.15,
      lineColor: [203, 213, 225], // slate-300
      valign: 'middle',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },  // No
      1: { halign: 'center', cellWidth: 14, fontStyle: 'bold' }, // Undian
      2: { halign: 'center', cellWidth: 25, fontStyle: 'bold' }, // No Registrasi
      3: { halign: 'left', cellWidth: 47, fontStyle: 'bold' },   // Nama Lengkap
      4: { halign: 'center', cellWidth: 10 }, // L/P
      5: { halign: 'left', cellWidth: 42 },   // Kabupaten / Kota
      6: { halign: 'center', cellWidth: 13 }, // Juri I
      7: { halign: 'center', cellWidth: 13 }, // Juri II
      8: { halign: 'center', cellWidth: 14, fontStyle: 'bold' }, // Total Nilai
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // slate-50
    },
  });

  // 4. BLOK TANDA TANGAN RESMI (3 Kolom: Panitera, Juri I, Juri II - manual signature & name)
  const lastTableY = (pdfDoc as any).lastAutoTable?.finalY || startTableY + 40;
  let signatureY = lastTableY + 6;

  // Jika tidak cukup ruang untuk tanda tangan (butuh minimal 30mm sebelum margin bawah), buat halaman baru
  if (signatureY + 30 > 282) {
    pdfDoc.addPage('a4', 'portrait');
    signatureY = 20;
  }

  const colWidth = contentWidth / 3;
  const col1X = marginX + (colWidth * 0.5);
  const col2X = marginX + (colWidth * 1.5);
  const col3X = marginX + (colWidth * 2.5);

  pdfDoc.setFont('helvetica', 'bold');
  pdfDoc.setFontSize(9);
  pdfDoc.setTextColor(15, 23, 42);

  // Label Header TTD
  pdfDoc.text('Panitera', col1X, signatureY, { align: 'center' });
  pdfDoc.text('Juri I', col2X, signatureY, { align: 'center' });
  pdfDoc.text('Juri II', col3X, signatureY, { align: 'center' });

  // Garis tempat tanda tangan dan nama manual
  const lineSignY = signatureY + 22;
  const lineWidth = 38;

  pdfDoc.setLineWidth(0.3);
  pdfDoc.setDrawColor(15, 23, 42);
  pdfDoc.line(col1X - (lineWidth / 2), lineSignY, col1X + (lineWidth / 2), lineSignY);
  pdfDoc.line(col2X - (lineWidth / 2), lineSignY, col2X + (lineWidth / 2), lineSignY);
  pdfDoc.line(col3X - (lineWidth / 2), lineSignY, col3X + (lineWidth / 2), lineSignY);

  // Petunjuk halus di bawah garis
  pdfDoc.setFont('helvetica', 'italic');
  pdfDoc.setFontSize(7.5);
  pdfDoc.setTextColor(100, 116, 139);
  pdfDoc.text('( Nama Terang & TTD )', col1X, lineSignY + 4, { align: 'center' });
  pdfDoc.text('( Nama Terang & TTD )', col2X, lineSignY + 4, { align: 'center' });
  pdfDoc.text('( Nama Terang & TTD )', col3X, lineSignY + 4, { align: 'center' });

  return pdfDoc;
}

/**
 * Unduh 1 Cabang Lomba Aktif sebagai PDF Resmi
 */
export async function downloadSingleBranchPdf(
  category: CompetitionCategory,
  participants: Participant[],
  kemantrenList: Kemantren[]
): Promise<void> {
  const doc = await renderBranchToPdfPage({
    category,
    participants,
    kemantrenList,
    isFirstPage: true,
  });

  const safeCatName = category.name.replace(/[/\\?%*:|"<>]/g, '_');
  doc.save(`Rekapitulasi_Cabang_${category.code}_${safeCatName}.pdf`);
}

/**
 * Unduh SEMUA Cabang Lomba dalam 1 Dokumen PDF Lengkap (A4 Multi-page)
 */
export async function downloadAllBranchesPdf({
  categories,
  participants,
  kemantrenList,
  onProgress,
}: {
  categories: CompetitionCategory[];
  participants: Participant[];
  kemantrenList: Kemantren[];
  onProgress?: (current: number, total: number) => void;
}): Promise<void> {
  if (!categories.length) return;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const total = categories.length;
  for (let i = 0; i < total; i++) {
    if (onProgress) onProgress(i + 1, total);
    const cat = categories[i];
    await renderBranchToPdfPage({
      category: cat,
      participants,
      kemantrenList,
      doc,
      isFirstPage: i === 0,
    });
  }

  const dateStr = new Date().toISOString().slice(0, 10);
  doc.save(`Rekapitulasi_Semua_Cabang_Lomba_FASI_XIII_${dateStr}.pdf`);
}

/**
 * Render satu cabang lomba ke halaman dokumen jsPDF Lembar Daftar Hadir / Presensi Peserta
 */
export async function renderAttendanceToPdfPage({
  category,
  participants,
  kemantrenList,
  doc,
  isFirstPage = true,
}: ExportBranchPdfOptions): Promise<jsPDF> {
  const pdfDoc = doc || new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  if (!isFirstPage) {
    pdfDoc.addPage('a4', 'portrait');
  }

  const pageWidth = 210;
  const marginX = 12;
  const contentWidth = pageWidth - (marginX * 2);

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

  // Teks Kop Tengah (Warna Biru, Font Arial Black / Helvetica Bold)
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

  // Baris 4: SK KEMENHUKAM Nomor AHU-0001522.AH.01.08.TAHUN 2026 (Hitam, normal, size 8)
  pdfDoc.setFont('helvetica', 'normal');
  pdfDoc.setFontSize(7.5);
  pdfDoc.setTextColor(0, 0, 0); // Hitam
  pdfDoc.text('SK KEMENHUKAM Nomor AHU-0001522.AH.01.08.TAHUN 2026', pageWidth / 2, topY + 18.5, { align: 'center' });

  // Garis Pembatas Persegi Panjang Berwarna Merah
  const rectY = topY + 21;
  const rectHeight = 5;
  pdfDoc.setFillColor(229, 9, 20); // Merah #E50914
  pdfDoc.rect(marginX, rectY, contentWidth, rectHeight, 'F');

  // Tulisan di dalam pita merah: jenis arial size 8 warna putih
  pdfDoc.setFont('helvetica', 'normal');
  pdfDoc.setFontSize(7);
  pdfDoc.setTextColor(255, 255, 255); // Putih
  pdfDoc.text(
    'Sekretariatan: Kertopaten, Wirokerten, Banguntapan, Bantul, Daerah Istimewa Yogyakarta | HP : 0877 3904 7175',
    pageWidth / 2,
    rectY + 3.5,
    { align: 'center' }
  );

  // 2. JUDUL DOKUMEN & NAMA CABANG LOMBA
  const titleY = rectY + rectHeight + 7;
  pdfDoc.setFont('helvetica', 'bold');
  pdfDoc.setFontSize(11);
  pdfDoc.setTextColor(15, 23, 42);
  pdfDoc.text('DAFTAR HADIR / PRESENSI PESERTA LOMBA', pageWidth / 2, titleY, { align: 'center' });

  pdfDoc.setFontSize(10);
  pdfDoc.setTextColor(4, 120, 87); // emerald-700
  pdfDoc.text(
    `CABANG: [${category.code}] ${category.name.toUpperCase()} — TINGKAT ${category.level}`,
    pageWidth / 2,
    titleY + 5,
    { align: 'center' }
  );

  // Filter and sort participants for this category
  const inCat = participants
    .filter((p) => p.categoryId === category.id)
    .sort((a, b) => {
      if (a.lotteryNumber && b.lotteryNumber) return a.lotteryNumber - b.lotteryNumber;
      if (a.lotteryNumber) return -1;
      if (b.lotteryNumber) return 1;
      return a.registrationNumber.localeCompare(b.registrationNumber);
    });

  const getKemName = (id: string) => {
    const k = kemantrenList.find((item) => item.id === id);
    return k ? k.name : id;
  };

  // 3. TABEL DATA DAFTAR HADIR
  // Kolom: No, Undian, No Registrasi, Nama Lengkap, L/P, Kabupaten / Kota, Paraf / Tanda Tangan
  const tableHeaders = [
    'No',
    'Undian',
    'No Registrasi',
    'Nama Lengkap',
    'L/P',
    'Kabupaten / Kota',
    'Paraf / Tanda Tangan',
  ];

  const tableBody = inCat.length === 0
    ? [['-', '-', '-', 'Belum ada santri terdaftar pada cabang lomba ini.', '-', '-', '-']]
    : inCat.map((p, index) => {
        const kemName = getKemName(p.kemantrenId);

        // Alternating numbering format for classic Indonesian attendance signature cell
        const signCell = (index % 2 === 0)
          ? `${index + 1}. .........`
          : `       ${index + 1}. .........`;

        return [
          String(index + 1),
          p.lotteryNumber ? String(p.lotteryNumber).padStart(2, '0') : '-',
          p.registrationNumber || '-',
          p.fullName || '-',
          p.gender || '-',
          kemName || '-',
          signCell,
        ];
      });

  const startTableY = titleY + 7;

  autoTable(pdfDoc, {
    startY: startTableY,
    head: [tableHeaders],
    body: tableBody,
    margin: { left: marginX, right: marginX, bottom: 15 },
    theme: 'grid',
    headStyles: {
      fillColor: [241, 245, 249], // slate-100
      textColor: [15, 23, 42], // slate-900
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: { top: 2, bottom: 2, left: 1.5, right: 1.5 },
      halign: 'center',
      valign: 'middle',
      lineWidth: 0.2,
      lineColor: [148, 163, 184], // slate-400
    },
    bodyStyles: {
      textColor: [15, 23, 42],
      fontSize: 7.5,
      cellPadding: { top: 2, bottom: 2, left: 1.5, right: 1.5 },
      lineWidth: 0.15,
      lineColor: [203, 213, 225], // slate-300
      valign: 'middle',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },  // No
      1: { halign: 'center', cellWidth: 14, fontStyle: 'bold' }, // Undian
      2: { halign: 'center', cellWidth: 25, fontStyle: 'bold' }, // No Registrasi
      3: { halign: 'left', cellWidth: 52, fontStyle: 'bold' },   // Nama Lengkap
      4: { halign: 'center', cellWidth: 10 }, // L/P
      5: { halign: 'left', cellWidth: 45 },   // Kabupaten / Kota
      6: { halign: 'left', cellWidth: 32, fontStyle: 'normal' },  // Paraf / TTD
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // slate-50
    },
  });

  // 4. BLOK TANDA TANGAN RESMI PRESENSI (1 Tanda Tangan: Panitera di Sisi Kanan)
  const lastTableY = (pdfDoc as any).lastAutoTable?.finalY || startTableY + 40;
  let signatureY = lastTableY + 6;

  if (signatureY + 30 > 282) {
    pdfDoc.addPage('a4', 'portrait');
    signatureY = 20;
  }

  // Tanda tangan Panitera di sisi kanan lembar
  const signX = marginX + contentWidth - 36;

  pdfDoc.setFont('helvetica', 'bold');
  pdfDoc.setFontSize(9);
  pdfDoc.setTextColor(15, 23, 42);

  // Label Header TTD
  pdfDoc.text('Panitera', signX, signatureY, { align: 'center' });

  // Garis tempat tanda tangan dan nama manual
  const lineSignY = signatureY + 22;
  const lineWidth = 52;

  pdfDoc.setLineWidth(0.3);
  pdfDoc.setDrawColor(15, 23, 42);
  pdfDoc.line(signX - (lineWidth / 2), lineSignY, signX + (lineWidth / 2), lineSignY);

  // Petunjuk halus di bawah garis
  pdfDoc.setFont('helvetica', 'italic');
  pdfDoc.setFontSize(7.5);
  pdfDoc.setTextColor(100, 116, 139);
  pdfDoc.text('( Nama Terang & TTD )', signX, lineSignY + 4, { align: 'center' });

  return pdfDoc;
}

/**
 * Unduh Lembar Daftar Hadir 1 Cabang Lomba sebagai PDF Resmi
 */
export async function downloadSingleBranchAttendancePdf(
  category: CompetitionCategory,
  participants: Participant[],
  kemantrenList: Kemantren[]
): Promise<void> {
  const doc = await renderAttendanceToPdfPage({
    category,
    participants,
    kemantrenList,
    isFirstPage: true,
  });

  const safeCatName = category.name.replace(/[/\\?%*:|"<>]/g, '_');
  doc.save(`Daftar_Hadir_Cabang_${category.code}_${safeCatName}.pdf`);
}

/**
 * Unduh Lembar Daftar Hadir SEMUA Cabang Lomba dalam 1 Dokumen PDF Lengkap (A4 Multi-page)
 */
export async function downloadAllBranchesAttendancePdf({
  categories,
  participants,
  kemantrenList,
  onProgress,
}: {
  categories: CompetitionCategory[];
  participants: Participant[];
  kemantrenList: Kemantren[];
  onProgress?: (current: number, total: number) => void;
}): Promise<void> {
  if (!categories.length) return;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const total = categories.length;
  for (let i = 0; i < total; i++) {
    if (onProgress) onProgress(i + 1, total);
    const cat = categories[i];
    await renderAttendanceToPdfPage({
      category: cat,
      participants,
      kemantrenList,
      doc,
      isFirstPage: i === 0,
    });
  }

  const dateStr = new Date().toISOString().slice(0, 10);
  doc.save(`Daftar_Hadir_Semua_Cabang_Lomba_FASI_XIII_${dateStr}.pdf`);
}

