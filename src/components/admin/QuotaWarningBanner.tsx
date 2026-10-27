/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sistem Informasi FASI XIII D.I. Yogyakarta
 * Komponen Notifikasi Peringatan Kuota Berlebih & Panduan Resolusi Data Santri
 */

import React, { useState } from 'react';
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  BookOpen,
  ArrowRight,
  X,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Trash2,
  RefreshCw,
  Hash,
} from 'lucide-react';
import { Participant, UserSession, Kemantren, CompetitionCategory } from '../../types/fasi';

export interface QuotaViolation {
  kemantrenId: string;
  kemantrenName: string;
  categoryId: string;
  categoryName: string;
  categoryLevel: string;
  isGroup: boolean;
  participantCount: number;
  maxQuota: number;
  excessCount: number;
  reason: string;
  participants: Participant[];
}

interface QuotaWarningBannerProps {
  session: UserSession;
  participants: Participant[];
  kemantrenList: Kemantren[];
  categoriesList: CompetitionCategory[];
  onInspectViolation?: (violation: QuotaViolation) => void;
}

export const QuotaWarningBanner: React.FC<QuotaWarningBannerProps> = ({
  session,
  participants,
  kemantrenList,
  categoriesList,
  onInspectViolation,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);
  const [selectedViolationForGuide, setSelectedViolationForGuide] = useState<QuotaViolation | null>(null);

  const isSuperAdmin = session.role === 'super_admin';

  // Hitung pelanggaran kuota secara real-time
  const violations: QuotaViolation[] = React.useMemo(() => {
    const list: QuotaViolation[] = [];

    // Tentukan daftar kemantren/kabupaten yang diperiksa:
    // Superadmin: periksa semua 5 Kabupaten/Kota
    // Admin Kab: hanya periksa daerahnya sendiri
    const targetKemantrens = isSuperAdmin
      ? kemantrenList
      : kemantrenList.filter((k) => k.id === session.kemantrenId);

    targetKemantrens.forEach((kem) => {
      categoriesList.forEach((cat) => {
        const inCatKem = participants.filter((p) => {
          const matchKem =
            p.kemantrenId === kem.id ||
            p.kemantrenId === kem.code ||
            (p.kemantrenId && p.kemantrenId.toLowerCase() === kem.name.toLowerCase());
          const matchCat = p.categoryId === cat.id || p.categoryId === cat.code;
          return matchKem && matchCat;
        });

        if (cat.isGroup) {
          // Cabang Beregu: Maksimal 3 grup per daerah, masing-masing grup maks 3 orang
          // Deteksi grup unik
          const groupMap = new Map<string, Participant[]>();
          inCatKem.forEach((p) => {
            let groupKey = 'Regu 1';
            if (p.tpaUnitName && p.tpaUnitName.includes(' - ')) {
              groupKey = p.tpaUnitName.split(' - ')[1].trim();
            }
            if (!groupMap.has(groupKey)) {
              groupMap.set(groupKey, []);
            }
            groupMap.get(groupKey)!.push(p);
          });

          const groupCount = groupMap.size;
          const maxAllowedGroups = 3;
          const maxPerGroup = cat.groupMemberCount || 3;

          let groupOverCapacity = false;
          let overCapacityReason = '';
          groupMap.forEach((members, gName) => {
            if (members.length > maxPerGroup) {
              groupOverCapacity = true;
              overCapacityReason = `${gName} berisi ${members.length} santri (maks. ${maxPerGroup} santri)`;
            }
          });

          if (groupCount > maxAllowedGroups || groupOverCapacity || inCatKem.length > (maxAllowedGroups * maxPerGroup)) {
            const reason = groupCount > maxAllowedGroups
              ? `Terdapat ${groupCount} grup terdaftar (maksimal ${maxAllowedGroups} grup)`
              : overCapacityReason || `Total ${inCatKem.length} santri beregu melebihi kapasitas kuota`;

            list.push({
              kemantrenId: kem.id,
              kemantrenName: kem.name,
              categoryId: cat.id,
              categoryName: cat.name,
              categoryLevel: cat.level,
              isGroup: true,
              participantCount: inCatKem.length,
              maxQuota: maxAllowedGroups * maxPerGroup,
              excessCount: Math.max(1, inCatKem.length - (maxAllowedGroups * maxPerGroup)),
              reason,
              participants: inCatKem,
            });
          }
        } else {
          // Cabang Individu: Maksimal 3 peserta per cabang untuk tiap Kabupaten/Kota
          const maxAllowed = 3;
          if (inCatKem.length > maxAllowed) {
            list.push({
              kemantrenId: kem.id,
              kemantrenName: kem.name,
              categoryId: cat.id,
              categoryName: cat.name,
              categoryLevel: cat.level,
              isGroup: false,
              participantCount: inCatKem.length,
              maxQuota: maxAllowed,
              excessCount: inCatKem.length - maxAllowed,
              reason: `Terdaftar ${inCatKem.length} peserta (melebihi batas maksimal ${maxAllowed} peserta individu)`,
              participants: inCatKem,
            });
          }
        }
      });
    });

    return list;
  }, [participants, kemantrenList, categoriesList, isSuperAdmin, session.kemantrenId]);

  // Jika tidak ada pelanggaran kuota, banner tidak perlu ditampilkan
  if (violations.length === 0) {
    return null;
  }

  const totalExcess = violations.reduce((acc, v) => acc + v.excessCount, 0);

  return (
    <>
      <div className="bg-gradient-to-r from-amber-50 via-rose-50 to-amber-50 border-2 border-rose-300 rounded-2xl p-4 sm:p-5 shadow-sm text-slate-800 transition-all mb-4 animate-in fade-in slide-in-from-top-2">
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5 sm:mt-0">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white">
                  Peringatan Kuota Berlebih
                </span>
                <span className="text-xs font-bold text-rose-800 font-mono">
                  {violations.length} Cabang Melebihi Kuota ({totalExcess} Santri Berlebih)
                </span>
              </div>
              <h4 className="text-sm sm:text-base font-black text-slate-900 mt-0.5">
                {isSuperAdmin
                  ? 'Ditemukan Kuota Santri Melebihi Batas Resmi FASI XIII'
                  : `Peringatan Kuota Kontingen ${violations[0]?.kemantrenName || ''}`}
              </h4>
              <p className="text-xs text-slate-600 mt-0.5">
                Sesuai ketentuan, setiap cabang lomba individu maksimal <strong>3 peserta</strong> dan beregu maksimal <strong>3 grup</strong> per Kabupaten/Kota.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <button
              onClick={() => {
                setSelectedViolationForGuide(violations[0] || null);
                setShowGuideModal(true);
              }}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-emerald-900 font-bold text-xs rounded-xl border border-slate-300 shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Lihat petunjuk langkah untuk menyelesaikan kelebihan kuota"
            >
              <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
              <span>Panduan Solusi</span>
            </button>

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 hover:bg-rose-100 text-slate-600 hover:text-slate-900 rounded-lg transition-colors cursor-pointer"
              title={isExpanded ? 'Sembunyikan Rincian' : 'Tampilkan Rincian'}
            >
              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Accordion / Daftar Rincian Pelanggaran Kuota */}
        {isExpanded && (
          <div className="mt-4 pt-3 border-t border-rose-200/80 space-y-2.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Daftar Cabang Lomba yang Mengalami Over-Quota:
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {violations.map((v, idx) => (
                <div
                  key={`${v.kemantrenId}-${v.categoryId}-${idx}`}
                  className="bg-white rounded-xl p-3 border border-rose-200 shadow-xs flex flex-col justify-between gap-2.5 hover:border-rose-400 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-800 font-mono text-[10px] font-bold rounded">
                        Tingkat {v.categoryLevel}
                      </span>
                      <span className="px-2 py-0.5 bg-rose-100 text-rose-800 font-bold text-[10px] rounded-full">
                        {v.participantCount} / {v.maxQuota} Santri (+{v.excessCount})
                      </span>
                    </div>

                    <h5 className="font-extrabold text-xs text-slate-900 leading-snug">
                      {v.categoryName}
                    </h5>

                    <p className="text-[11px] font-semibold text-emerald-900 mt-0.5">
                      Kontingen: <span className="font-black text-rose-700">{v.kemantrenName}</span>
                    </p>

                    <p className="text-[11px] text-rose-600 mt-0.5 italic">
                      ⚠️ {v.reason}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setSelectedViolationForGuide(v);
                        setShowGuideModal(true);
                      }}
                      className="text-[11px] font-bold text-slate-600 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
                      <span>Cara Atasi?</span>
                    </button>

                    {onInspectViolation && (
                      <button
                        onClick={() => onInspectViolation(v)}
                        className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] rounded-lg shadow-xs flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                      >
                        <span>Buka & Koreksi Peserta</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal Panduan / Tutorial Langkah Penyelesaian Kuota */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden my-6">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-900 to-emerald-950 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base">Panduan Penyelesaian Kuota Berlebih</h3>
                  <p className="text-xs text-emerald-300">Langkah Resmi & Penyelarasan No. Registrasi</p>
                </div>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="p-1 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs text-slate-700 leading-relaxed">
              {selectedViolationForGuide && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
                  <span className="text-[10px] font-black uppercase text-rose-800 tracking-wider block">
                    Cabang Yang Bermasalah Saat Ini:
                  </span>
                  <p className="font-bold text-sm text-slate-900 mt-0.5">
                    [{selectedViolationForGuide.categoryLevel}] {selectedViolationForGuide.categoryName}
                  </p>
                  <p className="text-slate-600 font-semibold mt-0.5">
                    Kontingen: <strong>{selectedViolationForGuide.kemantrenName}</strong> (Terdaftar {selectedViolationForGuide.participantCount} orang, kuota maksimal {selectedViolationForGuide.maxQuota} orang).
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <span>Pilih Solusi Berdasarkan Penyebabnya:</span>
                </h4>

                {/* Skenario 1 */}
                <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/70 space-y-2">
                  <div className="flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      1
                    </div>
                    <div>
                      <h5 className="font-bold text-slate-900 text-xs">
                        Jika Santri Keliru Memilih Cabang Lomba (Seharusnya Cabang Lain)
                      </h5>
                      <p className="text-slate-600 mt-1">
                        <strong>Langkah yang Tepat:</strong> Jangan hanya ganti nama lewat edit biasa jika kodenya tidak otomatis berubah. Lebih baik <strong>HAPUS</strong> data santri dari cabang yang salah ini, kemudian daftarkan kembali ke cabang yang benar via tombol <em>&quot;+ Daftarkan Santri&quot;</em>.
                      </p>
                      <div className="mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 text-[11px] flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                        <span>Sistem otomatis menerbitkan Nomor Registrasi baru yang valid dan seragam sesuai cabang barunya.</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Skenario 2 */}
                <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/70 space-y-2">
                  <div className="flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-lg bg-rose-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      2
                    </div>
                    <div>
                      <h5 className="font-bold text-slate-900 text-xs">
                        Jika Santri Cadangan / Tidak Jadi Ikut (Hanya Berangkat 3 Orang)
                      </h5>
                      <p className="text-slate-600 mt-1">
                        <strong>Langkah yang Tepat:</strong> Klik tombol <strong>Hapus (ikon tempat sampah)</strong> pada data santri yang batal atau yang merupakan cadangan.
                      </p>
                      <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-950 text-[11px] space-y-1">
                        <div className="font-bold flex items-center gap-1.5">
                          <Hash className="w-3.5 h-3.5 text-amber-700" />
                          <span>Penyelarasan Nomor Registrasi:</span>
                        </div>
                        <ul className="list-disc pl-4 space-y-0.5 text-slate-700">
                          <li>Jika yang dihapus adalah santri nomor urut paling belakang (nomor <strong>04</strong>), maka santri tersisa otomatis rapi menjadi <strong>01, 02, 03</strong> tanpa perlu ubah apapun.</li>
                          <li>Jika yang dihapus santri nomor urut tengah (misal nomor <strong>02</strong> yang batal), maka nomor yang tersisa adalah <strong>01, 03, 04</strong>. Cukup edit santri nomor <strong>04</strong> dan perbarui nomor registrasinya menjadi <strong>02</strong> agar nomor tetap kompak dan urut.</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Hubungi Panitia Pusat jika membutuhkan asistensi database.
              </span>
              <div className="flex items-center gap-2">
                {selectedViolationForGuide && onInspectViolation && (
                  <button
                    onClick={() => {
                      setShowGuideModal(false);
                      onInspectViolation(selectedViolationForGuide);
                    }}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                  >
                    <span>Buka Data Peserta Cabang Ini</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => setShowGuideModal(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
