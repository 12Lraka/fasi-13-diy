/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sistem Informasi FASI XIII Kota Yogyakarta
 * Generator PDF Rekapitulasi Nominasi Tetap Peserta Lomba F4 / A4 Portrait Rapi
 * Mendukung Ekspor Satuan (Filter/Kabupaten Terpilih) atau Batch Semua 5 Kabupaten/Kota
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Participant, CompetitionCategory, Kemantren } from '../types/fasi';
import { fetchImageAsBase64 } from './idCardPngGenerator';

const LOGO_LEFT_URL = 'https://gcligykrxdujlfapgkud.supabase.co/storage/v1/object/public/public-assets/logofasidiy.jpg';
const LOGO_RIGHT_URL = 'https://gcligykrxdujlfapgkud.supabase.co/storage/v1/object/public/public-assets/maskotfasidiy.jpeg';

export const F4_FOLIO_FORMAT: [number, number] = [215, 330];

interface ExportRecapPdfOptions {
  titleSubtitle: {
    mainTitle?: string;
    subTitle?: string;
    filterInfo?: string;
  };
  participants: Participant[];
  categoriesList: CompetitionCategory[];
  kemantrenList: Kemantren[];
  doc?: jsPDF;
  isFirstPage?: boolean;
  docType?: 'daftar_hadir' | 'nominasi';
  orientation?: 'landscape' | 'portrait';
  paperSize?: 'a4' | 'f4';
}

/**
 * Render satu lembar / kontingen rekapitulasi ke dokumen jsPDF F4/A4 (Portrait / Landscape)
 */
export async function renderRecapToPdfPage({
  titleSubtitle,
  participants,
  categoriesList,
  kemantrenList,
  doc,
  isFirstPage = true,
  docType = 'nominasi',
  orientation = 'portrait',
  paperSize = 'f4',
}: ExportRecapPdfOptions): Promise<jsPDF> {
  const pageFormat: [number, number] | string = paperSize === 'f4' ? F4_FOLIO_FORMAT : 'a4';

  const pdfDoc = doc || new jsPDF({
    orientation: orientation,
    unit: 'mm',
    format: pageFormat,
    compress: true,
  });

  if (!isFirstPage) {
    pdfDoc.addPage(pageFormat, orientation);
  }

  const pageWidth = paperSize === 'f4'
    ? (orientation === 'landscape' ? 330 : 215)
    : (orientation === 'landscape' ? 297 : 210);
  const pageHeight = paperSize === 'f4'
    ? (orientation === 'landscape' ? 215 : 330)
    : (orientation === 'landscape' ? 210 : 297);
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
  const logoSize = orientation === 'landscape' ? 22 : 18;

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
  pdfDoc.setFontSize(orientation === 'landscape' ? 17 : 14);
  pdfDoc.text('PANITIA PELAKSANA', pageWidth / 2, topY + 4.5, { align: 'center' });

  // Baris 2: FESTIVAL ANAK SHOLEH INDONESIA XIII
  pdfDoc.setFontSize(orientation === 'landscape' ? 13 : 11);
  pdfDoc.text('FESTIVAL ANAK SHOLEH INDONESIA XIII', pageWidth / 2, topY + 9.5, { align: 'center' });

  // Baris 3: BADAN KOORDINASI TKA-TPA DI.YOGYAKARTA
  pdfDoc.setFontSize(orientation === 'landscape' ? 13 : 11);
  pdfDoc.text('BADAN KOORDINASI TKA-TPA DI.YOGYAKARTA', pageWidth / 2, topY + 14.5, { align: 'center' });

  // Baris 4: SK KEMENHUKAM Nomor AHU-0001522.AH.01.08.TAHUN 2026 (Hitam, normal, size 8)
  pdfDoc.setFont('helvetica', 'normal');
  pdfDoc.setFontSize(orientation === 'landscape' ? 8 : 7.5);
  pdfDoc.setTextColor(0, 0, 0); // Hitam
  pdfDoc.text('SK KEMENHUKAM Nomor AHU-0001522.AH.01.08.TAHUN 2026', pageWidth / 2, topY + 18.5, { align: 'center' });

  // Garis Pembatas Persegi Panjang Berwarna Merah
  const rectY = topY + 21;
  const rectHeight = orientation === 'landscape' ? 5.5 : 5;
  pdfDoc.setFillColor(229, 9, 20); // Merah #E50914
  pdfDoc.rect(marginX, rectY, contentWidth, rectHeight, 'F');

  // Tulisan di dalam pita merah: jenis arial size 8 warna putih
  pdfDoc.setFont('helvetica', 'normal');
  pdfDoc.setFontSize(orientation === 'landscape' ? 8 : 7);
  pdfDoc.setTextColor(255, 255, 255); // Putih
  pdfDoc.text(
    'Sekretariatan: Kertopaten, Wirokerten, Banguntapan, Bantul, Daerah Istimewa Yogyakarta | HP : 0877 3904 7175',
    pageWidth / 2,
    rectY + (orientation === 'landscape' ? 3.8 : 3.5),
    { align: 'center' }
  );

  // 2. JUDUL DOKUMEN & KETERANGAN KONTINGEN
  const titleY = rectY + rectHeight + 7;
  pdfDoc.setFont('helvetica', 'bold');
  pdfDoc.setFontSize(11);
  pdfDoc.setTextColor(15, 23, 42);
  pdfDoc.text(titleSubtitle.mainTitle || 'REKAPITULASI NOMINASI TETAP PESERTA LOMBA', pageWidth / 2, titleY, { align: 'center' });

  pdfDoc.setFontSize(10);
  pdfDoc.setTextColor(4, 120, 87); // emerald-700
  pdfDoc.text(
    titleSubtitle.subTitle || 'SEMUA KONTINGEN D.I. YOGYAKARTA',
    pageWidth / 2,
    titleY + 5,
    { align: 'center' }
  );

  if (titleSubtitle.filterInfo) {
    pdfDoc.setFont('helvetica', 'normal');
    pdfDoc.setFontSize(7.5);
    pdfDoc.setTextColor(100, 116, 139); // slate-500
    pdfDoc.text(titleSubtitle.filterInfo, pageWidth / 2, titleY + 9, { align: 'center' });
  }

  const getKemName = (id: string) => {
    const k = kemantrenList.find((item) => item.id === id);
    return k ? k.name : id;
  };

  const getCategory = (id: string) => {
    return categoriesList.find((c) => c.id === id);
  };

  // 3. TABEL DATA
  const isDaftarHadir = docType === 'daftar_hadir';

  const tableHeaders = isDaftarHadir
    ? [
        'No',
        'No. Registrasi',
        'Nama Lengkap Santri',
        'L/P',
        'Kabupaten / Kota',
        'Cabang Lomba',
        'Paraf / Tanda Tangan Meja',
      ]
    : [
        'No',
        'No. Registrasi',
        'Nama Lengkap Santri',
        'L/P',
        'Tgl Lahir / Usia',
        'Kabupaten / Kota',
        'Cabang Lomba',
        'No. Undian',
      ];

  const tableBody = participants.length === 0
    ? [[
        '-',
        '-',
        isDaftarHadir
          ? 'Tidak ada santri pada filter kehadiran ini.'
          : 'Tidak ada santri yang memenuhi kriteria rekapitulasi.',
        '-',
        '-',
        '-',
        '-',
        ...(isDaftarHadir ? [] : ['-']),
      ]]
    : participants.map((p, index) => {
        const kemName = getKemName(p.kemantrenId);
        const cat = getCategory(p.categoryId);
        const kabupatenKota = kemName || '-';

        const branchName = cat
          ? `[${cat.level}] ${cat.name}${cat.isGroup ? ' (Grup)' : ''}`
          : p.categoryId;

        if (isDaftarHadir) {
          const attendanceSign = p.attendance === 'hadir'
            ? '[ ✓ HADIR ]\n( .......................... )'
            : '( .......................... )';

          return [
            String(index + 1),
            p.registrationNumber || '-',
            p.fullName || '-',
            p.gender || '-',
            kabupatenKota,
            branchName,
            attendanceSign,
          ];
        }

        const birthAndAge = p.birthDate
          ? `${p.birthDate}\n(${p.ageOnCutoff.years}th ${p.ageOnCutoff.months}bln)`
          : '-';

        return [
          String(index + 1),
          p.registrationNumber || '-',
          p.fullName || '-',
          p.gender || '-',
          birthAndAge,
          kabupatenKota,
          branchName,
          p.lotteryNumber ? String(p.lotteryNumber).padStart(2, '0') : '-',
        ];
      });

  const startTableY = titleSubtitle.filterInfo ? titleY + 12 : titleY + 8;

  autoTable(pdfDoc, {
    startY: startTableY,
    head: [tableHeaders],
    body: tableBody,
    margin: { left: marginX, right: marginX, bottom: 25 },
    theme: 'grid',
    headStyles: {
      fillColor: [241, 245, 249], // slate-100
      textColor: [15, 23, 42], // slate-900
      fontStyle: 'bold',
      fontSize: 8.5,
      cellPadding: { top: 2.5, bottom: 2.5, left: 1.5, right: 1.5 },
      halign: 'center',
      valign: 'middle',
      lineWidth: 0.2,
      lineColor: [148, 163, 184], // slate-400
    },
    bodyStyles: {
      textColor: [15, 23, 42],
      fontSize: 8,
      cellPadding: { top: 2.4, bottom: 2.4, left: 1.5, right: 1.5 },
      lineWidth: 0.15,
      lineColor: [203, 213, 225], // slate-300
      valign: 'middle',
    },
    columnStyles: isDaftarHadir
      ? {
          0: { halign: 'center', cellWidth: 8 }, // No
          1: { halign: 'center', cellWidth: 26, fontStyle: 'bold' }, // No Registrasi
          2: { halign: 'left', cellWidth: orientation === 'landscape' ? 68 : 46, fontStyle: 'bold' }, // Nama Lengkap
          3: { halign: 'center', cellWidth: 10 }, // L/P
          4: { halign: 'left', cellWidth: orientation === 'landscape' ? 60 : 38 }, // Kabupaten / Kota
          5: { halign: 'left', cellWidth: orientation === 'landscape' ? 60 : 33 }, // Cabang Lomba
          6: { halign: 'center', cellWidth: orientation === 'landscape' ? 50 : 30 }, // Paraf / Tanda Tangan
        }
      : {
          0: { halign: 'center', cellWidth: 8 }, // No
          1: { halign: 'center', cellWidth: 26, fontStyle: 'bold' }, // No Registrasi
          2: { halign: 'left', cellWidth: orientation === 'landscape' ? 68 : 44, fontStyle: 'bold' }, // Nama Lengkap
          3: { halign: 'center', cellWidth: 10 }, // L/P
          4: { halign: 'center', cellWidth: orientation === 'landscape' ? 36 : 24 }, // Tgl Lahir / Usia
          5: { halign: 'left', cellWidth: orientation === 'landscape' ? 60 : 36 }, // Kabupaten / Kota
          6: { halign: 'left', cellWidth: orientation === 'landscape' ? 54 : 31 }, // Cabang Lomba
          7: { halign: 'center', cellWidth: orientation === 'landscape' ? 20 : 12, fontStyle: 'bold' }, // No Undian
        },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // slate-50
    },
  });

  // 4. BLOK TANDA TANGAN RESMI
  const lastTableY = (pdfDoc as any).lastAutoTable?.finalY || startTableY + 40;
  let signatureY = lastTableY + 8;

  // Jika tidak cukup ruang untuk tanda tangan (butuh minimal 35mm), buat halaman baru
  if (signatureY + 35 > pageHeight) {
    pdfDoc.addPage(pageFormat, orientation);
    signatureY = 20;
  }

  const colWidth = contentWidth / 2;
  const colLeftX = marginX + (colWidth / 2);
  const colRightX = marginX + colWidth + (colWidth / 2);

  pdfDoc.setFont('helvetica', 'normal');
  pdfDoc.setFontSize(8.5);
  pdfDoc.setTextColor(71, 85, 105);

  const dateStr = 'Yogyakarta, 08 November 2026';

  if (isDaftarHadir) {
    // Kiri: Mengetahui, Koordinator Registrasi / Kesekretariatan
    pdfDoc.text('Mengetahui,', colLeftX, signatureY, { align: 'center' });
    pdfDoc.setFont('helvetica', 'bold');
    pdfDoc.setTextColor(15, 23, 42);
    pdfDoc.text('Koordinator Registrasi / Kesekretariatan', colLeftX, signatureY + 4.5, { align: 'center' });

    // Kanan: Tanggal & Petugas Meja Registrasi
    pdfDoc.setFont('helvetica', 'normal');
    pdfDoc.setTextColor(71, 85, 105);
    pdfDoc.text(dateStr, colRightX, signatureY, { align: 'center' });
    pdfDoc.setFont('helvetica', 'bold');
    pdfDoc.setTextColor(15, 23, 42);
    pdfDoc.text('Petugas Meja Registrasi', colRightX, signatureY + 4.5, { align: 'center' });

    // Garis tanda tangan / nama
    const lineSignY = signatureY + 24;
    pdfDoc.setFont('helvetica', 'normal');
    pdfDoc.setFontSize(8.5);
    pdfDoc.setTextColor(71, 85, 105);
    pdfDoc.text('( .................................................. )', colLeftX, lineSignY, { align: 'center' });
    pdfDoc.text('( .................................................. )', colRightX, lineSignY, { align: 'center' });
  } else {
    // Tanda Tangan Tunggal: Koordinator Sie Lomba
    pdfDoc.setFont('helvetica', 'normal');
    pdfDoc.setTextColor(71, 85, 105);
    pdfDoc.text(dateStr, colRightX, signatureY, { align: 'center' });
    pdfDoc.setFont('helvetica', 'bold');
    pdfDoc.setTextColor(15, 23, 42);
    pdfDoc.text('Koordinator Sie Lomba', colRightX, signatureY + 4.5, { align: 'center' });

    // Garis tanda tangan / nama
    const lineSignY = signatureY + 24;
    pdfDoc.setFont('helvetica', 'normal');
    pdfDoc.setFontSize(8.5);
    pdfDoc.setTextColor(71, 85, 105);
    pdfDoc.text('( .................................................. )', colRightX, lineSignY, { align: 'center' });
  }

  return pdfDoc;
}

/**
 * Unduh Rekapitulasi Data Peserta Aktif (Single Filter / Kabupaten) sebagai Dokumen PDF F4 (Folio) Portrait Resmi
 */
export async function downloadSingleRecapPdf({
  titleSubtitle,
  participants,
  categoriesList,
  kemantrenList,
  fileName = 'Rekapitulasi_Peserta_FASI_XIII',
  docType = 'nominasi',
  orientation = 'portrait',
  paperSize = 'f4',
}: {
  titleSubtitle: {
    mainTitle?: string;
    subTitle?: string;
    filterInfo?: string;
  };
  participants: Participant[];
  categoriesList: CompetitionCategory[];
  kemantrenList: Kemantren[];
  fileName?: string;
  docType?: 'daftar_hadir' | 'nominasi';
  orientation?: 'landscape' | 'portrait';
  paperSize?: 'a4' | 'f4';
}): Promise<void> {
  const doc = await renderRecapToPdfPage({
    titleSubtitle,
    participants,
    categoriesList,
    kemantrenList,
    isFirstPage: true,
    docType,
    orientation,
    paperSize,
  });

  const dateIso = new Date().toISOString().slice(0, 10);
  const safeName = fileName.replace(/[/\\?%*:|"<>]/g, '_');
  doc.save(`${safeName}_${dateIso}.pdf`);
}

/**
 * Unduh Semua 5 Kabupaten/Kota dalam 1 Dokumen PDF Lengkap (F4 Folio Portrait Multi-page)
 */
export async function downloadAllKemantrenRecapPdf({
  kemantrenList,
  participants,
  categoriesList,
  orientation = 'portrait',
  paperSize = 'f4',
  onProgress,
}: {
  kemantrenList: Kemantren[];
  participants: Participant[];
  categoriesList: CompetitionCategory[];
  orientation?: 'landscape' | 'portrait';
  paperSize?: 'a4' | 'f4';
  onProgress?: (current: number, total: number) => void;
}): Promise<void> {
  if (!kemantrenList.length) return;

  const pageFormat: [number, number] | string = paperSize === 'f4' ? F4_FOLIO_FORMAT : 'a4';
  const doc = new jsPDF({
    orientation: orientation,
    unit: 'mm',
    format: pageFormat,
    compress: true,
  });

  const total = kemantrenList.length;
  for (let i = 0; i < total; i++) {
    if (onProgress) onProgress(i + 1, total);
    const kem = kemantrenList[i];
    const kemParticipants = participants.filter((p) => p.kemantrenId === kem.id);

    await renderRecapToPdfPage({
      titleSubtitle: {
        mainTitle: 'REKAPITULASI NOMINASI TETAP PESERTA LOMBA',
        subTitle: `KONTINGEN ${kem.name.toUpperCase()} (${kemParticipants.length} SANTRI)`,
        filterInfo: `Kontingen Resmi FASI XIII — ${kem.name}`,
      },
      participants: kemParticipants,
      categoriesList,
      kemantrenList,
      doc,
      isFirstPage: i === 0,
      docType: 'nominasi',
      orientation,
      paperSize,
    });
  }

  const dateStr = new Date().toISOString().slice(0, 10);
  doc.save(`Rekapitulasi_Semua_KabupatenKota_FASI_XIII_${dateStr}.pdf`);
}
