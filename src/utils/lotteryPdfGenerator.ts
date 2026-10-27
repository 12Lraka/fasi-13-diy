/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sistem Informasi FASI XIII Kota Yogyakarta
 * Generator PDF Daftar Nomor Urut Tampil Peserta (A4 Portrait)
 * Format Bersih Tanpa Tanda Tangan Juri/Panitera — Siap Distribusi ke Ketua Rayon & Walisantri
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Participant, CompetitionCategory, Kemantren } from '../types/fasi';
import { fetchImageAsBase64 } from './idCardPngGenerator';

const LOGO_LEFT_URL = 'https://gcligykrxdujlfapgkud.supabase.co/storage/v1/object/public/public-assets/logofasidiy.jpg';
const LOGO_RIGHT_URL = 'https://gcligykrxdujlfapgkud.supabase.co/storage/v1/object/public/public-assets/maskotfasidiy.jpeg';

interface ExportLotteryPdfOptions {
  category: CompetitionCategory;
  participants: Participant[];
  kemantrenList: Kemantren[];
  doc?: jsPDF;
  isFirstPage?: boolean;
}

/**
 * Format tanggal cetak saat dokumen digenerate (dinamis sesuai hari cetak)
 * Contoh: 27 Oktober 2026
 */
function getCurrentPrintDate(): string {
  return new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Tanggal pelaksanaan resmi FASI XIII untuk pengesahan footer
 */
const OFFICIAL_EVENT_DATE = '08 November 2026';

/**
 * Render satu cabang lomba ke halaman dokumen jsPDF A4 Portrait untuk Nomor Undian
 */
export async function renderLotteryToPdfPage({
  category,
  participants,
  kemantrenList,
  doc,
  isFirstPage = true,
}: ExportLotteryPdfOptions): Promise<jsPDF> {
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
  const pageHeight = 297;
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
  pdfDoc.text('DAFTAR NOMOR URUT TAMPIL PESERTA', pageWidth / 2, titleY, { align: 'center' });

  pdfDoc.setFontSize(10);
  pdfDoc.setTextColor(4, 120, 87); // emerald-700
  pdfDoc.text(
    `CABANG: [${category.code}] ${category.name.toUpperCase()} — JENJANG ${category.level}`,
    pageWidth / 2,
    titleY + 5,
    { align: 'center' }
  );

  // Filter and sort participants for this category
  // Prioritas urut: Berdasarkan Nomor Undian (1, 2, 3...)
  // Santri yang belum diundi diletakkan di akhir berdasarkan No. Registrasi
  const inCat = participants
    .filter((p) => p.categoryId === category.id)
    .sort((a, b) => {
      const numA = a.lotteryNumber;
      const numB = b.lotteryNumber;
      if (numA && numB) return numA - numB;
      if (numA && !numB) return -1;
      if (!numA && numB) return 1;
      return a.registrationNumber.localeCompare(b.registrationNumber);
    });

  const getKemName = (id: string) => {
    const k = kemantrenList.find((item) => item.id === id);
    return k ? k.name : id;
  };

  const totalPeserta = inCat.length;
  const sudahDiundi = inCat.filter((p) => p.lotteryNumber && p.lotteryNumber > 0).length;

  // Metadata Sub-bar
  const subMetaY = titleY + 10;
  pdfDoc.setFont('helvetica', 'normal');
  pdfDoc.setFontSize(8);
  pdfDoc.setTextColor(71, 85, 105);
  pdfDoc.text(
    `Total Peserta: ${totalPeserta} | Sudah Diundi: ${sudahDiundi} Santri/Regu | Tanggal Cetak: ${getCurrentPrintDate()}`,
    marginX,
    subMetaY
  );

  // 3. TABEL DATA DAFTAR NOMOR TAMPIL
  // Kolom: No, No. Undian, No Registrasi, Nama Lengkap / Regu, L/P, Kabupaten / Kota
  const tableHeaders = [
    'No',
    'No. Undian',
    'No Registrasi',
    'Nama Lengkap Peserta / Regu',
    'L/P',
    'Kabupaten / Kota',
  ];

  const tableBody = inCat.length === 0
    ? [['-', '-', '-', 'Belum ada santri terdaftar pada cabang lomba ini.', '-', '-']]
    : inCat.map((p, index) => {
        const kemName = getKemName(p.kemantrenId);
        const undianStr = p.lotteryNumber != null && p.lotteryNumber > 0
          ? String(p.lotteryNumber).padStart(2, '0')
          : 'Belum Diundi';

        const reguSuffix = category.isGroup && p.tpaUnitName && p.tpaUnitName.includes(' - ')
          ? ` [${p.tpaUnitName.split(' - ')[1]}]`
          : '';

        return [
          String(index + 1),
          undianStr,
          p.registrationNumber || '-',
          `${p.fullName || '-'}${reguSuffix}`,
          p.gender || '-',
          kemName,
        ];
      });

  const startTableY = subMetaY + 3;

  autoTable(pdfDoc, {
    startY: startTableY,
    head: [tableHeaders],
    body: tableBody,
    margin: { left: marginX, right: marginX, bottom: 25 },
    theme: 'grid',
    headStyles: {
      fillColor: [16, 185, 129], // emerald-500
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'center',
      valign: 'middle',
      lineWidth: 0.2,
      lineColor: [5, 150, 105], // emerald-600
    },
    bodyStyles: {
      textColor: [15, 23, 42],
      fontSize: 8,
      cellPadding: { top: 2.2, bottom: 2.2, left: 1.5, right: 1.5 },
      lineWidth: 0.15,
      lineColor: [203, 213, 225], // slate-300
      valign: 'middle',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },                           // No
      1: { halign: 'center', cellWidth: 22, fontStyle: 'bold' },       // No. Undian
      2: { halign: 'center', cellWidth: 28, fontStyle: 'bold' },       // No Registrasi
      3: { halign: 'left', cellWidth: 76, fontStyle: 'bold' },         // Nama Lengkap
      4: { halign: 'center', cellWidth: 10 },                          // L/P
      5: { halign: 'left', cellWidth: 42 },                            // Kabupaten / Kota
    },
    alternateRowStyles: {
      fillColor: [240, 253, 244], // emerald-50
    },
    didParseCell: (data) => {
      // Highlight cell No. Undian if already drawn
      if (data.section === 'body' && data.column.index === 1) {
        const val = String(data.cell.raw);
        if (val !== 'Belum Diundi' && val !== '-') {
          data.cell.styles.fillColor = [254, 243, 199]; // amber-100
          data.cell.styles.textColor = [120, 53, 15];   // amber-900
        } else {
          data.cell.styles.textColor = [148, 163, 184]; // slate-400
          data.cell.styles.fontStyle = 'normal';
        }
      }
    },
  });

  // 4. FOOTER: TATA TERTIB & PENGESAHAN PANITIA (TANPA TTD JURI/PANITERA)
  const lastTableY = (pdfDoc as any).lastAutoTable?.finalY || startTableY + 40;
  let footerY = lastTableY + 6;

  // Cek apakah muat di halaman yang sama (butuh sekitar 30mm)
  if (footerY + 30 > 282) {
    pdfDoc.addPage('a4', 'portrait');
    footerY = 20;
  }

  // Kotak Catatan / Tata Tertib Peserta
  const noteBoxWidth = contentWidth * 0.62;
  const noteBoxX = marginX;
  
  pdfDoc.setFillColor(248, 250, 252); // slate-50
  pdfDoc.setDrawColor(226, 232, 240); // slate-200
  pdfDoc.roundedRect(noteBoxX, footerY, noteBoxWidth, 24, 2, 2, 'FD');

  pdfDoc.setFont('helvetica', 'bold');
  pdfDoc.setFontSize(7.5);
  pdfDoc.setTextColor(15, 23, 42);
  pdfDoc.text('Ketentuan & Tata Tertib Pemanggilan:', noteBoxX + 3, footerY + 4.5);

  pdfDoc.setFont('helvetica', 'normal');
  pdfDoc.setFontSize(7);
  pdfDoc.setTextColor(71, 85, 105);
  pdfDoc.text('1. Peserta wajib hadir di arena lomba 15 menit sebelum nomor urut dipanggil.', noteBoxX + 3, footerY + 9);
  pdfDoc.text('2. Pemanggilan peserta dilakukan maksimal 3 (tiga) kali berturut-turut oleh panitera.', noteBoxX + 3, footerY + 13.5);
  pdfDoc.text('3. Daftar nomor undian ini resmi diterbitkan oleh Panitia FASI XIII D.I. Yogyakarta.', noteBoxX + 3, footerY + 18);

  // Pengesahan Panitia Pelaksana (Sisi Kanan)
  const authBoxX = marginX + noteBoxWidth + 5;
  const authWidth = contentWidth - noteBoxWidth - 5;
  const authCenterX = authBoxX + (authWidth / 2);

  pdfDoc.setFont('helvetica', 'normal');
  pdfDoc.setFontSize(7.5);
  pdfDoc.setTextColor(15, 23, 42);
  pdfDoc.text(`Yogyakarta, ${OFFICIAL_EVENT_DATE}`, authCenterX, footerY + 4.5, { align: 'center' });

  pdfDoc.setFont('helvetica', 'bold');
  pdfDoc.setFontSize(8);
  pdfDoc.text('Panitia Pelaksana FASI XIII', authCenterX, footerY + 9, { align: 'center' });
  pdfDoc.text('BADKO TKA-TPA D.I. Yogyakarta', authCenterX, footerY + 13, { align: 'center' });

  pdfDoc.setFont('helvetica', 'italic');
  pdfDoc.setFontSize(7.5);
  pdfDoc.setTextColor(4, 120, 87);
  pdfDoc.text('( Sie Lomba )', authCenterX, footerY + 22, { align: 'center' });

  return pdfDoc;
}

/**
 * Unduh 1 Cabang Lomba sebagai PDF Nomor Urut Tampil (A4 Portrait)
 */
export async function downloadSingleLotteryPdf(
  category: CompetitionCategory,
  participants: Participant[],
  kemantrenList: Kemantren[]
): Promise<void> {
  const doc = await renderLotteryToPdfPage({
    category,
    participants,
    kemantrenList,
    isFirstPage: true,
  });

  const safeCatName = category.name.replace(/[/\\?%*:|"<>]/g, '_');
  doc.save(`Nomor_Urut_Tampil_${category.code}_${safeCatName}.pdf`);
}

/**
 * Unduh SEMUA Cabang Lomba dalam 1 Dokumen PDF Gabungan (A4 Multi-page)
 */
export async function downloadAllLotteryPdf({
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
    await renderLotteryToPdfPage({
      category: cat,
      participants,
      kemantrenList,
      doc,
      isFirstPage: i === 0,
    });
  }

  const dateStr = new Date().toISOString().slice(0, 10);
  doc.save(`Daftar_Nomor_Urut_Tampil_Semua_Cabang_FASI_XIII_${dateStr}.pdf`);
}
