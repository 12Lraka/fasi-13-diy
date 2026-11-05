/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sistem Informasi FASI XIII Kota Yogyakarta
 * Komponen Cocard Resmi Panitia Pelaksana, Dewan Hakim, & Panitera
 * Ukuran Resmi Portrait 9,2 cm × 13,8 cm (92mm × 138mm)
 * Menggunakan Template Desain Resmi Supabase
 * Tata Letak:
 *  - Baris 1: Nama Lengkap & Gelar (Font tebal, ukuran besar, 1 baris)
 *  - Baris 2: Jabatan / Penugasan
 */

import React from 'react';
import { ID_CARD_ASSETS } from './idCardThemes';

export interface CommitteeCardData {
  id: string;
  name?: string; // Nama Lengkap & Gelar (jika kosong, area blanko untuk tempel stiker/tulis tangan)
  division: string; // Jabatan / Penugasan Cabang / Seksi
  accessLevel?: string; // Instansi (Dewan Hakim) / Hak Akses Ruang
  cardCategory?: 'panitia' | 'dewan_hakim' | 'panitera';
  customBadge?: string;
}

interface IdCardCommitteeProps {
  data: CommitteeCardData;
}

/**
 * Format nama agar spasi setelah tanda koma gelar rapi (misal: "H. Suprapto,S.Ag.,M.A." -> "H. Suprapto, S.Ag., M.A.")
 */
function formatDisplayName(rawName?: string): string {
  if (!rawName) return '';
  return rawName.trim().replace(/,([^\s])/g, ', $1');
}

export const IdCardCommittee: React.FC<IdCardCommitteeProps> = ({ data }) => {
  const isPanitera =
    data.cardCategory === 'panitera' ||
    (data.customBadge && /panitera/i.test(data.customBadge)) ||
    /panitera/i.test(data.division || '');

  const isDewanHakim =
    !isPanitera &&
    (data.cardCategory === 'dewan_hakim' ||
      (data.customBadge && /hakim|juri|yuri/i.test(data.customBadge)) ||
      /hakim|juri|yuri/i.test(data.division || ''));

  // 1. Pilih Template Resmi dari Supabase Storage
  let templateBg = ID_CARD_ASSETS.templateCocardPanitia;
  let roleColor = '#065f46'; // Emerald untuk Panitia
  let defaultDivision = 'PANITIA PELAKSANA';

  if (isDewanHakim) {
    templateBg = ID_CARD_ASSETS.templateCocardDewanHakim;
    roleColor = '#881337'; // Wine / Maroon untuk Dewan Hakim
    defaultDivision = 'DEWAN HAKIM / JURI';
  } else if (isPanitera) {
    templateBg = ID_CARD_ASSETS.templateCocardPanitera;
    roleColor = '#0369a1'; // Sky Royal untuk Panitera
    defaultDivision = 'PANITERA ARENA LOMBA';
  }

  const displayName = formatDisplayName(data.name);
  const hasDigitalName = displayName.length > 0;
  const displayDivision = (data.division || defaultDivision).trim();

  // Dynamic font sizing adaptif agar nama dengan karakter panjang PASTI cukup 1 baris
  const nameLength = displayName.length;
  let nameFontSize = '16.5px';
  if (nameLength > 36) {
    nameFontSize = '11.5px';
  } else if (nameLength > 30) {
    nameFontSize = '12.5px';
  } else if (nameLength > 24) {
    nameFontSize = '14px';
  } else if (nameLength > 18) {
    nameFontSize = '15px';
  }

  // Dynamic font sizing untuk jabatan / penugasan (cukup 1 baris)
  const divLength = displayDivision.length;
  let divFontSize = '11.5px';
  if (divLength > 36) {
    divFontSize = '9.5px';
  } else if (divLength > 26) {
    divFontSize = '10.5px';
  }

  return (
    <div
      className="fasi-id-card relative flex flex-col justify-center items-center overflow-hidden select-none bg-white text-slate-900 box-border shadow-md"
      style={{
        width: '92mm',
        height: '138mm',
        minWidth: '92mm',
        maxWidth: '92mm',
        minHeight: '138mm',
        maxHeight: '138mm',
        backgroundColor: '#ffffff',
      }}
    >
      {/* 1. Background Template Desain Resmi (Layer Penuh) */}
      <img
        src={templateBg}
        alt="Cocard Template"
        crossOrigin="anonymous"
        className="absolute inset-0 w-full h-full object-fill pointer-events-none z-0"
        style={{ width: '100%', height: '100%' }}
      />

      {/* 2. Area Kotak Putih Khusus Teks Nama & Jabatan Penugasan
          Koordinat Hasil Analisis Pixel Presisi (1088 x 1630 px master):
          top: 57.91% (944px), height: 14.79% (241px), left: 3.03% (33px), width: 93.93% (1022px)
      */}
      <div
        className="absolute z-10 flex flex-col justify-center items-center text-center px-3 py-1 select-none pointer-events-none"
        style={{
          top: '57.91%',
          height: '14.79%',
          left: '3.03%',
          width: '93.93%',
          boxSizing: 'border-box',
        }}
      >
        {/* Baris 1: Nama Lengkap & Gelar (Font Tebal, Ukuran Besar, PASTI Cukup 1 Baris) */}
        {hasDigitalName ? (
          <div
            className="font-black uppercase tracking-tight text-slate-950 w-full text-center font-sans whitespace-nowrap overflow-hidden text-ellipsis leading-tight px-1"
            style={{
              fontSize: nameFontSize,
              letterSpacing: nameLength > 30 ? '-0.02em' : '-0.01em',
            }}
            title={displayName}
          >
            {displayName}
          </div>
        ) : (
          <div className="w-4/5 text-center border border-dashed border-slate-300 rounded py-1 bg-white/80">
            <span className="text-[8.5px] font-bold tracking-wider text-slate-400 uppercase">
              [ Area Tempel / Tulis Nama ]
            </span>
          </div>
        )}

        {/* Garis Aksen Halus Pemisah */}
        <div
          className="w-14 h-[1.5px] rounded-full my-1.5 shrink-0"
          style={{ backgroundColor: `${roleColor}40` }}
        />

        {/* Baris 2: Jabatan / Penugasan */}
        <div
          className="font-extrabold uppercase tracking-wide w-full text-center whitespace-nowrap overflow-hidden text-ellipsis px-1 leading-tight"
          style={{
            fontSize: divFontSize,
            color: roleColor,
            letterSpacing: '0.03em',
          }}
          title={displayDivision}
        >
          {displayDivision}
        </div>
      </div>
    </div>
  );
};
