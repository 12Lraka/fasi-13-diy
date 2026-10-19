import React, { useState, useMemo, useEffect } from 'react';
import { 
  Award, 
  Trophy, 
  RefreshCw, 
  CheckCircle2, 
  Calendar,
  Lock,
  Clock,
  Activity,
  ShieldCheck,
  Sparkles,
  Users,
  Layers,
  ChevronRight
} from 'lucide-react';
import { Participant, BeritaAcaraKejuaraan, AppSettings, Jenjang } from '../../types/fasi';
import { KEMANTREN_LIST, CATEGORIES_LIST } from '../../data/fasiMasterData';
import { getStoredBeritaAcara, saveBeritaAcaraList, getStoredSettings } from '../../utils/storage';
import { getThemeConfig } from '../../utils/theme';
import {
  fetchBeritaAcaraFromSupabase,
  subscribeToBeritaAcaraRealtime,
  isSupabaseConfigured
} from '../../lib/supabase';
import { showToast } from '../../utils/sweetalert';

interface LiveScoreboardProps {
  participants: Participant[];
  settings?: AppSettings;
}

interface RayonTally {
  kemantrenId: string;
  kode: string;
  nama: string;
  emas: number; // Juara 1 (jumlah piala)
  perak: number; // Juara 2 (jumlah piala)
  perunggu: number; // Juara 3 (jumlah piala)
  poinEmas: number; // Akumulasi poin dari Juara 1
  poinPerak: number; // Akumulasi poin dari Juara 2
  poinPerunggu: number; // Akumulasi poin dari Juara 3
  totalPoin: number;
  rank: number;
}

export const LiveScoreboard: React.FC<LiveScoreboardProps> = ({ participants, settings: propSettings }) => {
  const settings = propSettings || getStoredSettings();
  const theme = getThemeConfig(settings?.themeColor);

  // Default tab langsung ke TKA (Klasemen Juara Umum ditiadakan demi menjaga surprise pengumuman akbar)
  const [activeTab, setActiveTab] = useState<'tka' | 'tpa' | 'tqa'>('tka');
  const [beritaAcaraList, setBeritaAcaraList] = useState<BeritaAcaraKejuaraan[]>(() => getStoredBeritaAcara());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>(() =>
    new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );

  // Filter pencarian atau filter status cabang di arena tracker
  const [filterStatusArena, setFilterStatusArena] = useState<'all' | 'selesai' | 'belum'>('all');

  // Sinkronisasi data awal dari Supabase & langganan realtime
  useEffect(() => {
    let isMounted = true;

    const syncInitialData = async () => {
      if (!isSupabaseConfigured()) return;
      try {
        const cloudData = await fetchBeritaAcaraFromSupabase();
        if (cloudData && isMounted) {
          setBeritaAcaraList(cloudData);
          saveBeritaAcaraList(cloudData);
        }
      } catch (err) {
        console.warn('Gagal memuat berita acara live score dari Supabase:', err);
      }
    };

    syncInitialData();

    // Listen to local / storage events for live updates
    const handleUpdate = (e: any) => {
      if (e?.detail && Array.isArray(e.detail)) {
        setBeritaAcaraList(e.detail);
      } else {
        setBeritaAcaraList(getStoredBeritaAcara());
      }
    };

    window.addEventListener('fasi_berita_acara_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    // Direct Realtime Supabase Subscription
    const unsubscribe = subscribeToBeritaAcaraRealtime((updatedList) => {
      if (isMounted && updatedList) {
        setBeritaAcaraList(updatedList);
        saveBeritaAcaraList(updatedList);
        setLastRefreshedAt(
          new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        );
      }
    });

    return () => {
      isMounted = false;
      window.removeEventListener('fasi_berita_acara_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Handler Refresh Manual
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (isSupabaseConfigured()) {
        const cloudData = await fetchBeritaAcaraFromSupabase();
        if (cloudData) {
          setBeritaAcaraList(cloudData);
          saveBeritaAcaraList(cloudData);
        }
      } else {
        setBeritaAcaraList(getStoredBeritaAcara());
      }
      setLastRefreshedAt(
        new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
      showToast('success', 'Status arena & perolehan poin berhasil disinkronkan dengan database cloud!');
    } catch {
      showToast('error', 'Gagal menyegarkan data klasemen.');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Filter hanya berita acara yang sudah "Disahkan" oleh dewan juri/superadmin
  const validatedBeritaAcara = useMemo(() => {
    return beritaAcaraList.filter(b => b.status === 'Disahkan');
  }, [beritaAcaraList]);

  // Daftar cabang lomba untuk jenjang yang aktif
  const currentJenjangCategories = useMemo(() => {
    const targetLevel = activeTab.toUpperCase();
    return CATEGORIES_LIST.filter(c => c.level === targetLevel);
  }, [activeTab]);

  // Logika Status Arena per Cabang Lomba
  const getCabangProgress = (catId: string) => {
    const ba = validatedBeritaAcara.find(b => b.cabangId === catId);
    const isSelesai = !!ba && ba.status === 'Disahkan';
    
    // Hari H Lomba FASI XIII: 8 November 2026
    const isHariH = new Date() >= new Date('2026-11-08T00:00:00');

    if (isSelesai) {
      return {
        status: 'selesai' as const,
        label: 'Selesai Dinilai & Berkas Terkunci',
        shortLabel: 'Selesai Dinilai',
        badgeBg: 'bg-emerald-500 text-white',
        borderClass: 'border-emerald-300 bg-emerald-50/70',
        textClass: 'text-emerald-900',
        icon: Lock,
        description: 'Hasil penilaian dewan juri telah disahkan & berkas terkunci aman.',
        disahkanAt: ba?.tanggalPenetapan || ba?.updatedAt || ba?.createdAt,
      };
    }

    if (isHariH) {
      return {
        status: 'berlangsung' as const,
        label: 'Sedang Berlangsung',
        shortLabel: 'Sedang Berlangsung',
        badgeBg: 'bg-amber-500 text-white',
        borderClass: 'border-amber-300 bg-amber-50/70',
        textClass: 'text-amber-900',
        icon: Clock,
        description: 'Dewan juri & panitera sedang memproses jalannya penilaian di majelis.',
      };
    }

    return {
      status: 'terjadwal' as const,
      label: 'Terjadwal (8 Nov 2026)',
      shortLabel: 'Terjadwal',
      badgeBg: 'bg-slate-200 text-slate-700',
      borderClass: 'border-slate-200 bg-slate-50/70',
      textClass: 'text-slate-700',
      icon: Calendar,
      description: 'Arena majelis siap digelar pada hari pelaksanaan lomba 8 November 2026.',
    };
  };

  // Hitungan statistik progres arena jenjang aktif
  const { selesaiCount, totalCount } = useMemo(() => {
    const total = currentJenjangCategories.length;
    const selesai = currentJenjangCategories.filter(cat => {
      const ba = validatedBeritaAcara.find(b => b.cabangId === cat.id);
      return ba && ba.status === 'Disahkan';
    }).length;
    return { selesaiCount: selesai, totalCount: total };
  }, [currentJenjangCategories, validatedBeritaAcara]);

  const progressPercentage = totalCount > 0 ? Math.round((selesaiCount / totalCount) * 100) : 0;

  // Cabang yang difilter di panel Progres Arena
  const filteredArenaCategories = useMemo(() => {
    if (filterStatusArena === 'all') return currentJenjangCategories;
    return currentJenjangCategories.filter(cat => {
      const prog = getCabangProgress(cat.id);
      if (filterStatusArena === 'selesai') return prog.status === 'selesai';
      return prog.status !== 'selesai';
    });
  }, [currentJenjangCategories, filterStatusArena, validatedBeritaAcara]);

  // Kalkulasi Klasemen Kontingen Daerah per Jenjang Terpilih (TKA / TPA / TQA)
  const standings = useMemo(() => {
    const talliesMap: Record<string, RayonTally> = {};

    KEMANTREN_LIST.forEach(k => {
      const kName = k.name;
      talliesMap[kName] = {
        kemantrenId: k.id,
        kode: k.code,
        nama: kName,
        emas: 0,
        perak: 0,
        perunggu: 0,
        poinEmas: 0,
        poinPerak: 0,
        poinPerunggu: 0,
        totalPoin: 0,
        rank: 1,
      };
    });

    const findTally = (kemName?: string): RayonTally | undefined => {
      if (!kemName) return undefined;
      const raw = kemName.trim().toLowerCase();

      // 1. Cek langsung kecocokan ID atau kode
      const byIdOrCode = Object.values(talliesMap).find(
        (t) => t.kemantrenId.toLowerCase() === raw || t.kode.toLowerCase() === raw
      );
      if (byIdOrCode) return byIdOrCode;

      // 2. Bersihkan awalan Kabupaten, Kab, Kota, Rayon, Kemantren
      const cleanInput = raw
        .replace(/^(kabupaten|kab\.?|kota|rayon|kemantren)\s+/i, '')
        .trim();

      // 3. Cocokkan dengan nama daerah yang juga dibersihkan awalannya
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

    validatedBeritaAcara.forEach(ba => {
      // Filter mutlak hanya jenjang yang sedang aktif
      if (activeTab === 'tka' && ba.jenjang !== 'TKA') return;
      if (activeTab === 'tpa' && ba.jenjang !== 'TPA') return;
      if (activeTab === 'tqa' && ba.jenjang !== 'TQA') return;

      const p = ba.pemenang;
      const isUtama = ba.isCabangUtama;
      const p1 = isUtama ? 7 : 5;
      const p2 = isUtama ? 5 : 3;
      const p3 = isUtama ? 3 : 1;

      const t1 = findTally(p.juara1?.kemantren);
      if (t1) {
        t1.emas += 1;
        t1.poinEmas += p1;
        t1.totalPoin += p1;
      }

      const t2 = findTally(p.juara2?.kemantren);
      if (t2) {
        t2.perak += 1;
        t2.poinPerak += p2;
        t2.totalPoin += p2;
      }

      const t3 = findTally(p.juara3?.kemantren);
      if (t3) {
        t3.perunggu += 1;
        t3.poinPerunggu += p3;
        t3.totalPoin += p3;
      }
    });

    // Urutkan berdasarkan: Total Poin desc -> Emas desc -> Perak desc -> Perunggu desc
    const sorted = Object.values(talliesMap).sort((a, b) => {
      if (b.totalPoin !== a.totalPoin) return b.totalPoin - a.totalPoin;
      if (b.emas !== a.emas) return b.emas - a.emas;
      if (b.perak !== a.perak) return b.perak - a.perak;
      return b.perunggu - a.perunggu;
    });

    // Tetapkan ranking
    return sorted.map((item, index) => ({
      ...item,
      rank: index + 1,
    }));
  }, [validatedBeritaAcara, activeTab]);

  const top1 = standings[0];
  const top2 = standings[1];
  const top3 = standings[2];

  // Helper deskripsi nama jenjang lengkap
  const getJenjangLabel = (tab: 'tka' | 'tpa' | 'tqa') => {
    switch (tab) {
      case 'tka':
        return 'TKA (Taman Kanak-kanak Al-Qur\'an)';
      case 'tpa':
        return 'TPA (Taman Pendidikan Al-Qur\'an)';
      case 'tqa':
        return 'TQA (Ta\'limul Qur\'an lil Aulad)';
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. HERO BANNER LIVE SCORE */}
      <div className={`${theme.headerGradient} rounded-3xl p-6 sm:p-8 text-white shadow-xl border ${theme.headerBorder} relative overflow-hidden`}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="p-2.5 rounded-2xl bg-amber-400 text-slate-950 shadow-md">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-extrabold text-amber-300 uppercase tracking-widest block">
                  PORTAL PUBLIKASI RESMI FASI XIII D.I. YOGYAKARTA
                </span>
                <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight">
                  Live Scoreboard & Klasemen Jenjang
                </h2>
              </div>
            </div>
            <p className={`text-xs sm:text-sm ${theme.headerSubtext} max-w-2xl leading-relaxed`}>
              Rekapitulasi perolehan poin resmi per jenjang kejuaraan FASI XIII D.I. Yogyakarta.
              <br />
              <span className="text-amber-300 font-semibold">
                ★ Cabang Utama (Tartil & Tilawah): J1=7pt, J2=5pt, J3=3pt | Cabang Umum: J1=5pt, J2=3pt, J3=1pt.
              </span>
              <br />
              <span className="text-emerald-200 text-xs italic">
                * Catatan: Klasemen Juara Umum D.I. Yogyakarta akan diumumkan secara resmi pada Malam Penganugerahan Akbar.
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2 bg-black/30 backdrop-blur px-3.5 py-2 rounded-2xl border border-white/20 text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="text-slate-200 font-semibold">
                {selesaiCount} dari {totalCount} Cabang {activeTab.toUpperCase()} Selesai
              </span>
            </div>

            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="px-3.5 py-2 rounded-2xl bg-white/15 hover:bg-white/25 active:scale-95 transition-all text-xs font-bold text-white border border-white/25 shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
              title="Perbarui data status arena & poin langsung dari database cloud Supabase"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-amber-300 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Menyinkronkan...' : 'Refresh Poin'}</span>
              <span className="text-[10px] text-amber-200 font-mono opacity-80 hidden sm:inline">
                ({lastRefreshedAt})
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. TAB NAVIGASI KHUSUS PER JENJANG (TKA, TPA, TQA) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200 text-xs sm:text-sm font-semibold no-scrollbar">
        {/* Tab TKA */}
        <button
          onClick={() => setActiveTab('tka')}
          className={`px-5 py-3 rounded-2xl transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
            activeTab === 'tka'
              ? 'bg-emerald-800 text-white shadow-md font-extrabold ring-2 ring-emerald-600/30'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Award className={`w-4 h-4 ${activeTab === 'tka' ? 'text-amber-300' : 'text-emerald-700'}`} />
          <span>Juara Kategori TKA</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
            activeTab === 'tka' ? 'bg-emerald-900/80 text-emerald-100' : 'bg-slate-100 text-slate-600'
          }`}>
            12 Cabang
          </span>
        </button>

        {/* Tab TPA */}
        <button
          onClick={() => setActiveTab('tpa')}
          className={`px-5 py-3 rounded-2xl transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
            activeTab === 'tpa'
              ? 'bg-sky-800 text-white shadow-md font-extrabold ring-2 ring-sky-600/30'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Award className={`w-4 h-4 ${activeTab === 'tpa' ? 'text-amber-300' : 'text-sky-700'}`} />
          <span>Juara Kategori TPA</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
            activeTab === 'tpa' ? 'bg-sky-900/80 text-sky-100' : 'bg-slate-100 text-slate-600'
          }`}>
            10 Cabang
          </span>
        </button>

        {/* Tab TQA */}
        <button
          onClick={() => setActiveTab('tqa')}
          className={`px-5 py-3 rounded-2xl transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
            activeTab === 'tqa'
              ? 'bg-purple-800 text-white shadow-md font-extrabold ring-2 ring-purple-600/30'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Award className={`w-4 h-4 ${activeTab === 'tqa' ? 'text-amber-300' : 'text-purple-700'}`} />
          <span>Juara Kategori TQA</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
            activeTab === 'tqa' ? 'bg-purple-900/80 text-purple-100' : 'bg-slate-100 text-slate-600'
          }`}>
            12 Cabang
          </span>
        </button>
      </div>

      {/* 3. STATUS & PROGRES ARENA LOMBA (LIVE COMPETITION TRACKER) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-emerald-700" />
                <span>Status & Progres Arena Lomba ({activeTab.toUpperCase()})</span>
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Pantauan progres penilaian dewan hakim di arena majelis {getJenjangLabel(activeTab)}. Nama pemenang dirahasiakan hingga Pengumuman Akbar.
            </p>
          </div>

          {/* Baris Ringkasan Progres Bar & Filter */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-2xs flex items-center gap-2">
              <div className="w-20 sm:w-28 bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              <span className="text-[11px] font-black text-emerald-800 font-mono">
                {progressPercentage}%
              </span>
            </div>

            {/* Filter Cepat */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl text-[11px] font-bold">
              <button
                onClick={() => setFilterStatusArena('all')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  filterStatusArena === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua ({totalCount})
              </button>
              <button
                onClick={() => setFilterStatusArena('selesai')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                  filterStatusArena === 'selesai' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-emerald-700 hover:text-emerald-900'
                }`}
              >
                <span>🟢 Selesai ({selesaiCount})</span>
              </button>
              <button
                onClick={() => setFilterStatusArena('belum')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                  filterStatusArena === 'belum' ? 'bg-amber-600 text-white shadow-2xs' : 'text-amber-700 hover:text-amber-900'
                }`}
              >
                <span>🟡 Berjalan / Terjadwal ({totalCount - selesaiCount})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Grid Kartu Cabang Lomba */}
        <div className="p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredArenaCategories.map((cat) => {
              const prog = getCabangProgress(cat.id);
              const IconComp = prog.icon;
              const isUtama = cat.name.toLowerCase().includes('tartil') || cat.name.toLowerCase().includes('tilawah');

              return (
                <div
                  key={cat.id}
                  className={`p-3.5 rounded-2xl border transition-all ${prog.borderClass} flex flex-col justify-between hover:shadow-sm`}
                >
                  <div className="space-y-2">
                    {/* Header Kartu: Kode & Status Badge */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-slate-800 text-white font-mono shadow-2xs">
                          {cat.code}
                        </span>
                        <span className="text-[10px] font-bold text-slate-600 uppercase px-1.5 py-0.5 bg-white/80 rounded-md border border-slate-200">
                          {cat.isGroup ? 'Regu' : cat.genderRequirement === 'L' ? 'Putra' : cat.genderRequirement === 'P' ? 'Putri' : 'Campuran'}
                        </span>
                      </div>

                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${prog.badgeBg} shadow-2xs`}>
                        <IconComp className="w-3 h-3 shrink-0" />
                        <span>{prog.shortLabel}</span>
                      </span>
                    </div>

                    {/* Judul Cabang Lomba */}
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm leading-tight flex items-start gap-1">
                        <span>{cat.name}</span>
                        {isUtama && (
                          <span
                            title="Cabang Utama (Bobot Poin: 7 - 5 - 3)"
                            className="text-amber-500 shrink-0 text-xs"
                          >
                            ★
                          </span>
                        )}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {cat.description}
                      </p>
                    </div>
                  </div>

                  {/* Footer Keterangan Status */}
                  <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      {prog.status === 'selesai' ? (
                        <>
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="font-semibold text-emerald-800 text-[10px]">
                            Berkas Terkunci & Disahkan
                          </span>
                        </>
                      ) : prog.status === 'berlangsung' ? (
                        <>
                          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                          <span className="font-semibold text-amber-800 text-[10px]">
                            Majelis Penilaian Berjalan
                          </span>
                        </>
                      ) : (
                        <>
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-medium text-slate-500 text-[10px]">
                            Ahad, 08 November 2026
                          </span>
                        </>
                      )}
                    </div>

                    {isUtama && (
                      <span className="text-[9px] font-bold text-amber-700 bg-amber-100/80 px-1.5 py-0.5 rounded border border-amber-200">
                        Cabang Utama
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. KLASEMEN PEROLEHAN POIN KATEGORI (PODIUM & TABEL RESMI) */}
      <div className="space-y-6">
        {/* Top 3 Podium Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          
          {/* Peringkat 2 */}
          {top2 && (
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between order-2 md:order-1">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  Peringkat 2 {activeTab.toUpperCase()}
                </span>
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-black text-slate-700 text-sm shadow-2xs">
                  🥈
                </div>
              </div>
              <div className="my-3">
                <h3 className="text-lg font-bold text-slate-900 leading-tight">
                  {top2.nama}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  Total <strong>{top2.totalPoin} Poin</strong>
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs bg-slate-50 p-2 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[10px]">Juara I</span>
                  <strong className="text-amber-600 font-bold text-sm">{top2.emas}</strong>
                  <span className="text-[10px] text-slate-500 font-medium block">({top2.poinEmas} pt)</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Juara II</span>
                  <strong className="text-slate-600 font-bold text-sm">{top2.perak}</strong>
                  <span className="text-[10px] text-slate-500 font-medium block">({top2.poinPerak} pt)</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Juara III</span>
                  <strong className="text-amber-800 font-bold text-sm">{top2.perunggu}</strong>
                  <span className="text-[10px] text-slate-500 font-medium block">({top2.poinPerunggu} pt)</span>
                </div>
              </div>
            </div>
          )}

          {/* Peringkat 1 (Kandidat Juara Jenjang) */}
          {top1 && (
            <div className="bg-gradient-to-b from-amber-50 to-white rounded-2xl p-6 border-2 border-amber-400 shadow-lg relative overflow-hidden flex flex-col justify-between order-1 md:order-2 md:-translate-y-2">
              <div className="absolute top-0 right-0 bg-amber-500 text-slate-950 text-[10px] font-black px-3.5 py-0.5 rounded-bl-xl uppercase tracking-wider shadow-2xs">
                JUARA KATEGORI {activeTab.toUpperCase()}
              </div>
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                  Peringkat 1 {activeTab.toUpperCase()}
                </span>
                <div className="w-11 h-11 rounded-2xl bg-amber-400 flex items-center justify-center font-black text-slate-950 text-xl shadow-md">
                  🥇
                </div>
              </div>
              <div className="my-4">
                <h3 className="text-2xl font-black text-slate-900 leading-tight">
                  {top1.nama}
                </h3>
                <p className="text-sm font-extrabold text-amber-700 font-mono mt-0.5">
                  Total {top1.totalPoin} Poin Jenjang {activeTab.toUpperCase()}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs bg-amber-100/70 p-2.5 rounded-xl border border-amber-200">
                <div>
                  <span className="text-amber-900 block text-[10px] font-bold">Juara I</span>
                  <strong className="text-amber-700 font-black text-base">{top1.emas}</strong>
                  <span className="text-[10px] text-amber-900/80 font-bold block">({top1.poinEmas} pt)</span>
                </div>
                <div>
                  <span className="text-slate-700 block text-[10px] font-bold">Juara II</span>
                  <strong className="text-slate-800 font-black text-base">{top1.perak}</strong>
                  <span className="text-[10px] text-slate-700/80 font-bold block">({top1.poinPerak} pt)</span>
                </div>
                <div>
                  <span className="text-amber-950 block text-[10px] font-bold">Juara III</span>
                  <strong className="text-amber-950 font-black text-base">{top1.perunggu}</strong>
                  <span className="text-[10px] text-amber-950/80 font-bold block">({top1.poinPerunggu} pt)</span>
                </div>
              </div>
            </div>
          )}

          {/* Peringkat 3 */}
          {top3 && (
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between order-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  Peringkat 3 {activeTab.toUpperCase()}
                </span>
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center font-black text-amber-800 text-sm shadow-2xs">
                  🥉
                </div>
              </div>
              <div className="my-3">
                <h3 className="text-lg font-bold text-slate-900 leading-tight">
                  {top3.nama}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  Total <strong>{top3.totalPoin} Poin</strong>
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs bg-slate-50 p-2 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[10px]">Juara I</span>
                  <strong className="text-amber-600 font-bold text-sm">{top3.emas}</strong>
                  <span className="text-[10px] text-slate-500 font-medium block">({top3.poinEmas} pt)</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Juara II</span>
                  <strong className="text-slate-600 font-bold text-sm">{top3.perak}</strong>
                  <span className="text-[10px] text-slate-500 font-medium block">({top3.poinPerak} pt)</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Juara III</span>
                  <strong className="text-amber-800 font-bold text-sm">{top3.perunggu}</strong>
                  <span className="text-[10px] text-slate-500 font-medium block">({top3.poinPerunggu} pt)</span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Tabel Lengkap Perolehan Medali & Poin 5 Kabupaten/Kota */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">
                Klasemen Resmi 5 Kabupaten / Kota — Jenjang {activeTab.toUpperCase()}
              </h3>
              <p className="text-xs text-slate-500">
                Diurutkan berdasarkan akumulasi poin Berita Acara yang telah disahkan dewan juri untuk jenjang {activeTab.toUpperCase()}.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-3.5 px-4 w-14 text-center">Rank</th>
                  <th className="py-3.5 px-4">Kontingen Daerah</th>
                  <th className="py-3.5 px-4 text-center bg-amber-50/70 text-amber-950 font-bold min-w-[95px]">
                    <div>🥇 Juara I</div>
                    <div className="text-[10px] font-normal text-amber-800/80">(Piala & Poin)</div>
                  </th>
                  <th className="py-3.5 px-4 text-center bg-slate-100/70 text-slate-800 font-bold min-w-[95px]">
                    <div>🥈 Juara II</div>
                    <div className="text-[10px] font-normal text-slate-600/80">(Piala & Poin)</div>
                  </th>
                  <th className="py-3.5 px-4 text-center bg-amber-900/10 text-amber-950 font-bold min-w-[95px]">
                    <div>🥉 Juara III</div>
                    <div className="text-[10px] font-normal text-amber-900/80">(Piala & Poin)</div>
                  </th>
                  <th className="py-3.5 px-4 text-center font-black bg-amber-100 text-slate-950 min-w-[95px]">
                    <div>Total Poin</div>
                    <div className="text-[10px] font-normal text-slate-700">({activeTab.toUpperCase()})</div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {standings.map((tally) => (
                  <tr
                    key={tally.kemantrenId}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      tally.rank === 1 ? 'bg-amber-50/30 font-semibold' : ''
                    }`}
                  >
                    <td className="py-3 px-4 text-center">
                      {tally.rank === 1 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-400 text-slate-950 font-black text-xs shadow-2xs">
                          1
                        </span>
                      ) : tally.rank === 2 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-300 text-slate-800 font-black text-xs">
                          2
                        </span>
                      ) : tally.rank === 3 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-200 text-amber-900 font-black text-xs">
                          3
                        </span>
                      ) : (
                        <span className="text-slate-400 font-medium">{tally.rank}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {tally.nama}
                    </td>
                    <td className="py-3 px-4 text-center bg-amber-50/30">
                      <div className="font-bold text-amber-700 text-sm leading-tight">
                        {tally.emas}
                      </div>
                      <div className="text-[10px] font-semibold text-amber-900/80">
                        ({tally.poinEmas} pt)
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center bg-slate-100/30">
                      <div className="font-bold text-slate-700 text-sm leading-tight">
                        {tally.perak}
                      </div>
                      <div className="text-[10px] font-semibold text-slate-600/80">
                        ({tally.poinPerak} pt)
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center bg-amber-900/5">
                      <div className="font-bold text-amber-900 text-sm leading-tight">
                        {tally.perunggu}
                      </div>
                      <div className="text-[10px] font-semibold text-amber-950/80">
                        ({tally.poinPerunggu} pt)
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-black text-slate-950 bg-amber-50 text-sm">
                      {tally.totalPoin}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
