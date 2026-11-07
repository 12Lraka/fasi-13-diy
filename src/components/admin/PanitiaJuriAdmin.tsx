/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sistem Informasi FASI XIII D.I. Yogyakarta
 * Panel Manajemen Data Panitia, Panitera & Dewan Hakim (Superadmin Only)
 * Terhubung langsung ke Studio Cetak ID Card dan Generator PDF Daftar Hadir
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Scale,
  FileCheck,
  ShieldCheck,
  Plus,
  Trash2,
  Edit3,
  Download,
  Printer,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Building2,
  FileText,
  Eye,
  Sliders,
  X,
  Check,
  ChevronDown,
  FileSpreadsheet,
  ClipboardPaste,
  FileUp,
  Sparkles,
  Upload,
  AlertCircle,
  Info,
  Layers,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Coins,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { IdCardCommitteeData, UserSession } from '../../types/fasi';
import {
  getStoredCommittees,
  saveCommitteesList,
  persistCommittee,
  bulkPersistCommittees,
  removeCommittee,
  clearStoredCommittees,
  syncCommitteesFromCloud,
  getStoredSettings,
  logAuditEvent,
} from '../../utils/storage';
import { isSupabaseConfigured, fetchCommitteesFromSupabase } from '../../lib/supabase';
import { showToast, showSuccessAlert, showConfirmDialog } from '../../utils/sweetalert';
import { downloadDaftarHadirPdf, sortCommitteesList } from '../../utils/daftarHadirPdfGenerator';
import { downloadHonorPdf } from '../../utils/honorPdfGenerator';

interface PanitiaJuriAdminProps {
  session: UserSession;
  onNavigateToIdCard?: (categoryType?: 'panitia' | 'dewan_hakim' | 'panitera') => void;
}

type SubCategoryFilter = 'all' | 'dewan_hakim' | 'panitera' | 'panitia';

export const PanitiaJuriAdmin: React.FC<PanitiaJuriAdminProps> = ({
  session,
  onNavigateToIdCard,
}) => {
  const [committees, setCommittees] = useState<IdCardCommitteeData[]>(() => getStoredCommittees());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<SubCategoryFilter>('all');
  const [selectedAccessLevel, setSelectedAccessLevel] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [isExportingExcel, setIsExportingExcel] = useState<boolean>(false);

  // Pagination State (Default 20 per halaman sesuai permintaan pengguna)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);

  // Form Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<IdCardCommitteeData | null>(null);

  // Form Fields
  const [formName, setFormName] = useState<string>('');
  const [formDivision, setFormDivision] = useState<string>('');
  const [formCategory, setFormCategory] = useState<'panitia' | 'dewan_hakim' | 'panitera'>('dewan_hakim');
  const [formAccessLevel, setFormAccessLevel] = useState<string>('RUANG HAKIM & JURI');
  const [formCustomBadge, setFormCustomBadge] = useState<string>('DEWAN HAKIM');

  // Smart Import (Excel / Word) Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [importRawText, setImportRawText] = useState<string>('');
  const [importCategory, setImportCategory] = useState<'panitia' | 'dewan_hakim' | 'panitera'>('dewan_hakim');
  const [importAccessLevel, setImportAccessLevel] = useState<string>('RUANG HAKIM & JURI');
  const [importCustomBadge, setImportCustomBadge] = useState<string>('DEWAN HAKIM');
  const [avoidDuplicates, setAvoidDuplicates] = useState<boolean>(true);
  const [isSubmittingImport, setIsSubmittingImport] = useState<boolean>(false);

  // Dropdown Download Menu
  const [showDownloadMenu, setShowDownloadMenu] = useState<boolean>(false);
  const [showHonorMenu, setShowHonorMenu] = useState<boolean>(false);
  const [isGeneratingHonorPdf, setIsGeneratingHonorPdf] = useState<boolean>(false);

  // Settings
  const appSettings = useMemo(() => getStoredSettings(), []);

  // Sync on mount
  useEffect(() => {
    const list = getStoredCommittees();
    setCommittees(list);

    if (isSupabaseConfigured()) {
      syncCommitteesFromCloud().then((cloudList) => {
        if (cloudList && cloudList.length > 0) {
          setCommittees(cloudList);
        }
      });
    }

    const handleStorageUpdate = (e: any) => {
      if (e.detail) {
        setCommittees(e.detail);
      } else {
        setCommittees(getStoredCommittees());
      }
    };

    window.addEventListener('fasi_committees_updated', handleStorageUpdate);
    return () => {
      window.removeEventListener('fasi_committees_updated', handleStorageUpdate);
    };
  }, []);

  // Filtered list
  const filteredList = useMemo(() => {
    const filtered = committees.filter((item) => {
      // Category filter
      if (selectedCategory !== 'all') {
        const itemCat = item.cardCategory || 'panitia';
        if (itemCat !== selectedCategory) return false;
      }

      // Access level filter
      if (selectedAccessLevel !== 'all') {
        if (item.accessLevel !== selectedAccessLevel) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = (item.name || '').toLowerCase().includes(q);
        const matchDiv = (item.division || '').toLowerCase().includes(q);
        const matchAccess = (item.accessLevel || '').toLowerCase().includes(q);
        const matchBadge = (item.customBadge || '').toLowerCase().includes(q);
        if (!matchName && !matchDiv && !matchAccess && !matchBadge) return false;
      }

      return true;
    });

    // Urutkan secara rapi dan konsisten (Kategori -> Penugasan/Cabang -> Nama)
    return sortCommitteesList(filtered);
  }, [committees, selectedCategory, selectedAccessLevel, searchQuery]);

  // Reset ke halaman 1 jika filter atau pencarian berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedAccessLevel, pageSize]);

  // Perhitungan Pagination
  const totalPages = Math.max(1, Math.ceil(filteredList.length / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedList = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * pageSize;
    return filteredList.slice(startIndex, startIndex + pageSize);
  }, [filteredList, safeCurrentPage, pageSize]);

  // Statistics Count
  const stats = useMemo(() => {
    const hakim = committees.filter((c) => c.cardCategory === 'dewan_hakim').length;
    const panitera = committees.filter((c) => c.cardCategory === 'panitera').length;
    const panitia = committees.filter((c) => !c.cardCategory || c.cardCategory === 'panitia').length;
    return {
      hakim,
      panitera,
      panitia,
      total: committees.length,
    };
  }, [committees]);

  // Unique Access Levels
  const uniqueAccessLevels = useMemo(() => {
    const set = new Set<string>();
    committees.forEach((c) => {
      if (c.accessLevel) set.add(c.accessLevel);
    });
    return Array.from(set).sort();
  }, [committees]);

  // Refresh from Cloud
  const handleRefreshCloud = async () => {
    setIsRefreshing(true);
    try {
      const cloudData = await syncCommitteesFromCloud();
      setCommittees(cloudData);
      showToast('success', `Berhasil menyinkronkan ${cloudData.length} data personel dari Supabase.`);
    } catch {
      showToast('error', 'Gagal menyinkronkan data dengan Supabase.');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Open Form Add
  const handleOpenAdd = (defaultType?: 'panitia' | 'dewan_hakim' | 'panitera') => {
    setEditingItem(null);
    const cat = defaultType || (selectedCategory === 'all' ? 'dewan_hakim' : selectedCategory);
    setFormCategory(cat);
    setFormName('');

    if (cat === 'dewan_hakim') {
      setFormDivision('Cabang Tilawah (TKA, TPA, TQA)');
      setFormAccessLevel('RUANG HAKIM & JURI');
      setFormCustomBadge('DEWAN HAKIM');
    } else if (cat === 'panitera') {
      setFormDivision('Panitera Arena Tilawah');
      setFormAccessLevel('ARENA LOMBA & MEJA PANITERA');
      setFormCustomBadge('PANITERA');
    } else {
      setFormDivision('Seksi Acara & Lomba');
      setFormAccessLevel('ALL ACCESS');
      setFormCustomBadge('PANITIA');
    }

    setIsModalOpen(true);
  };

  // Open Form Edit
  const handleOpenEdit = (item: IdCardCommitteeData) => {
    setEditingItem(item);
    setFormName(item.name || '');
    setFormDivision(item.division || '');
    setFormCategory(item.cardCategory || 'panitia');
    setFormAccessLevel(item.accessLevel || 'ALL ACCESS');
    setFormCustomBadge(item.customBadge || (item.cardCategory === 'dewan_hakim' ? 'DEWAN HAKIM' : (item.cardCategory === 'panitera' ? 'PANITERA' : 'PANITIA')));
    setIsModalOpen(true);
  };

  // Handle Category Change inside Form
  const handleFormCategoryChange = (cat: 'panitia' | 'dewan_hakim' | 'panitera') => {
    setFormCategory(cat);
    if (!editingItem) {
      if (cat === 'dewan_hakim') {
        setFormAccessLevel('RUANG HAKIM & JURI');
        setFormCustomBadge('DEWAN HAKIM');
      } else if (cat === 'panitera') {
        setFormAccessLevel('ARENA LOMBA & MEJA PANITERA');
        setFormCustomBadge('PANITERA');
      } else {
        setFormAccessLevel('ALL ACCESS');
        setFormCustomBadge('PANITIA');
      }
    }
  };

  // Submit Form Save
  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      showToast('warning', 'Nama lengkap & gelar wajib diisi.');
      return;
    }
    if (!formDivision.trim()) {
      showToast('warning', 'Jabatan / Penugasan cabang lomba wajib diisi.');
      return;
    }

    const itemData: IdCardCommitteeData = {
      id: editingItem ? editingItem.id : `com-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: formName.trim(),
      division: formDivision.trim(),
      accessLevel: formAccessLevel.trim() || 'ALL ACCESS',
      cardCategory: formCategory,
      customBadge: formCustomBadge.trim() || (formCategory === 'dewan_hakim' ? 'DEWAN HAKIM' : (formCategory === 'panitera' ? 'PANITERA' : 'PANITIA')),
      updatedAt: new Date().toISOString(),
    };

    await persistCommittee(itemData);

    const updated = getStoredCommittees();
    setCommittees(updated);
    setIsModalOpen(false);

    logAuditEvent(
      session.name,
      editingItem ? 'UPDATE_PANITIA_HAKIM' : 'TAMBAH_PANITIA_HAKIM',
      `${editingItem ? 'Memperbarui' : 'Menambahkan'} data ${itemData.name} (${itemData.division}) sebagai ${itemData.cardCategory}.`
    );

    showToast(
      'success',
      editingItem
        ? `Data ${itemData.name} berhasil diperbarui!`
        : `Berhasil menambahkan ${itemData.name} ke sistem!`
    );
  };

  // Handle Delete
  const handleDeleteItem = async (item: IdCardCommitteeData) => {
    const confirmed = await showConfirmDialog(
      `Hapus ${item.name}?`,
      `Data personel "${item.name}" (${item.division}) akan dihapus dari daftar panitia dan database Supabase.`,
      'Ya, Hapus'
    );

    if (!confirmed) return;

    await removeCommittee(item.id);
    const updated = getStoredCommittees();
    setCommittees(updated);

    logAuditEvent(
      session.name,
      'HAPUS_PANITIA_HAKIM',
      `Menghapus data personel ${item.name} (${item.division}) dari sistem.`
    );

    showToast('info', `Data ${item.name} telah dihapus.`);
  };

  // Handle Kosongkan Semua Data Perangkat
  const handleClearAllCommittees = async () => {
    if (committees.length === 0) {
      showToast('info', 'Data perangkat sudah dalam keadaan bersih/kosong.');
      return;
    }

    const confirmed = await showConfirmDialog(
      'Kosongkan Semua Data Perangkat?',
      `Perhatian: Seluruh data panitia, panitera, dan dewan hakim (${committees.length} orang) akan dibersihkan dari penyimpanan lokal (Local Storage). Tindakan ini tidak dapat dibatalkan.`,
      'Ya, Kosongkan Semua'
    );

    if (!confirmed) return;

    clearStoredCommittees();
    setCommittees([]);

    logAuditEvent(
      session.name,
      'KOSONGKAN_SEMUA_PANITIA_HAKIM',
      `Mengosongkan seluruh data perangkat panitia, panitera, dan dewan hakim dari sistem.`
    );

    showToast('success', 'Seluruh data perangkat berhasil dikosongkan!');
  };

  // ============================================================================
  // LOGIKA SMART IMPORT (COPY-PASTE EXCEL / WORD & UPLOAD FILE)
  // ============================================================================

  const handleImportCategoryChange = (cat: 'panitia' | 'dewan_hakim' | 'panitera') => {
    setImportCategory(cat);
    if (cat === 'dewan_hakim') {
      setImportAccessLevel('RUANG HAKIM & JURI');
      setImportCustomBadge('DEWAN HAKIM');
    } else if (cat === 'panitera') {
      setImportAccessLevel('ARENA LOMBA & MEJA PANITERA');
      setImportCustomBadge('PANITERA');
    } else {
      setImportAccessLevel('ALL ACCESS');
      setImportCustomBadge('PANITIA');
    }
  };

  const handleOpenSmartImport = (defaultCat?: 'panitia' | 'dewan_hakim' | 'panitera') => {
    const targetCat = defaultCat || (selectedCategory !== 'all' ? selectedCategory : 'dewan_hakim');
    handleImportCategoryChange(targetCat);
    setImportRawText('');
    setIsImportModalOpen(true);
  };

  // Real-time parsing teks mentah dari Excel / Word
  const parsedImportRows = useMemo(() => {
    if (!importRawText.trim()) return [];

    const lines = importRawText.split(/\r?\n/);
    const results: Array<{
      rawIndex: number;
      name: string;
      division: string;
      institution?: string;
      isExisting: boolean;
      existingId?: string;
    }> = [];

    // Map data yang sudah ada di database untuk deteksi duplikasi cepat (O(1))
    const existingMap = new Map<string, IdCardCommitteeData>();
    committees.forEach((c) => {
      if ((c.cardCategory || 'panitia') === importCategory) {
        const key = (c.name || '').trim().toLowerCase();
        if (key) existingMap.set(key, c);
      }
    });

    const seenInBatch = new Set<string>();

    lines.forEach((rawLine, idx) => {
      let line = rawLine.trim();
      if (!line) return;

      // Bersihkan nomor urut di awal baris (contoh: "1. ", "2) ", "- ", "• ")
      line = line.replace(/^[-*•\d]+[\.\)\-\:\s]+\s*/, '').trim();
      if (!line) return;

      let name = '';
      let division = '';
      let institution = '';

      if (line.includes('\t')) {
        // Format dari MS Excel / Google Sheets / Tabel Word (Tab separated)
        let parts = line.split('\t').map((p) => p.trim()).filter(Boolean);
        // Jika kolom pertama hanya berupa nomor urut (angka murni), hilangkan
        if (parts.length >= 2 && /^\d+$/.test(parts[0])) {
          parts = parts.slice(1);
        }

        if (parts.length === 1) {
          name = parts[0];
        } else if (parts.length === 2) {
          name = parts[0];
          division = parts[1];
        } else if (parts.length >= 3) {
          // Format 3 kolom lengkap: Kolom 1 = Nama, Kolom 2 = Cabang/Penugasan, Kolom 3 = Instansi
          name = parts[0];
          division = parts[1];
          institution = parts.slice(2).join(' - ');
        }
      } else if (line.includes(' - ') || line.includes(' — ') || line.includes(' : ') || line.includes(' | ') || line.includes(' ; ')) {
        // Format teks biasa dengan pemisah
        const parts = line.split(/\s+[-—:|;]\s+/).map((p) => p.trim()).filter(Boolean);
        if (parts.length === 1) {
          name = parts[0];
        } else if (parts.length === 2) {
          name = parts[0];
          division = parts[1];
        } else if (parts.length >= 3) {
          name = parts[0];
          division = parts[1];
          institution = parts.slice(2).join(' - ');
        }
      } else {
        // Cek format khusus seperti: "M. Anwar Tartil Al Qur’an ( Putra Putri ) PP Al Munawwir"
        // Pola: Nama + Cabang Lomba ( dengan/tanpa kurung ) + Instansi (contoh: PP ..., Ponpes ..., UIN ..., Kemenag ...)
        // Atau jika terdapat tanda kurung cabang: Nama + Cabang (Ket) + Instansi
        const branchWithParenRegex = /^(.*?)\s+(Tartil|Tilawah|Tahfidz|Cerita|CCQ|Syarhil|Khat|Kaligrafi|Nasyid|Kisah|Mewarnai|Menggambar|Adzan|Sholat|Pidato|Pildacil|Terjemah)\s*([^\(]*?\([^\)]+?\))\s*(.*)$/i;
        const generalBranchRegex = /^(.*?)\s+(Tartil|Tilawah|Tahfidz|Cerita|CCQ|Syarhil|Khat|Kaligrafi|Nasyid|Kisah|Mewarnai|Menggambar|Adzan|Sholat|Pidato|Pildacil|Terjemah)\s+([A-Za-z0-9\s\(\)\/]+?)\s+(PP\s+|Ponpes\s+|Pondok\s+|UIN\s+|Kemenag\s+|Badko\s+|LPTQ\s+|Masjid\s+|TPA\s+|Kec\.\s+|Kecamatan\s+|Kab\.\s+|Kota\s+)(.*)$/i;

        const mParen = line.match(branchWithParenRegex);
        const mGen = line.match(generalBranchRegex);

        if (mParen) {
          name = mParen[1].trim();
          division = `${mParen[2]} ${mParen[3]}`.trim();
          institution = mParen[4]?.trim() || '';
        } else if (mGen) {
          name = mGen[1].trim();
          division = `${mGen[2]} ${mGen[3]}`.trim();
          institution = `${mGen[4]}${mGen[5]}`.trim();
        } else {
          // Cek jika terdapat tanda kurung sederhana di akhir: "Ahmad, S.Pd (Juri Tilawah)"
          const parenMatch = line.match(/^(.*?)\((.*?)\)$/);
          if (parenMatch) {
            name = parenMatch[1].trim();
            division = parenMatch[2].trim();
          } else {
            name = line;
          }
        }
      }

      // Bersihkan tanda petik
      name = name.replace(/^["']|["']$/g, '').trim();
      division = division.replace(/^["']|["']$/g, '').trim();
      institution = institution.replace(/^["']|["']$/g, '').trim();

      // Abaikan baris header tabel jika terbawa copy
      const lowerName = name.toLowerCase();
      const lowerDiv = division.toLowerCase();
      const isHeader =
        ['no', 'nomor', 'nama', 'name', 'nama lengkap', 'peserta', 'perangkat', 'nama & gelar'].includes(lowerName) ||
        (['jabatan', 'divisi', 'bagian', 'penugasan', 'kategori', 'cabang'].includes(lowerDiv) && lowerName.includes('nama'));

      if (isHeader || !name) return;

      // Default divisi / jabatan jika tidak dicantumkan di teks
      if (!division) {
        division =
          importCategory === 'dewan_hakim'
            ? 'Anggota Dewan Hakim'
            : importCategory === 'panitera'
            ? 'Panitera Lomba'
            : 'Panitia Pelaksana';
      }

      // Cegah duplikasi ganda dalam batch teks yang sama
      const normKey = name.toLowerCase();
      if (seenInBatch.has(normKey)) {
        return; // Lewati duplikat di dalam batch paste yang sama
      }
      seenInBatch.add(normKey);

      // Cek apakah sudah terdaftar di database Supabase
      const existing = existingMap.get(normKey);

      results.push({
        rawIndex: idx + 1,
        name,
        division,
        institution,
        isExisting: Boolean(existing),
        existingId: existing?.id,
      });
    });

    return results;
  }, [importRawText, importCategory, committees]);

  // Handler Upload File Excel (.xlsx / .xls / .csv)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        // Konversi sheet Excel ke format teks TSV
        const tsv = XLSX.utils.sheet_to_csv(ws, { FS: '\t' });
        setImportRawText(tsv);
        showToast('info', `File ${file.name} berhasil dibaca! Silakan periksa pratinjau.`);
      } catch (err: any) {
        console.error('Gagal membaca file excel:', err);
        showToast('error', 'Gagal memproses file Excel.');
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = ''; // Reset input agar bisa upload file yang sama jika diperlukan
  };

  // Eksekusi Simpan Langsung ke Database Supabase
  const handleExecuteImport = async () => {
    if (parsedImportRows.length === 0) {
      showToast('warning', 'Tidak ada data valid yang terdeteksi untuk disimpan.');
      return;
    }

    setIsSubmittingImport(true);
    try {
      showToast('info', 'Menyimpan data massal langsung ke database Supabase Cloud...');

      const baseTime = Date.now();
      const newItems: IdCardCommitteeData[] = parsedImportRows.map((row, idx) => {
        // Tentukan accessLevel / instansi: utamakan hasil parsing kolom 3 jika terdeteksi
        const accessOrInstansi = row.institution?.trim() || importAccessLevel.trim() || (importCategory === 'dewan_hakim' ? '-' : 'ALL ACCESS');
        // Buat timestamp ISO bertahap per milidetik/detik agar urutan input tetap 100% konsisten di PostgreSQL & LocalStorage
        const itemCreatedAt = new Date(baseTime + (idx * 100)).toISOString();
        const safeIdx = String(idx + 1).padStart(4, '0');

        return {
          id: row.isExisting && row.existingId && avoidDuplicates
            ? row.existingId
            : `com-${baseTime}-${safeIdx}`,
          name: row.name,
          division: row.division,
          accessLevel: accessOrInstansi,
          cardCategory: importCategory,
          customBadge:
            importCustomBadge.trim() ||
            (importCategory === 'dewan_hakim'
              ? 'DEWAN HAKIM'
              : importCategory === 'panitera'
              ? 'PANITERA'
              : 'PANITIA'),
          createdAt: row.isExisting && row.existingId ? undefined : itemCreatedAt,
          updatedAt: itemCreatedAt,
        };
      });

      // Sekali klik langsung tersimpan ke database Supabase dan LocalStorage
      const result = await bulkPersistCommittees(newItems);

      if (!result.success && result.error) {
        throw new Error(result.error);
      }

      // Refresh data tampilan
      const updated = getStoredCommittees();
      setCommittees(updated);

      logAuditEvent(
        session.name,
        'IMPORT_CERDAS_PANITIA_HAKIM',
        `Import cerdas ${newItems.length} personel (${importCategory}) langsung ke database Supabase.`
      );

      const updatedCount = parsedImportRows.filter((r) => r.isExisting).length;
      const newCount = parsedImportRows.length - updatedCount;

      setIsImportModalOpen(false);
      setImportRawText('');

      showSuccessAlert(
        'Import Berhasil Disimpan ke Supabase!',
        `Berhasil menyimpan ${parsedImportRows.length} data personel ke database Supabase Cloud.\n\n• Data Baru Ditambahkan: ${newCount}\n• Data Sudah Ada Diperbarui: ${updatedCount}\n\nSeluruh data langsung aktif di Studio Cetak ID Card & Lembar Daftar Hadir Resmi.`
      );
    } catch (err: any) {
      console.error('Gagal simpan import massal ke Supabase:', err);
      showToast('error', `Gagal menyimpan ke Supabase: ${err?.message || 'Error tidak diketahui'}`);
    } finally {
      setIsSubmittingImport(false);
    }
  };

  // Handle Download PDF Daftar Hadir
  const handleDownloadPdf = async (type: 'dewan_hakim' | 'panitera' | 'panitia' | 'all') => {
    setIsGeneratingPdf(true);
    setShowDownloadMenu(false);
    try {
      showToast('info', 'Sedang menyusun dokumen PDF Daftar Hadir resmi...');
      await downloadDaftarHadirPdf({
        categoryType: type,
        committees,
        eventName: appSettings.eventName,
        eventDate: appSettings.eventDate,
        ketuaPanitiaName: 'Endro Suwarno, A.Md., S.E.',
        koordinatorLombaName: 'Nihayaturruhama, S.E.',
      });
      showToast('success', 'PDF Daftar Hadir berhasil diunduh!');
    } catch (err: any) {
      console.error('Gagal generate PDF daftar hadir:', err);
      showToast('error', 'Gagal membuat dokumen PDF Daftar Hadir.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Handle Download PDF Penerimaan Honor (F4 Landscape)
  const handleDownloadHonorPdf = async (type: 'dewan_hakim' | 'panitera' | 'panitia' | 'all') => {
    setIsGeneratingHonorPdf(true);
    setShowHonorMenu(false);
    try {
      showToast('info', 'Sedang menyusun dokumen PDF Penerimaan Honor resmi (F4 Landscape)...');
      await downloadHonorPdf({
        categoryType: type,
        committees,
        eventName: appSettings.eventName,
        eventDate: appSettings.eventDate,
        ketuaPanitiaName: 'Endro Suwarno, A.Md., S.E.',
        bendaharaName: 'H. Anas Yusuf, S.Sos.I.',
      });
      showToast('success', 'PDF Penerimaan Honor (F4 Landscape) berhasil diunduh!');
    } catch (err: any) {
      console.error('Gagal generate PDF penerimaan honor:', err);
      showToast('error', 'Gagal membuat dokumen PDF Penerimaan Honor.');
    } finally {
      setIsGeneratingHonorPdf(false);
    }
  };

  // Handle Download Excel (.xlsx) Resmi
  const handleDownloadExcel = (targetCategory?: 'dewan_hakim' | 'panitera' | 'panitia' | 'all') => {
    setIsExportingExcel(true);
    try {
      const catToUse = targetCategory !== undefined ? targetCategory : selectedCategory;
      let dataToExport = [...committees];

      if (catToUse !== 'all') {
        dataToExport = dataToExport.filter((item) => (item.cardCategory || 'panitia') === catToUse);
      } else if (searchQuery.trim() || selectedAccessLevel !== 'all') {
        dataToExport = [...filteredList];
      }

      if (dataToExport.length === 0) {
        showToast('warning', 'Tidak ada data personel untuk diekspor ke format Excel.');
        setIsExportingExcel(false);
        return;
      }

      // Urutkan data secara konsisten (Kategori -> Urutan Asli Input)
      const sortedData = sortCommitteesList(dataToExport);

      // Label kategori untuk judul kop dokumen Excel
      const categoryLabel =
        catToUse === 'dewan_hakim'
          ? 'DEWAN HAKIM & JURI'
          : catToUse === 'panitera'
          ? 'PANITERA LOMBA'
          : catToUse === 'panitia'
          ? 'PANITIA PELAKSANA'
          : 'PANITIA, PANITERA & DEWAN HAKIM';

      // Baris Kop Surat Resmi
      const titleRows = [
        ['FESTIVAL ANAK SHOLEH INDONESIA (FASI) XIII'],
        ['BADKO TKA-TPA D.I. YOGYAKARTA'],
        ['Sekretariat : Kertopaten, Glondong, Wirokerten, Kec. Banguntapan, Bantul, DIY 55194'],
        [],
        [`DAFTAR DATA ${categoryLabel}`],
        [
          `Tanggal Ekspor: ${new Date().toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })} | Total Personel: ${sortedData.length} Orang`,
        ],
        [],
      ];

      // Header Kolom Tabel
      const headers = [
        'No',
        'Kategori Perangkat',
        'Nama Lengkap & Gelar',
        'Jabatan / Penugasan Cabang Lomba',
        'Hak Akses Ruang / Arena',
        'Badge Kartu ID',
        'ID Personel',
      ];

      // Baris Data
      const dataRows = sortedData.map((item, index) => {
        const cat = item.cardCategory || 'panitia';
        const categoryText =
          cat === 'dewan_hakim'
            ? 'Dewan Hakim / Juri'
            : cat === 'panitera'
            ? 'Panitera Lomba'
            : 'Panitia Pelaksana';

        return [
          index + 1,
          categoryText,
          item.name || '-',
          item.division || '-',
          item.accessLevel || 'ALL ACCESS',
          item.customBadge || (cat === 'dewan_hakim' ? 'DEWAN HAKIM' : cat === 'panitera' ? 'PANITERA' : 'PANITIA'),
          item.id || '-',
        ];
      });

      // Tanda Tangan Resmi di Bawah
      const dateStrId = '08 November 2026';
      const footerRows = [
        [],
        [],
        ['', '', '', '', 'Yogyakarta, ' + dateStrId],
        ['Mengetahui,', '', '', '', 'Ketua Panitia FASI XIII'],
        ['Ketua Umum BADKO TKA-TPA DIY', '', '', '', ''],
        [],
        [],
        [],
        ['H. Suprapto, S.Ag., M.A', '', '', '', 'Endro Suwarno, S.E.'],
      ];

      const sheetData = [...titleRows, headers, ...dataRows, ...footerRows];
      const ws = XLSX.utils.aoa_to_sheet(sheetData);

      // Lebar Kolom
      ws['!cols'] = [
        { wch: 6 },  // No
        { wch: 24 }, // Kategori Perangkat
        { wch: 36 }, // Nama Lengkap & Gelar
        { wch: 36 }, // Jabatan / Penugasan
        { wch: 28 }, // Hak Akses Ruang
        { wch: 20 }, // Badge Kartu ID
        { wch: 20 }, // ID Personel
      ];

      const wb = XLSX.utils.book_new();
      const sheetName =
        catToUse === 'dewan_hakim'
          ? 'Dewan Hakim'
          : catToUse === 'panitera'
          ? 'Panitera'
          : catToUse === 'panitia'
          ? 'Panitia'
          : 'Data Perangkat';
      XLSX.utils.book_append_sheet(wb, ws, sheetName);

      const dateStr = new Date().toISOString().slice(0, 10);
      const catFileName =
        catToUse === 'all'
          ? 'Panitia_Panitera_Hakim'
          : catToUse === 'dewan_hakim'
          ? 'Dewan_Hakim_Juri'
          : catToUse === 'panitera'
          ? 'Panitera_Lomba'
          : 'Panitia_Pelaksana';
      const fullFileName = `Data_${catFileName}_FASI_XIII_DIY_${dateStr}.xlsx`;

      // Simpan sebagai file Excel (.xlsx) asli
      XLSX.writeFile(wb, fullFileName);
      showToast('success', `File Excel (${fullFileName}) berhasil diunduh!`);
    } catch (err: any) {
      console.error('Gagal export Excel panitia & juri:', err);
      showToast('error', 'Gagal membuat file Excel perangkat.');
    } finally {
      setIsExportingExcel(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER BANNER */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 rounded-2xl p-5 sm:p-6 text-white shadow-sm border border-emerald-700/50 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-emerald-950 uppercase tracking-wider">
              Khusus Super Admin
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-800 text-emerald-200">
              Perangkat FASI XIII
            </span>
            {isSupabaseConfigured() ? (
              <span className="flex items-center gap-1 text-[11px] text-emerald-300 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Tersinkron Cloud Supabase
              </span>
            ) : (
              <span className="text-[11px] text-amber-300 font-medium">
                Penyimpanan Lokal Aktif
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight mt-1.5 flex items-center gap-2">
            <Scale className="w-6 h-6 text-amber-400" />
            <span>Data Panitia, Panitera & Dewan Hakim</span>
          </h2>
        </div>

        {/* Action Header Buttons: Terorganisir rapi menjadi 2 kluster (Dokumen & Kelola Data) */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-start lg:justify-end">
          {/* Kluster Dokumen & Cetak: Cetak ID Card, Download Excel, Download Daftar Hadir */}
          <div className="flex items-center gap-1.5 p-1 bg-white/10 backdrop-blur-md rounded-xl border border-white/15">
            {/* 1. Tombol Cetak ID Card */}
            {onNavigateToIdCard && (
              <button
                type="button"
                onClick={() => onNavigateToIdCard(selectedCategory === 'all' ? 'panitia' : selectedCategory)}
                className="px-3 py-2 bg-emerald-800/90 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-2xs border border-emerald-600/40 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                title="Buka Studio Cetak ID Card untuk Panitia, Panitera & Dewan Hakim"
              >
                <Printer className="w-3.5 h-3.5 text-amber-300" />
                <span>Cetak ID Card</span>
              </button>
            )}

            {/* 2. Tombol Download Excel */}
            <button
              type="button"
              onClick={() => handleDownloadExcel()}
              disabled={isExportingExcel}
              className="px-3 py-2 bg-emerald-800/90 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-2xs border border-emerald-600/40 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer whitespace-nowrap disabled:opacity-60"
              title="Unduh Data Panitia, Panitera & Dewan Hakim format Microsoft Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-amber-300" />
              <span>{isExportingExcel ? 'Export...' : 'Download Excel'}</span>
            </button>

            {/* 3. Tombol Download Daftar Hadir (PDF) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowDownloadMenu(!showDownloadMenu);
                  setShowHonorMenu(false);
                }}
                disabled={isGeneratingPdf}
                className="px-3 py-2 bg-teal-800/90 hover:bg-teal-700 text-white font-bold text-xs rounded-lg shadow-2xs border border-teal-600/40 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer whitespace-nowrap disabled:opacity-60"
                title="Unduh Lembar Presensi / Daftar Hadir Resmi format PDF"
              >
                <Download className="w-3.5 h-3.5 text-teal-300" />
                <span>{isGeneratingPdf ? 'Membuat...' : 'Download Daftar Hadir'}</span>
                <ChevronDown className="w-3 h-3 opacity-80" />
              </button>

              {showDownloadMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 text-slate-800 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    Pilih Lembar Daftar Hadir
                  </div>
                  <button
                    onClick={() => handleDownloadPdf('dewan_hakim')}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-rose-950 hover:bg-rose-50 rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Scale className="w-4 h-4 text-rose-700 shrink-0" />
                    <span>Daftar Hadir Dewan Hakim & Juri</span>
                  </button>
                  <button
                    onClick={() => handleDownloadPdf('panitera')}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-teal-950 hover:bg-teal-50 rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <FileCheck className="w-4 h-4 text-teal-700 shrink-0" />
                    <span>Daftar Hadir Panitera Lomba</span>
                  </button>
                  <button
                    onClick={() => handleDownloadPdf('panitia')}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-emerald-950 hover:bg-emerald-50 rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>Daftar Hadir Panitia Pelaksana</span>
                  </button>
                  <div className="border-t border-slate-100 my-1"></div>
                  <button
                    onClick={() => handleDownloadPdf('all')}
                    className="w-full text-left px-3 py-2 text-xs font-bold text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-slate-700 shrink-0" />
                    <span>Unduh Semua Paket Lengkap (3 Lembar)</span>
                  </button>
                  <div className="border-t border-slate-100 my-1"></div>
                  <button
                    onClick={() => {
                      setShowDownloadMenu(false);
                      handleDownloadExcel(selectedCategory);
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-bold text-emerald-950 bg-emerald-50 hover:bg-emerald-100 rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>Download File Excel (.xlsx)</span>
                  </button>
                </div>
              )}
            </div>

            {/* 4. Tombol Download Penerimaan Honor (PDF F4 Landscape) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowHonorMenu(!showHonorMenu);
                  setShowDownloadMenu(false);
                }}
                disabled={isGeneratingHonorPdf}
                className="px-3 py-2 bg-amber-800/90 hover:bg-amber-700 text-white font-bold text-xs rounded-lg shadow-2xs border border-amber-600/40 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer whitespace-nowrap disabled:opacity-60"
                title="Unduh Lembar Bukti Penerimaan Honor Resmi F4 Landscape format PDF"
              >
                <Coins className="w-3.5 h-3.5 text-amber-300" />
                <span>{isGeneratingHonorPdf ? 'Membuat...' : 'Download Penerimaan Honor'}</span>
                <ChevronDown className="w-3 h-3 opacity-80" />
              </button>

              {showHonorMenu && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 text-slate-800 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-amber-800 uppercase tracking-wider border-b border-slate-100 flex items-center justify-between">
                    <span>Penerimaan Honor (F4 Landscape)</span>
                    <span className="bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded text-[9px] font-extrabold">Resmi</span>
                  </div>
                  <button
                    onClick={() => handleDownloadHonorPdf('dewan_hakim')}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-rose-950 hover:bg-rose-50 rounded-xl flex items-center justify-between transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2">
                      <Scale className="w-4 h-4 text-rose-700 shrink-0" />
                      <span>Dewan Yuri</span>
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 bg-rose-100 text-rose-900 rounded-md group-hover:bg-rose-200">
                      Rp 500.000
                    </span>
                  </button>
                  <button
                    onClick={() => handleDownloadHonorPdf('panitera')}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-teal-950 hover:bg-teal-50 rounded-xl flex items-center justify-between transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-teal-700 shrink-0" />
                      <span>Panitera Lomba</span>
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 bg-teal-100 text-teal-900 rounded-md group-hover:bg-teal-200">
                      Rp 100.000
                    </span>
                  </button>
                  <button
                    onClick={() => handleDownloadHonorPdf('panitia')}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-emerald-950 hover:bg-emerald-50 rounded-xl flex items-center justify-between transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>Panitia Pelaksana</span>
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 bg-emerald-100 text-emerald-900 rounded-md group-hover:bg-emerald-200">
                      Rp 100.000
                    </span>
                  </button>
                  <div className="border-t border-slate-100 my-1"></div>
                  <button
                    onClick={() => handleDownloadHonorPdf('all')}
                    className="w-full text-left px-3 py-2 text-xs font-bold text-amber-950 bg-amber-50 hover:bg-amber-100 rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>Unduh Semua Paket Honor (3 Lembar)</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Kluster Aksi Input Data: Import Cerdas & Tambah Personel */}
          <div className="flex items-center gap-2">
            {/* 4. Tombol Import Cerdas */}
            <button
              type="button"
              onClick={() => handleOpenSmartImport()}
              className="px-3.5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-xs border border-blue-400/40 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
              title="Import data banyak sekaligus via Copy-Paste dari MS Excel / MS Word atau Upload File .xlsx"
            >
              <ClipboardPaste className="w-4 h-4 text-cyan-200" />
              <span>Import Cerdas</span>
            </button>

            {/* 5. Tombol Tambah Personel */}
            <button
              type="button"
              onClick={() => handleOpenAdd()}
              className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-emerald-950 font-black text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ Tambah Personel</span>
            </button>

            {/* Tombol Kosongkan Semua Data (Ikon ringkas di ujung agar rapi) */}
            {committees.length > 0 && (
              <button
                type="button"
                onClick={handleClearAllCommittees}
                className="p-2.5 bg-rose-950/80 hover:bg-rose-900 text-rose-300 hover:text-white rounded-xl border border-rose-800/50 shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
                title="Kosongkan seluruh data personel perangkat dari penyimpanan lokal"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. STATISTIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Dewan Hakim */}
        <div
          onClick={() => setSelectedCategory('dewan_hakim')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            selectedCategory === 'dewan_hakim'
              ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-400 shadow-xs'
              : 'bg-white border-slate-200 hover:border-rose-300 hover:bg-rose-50/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Dewan Hakim / Juri
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-950">{stats.hakim}</span>
            <span className="text-xs text-rose-700 font-medium">Orang</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Penilai arena lomba FASI XIII</p>
        </div>

        {/* Panitera */}
        <div
          onClick={() => setSelectedCategory('panitera')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            selectedCategory === 'panitera'
              ? 'bg-teal-50 border-teal-400 ring-2 ring-teal-400 shadow-xs'
              : 'bg-white border-slate-200 hover:border-teal-300 hover:bg-teal-50/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Panitera Meja Lomba
            </span>
            <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-teal-950">{stats.panitera}</span>
            <span className="text-xs text-teal-700 font-medium">Orang</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Pencatat nilai & pemanggilan</p>
        </div>

        {/* Panitia Pelaksana */}
        <div
          onClick={() => setSelectedCategory('panitia')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            selectedCategory === 'panitia'
              ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-400 shadow-xs'
              : 'bg-white border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Panitia Pelaksana
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-950">{stats.panitia}</span>
            <span className="text-xs text-emerald-700 font-medium">Orang</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Seksi acara, registrasi, konsumsi</p>
        </div>

        {/* Total Personel */}
        <div
          onClick={() => setSelectedCategory('all')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            selectedCategory === 'all'
              ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400 shadow-xs'
              : 'bg-white border-slate-200 hover:border-amber-300 hover:bg-amber-50/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Total Keseluruhan
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-950">{stats.total}</span>
            <span className="text-xs text-amber-800 font-medium">Personel</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Semua perangkat resmi terdaftar</p>
        </div>
      </div>

      {/* 3. FILTER & SEARCH CONTROLS */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Subcategory Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-full sm:w-auto overflow-x-auto">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua ({stats.total})
            </button>
            <button
              onClick={() => setSelectedCategory('dewan_hakim')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                selectedCategory === 'dewan_hakim'
                  ? 'bg-rose-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-rose-900'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Dewan Hakim ({stats.hakim})</span>
            </button>
            <button
              onClick={() => setSelectedCategory('panitera')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                selectedCategory === 'panitera'
                  ? 'bg-teal-800 text-white shadow-xs'
                  : 'text-slate-600 hover:text-teal-900'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Panitera ({stats.panitera})</span>
            </button>
            <button
              onClick={() => setSelectedCategory('panitia')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                selectedCategory === 'panitia'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-slate-600 hover:text-emerald-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Panitia ({stats.panitia})</span>
            </button>
          </div>

          {/* Cloud Sync Button */}
          {isSupabaseConfigured() && (
            <button
              onClick={handleRefreshCloud}
              disabled={isRefreshing}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer self-end sm:self-auto disabled:opacity-50"
              title="Perbarui data langsung dari database Supabase"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
              <span>{isRefreshing ? 'Menyinkronkan...' : 'Sinkron Supabase'}</span>
            </button>
          )}
        </div>

        {/* Search & Access Level Dropdown */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1 border-t border-slate-100">
          <div className="sm:col-span-8 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama personel, penugasan cabang lomba, divisi, atau hak akses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="sm:col-span-4">
            <select
              value={selectedAccessLevel}
              onChange={(e) => setSelectedAccessLevel(e.target.value)}
              className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 font-medium cursor-pointer"
            >
              <option value="all">Semua Hak Akses Ruangan</option>
              {uniqueAccessLevels.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 4. DATA TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
              Daftar Perangkat Terdaftar ({filteredList.length})
            </h3>
            {searchQuery && (
              <span className="text-[11px] text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full font-medium">
                Pencarian: "{searchQuery}"
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Format Resmi FASI XIII BADKO TKA-TPA D.I. YOGYAKARTA
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 uppercase font-black tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4 w-32">Kategori Perangkat</th>
                <th className="py-3 px-4">Nama Lengkap & Gelar</th>
                <th className="py-3 px-4">Jabatan / Penugasan Cabang</th>
                <th className="py-3 px-4 w-44">
                  {selectedCategory === 'dewan_hakim'
                    ? 'Instansi'
                    : selectedCategory === 'all'
                    ? 'Hak Akses / Instansi'
                    : 'Hak Akses Ruang / Arena'}
                </th>
                <th className="py-3 px-4 w-28 text-center">Badge Kartu</th>
                <th className="py-3 px-4 w-28 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Scale className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="font-semibold text-xs">Tidak ada data personel yang cocok.</p>
                    <p className="text-[11px] mt-0.5">
                      Coba ganti kata kunci pencarian atau klik "+ Tambah Personel" di atas.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedList.map((item, index) => {
                  const cat = item.cardCategory || 'panitia';
                  const isHakim = cat === 'dewan_hakim';
                  const isPanitera = cat === 'panitera';
                  const itemNumber = (safeCurrentPage - 1) * pageSize + index + 1;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      <td className="py-3 px-4 text-center font-mono text-slate-400 font-bold">
                        {itemNumber}
                      </td>

                      {/* Kategori Badge */}
                      <td className="py-3 px-4">
                        {isHakim && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-900 border border-rose-300">
                            <Scale className="w-3 h-3 text-rose-700" />
                            <span>Dewan Hakim</span>
                          </span>
                        )}
                        {isPanitera && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-teal-100 text-teal-900 border border-teal-300">
                            <FileCheck className="w-3 h-3 text-teal-700" />
                            <span>Panitera</span>
                          </span>
                        )}
                        {!isHakim && !isPanitera && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                            <ShieldCheck className="w-3 h-3 text-emerald-700" />
                            <span>Panitia</span>
                          </span>
                        )}
                      </td>

                      {/* Nama Lengkap */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 text-xs">
                          {item.name || '(Nama belum diisi)'}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          ID: {item.id}
                        </div>
                      </td>

                      {/* Jabatan / Penugasan */}
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {item.division || '-'}
                      </td>

                      {/* Hak Akses Ruang */}
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {item.accessLevel || 'ALL ACCESS'}
                        </span>
                      </td>

                      {/* Badge Kartu */}
                      <td className="py-3 px-4 text-center">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-black tracking-wider uppercase bg-amber-100 text-amber-950 border border-amber-300">
                          {item.customBadge || (isHakim ? 'DEWAN HAKIM' : (isPanitera ? 'PANITERA' : 'PANITIA'))}
                        </span>
                      </td>

                      {/* Aksi */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Data Personel"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Hapus Personel"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION CONTROL BAR */}
        {filteredList.length > 0 && (
          <div className="p-4 bg-slate-50/90 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            {/* Kiri: Info Jumlah & Page Size Selector */}
            <div className="flex items-center gap-3 text-slate-600 flex-wrap">
              <span>
                Menampilkan{' '}
                <strong className="text-slate-900 font-mono">
                  {(safeCurrentPage - 1) * pageSize + 1}
                </strong>
                –
                <strong className="text-slate-900 font-mono">
                  {Math.min(safeCurrentPage * pageSize, filteredList.length)}
                </strong>{' '}
                dari{' '}
                <strong className="text-slate-900 font-mono">
                  {filteredList.length}
                </strong>{' '}
                Personel
              </span>

              <div className="flex items-center gap-1.5 pl-3 border-l border-slate-200">
                <span className="text-[11px] text-slate-500">Tampilkan:</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="py-1 px-2 text-xs bg-white border border-slate-300 rounded-lg font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-600 cursor-pointer"
                >
                  <option value={10}>10 / hal</option>
                  <option value={20}>20 / hal</option>
                  <option value={50}>50 / hal</option>
                  <option value={100}>100 / hal</option>
                </select>
              </div>
            </div>

            {/* Kanan: Navigasi Tombol Halaman */}
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                {/* First Page */}
                <button
                  type="button"
                  onClick={() => setCurrentPage(1)}
                  disabled={safeCurrentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 transition-colors"
                  title="Halaman Pertama"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>

                {/* Previous Page */}
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safeCurrentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 transition-colors"
                  title="Halaman Sebelumnya"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Page Number Buttons */}
                <div className="flex items-center gap-1 px-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => {
                      return (
                        p === 1 ||
                        p === totalPages ||
                        Math.abs(p - safeCurrentPage) <= 1
                      );
                    })
                    .reduce<(number | string)[]>((acc, p, idx, arr) => {
                      if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) {
                        acc.push('...');
                      }
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((item, idx) =>
                      item === '...' ? (
                        <span key={`dots-${idx}`} className="px-1 text-slate-400 font-mono">
                          ...
                        </span>
                      ) : (
                        <button
                          key={`page-${item}`}
                          type="button"
                          onClick={() => setCurrentPage(item as number)}
                          className={`w-7 h-7 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                            safeCurrentPage === item
                              ? 'bg-emerald-800 text-white shadow-2xs'
                              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {item}
                        </button>
                      )
                    )}
                </div>

                {/* Next Page */}
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safeCurrentPage === totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 transition-colors"
                  title="Halaman Berikutnya"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                {/* Last Page */}
                <button
                  type="button"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={safeCurrentPage === totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 transition-colors"
                  title="Halaman Terakhir"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 5. MODAL FORM TAMBAH / EDIT PERSONEL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-emerald-900 to-emerald-950 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">
                  {editingItem ? 'Edit Data Perangkat Lomba' : 'Tambah Perangkat FASI XIII Baru'}
                </h3>
                <p className="text-[11px] text-emerald-200">
                  Data otomatis terhubung dengan kartu identitas dan daftar hadir resmi.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveForm} className="p-6 space-y-4">
              {/* Kategori Perangkat */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Kategori Perangkat <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleFormCategoryChange('dewan_hakim')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      formCategory === 'dewan_hakim'
                        ? 'bg-rose-900 text-white border-rose-900 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Scale className="w-4 h-4" />
                    <span>Dewan Hakim</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleFormCategoryChange('panitera')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      formCategory === 'panitera'
                        ? 'bg-teal-800 text-white border-teal-800 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <FileCheck className="w-4 h-4" />
                    <span>Panitera</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleFormCategoryChange('panitia')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      formCategory === 'panitia'
                        ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Panitia</span>
                  </button>
                </div>
              </div>

              {/* Nama Lengkap & Gelar */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nama Lengkap & Gelar <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: K.H. Ahmad Syukri, M.S.I / Dra. Hj. Siti Aminah"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent font-medium"
                />
              </div>

              {/* Jabatan / Penugasan Cabang */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Jabatan / Penugasan Cabang Lomba <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    formCategory === 'dewan_hakim'
                      ? 'Contoh: Cabang Tilawah (TKA, TPA, TQA) / Bidang Tajwid'
                      : formCategory === 'panitera'
                      ? 'Contoh: Panitera Arena Tilawah / Panitera CCQ TPA'
                      : 'Contoh: Koordinator Sie Acara & Lomba / Sie Konsumsi'
                  }
                  value={formDivision}
                  onChange={(e) => setFormDivision(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent font-medium"
                />
              </div>

              {/* Hak Akses Ruangan / Instansi */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {formCategory === 'dewan_hakim' ? 'Instansi / Asal Lembaga' : 'Hak Akses Ruangan / Arena'}
                </label>
                <input
                  type="text"
                  placeholder={
                    formCategory === 'dewan_hakim'
                      ? 'Contoh: UIN Sunan Kalijaga / Kemenag DIY / LPTQ DIY / Ponpes Al-Munawwir'
                      : 'Contoh: RUANG HAKIM & JURI / ARENA LOMBA / ALL ACCESS'
                  }
                  value={formAccessLevel}
                  onChange={(e) => setFormAccessLevel(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent font-medium"
                />
                <div className="flex gap-1.5 mt-1.5 flex-wrap">
                  {formCategory === 'dewan_hakim' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setFormAccessLevel('UIN Sunan Kalijaga')}
                        className="text-[10px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 font-mono cursor-pointer"
                      >
                        UIN Sunan Kalijaga
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormAccessLevel('Kemenag DIY')}
                        className="text-[10px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 font-mono cursor-pointer"
                      >
                        Kemenag DIY
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormAccessLevel('LPTQ DIY')}
                        className="text-[10px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 font-mono cursor-pointer"
                      >
                        LPTQ DIY
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setFormAccessLevel('RUANG HAKIM & JURI')}
                        className="text-[10px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 font-mono cursor-pointer"
                      >
                        RUANG HAKIM & JURI
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormAccessLevel('ARENA LOMBA & MEJA PANITERA')}
                        className="text-[10px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 font-mono cursor-pointer"
                      >
                        ARENA LOMBA & MEJA PANITERA
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormAccessLevel('ALL ACCESS')}
                        className="text-[10px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 font-mono cursor-pointer"
                      >
                        ALL ACCESS
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Badge Kartu */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Teks Badge ID Card
                </label>
                <input
                  type="text"
                  placeholder="Contoh: DEWAN HAKIM / PANITERA / PANITIA"
                  value={formCustomBadge}
                  onChange={(e) => setFormCustomBadge(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent font-medium uppercase font-mono"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition-all cursor-pointer active:scale-95"
                >
                  {editingItem ? 'Simpan Perubahan' : 'Tambahkan Perangkat'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL IMPORT CERDAS (EXCEL / WORD / FILE .XLSX)                     */}
      {/* ==================================================================== */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/65 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-950 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-500/20 border border-blue-400/30 rounded-xl shadow-xs">
                  <ClipboardPaste className="w-5 h-5 text-cyan-300" />
                </div>
                <div>
                  <h3 className="font-bold text-sm flex items-center gap-2">
                    <span>Import Cerdas Perangkat FASI XIII</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-cyan-400/20 text-cyan-300 rounded-full border border-cyan-400/30 font-mono">
                      MS Excel & Word
                    </span>
                  </h3>
                  <p className="text-[11px] text-blue-200 mt-0.5">
                    Sekali klik langsung tersimpan ke Supabase Cloud tanpa duplikasi data.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Scrollable */}
            <div className="p-5 overflow-y-auto space-y-4 text-slate-800 text-xs">
              {/* 1. Target Kategori Sasaran */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  1. Pilih Kategori Perangkat Sasaran <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleImportCategoryChange('dewan_hakim')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      importCategory === 'dewan_hakim'
                        ? 'bg-rose-900 text-white border-rose-900 shadow-xs ring-2 ring-rose-400/50'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Scale className="w-4 h-4" />
                    <span>Dewan Hakim / Juri</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleImportCategoryChange('panitera')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      importCategory === 'panitera'
                        ? 'bg-teal-800 text-white border-teal-800 shadow-xs ring-2 ring-teal-400/50'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <FileCheck className="w-4 h-4" />
                    <span>Panitera Lomba</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleImportCategoryChange('panitia')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      importCategory === 'panitia'
                        ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs ring-2 ring-emerald-400/50'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Panitia Pelaksana</span>
                  </button>
                </div>
              </div>

              {/* 2. Textarea Paste & Upload File */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <span>2. Tempelkan (Paste) Teks dari Excel / Word</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  {/* File Upload Trigger */}
                  <label className="text-[11px] font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 cursor-pointer bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg border border-blue-200 transition-colors">
                    <FileUp className="w-3.5 h-3.5" />
                    <span>Upload File .xlsx / .csv</span>
                    <input
                      type="file"
                      accept=".xlsx, .xls, .csv"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="relative">
                  <textarea
                    rows={6}
                    value={importRawText}
                    onChange={(e) => setImportRawText(e.target.value)}
                    placeholder={
                      importCategory === 'dewan_hakim'
                        ? `Format 3 Kolom dari MS Excel / Google Sheets (Nama, Cabang Lomba, Instansi):\nM. Anwar\tTartil Al Qur’an ( Putra Putri )\tPP Al Munawwir\nK.H. Ahmad Syukri, M.S.I\tTilawah TQA\tUIN Sunan Kalijaga\nDra. Hj. Siti Aminah, M.Pd\tTahfidz Juz 1\tKemenag DIY\n\nAtau format teks berpemisah strip/spasi dari Word:\nM. Anwar - Tartil Al Qur’an ( Putra Putri ) - PP Al Munawwir\nK.H. Ahmad Syukri, M.S.I : Tilawah TQA : UIN Sunan Kalijaga`
                        : `Format Copy-Paste dari MS Excel / Google Sheets (Kolom Nama & Bagian):\nMuhammad Fikri, S.Pd\tSeksi Acara & Lomba\nSiti Rahmawati, S.E.\tSeksi Konsumsi\nUst. Muhammad Zidan, S.Pd\tPanitera CCQ TPA\n\nAtau format teks biasa berpemisah strip/titik dua dari MS Word:\n1. Muhammad Fikri, S.Pd - Seksi Acara & Lomba\n2. Siti Rahmawati, S.E. : Seksi Konsumsi`
                    }
                    className="w-full p-3 font-mono text-[11px] bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent leading-relaxed"
                  />
                  {importRawText && (
                    <button
                      type="button"
                      onClick={() => setImportRawText('')}
                      className="absolute top-2 right-2 px-2 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-[10px] font-bold"
                    >
                      Bersihkan
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>
                    {importCategory === 'dewan_hakim'
                      ? 'Mendukung format 3 kolom (Nama, Cabang Lomba, Instansi) baik dari tabel Excel maupun format teks berpemisah.'
                      : 'Sistem otomatis membersihkan nomor urut (1., 2.), tanda baca, dan mengabaikan baris header tabel.'}
                  </span>
                </p>
              </div>

              {/* 3. Pencegahan Duplikasi Data */}
              <div className="p-3 bg-amber-50/80 border border-amber-200/90 rounded-xl flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="avoid-duplicates-toggle"
                  checked={avoidDuplicates}
                  onChange={(e) => setAvoidDuplicates(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
                <label htmlFor="avoid-duplicates-toggle" className="text-[11px] text-amber-950 cursor-pointer select-none">
                  <span className="font-bold block">
                    Cegah Duplikasi Data Otomatis (Sangat Direkomendasikan)
                  </span>
                  <span className="text-amber-800">
                    Jika nama personel sudah pernah terdaftar pada kategori yang sama di Supabase, sistem akan memperbarui penugasan / divisinya tanpa membuat baris ganda (double data).
                  </span>
                </label>
              </div>

              {/* 4. Live Pratinjau Interaktif Hasil Parsing */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      3. Pratinjau Data Terdeteksi
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                        parsedImportRows.length > 0
                          ? 'bg-blue-100 text-blue-900 border border-blue-300'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {parsedImportRows.length} Personel
                    </span>
                  </div>

                  {parsedImportRows.length > 0 && (
                    <div className="flex items-center gap-2 text-[10px] font-bold">
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {parsedImportRows.filter((r) => !r.isExisting).length} Baru
                      </span>
                      {parsedImportRows.some((r) => r.isExisting) && (
                        <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          {parsedImportRows.filter((r) => r.isExisting).length} Perbarui
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {parsedImportRows.length === 0 ? (
                  <div className="p-6 border-2 border-dashed border-slate-200 rounded-xl text-center text-slate-400 bg-slate-50/50">
                    <FileSpreadsheet className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-medium text-xs">Belum ada data yang terdeteksi.</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Silakan copy daftar tabel dari Excel atau Word lalu tempelkan (Ctrl+V) di kotak atas.
                    </p>
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead className="bg-slate-100/90 text-slate-700 font-bold sticky top-0 border-b border-slate-200">
                        <tr>
                          <th className="py-1.5 px-3 w-10 text-center">No</th>
                          <th className="py-1.5 px-3">Nama Lengkap & Gelar</th>
                          <th className="py-1.5 px-3">
                            {importCategory === 'dewan_hakim' ? 'Cabang Lomba' : 'Bagian / Penugasan'}
                          </th>
                          {importCategory === 'dewan_hakim' && (
                            <th className="py-1.5 px-3">Instansi</th>
                          )}
                          <th className="py-1.5 px-3 w-24 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {parsedImportRows.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/80">
                            <td className="py-1 px-3 text-center text-slate-400 font-mono text-[10px]">
                              {idx + 1}
                            </td>
                            <td className="py-1 px-3 font-bold text-slate-900">
                              {row.name}
                            </td>
                            <td className="py-1 px-3 text-slate-600">
                              {row.division}
                            </td>
                            {importCategory === 'dewan_hakim' && (
                              <td className="py-1 px-3 text-slate-600 font-medium">
                                {row.institution || '-'}
                              </td>
                            )}
                            <td className="py-1 px-3 text-center">
                              {row.isExisting ? (
                                <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-300 whitespace-nowrap">
                                  {avoidDuplicates ? 'Perbarui' : 'Duplikat'}
                                </span>
                              ) : (
                                <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 whitespace-nowrap">
                                  Baru
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-slate-500 font-medium">
                {parsedImportRows.length > 0
                  ? `Siap menyimpan ${parsedImportRows.length} data personel ke Supabase.`
                  : 'Tempelkan data untuk mengaktifkan tombol simpan.'}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  disabled={isSubmittingImport}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                >
                  Batal
                </button>

                <button
                  type="button"
                  onClick={handleExecuteImport}
                  disabled={parsedImportRows.length === 0 || isSubmittingImport}
                  className="px-5 py-2.5 text-xs font-bold bg-blue-700 hover:bg-blue-600 text-white rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmittingImport ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-cyan-200" />
                      <span>Menyimpan ke Supabase...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-cyan-300" />
                      <span>Simpan Semua ({parsedImportRows.length} Data) Langsung ke Supabase</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
