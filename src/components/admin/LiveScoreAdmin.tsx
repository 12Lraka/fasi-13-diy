/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sistem Informasi FASI XIII Kota Yogyakarta
 * Panel Khusus Live Score & Klasemen Superadmin
 * Menampilkan Juara Umum, Juara Kategori TKA, TPA, dan TQA secara Real-Time
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Trophy,
  Award,
  Crown,
  Medal,
  RefreshCw,
  Search,
  Filter,
  Layers,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Printer,
  CheckCircle2,
  Clock,
  Radio,
  Building2,
  Users,
  Eye,
  Info,
  ExternalLink,
} from 'lucide-react';
import {
  BeritaAcaraKejuaraan,
  AppSettings,
  UserSession,
} from '../../types/fasi';
import { KEMANTREN_LIST, CATEGORIES_LIST } from '../../data/fasiMasterData';
import {
  getStoredBeritaAcara,
  saveBeritaAcaraList,
  getStoredSettings,
} from '../../utils/storage';
import {
  isSupabaseConfigured,
  fetchBeritaAcaraFromSupabase,
  subscribeToBeritaAcaraRealtime,
  fetchSettingsFromSupabase,
} from '../../lib/supabase';
import { showToast } from '../../utils/sweetalert';

interface LiveScoreAdminProps {
  session: UserSession;
  onNavigateTab?: (tab: string) => void;
}

interface RayonTally {
  kemantrenId: string;
  kode: string;
  nama: string;
  emas: number; // Juara 1
  perak: number; // Juara 2
  perunggu: number; // Juara 3
  poinUtama: number; // Poin dari cabang utama (7-5-3)
  poinReguler: number; // Poin dari cabang reguler (5-3-1)
  totalPoin: number;
  rank: number;
  detailJuara: {
    cabangId: string;
    cabangNama: string;
    jenjang: 'TKA' | 'TPA' | 'TQA';
    isUtama: boolean;
    posisiJuara: 'Juara I' | 'Juara II' | 'Juara III';
    poin: number;
    namaSantri: string;
    tpaUnitName: string;
  }[];
}

export const LiveScoreAdmin: React.FC<LiveScoreAdminProps> = ({ session, onNavigateTab }) => {
  const [activeTab, setActiveTab] = useState<'umum' | 'tka' | 'tpa' | 'tqa'>('umum');
  const [beritaAcaraList, setBeritaAcaraList] = useState<BeritaAcaraKejuaraan[]>(() => getStoredBeritaAcara());
  const [appSettings, setAppSettings] = useState<AppSettings>(() => getStoredSettings());
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>(() =>
    new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );
  const [searchKemantren, setSearchKemantren] = useState<string>('');
  const [selectedKemantrenDetail, setSelectedKemantrenDetail] = useState<string | null>(null);

  // Sinkronisasi data Berita Acara dari Supabase & subscribe Realtime
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (!isSupabaseConfigured()) return;
      try {
        const [cloudBA, cloudSettings] = await Promise.all([
          fetchBeritaAcaraFromSupabase(),
          fetchSettingsFromSupabase(),
        ]);
        if (cloudBA && isMounted) {
          setBeritaAcaraList(cloudBA);
          saveBeritaAcaraList(cloudBA);
        }
        if (cloudSettings && isMounted) {
          setAppSettings(cloudSettings);
        }
      } catch (err) {
        console.warn('Gagal load data awal Live Score Superadmin:', err);
      }
    };

    loadData();

    // Subscribe ke event realtime perubahan berita acara Supabase
    let unsubscribeBA: (() => void) | null = null;
    if (isSupabaseConfigured()) {
      unsubscribeBA = subscribeToBeritaAcaraRealtime((updatedBA) => {
        if (!isMounted) return;
        setBeritaAcaraList(updatedBA);
        saveBeritaAcaraList(updatedBA);
        setLastRefreshedAt(
          new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        );
        showToast('info', 'Data klasemen terupdate otomatis dari pengesahan Berita Acara!');
      });
    }

    // Listener lokal antar-tab / window storage
    const handleLocalUpdate = () => {
      setBeritaAcaraList(getStoredBeritaAcara());
      setLastRefreshedAt(
        new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };

    window.addEventListener('fasi_berita_acara_updated', handleLocalUpdate);
    window.addEventListener('storage', handleLocalUpdate);

    return () => {
      isMounted = false;
      if (unsubscribeBA) unsubscribeBA();
      window.removeEventListener('fasi_berita_acara_updated', handleLocalUpdate);
      window.removeEventListener('storage', handleLocalUpdate);
    };
  }, []);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (isSupabaseConfigured()) {
        const [cloudBA, cloudSettings] = await Promise.all([
          fetchBeritaAcaraFromSupabase(),
          fetchSettingsFromSupabase(),
        ]);
        if (cloudBA) {
          setBeritaAcaraList(cloudBA);
          saveBeritaAcaraList(cloudBA);
        }
        if (cloudSettings) {
          setAppSettings(cloudSettings);
        }
      } else {
        setBeritaAcaraList(getStoredBeritaAcara());
      }
      setLastRefreshedAt(
        new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
      showToast('success', 'Data klasemen real-time berhasil disinkronkan!');
    } catch {
      showToast('error', 'Gagal menyegarkan data klasemen.');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Filter hanya berita acara yang sudah "Disahkan"
  const validatedBeritaAcara = useMemo(() => {
    return beritaAcaraList.filter((b) => b.status === 'Disahkan');
  }, [beritaAcaraList]);

  // Statistik Progres Pengesahan
  const progressStats = useMemo(() => {
    const totalCategories = CATEGORIES_LIST.length || 34;
    const validatedCount = validatedBeritaAcara.length;
    const percentage = Math.min(100, Math.round((validatedCount / totalCategories) * 100));

    const tkaTotal = CATEGORIES_LIST.filter((c) => c.level === 'TKA').length || 10;
    const tpaTotal = CATEGORIES_LIST.filter((c) => c.level === 'TPA').length || 14;
    const tqaTotal = CATEGORIES_LIST.filter((c) => c.level === 'TQA').length || 10;

    const tkaValidated = validatedBeritaAcara.filter((b) => b.jenjang === 'TKA').length;
    const tpaValidated = validatedBeritaAcara.filter((b) => b.jenjang === 'TPA').length;
    const tqaValidated = validatedBeritaAcara.filter((b) => b.jenjang === 'TQA').length;

    return {
      totalCategories,
      validatedCount,
      percentage,
      tkaTotal,
      tpaTotal,
      tqaTotal,
      tkaValidated,
      tpaValidated,
      tqaValidated,
    };
  }, [validatedBeritaAcara]);

  // Helper pencocokan nama kemantren / kontingen
  const findKemantrenTally = (
    talliesMap: Record<string, RayonTally>,
    rawKemName?: string
  ): RayonTally | undefined => {
    if (!rawKemName) return undefined;
    const raw = rawKemName.trim().toLowerCase();

    // 1. Cek langsung ID atau kode
    const byIdOrCode = Object.values(talliesMap).find(
      (t) => t.kemantrenId.toLowerCase() === raw || t.kode.toLowerCase() === raw
    );
    if (byIdOrCode) return byIdOrCode;

    // 2. Bersihkan awalan Kabupaten, Kab, Kota, Rayon, Kemantren
    const cleanInput = raw
      .replace(/^(kabupaten|kab\.?|kota|rayon|kemantren)\s+/i, '')
      .trim();

    return Object.values(talliesMap).find((t) => {
      const cleanName = t.nama
        .toLowerCase()
        .replace(/^(kabupaten|kab\.?|kota|rayon|kemantren)\s+/i, '')
        .trim();
      return (
        t.nama.toLowerCase() === raw ||
        cleanName === cleanInput ||
        t.nama.toLowerCase().includes(cleanInput) ||
        cleanInput.includes(cleanName)
      );
    });
  };

  // Kalkulasi Klasemen untuk Tab Aktif (Umum / TKA / TPA / TQA)
  const standings = useMemo(() => {
    const talliesMap: Record<string, RayonTally> = {};

    KEMANTREN_LIST.forEach((k) => {
      talliesMap[k.id] = {
        kemantrenId: k.id,
        kode: k.code,
        nama: k.name,
        emas: 0,
        perak: 0,
        perunggu: 0,
        poinUtama: 0,
        poinReguler: 0,
        totalPoin: 0,
        rank: 1,
        detailJuara: [],
      };
    });

    validatedBeritaAcara.forEach((ba) => {
      // Filter sesuai tab aktif
      if (activeTab === 'tka' && ba.jenjang !== 'TKA') return;
      if (activeTab === 'tpa' && ba.jenjang !== 'TPA') return;
      if (activeTab === 'tqa' && ba.jenjang !== 'TQA') return;

      const p = ba.pemenang;
      const catName = (ba.namaCabang || ba.cabangNama || '').toLowerCase();
      const isUtama = Boolean(
        ba.isCabangUtama ||
        catName.includes('tartil') ||
        catName.includes('tilawah') ||
        catName.includes('tilawati')
      );

      const p1 = isUtama ? 7 : 5;
      const p2 = isUtama ? 5 : 3;
      const p3 = isUtama ? 3 : 1;

      // Juara 1
      if (p.juara1?.kemantren) {
        const t1 = findKemantrenTally(talliesMap, p.juara1.kemantren);
        if (t1) {
          t1.emas += 1;
          if (isUtama) t1.poinUtama += p1;
          else t1.poinReguler += p1;
          t1.totalPoin += p1;
          t1.detailJuara.push({
            cabangId: ba.cabangId,
            cabangNama: ba.cabangNama || ba.namaCabang || ba.id,
            jenjang: ba.jenjang,
            isUtama,
            posisiJuara: 'Juara I',
            poin: p1,
            namaSantri: p.juara1.nama || '-',
            tpaUnitName: p.juara1.unitTpa || '-',
          });
        }
      }

      // Juara 2
      if (p.juara2?.kemantren) {
        const t2 = findKemantrenTally(talliesMap, p.juara2.kemantren);
        if (t2) {
          t2.perak += 1;
          if (isUtama) t2.poinUtama += p2;
          else t2.poinReguler += p2;
          t2.totalPoin += p2;
          t2.detailJuara.push({
            cabangId: ba.cabangId,
            cabangNama: ba.cabangNama || ba.namaCabang || ba.id,
            jenjang: ba.jenjang,
            isUtama,
            posisiJuara: 'Juara II',
            poin: p2,
            namaSantri: p.juara2.nama || '-',
            tpaUnitName: p.juara2.unitTpa || '-',
          });
        }
      }

      // Juara 3
      if (p.juara3?.kemantren) {
        const t3 = findKemantrenTally(talliesMap, p.juara3.kemantren);
        if (t3) {
          t3.perunggu += 1;
          if (isUtama) t3.poinUtama += p3;
          else t3.poinReguler += p3;
          t3.totalPoin += p3;
          t3.detailJuara.push({
            cabangId: ba.cabangId,
            cabangNama: ba.cabangNama || ba.namaCabang || ba.id,
            jenjang: ba.jenjang,
            isUtama,
            posisiJuara: 'Juara III',
            poin: p3,
            namaSantri: p.juara3.nama || '-',
            tpaUnitName: p.juara3.unitTpa || '-',
          });
        }
      }
    });

    // Urutkan: Total Poin desc -> Emas desc -> Perak desc -> Perunggu desc
    const sorted = Object.values(talliesMap).sort((a, b) => {
      if (b.totalPoin !== a.totalPoin) return b.totalPoin - a.totalPoin;
      if (b.emas !== a.emas) return b.emas - a.emas;
      if (b.perak !== a.perak) return b.perak - a.perak;
      return b.perunggu - a.perunggu;
    });

    return sorted.map((item, index) => ({
      ...item,
      rank: index + 1,
    }));
  }, [validatedBeritaAcara, activeTab]);

  // Filter pencarian tabel
  const filteredStandings = useMemo(() => {
    if (!searchKemantren.trim()) return standings;
    const q = searchKemantren.toLowerCase();
    return standings.filter(
      (s) => s.nama.toLowerCase().includes(q) || s.kode.toLowerCase().includes(q)
    );
  }, [standings, searchKemantren]);

  // Data Podium Top 3
  const top1 = standings[0];
  const top2 = standings[1];
  const top3 = standings[2];

  // Helper judul kategori
  const getTabTitle = () => {
    switch (activeTab) {
      case 'umum':
        return 'Klasemen Juara Umum (Seluruh Jenjang TKA + TPA + TQA)';
      case 'tka':
        return 'Klasemen Juara Kategori Jenjang TKA';
      case 'tpa':
        return 'Klasemen Juara Kategori Jenjang TPA';
      case 'tqa':
        return 'Klasemen Juara Kategori Jenjang TQA';
    }
  };

  const activeKemantrenDetailObj = useMemo(() => {
    if (!selectedKemantrenDetail) return null;
    return standings.find((s) => s.kemantrenId === selectedKemantrenDetail) || null;
  }, [standings, selectedKemantrenDetail]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-emerald-800/40">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 w-64 h-64 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-bold border border-emerald-400/30 backdrop-blur-xs">
              <Radio className="w-3.5 h-3.5 text-red-400 animate-pulse" />
              <span>LIVE SCOREBOARD SUPERADMIN</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span className="text-[11px] font-normal text-emerald-200">Real-Time Supabase Sync</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              <Trophy className="w-8 h-8 text-amber-400 fill-amber-400/30" />
              <span>Klasemen & Papan Skor Kejuaraan</span>
            </h1>

            <p className="text-sm text-emerald-100/90 max-w-2xl leading-relaxed">
              Pantauan perolehan piala dan total poin kejuaraan 5 Kabupaten/Kota se-D.I. Yogyakarta. Data terhitung otomatis begitu Berita Acara Dewan Hakim disahkan.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="px-4 py-2 bg-emerald-800/80 hover:bg-emerald-700/90 text-white text-xs font-bold rounded-xl border border-emerald-600/40 shadow-xs flex items-center gap-2 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Menyinkron...' : 'Segarkan Data'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer active:scale-95"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Cetak Rekap Klasemen</span>
            </button>
          </div>
        </div>

        {/* WAKTU TERAKHIR & ATURAN POIN STRIP */}
        <div className="mt-6 pt-4 border-t border-emerald-800/60 flex flex-wrap items-center justify-between gap-4 text-xs text-emerald-200">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span>Terakhir disinkronkan: <strong className="text-white">{lastRefreshedAt} WIB</strong></span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[11px] bg-black/25 px-3.5 py-1.5 rounded-lg border border-white/10">
            <span className="font-bold text-amber-300">★ Bobot Poin FASI XIII:</span>
            <span>Cabang Utama (Tartil/Tilawah): <strong>7 - 5 - 3</strong></span>
            <span className="text-emerald-400">•</span>
            <span>Cabang Reguler: <strong>5 - 3 - 1</strong></span>
          </div>
        </div>
      </div>

      {/* PROGRES PENGESAHAN BERITA ACARA CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Selesai */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Disahkan</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{progressStats.validatedCount}</span>
            <span className="text-xs text-slate-500">/ {progressStats.totalCategories} Cabang</span>
            <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              {progressStats.percentage}%
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-emerald-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progressStats.percentage}%` }}
            />
          </div>
        </div>

        {/* TKA Progress */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Jenjang TKA</span>
            <Award className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{progressStats.tkaValidated}</span>
            <span className="text-xs text-slate-500">/ {progressStats.tkaTotal} Cabang</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.round((progressStats.tkaValidated / progressStats.tkaTotal) * 100)}%` }}
            />
          </div>
        </div>

        {/* TPA Progress */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Jenjang TPA</span>
            <Award className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{progressStats.tpaValidated}</span>
            <span className="text-xs text-slate-500">/ {progressStats.tpaTotal} Cabang</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.round((progressStats.tpaValidated / progressStats.tpaTotal) * 100)}%` }}
            />
          </div>
        </div>

        {/* TQA Progress */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">Jenjang TQA</span>
            <Award className="w-4 h-4 text-purple-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{progressStats.tqaValidated}</span>
            <span className="text-xs text-slate-500">/ {progressStats.tqaTotal} Cabang</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-purple-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.round((progressStats.tqaValidated / progressStats.tqaTotal) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 4 SUB-TABS: JUARA UMUM, TKA, TPA, TQA */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('umum')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'umum'
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20 scale-[1.02]'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Crown className="w-4 h-4" />
            <span>🏆 Juara Umum (Gabungan)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tka')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'tka'
                ? 'bg-emerald-700 text-white shadow-md shadow-emerald-700/20 scale-[1.02]'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Medal className="w-4 h-4" />
            <span>🥇 Juara Kategori TKA</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tpa')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'tpa'
                ? 'bg-blue-700 text-white shadow-md shadow-blue-700/20 scale-[1.02]'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Medal className="w-4 h-4" />
            <span>🥈 Juara Kategori TPA</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tqa')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'tqa'
                ? 'bg-purple-700 text-white shadow-md shadow-purple-700/20 scale-[1.02]'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Medal className="w-4 h-4" />
            <span>🥉 Juara Kategori TQA</span>
          </button>
        </div>

        {/* Input Pencarian Kab/Kota */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchKemantren}
            onChange={(e) => setSearchKemantren(e.target.value)}
            placeholder="Cari nama Kab/Kota / kode..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* PODIUM TOP 3 KONTINGEN KAB/KOTA */}
      {standings.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end pt-4">
          {/* PERINGKAT 2 (SILVER) */}
          {top2 && (
            <div className="order-2 md:order-1 bg-gradient-to-b from-slate-100 via-slate-50 to-white rounded-2xl p-5 border-2 border-slate-300 shadow-md relative overflow-hidden text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-slate-300 text-slate-800 flex items-center justify-center font-black text-lg shadow-inner">
                🥈 2
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Runner Up 1</span>
                <h3 className="text-lg font-black text-slate-900 mt-0.5">{top2.nama}</h3>
                <span className="font-mono text-xs text-slate-500 font-bold">[{top2.kode}]</span>
              </div>
              <div className="bg-slate-200/80 py-2 px-3 rounded-xl">
                <span className="text-2xl font-black text-slate-900">{top2.totalPoin}</span>
                <span className="text-xs text-slate-600 font-bold ml-1">Poin</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-700">
                <span className="px-2 py-0.5 bg-slate-200/90 rounded-md">🥇 Juara I: {top2.emas}</span>
                <span className="px-2 py-0.5 bg-slate-200/90 rounded-md">🥈 Juara II: {top2.perak}</span>
                <span className="px-2 py-0.5 bg-slate-200/90 rounded-md">🥉 Juara III: {top2.perunggu}</span>
              </div>
            </div>
          )}

          {/* PERINGKAT 1 (GOLD) */}
          {top1 && (
            <div className="order-1 md:order-2 bg-gradient-to-b from-amber-50 via-yellow-50/50 to-white rounded-2xl p-6 border-2 border-amber-400 shadow-xl relative overflow-hidden text-center space-y-3 transform md:-translate-y-2 ring-2 ring-amber-300/50">
              <div className="absolute top-2 right-2">
                <Sparkles className="w-5 h-5 text-amber-500 animate-spin" />
              </div>
              <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 text-amber-950 flex items-center justify-center font-black text-2xl shadow-lg ring-4 ring-amber-200">
                👑 1
              </div>
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full">
                  {activeTab === 'umum' ? '★ CALON JUARA UMUM ★' : '★ JUARA 1 KATEGORI ★'}
                </span>
                <h2 className="text-xl font-black text-slate-900 mt-1">{top1.nama}</h2>
                <span className="font-mono text-xs text-amber-800 font-bold">[{top1.kode}]</span>
              </div>
              <div className="bg-gradient-to-r from-amber-400 to-yellow-400 text-amber-950 py-2.5 px-4 rounded-xl shadow-xs">
                <span className="text-3xl font-black">{top1.totalPoin}</span>
                <span className="text-sm font-bold ml-1">Total Poin</span>
              </div>
              <div className="flex items-center justify-center gap-2.5 text-xs font-bold text-slate-800 pt-1">
                <span className="px-2 py-1 bg-amber-100 text-amber-900 rounded-md">🥇 {top1.emas} Juara I</span>
                <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-md">🥈 {top1.perak} Juara II</span>
                <span className="px-2 py-1 bg-orange-100 text-orange-900 rounded-md">🥉 {top1.perunggu} Juara III</span>
              </div>
            </div>
          )}

          {/* PERINGKAT 3 (BRONZE) */}
          {top3 && (
            <div className="order-3 bg-gradient-to-b from-orange-50/60 via-amber-50/30 to-white rounded-2xl p-5 border-2 border-orange-300 shadow-md relative overflow-hidden text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-orange-200 text-orange-900 flex items-center justify-center font-black text-lg shadow-inner">
                🥉 3
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-orange-600">Runner Up 2</span>
                <h3 className="text-lg font-black text-slate-900 mt-0.5">{top3.nama}</h3>
                <span className="font-mono text-xs text-slate-500 font-bold">[{top3.kode}]</span>
              </div>
              <div className="bg-orange-100/70 py-2 px-3 rounded-xl">
                <span className="text-2xl font-black text-orange-950">{top3.totalPoin}</span>
                <span className="text-xs text-orange-800 font-bold ml-1">Poin</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-700">
                <span className="px-2 py-0.5 bg-orange-100/90 text-orange-900 rounded-md">🥇 Juara I: {top3.emas}</span>
                <span className="px-2 py-0.5 bg-slate-200/90 text-slate-800 rounded-md">🥈 Juara II: {top3.perak}</span>
                <span className="px-2 py-0.5 bg-orange-100/90 text-orange-900 rounded-md">🥉 Juara III: {top3.perunggu}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TABEL LENGKAP KLASEMEN 14 KEMANTREN */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span>{getTabTitle()}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Urutan pemeringkatan dihitung berdasarkan Total Poin tertinggi, lalu perolehan piala Emas, Perak, dan Perunggu.
            </p>
          </div>

          <span className="text-xs font-bold text-slate-600 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
            Menampilkan 5 Kontingen Kab/Kota
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200">
                <th className="py-3 px-4 w-16 text-center">Rank</th>
                <th className="py-3 px-4 w-20">Kode</th>
                <th className="py-3 px-4 min-w-[220px]">Kontingen Kab/Kota</th>
                <th className="py-3 px-4 w-28 text-center">🥇 Juara I</th>
                <th className="py-3 px-4 w-28 text-center">🥈 Juara II</th>
                <th className="py-3 px-4 w-28 text-center">🥉 Juara III</th>
                <th className="py-3 px-4 w-32 text-center bg-emerald-50 text-emerald-900 font-black">Total Poin</th>
                <th className="py-3 px-4 w-32 text-center">Rincian Juara</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStandings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Tidak ada data kontingen Kab/Kota yang cocok dengan pencarian.
                  </td>
                </tr>
              ) : (
                filteredStandings.map((item) => {
                  const isTop1 = item.rank === 1 && item.totalPoin > 0;
                  const isTop2 = item.rank === 2 && item.totalPoin > 0;
                  const isTop3 = item.rank === 3 && item.totalPoin > 0;

                  return (
                    <tr
                      key={item.kemantrenId}
                      className={`transition-colors hover:bg-slate-50 ${
                        isTop1
                          ? 'bg-amber-50/40 font-semibold'
                          : isTop2
                          ? 'bg-slate-50/60'
                          : isTop3
                          ? 'bg-orange-50/30'
                          : ''
                      }`}
                    >
                      {/* Peringkat */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center justify-center w-7 h-7 rounded-full font-black text-xs ${
                            isTop1
                              ? 'bg-amber-400 text-amber-950 shadow-xs ring-2 ring-amber-300'
                              : isTop2
                              ? 'bg-slate-300 text-slate-800'
                              : isTop3
                              ? 'bg-orange-300 text-orange-950'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {item.rank}
                        </span>
                      </td>

                      {/* Kode */}
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-slate-700 bg-slate-200/80 px-2 py-0.5 rounded text-[11px]">
                          {item.kode}
                        </span>
                      </td>

                      {/* Nama Kab/Kota */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-emerald-700 shrink-0" />
                          <span className="font-bold text-slate-900 text-sm">{item.nama}</span>
                          {isTop1 && (
                            <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 border border-amber-300 rounded text-[9px] font-black">
                              ★ Pemuncak
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Juara I */}
                      <td className="py-3 px-4 text-center font-bold text-amber-900">
                        {item.emas > 0 ? (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md">
                            {item.emas}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      {/* Juara II */}
                      <td className="py-3 px-4 text-center font-bold text-slate-700">
                        {item.perak > 0 ? (
                          <span className="px-2 py-0.5 bg-slate-200 text-slate-800 rounded-md">
                            {item.perak}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      {/* Juara III */}
                      <td className="py-3 px-4 text-center font-bold text-orange-900">
                        {item.perunggu > 0 ? (
                          <span className="px-2 py-0.5 bg-orange-100 text-orange-800 rounded-md">
                            {item.perunggu}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      {/* Total Poin */}
                      <td className="py-3 px-4 text-center bg-emerald-50/50">
                        <span className="inline-block px-3.5 py-1 bg-emerald-700 text-white font-black text-sm rounded-xl shadow-2xs">
                          {item.totalPoin}
                        </span>
                      </td>

                      {/* Tombol Rincian Juara */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedKemantrenDetail(item.kemantrenId)}
                          className="px-2.5 py-1 text-[11px] font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg flex items-center gap-1 mx-auto transition-colors cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          <span>{item.detailJuara.length} Juara</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL RINCIAN PEROLEHAN JUARA PER KAB/KOTA */}
      {activeKemantrenDetailObj && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="bg-emerald-900 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-bold text-base">Rincian Kejuaraan: {activeKemantrenDetailObj.nama}</h3>
                  <p className="text-xs text-emerald-200">
                    Total: {activeKemantrenDetailObj.totalPoin} Poin • {activeKemantrenDetailObj.emas} Juara I, {activeKemantrenDetailObj.perak} Juara II, {activeKemantrenDetailObj.perunggu} Juara III
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedKemantrenDetail(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto space-y-3">
              {activeKemantrenDetailObj.detailJuara.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  Belum ada perolehan piala kejuaraan yang disahkan untuk kontingen ini pada tab {activeTab.toUpperCase()}.
                </div>
              ) : (
                <div className="space-y-2">
                  {activeKemantrenDetailObj.detailJuara.map((d, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded font-black text-[10px] ${
                              d.posisiJuara === 'Juara I'
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : d.posisiJuara === 'Juara II'
                                ? 'bg-slate-200 text-slate-800'
                                : 'bg-orange-100 text-orange-900 border border-orange-300'
                            }`}
                          >
                            {d.posisiJuara === 'Juara I' ? '🥇' : d.posisiJuara === 'Juara II' ? '🥈' : '🥉'} {d.posisiJuara}
                          </span>
                          <span className="font-bold text-slate-900">{d.cabangNama}</span>
                          <span className="text-[10px] bg-slate-200 px-1.5 py-0.2 rounded font-bold text-slate-700">
                            {d.jenjang}
                          </span>
                          {d.isUtama && (
                            <span className="text-[9px] bg-amber-100 text-amber-800 border border-amber-300 px-1 py-0.2 rounded font-extrabold">
                              ★ Utama
                            </span>
                          )}
                        </div>
                        <div className="text-slate-600 text-[11px]">
                          Santri: <strong>{d.namaSantri}</strong> • Unit: <em>{d.tpaUnitName}</em>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-sm font-black text-emerald-800">+{d.poin}</span>
                        <div className="text-[10px] text-slate-400">Poin</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 text-right">
              <button
                type="button"
                onClick={() => setSelectedKemantrenDetail(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
