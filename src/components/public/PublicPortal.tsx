/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sistem Informasi FASI XIII Kota Yogyakarta
 * Beranda Portal Publik & Countdown Timer
 */

import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Award, Users, Calculator, ShieldCheck, ChevronRight, Sparkles, BookOpen, CheckCircle, Clock, Shuffle, RotateCcw } from 'lucide-react';
import { Participant, AppSettings } from '../../types/fasi';
import { KEMANTREN_LIST, CATEGORIES_LIST } from '../../data/fasiMasterData';
import { SecurityBadge } from './SecurityBadge';
import { getThemeConfig } from '../../utils/theme';

interface PublicPortalProps {
  participants: Participant[];
  settings?: AppSettings;
  onOpenAgeCalc: () => void;
  onNavigateTab: (tab: 'peserta' | 'klasemen' | 'lokasi' | 'kalkulator') => void;
}

export const PublicPortal: React.FC<PublicPortalProps> = ({
  participants,
  settings,
  onOpenAgeCalc,
  onNavigateTab,
}) => {
  const theme = getThemeConfig(settings?.themeColor);

  // Target 1: Batas Akhir Pendaftaran Santri (28 Oktober 2026 23.59 WIB)
  const regDeadlineDate = settings?.registrationDeadlineDate && settings.registrationDeadlineDate !== '2026-10-05'
    ? settings.registrationDeadlineDate
    : '2026-10-28';
  const regDeadlineTime = settings?.registrationDeadlineTime || '23:59';
  const regDeadlineTarget = new Date(`${regDeadlineDate}T${regDeadlineTime}:00+07:00`).getTime();

  // Target 2: Hari-H Pelaksanaan FASI XIII (Ahad, 8 November 2026 07.00 WIB)
  const eventDateTarget = new Date('2026-11-08T07:00:00+07:00').getTime();

  // Mode Tab Hitung Mundur: 'pendaftaran' (default) atau 'pelaksanaan'
  const [activeCountdownMode, setActiveCountdownMode] = useState<'pendaftaran' | 'pelaksanaan'>('pendaftaran');
  const [isAutoRotatePaused, setIsAutoRotatePaused] = useState<boolean>(false);

  const [timeLeftReg, setTimeLeftReg] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: false });

  const [timeLeftEvent, setTimeLeftEvent] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: false });

  // Update countdown tiap detik
  useEffect(() => {
    const calc = (target: number) => {
      const now = new Date().getTime();
      const difference = target - now;
      if (difference > 0) {
        return {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
          isExpired: false,
        };
      }
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
    };

    const updateAll = () => {
      setTimeLeftReg(calc(regDeadlineTarget));
      setTimeLeftEvent(calc(eventDateTarget));
    };

    updateAll();
    const interval = setInterval(updateAll, 1000);
    return () => clearInterval(interval);
  }, [regDeadlineTarget, eventDateTarget]);

  // Auto-rotate tab tiap 6 detik (jika tidak dipause oleh pengguna)
  useEffect(() => {
    if (isAutoRotatePaused) return;

    const rotateInterval = setInterval(() => {
      setActiveCountdownMode((prev) => (prev === 'pendaftaran' ? 'pelaksanaan' : 'pendaftaran'));
    }, 6000);

    return () => clearInterval(rotateInterval);
  }, [isAutoRotatePaused]);

  // Lanjutkan kembali auto-rotate setelah 15 detik jika user sempat klik tab manual
  useEffect(() => {
    if (!isAutoRotatePaused) return;
    const resumeTimer = setTimeout(() => {
      setIsAutoRotatePaused(false);
    }, 15000);
    return () => clearTimeout(resumeTimer);
  }, [isAutoRotatePaused]);

  const verifiedCount = participants.filter((p) => p.status === 'verified').length;

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className={`${theme.headerGradient} rounded-3xl p-6 sm:p-10 text-white shadow-xl border ${theme.headerBorder} relative overflow-hidden`}>
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#fbbf24_1px,transparent_1px)] [background-size:16px_16px]"></div>

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${theme.badgeBg} ${theme.badgeText} border ${theme.badgeBorder} text-xs font-semibold`}>
            <span>{settings?.eventTitle ? `${settings.eventTitle} ${settings.eventYear || '2026'}` : 'FESTIVAL ANAK SHOLEH INDONESIA (FASI) XIII TAHUN 2026'}</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight text-white">
            Santri Hebat, Hebat Prestasi, Hebat Mengaji, & Berakhlakul Karimah.
          </h1>

          <p className={`text-sm sm:text-base ${theme.headerSubtext} leading-relaxed font-light`}>
            {settings?.eventSubtitle || 'Portal resmi pendaftaran santri, validasi otomatis batas usia, pengacakan nomor undian tampil, dan publikasi live score klasemen kontingen se-D.I. Yogyakarta.'}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-3">
            <button
              id="hero-btn-calc"
              onClick={onOpenAgeCalc}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95"
            >
              <Calculator className="w-4 h-4" />
              <span>Kalkulator Batas Usia Santri</span>
            </button>

            <button
              id="hero-btn-directory"
              onClick={() => onNavigateTab('peserta')}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-semibold text-xs sm:text-sm transition-all"
            >
              <Users className="w-4 h-4 text-amber-300" />
              <span>Lihat Data Peserta</span>
            </button>
          </div>
        </div>

        {/* Countdown Card with Smart Dual-Tab Switcher & Auto-Rotate */}
        <div className={`mt-8 pt-6 border-t ${theme.headerBorder} relative z-10`}>
          {/* Tab Switcher & Status Badges */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="inline-flex p-1 bg-black/40 backdrop-blur-md rounded-2xl border border-white/15 shadow-inner">
              <button
                type="button"
                onClick={() => {
                  setActiveCountdownMode('pendaftaran');
                  setIsAutoRotatePaused(true);
                }}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeCountdownMode === 'pendaftaran'
                    ? 'bg-amber-500 text-slate-950 shadow-md scale-[1.02]'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Batas Pendaftaran</span>
                <span className="hidden sm:inline text-[10px] font-semibold opacity-90">
                  (28 Okt 23.59 WIB)
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveCountdownMode('pelaksanaan');
                  setIsAutoRotatePaused(true);
                }}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeCountdownMode === 'pelaksanaan'
                    ? 'bg-amber-500 text-slate-950 shadow-md scale-[1.02]'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Hari-H Pelaksanaan</span>
                <span className="hidden sm:inline text-[10px] font-semibold opacity-90">
                  (8 Nov 2026)
                </span>
              </button>
            </div>

            {/* Auto-Rotate Indicator & Status Pill */}
            <div className="flex items-center gap-2">
              {!isAutoRotatePaused ? (
                <span className="inline-flex items-center gap-1.5 text-[11px] text-amber-200/90 bg-black/30 px-2.5 py-1 rounded-full border border-white/10 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                  Auto-Rotate
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAutoRotatePaused(false)}
                  className="inline-flex items-center gap-1.5 text-[11px] text-slate-300 hover:text-white bg-black/30 hover:bg-black/50 px-2.5 py-1 rounded-full border border-white/10 transition-colors"
                  title="Klik untuk mengaktifkan kembali perputaran otomatis tab"
                >
                  <RotateCcw className="w-3 h-3 text-amber-400" />
                  <span>Resume Auto-Rotate</span>
                </button>
              )}

              {activeCountdownMode === 'pendaftaran' ? (
                timeLeftReg.isExpired ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-300 bg-rose-950/70 border border-rose-500/40 px-2.5 py-1 rounded-full">
                    Pendaftaran Ditutup
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-300 bg-emerald-950/70 border border-emerald-500/40 px-2.5 py-1 rounded-full">
                    Pendaftaran Aktif
                  </span>
                )
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 bg-amber-950/70 border border-amber-500/40 px-2.5 py-1 rounded-full">
                  FASI XIII DIY
                </span>
              )}
            </div>
          </div>

          <div className="text-xs font-bold text-amber-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            {activeCountdownMode === 'pendaftaran' ? (
              <>
                <Clock className="w-4 h-4 text-amber-400" />
                <span>
                  Hitung Mundur Batas Akhir Pendaftaran Santri (28 Oktober 2026, 23.59 WIB):
                </span>
              </>
            ) : (
              <>
                <Calendar className="w-4 h-4 text-amber-400" />
                <span>
                  Hitung Mundur Menuju Hari-H Pelaksanaan ({settings?.eventDate || 'Ahad, 8 November 2026'}):
                </span>
              </>
            )}
          </div>

          {/* Numbers Grid */}
          {activeCountdownMode === 'pendaftaran' && timeLeftReg.isExpired ? (
            <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-rose-200 text-xs sm:text-sm flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-400 animate-ping shrink-0" />
              <span>
                Pendaftaran santri FASI XIII telah resmi ditutup pada <strong>28 Oktober 2026 pukul 23.59 WIB</strong>.
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2 sm:gap-4 max-w-lg">
              <div className="bg-black/30 backdrop-blur p-3 rounded-xl border border-white/10 text-center">
                <span className="block text-xl sm:text-3xl font-black font-mono text-white">
                  {String((activeCountdownMode === 'pendaftaran' ? timeLeftReg : timeLeftEvent).days).padStart(2, '0')}
                </span>
                <span className="text-[10px] sm:text-xs text-slate-300 uppercase tracking-wider font-semibold">
                  Hari
                </span>
              </div>
              <div className="bg-black/30 backdrop-blur p-3 rounded-xl border border-white/10 text-center">
                <span className="block text-xl sm:text-3xl font-black font-mono text-white">
                  {String((activeCountdownMode === 'pendaftaran' ? timeLeftReg : timeLeftEvent).hours).padStart(2, '0')}
                </span>
                <span className="text-[10px] sm:text-xs text-slate-300 uppercase tracking-wider font-semibold">
                  Jam
                </span>
              </div>
              <div className="bg-black/30 backdrop-blur p-3 rounded-xl border border-white/10 text-center">
                <span className="block text-xl sm:text-3xl font-black font-mono text-white">
                  {String((activeCountdownMode === 'pendaftaran' ? timeLeftReg : timeLeftEvent).minutes).padStart(2, '0')}
                </span>
                <span className="text-[10px] sm:text-xs text-slate-300 uppercase tracking-wider font-semibold">
                  Menit
                </span>
              </div>
              <div className="bg-black/30 backdrop-blur p-3 rounded-xl border border-white/10 text-center">
                <span className="block text-xl sm:text-3xl font-black font-mono text-amber-400">
                  {String((activeCountdownMode === 'pendaftaran' ? timeLeftReg : timeLeftEvent).seconds).padStart(2, '0')}
                </span>
                <span className="text-[10px] sm:text-xs text-amber-300 uppercase tracking-wider font-semibold">
                  Detik
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4 Stat Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex items-center gap-3.5">
          <div className={`w-12 h-12 rounded-xl ${theme.accentBg} ${theme.primaryText} flex items-center justify-center font-bold text-xl shrink-0`}>
            5
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Kontingen</span>
            <h4 className="font-bold text-slate-900 text-sm sm:text-base">5 Kab / Kota</h4>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xl shrink-0">
            18
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Cabang Lomba</span>
            <h4 className="font-bold text-slate-900 text-sm sm:text-base">TKA, TPA & TQA</h4>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center font-bold text-xl shrink-0">
            {verifiedCount}
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Santri Terdaftar</span>
            <h4 className="font-bold text-slate-900 text-sm sm:text-base">Lolos Verifikasi</h4>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-xl shrink-0">
            100%
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Validasi Juknis</span>
            <h4 className="font-bold text-slate-900 text-sm sm:text-base">1 Juli 2027</h4>
          </div>
        </div>
      </div>

      {/* Sambutan & Juknis Batas Usia Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Sambutan & Profil Singkat */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <BookOpen className={`w-5 h-5 ${theme.primaryText}`} />
            <h3 className="font-bold text-slate-900 text-base">Sambutan {settings?.eventOrganizer || 'BADKO TKA-TPA D.I. Yogyakarta'}</h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Festival Anak Sholeh Indonesia (FASI) XIII merupakan momentum akbar pembinaan dan evaluasi kualitas santri Al-Qur’an di Daerah Istimewa Yogyakarta. Melalui sistem pendaftaran digital terpadu ini, kami berkomitmen menyelenggarakan kompetisi yang jujur, transparan, dan akuntabel, mulai dari validasi batas usia berstandar baku hingga penjurian real-time.
          </p>

          <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Shuffle className="w-3.5 h-3.5 text-amber-600" />
                Undian Nomor Tampil
              </span>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Pengacakan nomor tampil transparan & cetak berita acara resmi Sie Lomba.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-600" />
                Live Klasemen 5 Daerah
              </span>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Pantauan perolehan medali dan peringkat kontingen se-DIY secara real-time.
              </p>
            </div>
          </div>
        </div>

        {/* Kolom Quick Age Check & Rule Reminder */}
        <div className={`bg-gradient-to-b ${theme.accentBg} to-white rounded-2xl p-6 border ${theme.accentBorder} shadow-sm flex flex-col justify-between space-y-4`}>
          <div>
            <div className={`flex items-center gap-2 ${theme.primaryText} font-bold text-sm`}>
              <Calculator className="w-4 h-4" />
              <span>Ketentuan Usia Santri FASI XIII</span>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Patokan baku usia dihitung per <strong>1 Juli 2027</strong>:
            </p>

            <ul className="mt-3 space-y-2 text-xs">
              <li className="p-2 rounded-lg bg-white border border-slate-200 shadow-2xs">
                <strong className={`${theme.primaryText} block`}>1. Jenjang TKA (4 - 7 Thn)</strong>
                <span className="text-slate-500 text-[11px]">Kelahiran: 01/07/2020 s.d. 01/07/2023</span>
              </li>
              <li className="p-2 rounded-lg bg-white border border-slate-200 shadow-2xs">
                <strong className="text-sky-800 block">2. Jenjang TPA (&gt;7 - 12 Thn)</strong>
                <span className="text-slate-500 text-[11px]">Kelahiran: 01/07/2015 s.d. 30/06/2020</span>
              </li>
              <li className="p-2 rounded-lg bg-white border border-slate-200 shadow-2xs">
                <strong className="text-purple-800 block">3. Jenjang TQA (&gt;12 - 15 Thn)</strong>
                <span className="text-slate-500 text-[11px]">Kelahiran: 01/07/2012 s.d. 30/06/2015</span>
              </li>
            </ul>
          </div>

          <button
            onClick={onOpenAgeCalc}
            className={`w-full py-2.5 px-4 ${theme.primaryBtn} font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow`}
          >
            <span>Uji Tanggal Lahir Santri</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Security Protection Shield Indicator */}
      <SecurityBadge />
    </div>
  );
};

