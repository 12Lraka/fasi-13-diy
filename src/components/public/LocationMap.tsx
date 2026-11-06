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
            <p className="text-slate-500 text-[11px]">Waktu: 06.00 WIB s.d. 16.30 WIB</p>
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
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-700" />
            <h3 className="font-bold text-slate-900 text-base">Rundown Pelaksanaan Hari-H</h3>
          </div>
          <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 w-fit">
            Ahad, 8 November 2026 • 06.00 - 16.30 WIB
          </span>
        </div>

        {/* Timeline Acara */}
        <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-2.5 sm:before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
          {[
            {
              time: '06.00 - 08.00 WIB',
              title: 'Registrasi Kedatangan Kafilah & Pra Acara',
              description:
                'Penempatan posisi kafilah Kabupaten/Kota, welcome song, serta penampilan Juara 2 & 3 Eksibisi Vokal Tunggal dan Tari (Gerak Lagu).',
              badge: 'Pra Acara',
              badgeColor: 'bg-blue-50 text-blue-800 border-blue-200',
              dotColor: 'bg-blue-600',
            },
            {
              time: '08.00 - 09.00 WIB',
              title: 'Upacara Pembukaan FASI XIII DIY',
              description:
                'Pembacaan Kalam Ilahi, menyanyikan Indonesia Raya & Mars TKA-TPA, penyerahan piala bergilir dari Juara Umum FASI XII (Bantul), sambutan Ketua Badko TKA-TPA DIY & Gubernur DIY (sekaligus membuka acara dengan pemukulan gong & confetti), serta penampilan Juara 1 Eksibisi Vokal & Tari.',
              badge: 'Pembukaan Akbar',
              badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
              dotColor: 'bg-emerald-600',
            },
            {
              time: '09.00 - 13.30 WIB',
              title: 'Pelaksanaan Cabang Lomba (TKA, TPA, TQA) & Ishoma',
              description:
                'Pelaksanaan perlombaan di masing-masing ruang/panggung lomba sesuai pengumuman Seksi Lomba, diselingi istirahat dan Sholat Dzuhur.',
              badge: 'Perlombaan',
              badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
              dotColor: 'bg-amber-600',
            },
            {
              time: '13.30 - 14.15 WIB',
              title: 'Hiburan Jeda Acara & Rekapitulasi Nilai',
              description:
                'Penampilan Juara 4 & 5 Lomba Eksibisi (Tari dan Vokal Tunggal).',
              badge: 'Jeda Acara',
              badgeColor: 'bg-purple-50 text-purple-800 border-purple-200',
              dotColor: 'bg-purple-600',
            },
            {
              time: '14.15 - 15.30 WIB',
              title: 'Istirahat & Sholat Ashar Berjamaah',
              description:
                'Persiapan dan pelaksanaan ibadah Sholat Ashar di lokasi acara (Komplek SMK Muhammadiyah 3 Yogyakarta).',
              badge: 'Ishoma',
              badgeColor: 'bg-teal-50 text-teal-800 border-teal-200',
              dotColor: 'bg-teal-600',
            },
            {
              time: '15.30 - 16.30 WIB',
              title: 'Upacara Penutupan, Pengumuman Kejuaraan & Penyerahan Piala',
              description:
                'Kalam Ilahi oleh Juara MTQ, laporan Ketua Panitia sekaligus penutupan resmi, pengumuman Juara Umum per jenjang & Juara Umum FASI XIII DIY.',
              badge: 'Penutupan & Juara Umum',
              badgeColor: 'bg-rose-50 text-rose-800 border-rose-200',
              dotColor: 'bg-rose-600',
            },
          ].map((item, idx) => (
            <div key={idx} className="relative group">
              {/* Dot Penanda Timeline */}
              <div
                className={`absolute -left-6 sm:-left-8 top-1 w-3 h-3 rounded-full border-2 border-white shadow-xs ${item.dotColor} ring-4 ring-slate-100 group-hover:scale-125 transition-transform`}
              />

              {/* Konten Agenda */}
              <div className="bg-slate-50 hover:bg-slate-100/80 p-4 rounded-xl border border-slate-200 transition-colors space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono font-bold text-xs text-slate-800 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    {item.time}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 text-sm">
                  {item.title}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
