/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sistem Informasi FASI XIII D.I. Yogyakarta
 * Navbar Komponen Modern (Option 2: Single Slim Top Bar + Native Mobile Bottom Navigation)
 */

import React from 'react';
import { Award, Calculator, MapPin, Users, LogIn, LogOut, LayoutDashboard, QrCode, Home } from 'lucide-react';
import { UserSession, AppSettings } from '../../types/fasi';
import { AppRoute } from '../../utils/router';
import { getThemeConfig } from '../../utils/theme';

interface NavbarProps {
  activeTab: AppRoute;
  setActiveTab: (tab: AppRoute) => void;
  session: UserSession | null;
  settings?: AppSettings;
  onOpenLogin: () => void;
  onLogout: () => void;
  onOpenAgeCalc: () => void;
  onOpenPresensi: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  session,
  settings,
  onOpenLogin,
  onLogout,
  onOpenAgeCalc,
  onOpenPresensi,
}) => {
  const theme = getThemeConfig(settings?.themeColor);

  return (
    <>
      {/* ============================================================== */}
      {/* 1. TOP HEADER (Ramping 1 Baris Saja untuk Desktop & Mobile)     */}
      {/* ============================================================== */}
      <header className={`sticky top-0 z-40 text-white shadow-xs backdrop-blur-md border-b ${theme.navbarBg} ${theme.navbarBorder}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            
            {/* Brand & Logo */}
            <div
              id="nav-logo"
              onClick={() => setActiveTab('beranda')}
              className="flex items-center gap-2.5 cursor-pointer group shrink-0"
              title="Kembali ke Beranda FASI XIII DIY"
            >
              <div className={`w-8 h-8 rounded-lg ${theme.logoBg} border ${theme.logoBorder} flex items-center justify-center shadow-inner text-amber-300 font-serif font-black text-sm overflow-hidden shrink-0`}>
                {settings?.eventLogoUrl ? (
                  <img src={settings.eventLogoUrl} alt="Logo" className="w-full h-full object-contain p-0.5" />
                ) : (
                  'F13'
                )}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-sm sm:text-base tracking-tight leading-tight text-white group-hover:text-amber-300 transition-colors">
                    FASI XIII DIY
                  </span>
                  <span className="text-[10px] font-bold text-amber-300 font-mono bg-amber-400/15 px-1.5 py-0.2 rounded border border-amber-400/30 hidden sm:inline">
                    2026
                  </span>
                </div>
                <span className="text-[10px] text-slate-300 hidden md:inline leading-none font-medium">
                  {settings?.eventOrganizer || 'BADKO TKA-TPA D.I. Yogyakarta'}
                </span>
              </div>
            </div>

            {/* Desktop Navigation Links (Center / Left) */}
            <nav className="hidden lg:flex items-center gap-1">
              <button
                id="nav-tab-beranda"
                onClick={() => setActiveTab('beranda')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'beranda'
                    ? 'bg-white/20 text-white shadow-xs'
                    : 'text-slate-200 hover:text-white hover:bg-white/10'
                }`}
              >
                <Home className="w-3.5 h-3.5 text-amber-300" />
                <span>Beranda</span>
              </button>

              <button
                id="nav-tab-peserta"
                onClick={() => setActiveTab('peserta')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'peserta'
                    ? 'bg-white/20 text-white shadow-xs'
                    : 'text-slate-200 hover:text-white hover:bg-white/10'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-slate-200" />
                <span>Direktori Peserta</span>
              </button>

              <button
                id="nav-tab-klasemen"
                onClick={() => setActiveTab('klasemen')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'klasemen'
                    ? 'bg-white/20 text-white shadow-xs'
                    : 'text-slate-200 hover:text-white hover:bg-white/10'
                }`}
              >
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span>Live Score</span>
              </button>

              <button
                id="nav-tab-lokasi"
                onClick={() => setActiveTab('lokasi')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'lokasi'
                    ? 'bg-white/20 text-white shadow-xs'
                    : 'text-slate-200 hover:text-white hover:bg-white/10'
                }`}
              >
                <MapPin className="w-3.5 h-3.5 text-slate-200" />
                <span>Lokasi Lomba</span>
              </button>

              <button
                id="nav-btn-kalkulator"
                onClick={onOpenAgeCalc}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-200 hover:text-amber-100 hover:bg-white/10 transition-colors flex items-center gap-1.5 cursor-pointer ml-1"
                title="Buka Alat Verifikasi Batas Usia Santri FASI"
              >
                <Calculator className="w-3.5 h-3.5 text-amber-400" />
                <span>Cek Usia</span>
              </button>
            </nav>

            {/* Desktop & Mobile Actions (Right) */}
            <div className="flex items-center gap-2">
              {/* Presensi QR Button (Desktop) */}
              <button
                id="nav-btn-presensi"
                onClick={onOpenPresensi}
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 transition-all shadow-sm active:scale-95 cursor-pointer"
                title="Buka QR Scanner Presensi Check-in Hari-H"
              >
                <QrCode className="w-3.5 h-3.5 text-slate-950" />
                <span>Presensi QR</span>
              </button>

              {/* Quick Cek Usia Button (Mobile) */}
              <button
                onClick={onOpenAgeCalc}
                className="lg:hidden flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-amber-200 bg-white/10 hover:bg-white/20 border border-white/15 transition-all cursor-pointer"
                title="Kalkulator Batas Usia"
              >
                <Calculator className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[11px] font-semibold">Cek Usia</span>
              </button>

              {/* Admin Session Controls */}
              {session ? (
                <div className="flex items-center gap-1.5">
                  <button
                    id="nav-btn-dashboard"
                    onClick={() => setActiveTab('admin')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      activeTab.startsWith('admin') || activeTab === 'pengaturan' || activeTab === 'log'
                        ? 'bg-amber-400 text-slate-950 shadow-xs'
                        : 'bg-white/15 hover:bg-white/25 text-white border border-white/20'
                    }`}
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Panel</span>
                    <span className="max-w-[90px] truncate">{session.name}</span>
                  </button>

                  <button
                    id="nav-btn-logout"
                    onClick={onLogout}
                    title="Keluar / Logout"
                    className="p-1.5 text-slate-300 hover:text-white hover:bg-white/15 rounded-lg transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  id="nav-btn-login"
                  onClick={onOpenLogin}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/15 hover:bg-white/25 text-white border border-white/20 shadow-xs transition-all cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Masuk Admin</span>
                  <span className="sm:hidden font-bold">Admin</span>
                </button>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* ============================================================== */}
      {/* 2. MOBILE BOTTOM NAVIGATION BAR (Gaya Native App Modern)       */}
      {/* ============================================================== */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-slate-950/95 backdrop-blur-lg border-t border-slate-800 text-slate-400 shadow-2xl"
      >
        <div className="max-w-md mx-auto grid grid-cols-5 items-end h-16 pb-1 px-1">
          
          {/* Tab 1: Beranda */}
          <button
            type="button"
            onClick={() => setActiveTab('beranda')}
            className={`flex flex-col items-center justify-center h-full py-1 transition-colors cursor-pointer ${
              activeTab === 'beranda' ? 'text-amber-400' : 'hover:text-slate-200'
            }`}
          >
            <Home className={`w-5 h-5 ${activeTab === 'beranda' ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
            <span className={`text-[10px] mt-1 ${activeTab === 'beranda' ? 'font-extrabold text-amber-400' : 'font-medium'}`}>
              Beranda
            </span>
          </button>

          {/* Tab 2: Direktori Peserta */}
          <button
            type="button"
            onClick={() => setActiveTab('peserta')}
            className={`flex flex-col items-center justify-center h-full py-1 transition-colors cursor-pointer ${
              activeTab === 'peserta' ? 'text-amber-400' : 'hover:text-slate-200'
            }`}
          >
            <Users className={`w-5 h-5 ${activeTab === 'peserta' ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
            <span className={`text-[10px] mt-1 ${activeTab === 'peserta' ? 'font-extrabold text-amber-400' : 'font-medium'}`}>
              Peserta
            </span>
          </button>

          {/* Tab 3: Presensi QR (Center Hero / Floating Action Button) */}
          <button
            type="button"
            onClick={onOpenPresensi}
            className="flex flex-col items-center justify-center cursor-pointer group -mt-4"
          >
            <div className="w-12 h-12 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/25 active:scale-90 transition-transform border-4 border-slate-950 group-hover:bg-amber-300">
              <QrCode className="w-6 h-6 stroke-[2.5]" />
            </div>
            <span className="text-[10px] mt-0.5 font-extrabold text-amber-300">
              Presensi
            </span>
          </button>

          {/* Tab 4: Live Score */}
          <button
            type="button"
            onClick={() => setActiveTab('klasemen')}
            className={`flex flex-col items-center justify-center h-full py-1 transition-colors cursor-pointer ${
              activeTab === 'klasemen' ? 'text-amber-400' : 'hover:text-slate-200'
            }`}
          >
            <Award className={`w-5 h-5 ${activeTab === 'klasemen' ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
            <span className={`text-[10px] mt-1 ${activeTab === 'klasemen' ? 'font-extrabold text-amber-400' : 'font-medium'}`}>
              Live Score
            </span>
          </button>

          {/* Tab 5: Lokasi Lomba */}
          <button
            type="button"
            onClick={() => setActiveTab('lokasi')}
            className={`flex flex-col items-center justify-center h-full py-1 transition-colors cursor-pointer ${
              activeTab === 'lokasi' ? 'text-amber-400' : 'hover:text-slate-200'
            }`}
          >
            <MapPin className={`w-5 h-5 ${activeTab === 'lokasi' ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
            <span className={`text-[10px] mt-1 ${activeTab === 'lokasi' ? 'font-extrabold text-amber-400' : 'font-medium'}`}>
              Lokasi
            </span>
          </button>

        </div>
      </nav>
    </>
  );
};
