/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sistem Informasi FASI XIII D.I. Yogyakarta
 * Info Lokasi & Jadwal Pelaksanaan (SMK Muhammadiyah 3 Yogyakarta)
 */

import React from 'react';
import { MapPin, Calendar, Clock, Navigation, Phone, ExternalLink, Building2 } from 'lucide-react';

export const LocationMap: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 uppercase tracking-wider">
              VENUE RESMI FASI XIII DIY
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
              SMK Muhammadiyah 3 Yogyakarta
            </h2>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
              Jl. Pramuka No.62, Giwangan, Kec. Umbulharjo, Kota Yogyakarta, Daerah Istimewa Yogyakarta 55163
            </p>
          </div>

          <a
            href="https://maps.google.com/?q=SMK+Muhammadiyah+3+Yogyakarta"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
          >
            <Navigation className="w-4 h-4 text-amber-400" />
            <span>Buka Google Maps</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-70" />
          </a>
        </div>

        {/* 3 Detail Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 text-xs">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
            <div className="flex items-center gap-2 text-emerald-800 font-bold">
              <Calendar className="w-4 h-4" />
              <span>Hari & Tanggal</span>
            </div>
            <p className="font-semibold text-slate-900 text-sm">Ahad, 8 November 2026</p>
            <p className="text-slate-500 text-[11px]">Waktu: 07.00 WIB s.d. Selesai</p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
            <div className="flex items-center gap-2 text-emerald-800 font-bold">
              <Building2 className="w-4 h-4" />
              <span>Panggung & Ruang Lomba</span>
            </div>
            <p className="font-semibold text-slate-900 text-sm">Ruang Kelas & Aula Utama</p>
            <p className="text-slate-500 text-[11px]">Disertai QR Check-in di setiap panggung</p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
            <div className="flex items-center gap-2 text-emerald-800 font-bold">
              <Phone className="w-4 h-4" />
              <span>Sekretariat</span>
            </div>
            <p className="font-semibold text-slate-900 text-sm">Panitia Pelaksana FASI XIII</p>
            <p className="text-slate-500 text-[11px]">Helpdesk: 0812-XXXX-XXXX (WhatsApp)</p>
          </div>
        </div>
      </div>

      {/* Rundown Jadwal Acara */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-emerald-700" />
          <h3 className="font-bold text-slate-900 text-base">Rundown Pelaksanaan Hari-H</h3>
        </div>

        <div className="p-8 rounded-2xl bg-slate-50 border border-dashed border-slate-300 text-center space-y-2">
          <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center mx-auto">
            <Clock className="w-5 h-5" />
          </div>
          <p className="text-slate-800 font-bold text-xs">
            Rundown Definitif Belum Dirilis
          </p>
          <p className="text-slate-500 text-[11px] max-w-md mx-auto leading-relaxed">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Susunan jadwal dan rundown resmi Hari-H akan diperbarui oleh Panitia Pelaksana mendekati waktu pelaksanaan.
          </p>
        </div>
      </div>
    </div>
  );
};
