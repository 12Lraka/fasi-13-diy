/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sistem Informasi FASI XIII Kota Yogyakarta
 * Komponen ID Card Peserta Resmi (Portrait B4 - 100mm x 150mm)
 * Menggunakan Template Kartu Resmi Supabase / Local Asset
 */

import React from 'react';
import { Participant, CompetitionCategory } from '../../types/fasi';
import { ID_CARD_ASSETS, ID_CARD_THEMES, IdCardTheme } from './idCardThemes';

interface IdCardParticipantProps {
  participant: Participant;
  category?: CompetitionCategory;
  kemantrenName?: string;
  qrCodeUrl?: string;
  theme?: IdCardTheme;
  customTagline?: string;
}

export const IdCardParticipant: React.FC<IdCardParticipantProps> = ({
  participant,
  category,
  kemantrenName,
  qrCodeUrl,
  theme = ID_CARD_THEMES.emerald,
}) => {
  const cleanCategoryName = category?.name
    ? category.name.replace(/\s*\(Putra\)|\s*\(Putri\)/gi, '').trim()
    : participant.categoryId;
  
  // Format level text: e.g. TKA, TPA, TQA
  const rawLevel = category?.level || (participant.categoryId.includes('tka') ? 'TKA' : participant.categoryId.includes('tqa') ? 'TQA' : 'TPA');
  const levelText = rawLevel.toUpperCase().trim();

  // Template ID Card sesuai Tingkatan (TKA / TPA / TQA)
  let templateBg = ID_CARD_ASSETS.templateTka;
  if (levelText === 'TPA') {
    templateBg = ID_CARD_ASSETS.templateTpa || ID_CARD_ASSETS.templateTka;
  } else if (levelText === 'TQA') {
    templateBg = ID_CARD_ASSETS.templateTqa || ID_CARD_ASSETS.templateTka;
  }

  // Format Asal Daerah / Kab / Kota
  // Menampilkan langsung Kabupaten / Kota (contoh: Kabupaten Gunungkidul, Kota Yogyakarta, Kabupaten Sleman, dll.)
  const rawKemantren = kemantrenName || (participant as any).kemantren || (participant as any).kemantrenName || '';
  let displayKabKota = rawKemantren.trim();
  if (displayKabKota) {
    if (!/^Kabupaten|^Kota/i.test(displayKabKota)) {
      if (/yogyakarta|jogja/i.test(displayKabKota)) {
        displayKabKota = 'Kota Yogyakarta';
      } else if (/gunungkidul|gunung kidul/i.test(displayKabKota)) {
        displayKabKota = 'Kabupaten Gunungkidul';
      } else if (/sleman/i.test(displayKabKota)) {
        displayKabKota = 'Kabupaten Sleman';
      } else if (/bantul/i.test(displayKabKota)) {
        displayKabKota = 'Kabupaten Bantul';
      } else if (/kulonprogo|kulon progo/i.test(displayKabKota)) {
        displayKabKota = 'Kabupaten Kulon Progo';
      } else {
        displayKabKota = `Kabupaten ${displayKabKota}`;
      }
    }
  } else {
    displayKabKota = 'D.I. Yogyakarta';
  }

  // Format Gender / Grup
  const isGroup = typeof category?.isGroup === 'boolean'
    ? category.isGroup
    : Boolean(category?.name && /cerdas cermat|nasyid|ikrar/i.test(category.name));

  let genderDisplay = '';
  if (isGroup) {
    genderDisplay = 'Grup';
  } else if (participant.gender === 'L' || category?.genderRequirement === 'L' || /\(Putra\)/i.test(category?.name || '')) {
    genderDisplay = 'Putra';
  } else if (participant.gender === 'P' || category?.genderRequirement === 'P' || /\(Putri\)/i.test(category?.name || '')) {
    genderDisplay = 'Putri';
  }

  // Dynamic Font Size for participant full name (Auto-scale bertingkat agar tidak melebihi kotak)
  const nameLength = (participant.fullName || '').trim().length;
  let nameFontSizeClass = 'text-[12px] leading-[1.18]';
  if (nameLength > 36) {
    nameFontSizeClass = 'text-[8.5px] leading-[1.08]';
  } else if (nameLength > 28) {
    nameFontSizeClass = 'text-[9.5px] leading-[1.12]';
  } else if (nameLength > 20) {
    nameFontSizeClass = 'text-[10.5px] leading-[1.15]';
  }

  // Dynamic Font Size for Cabang Lomba
  const catLength = cleanCategoryName.length;
  let catFontSizeClass = 'text-[12px] leading-[1.18]';
  if (catLength > 30) {
    catFontSizeClass = 'text-[9.5px] leading-[1.12]';
  } else if (catLength > 20) {
    catFontSizeClass = 'text-[10.5px] leading-[1.15]';
  }

  return (
    <div
      className="fasi-id-card relative overflow-hidden select-none bg-white text-slate-900 box-border rounded-lg shadow-sm"
      style={{
        width: '100mm',
        height: '150mm',
        minWidth: '100mm',
        maxWidth: '100mm',
        minHeight: '150mm',
        maxHeight: '150mm',
        backgroundColor: '#ffffff',
      }}
    >
      {/* 1. Background Template Image (Layered underneath all content) */}
      <img
        src={templateBg}
        onError={(e) => {
          // Fallback to local asset if remote fails
          (e.target as HTMLImageElement).src = '/assets/aistudio/Cocard_peserta_TKA_eda46573.png';
        }}
        alt={`Template ID Card ${levelText}`}
        crossOrigin="anonymous"
        className="absolute inset-0 w-full h-full object-fill pointer-events-none z-0"
        style={{ width: '100%', height: '100%' }}
      />

      {/* 2. Kotak Kiri: Nama Peserta & Asal Kab/Kota */}
      {/* Header 'Nama Peserta' sudah tercetak pada template (Y ~43.7% - 45.8%) */}
      <div
        className="absolute z-10 flex flex-col items-center justify-center text-center px-2 overflow-hidden"
        style={{
          top: '45.8%',
          left: '4.8%',
          width: '43.3%',
          height: '7.4%',
        }}
      >
        <h4
          className={`w-full font-black uppercase font-sans tracking-tight line-clamp-2 max-h-[5.2mm] overflow-hidden ${nameFontSizeClass}`}
          style={{ color: '#0f172a' }}
          title={participant.fullName}
        >
          {participant.fullName}
        </h4>
        <span
          className="w-full text-[8px] font-bold text-slate-700 block truncate mt-0.5 tracking-tight"
          title={displayKabKota}
        >
          {displayKabKota}
        </span>
      </div>

      {/* 3. Kotak Kanan: Kategori Lomba & Gender / Grup */}
      {/* Header 'Kategori Lomba' sudah tercetak pada template (Y ~43.7% - 45.8%) */}
      <div
        className="absolute z-10 flex flex-col items-center justify-center text-center px-2 overflow-hidden"
        style={{
          top: '45.8%',
          left: '50.9%',
          width: '43.3%',
          height: '7.4%',
        }}
      >
        <p
          className={`w-full font-black text-slate-900 leading-tight line-clamp-2 max-h-[5.2mm] overflow-hidden ${catFontSizeClass}`}
          title={cleanCategoryName}
        >
          {cleanCategoryName}
        </p>
        {genderDisplay && (
          <span className="inline-block mt-0.5 font-black text-[7.5px] uppercase tracking-wider px-2 py-0.2 rounded-full bg-amber-100 text-amber-950 border border-amber-300 shadow-2xs">
            {genderDisplay}
          </span>
        )}
      </div>

      {/* 4. Kotak Besar Bawah: Nomor Undian Jumbo (~75% Tinggi Kotak) & QR Code di Sudut */}
      {/* Posisi kotak besar pada template: X 4.8% - 94.8%, Y 55.4% - 82.9% (Tinggi ~41.25mm) */}
      <div
        className="absolute z-10 flex items-center justify-center"
        style={{
          top: '55.4%',
          left: '4.8%',
          width: '90.0%',
          height: '27.5%',
        }}
      >
        {/* Angka Nomor Undian Jumbo: Mengisi ~75% tinggi kotak (~31mm) agar terbaca jelas dari jarak 5-10 meter */}
        <div className="w-full flex items-center justify-center text-center px-4">
          <span
            className="font-mono font-black leading-none text-slate-950 tracking-tight select-all drop-shadow-xs"
            style={{
              fontSize: String(participant.lotteryNumber ?? '').length > 3 ? '78px' : '96px',
            }}
          >
            {participant.lotteryNumber ?? '-'}
          </span>
        </div>

        {/* QR Code Kecil Diselipkan di Sudut Kanan Bawah Kotak Besar (Ukuran ~1.1cm x 1.1cm) */}
        <div
          className="absolute flex flex-col items-center p-0.5 bg-white border border-slate-300 rounded shadow-xs"
          style={{
            bottom: '7px',
            right: '8px',
          }}
        >
          {qrCodeUrl ? (
            <img
              src={qrCodeUrl}
              alt={`QR ${participant.registrationNumber}`}
              crossOrigin="anonymous"
              className="w-[11mm] h-[11mm] object-contain"
            />
          ) : (
            <div className="w-[11mm] h-[11mm] bg-slate-100 flex items-center justify-center text-[6px] text-slate-400 font-bold">
              QR
            </div>
          )}
          <span className="font-mono font-bold text-[6px] text-slate-700 tracking-tighter mt-0.5 leading-none">
            {participant.registrationNumber}
          </span>
        </div>
      </div>
    </div>
  );
};
