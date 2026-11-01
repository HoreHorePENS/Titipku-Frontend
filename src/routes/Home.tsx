import { Link, useNavigate } from 'react-router-dom'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/Button'
import { SalesChart } from '@/components/shared/SalesChart'

// ============================================================================
// DATA MOCKUP RESMI (Keripik Pisang Rina - Surabaya - Oktober 2026)
// ============================================================================

interface PriorityWarung {
  id: string
  name: string
  area: string
  reason: string
  type: 'habis' | 'basi' | 'utang'
}

const PRIORITY_WARUNG: PriorityWarung[] = [
  {
    id: 'w-smpn3',
    name: 'Kantin SMPN 3',
    area: 'Gubeng',
    reason: 'Stok diperkirakan habis Kamis',
    type: 'habis',
  },
  {
    id: 'w-barokah',
    name: 'Toko Oleh-oleh Barokah',
    area: 'Wonokromo',
    reason: '12 bungkus basi dalam 3 hari',
    type: 'basi',
  },
  {
    id: 'w-darto',
    name: 'Warung Pak Darto',
    area: 'Rungkut',
    reason: 'Belum bayar 21 hari',
    type: 'utang',
  },
]

interface PartnerRank {
  rank: number
  id: string
  name: string
  area: string
  sold: number
  returnRate: string
  isReturnHigh?: boolean
  debt: string
  lastVisit: string
  status: 'BAGUS' | 'PANTAU' | 'EVALUASI'
  note: string
}

const PARTNER_RANKS: PartnerRank[] = [
  {
    rank: 1,
    id: 'p-1',
    name: 'Toko Oleh-oleh Barokah',
    area: 'Wonokromo',
    sold: 342,
    returnRate: '5,1%',
    debt: '312.000',
    lastVisit: '22 Okt 2026',
    status: 'BAGUS',
    note: 'Penjualan tertinggi, bayar tiap 2 minggu',
  },
  {
    rank: 2,
    id: 'p-2',
    name: 'Kantin SMPN 3',
    area: 'Gubeng',
    sold: 298,
    returnRate: '3,4%',
    debt: '96.500',
    lastVisit: '21 Okt 2026',
    status: 'BAGUS',
    note: 'Cepat habis di jam istirahat',
  },
  {
    rank: 3,
    id: 'p-3',
    name: 'Warung Bu Sri',
    area: 'Rungkut',
    sold: 166,
    returnRate: '2,7%',
    debt: '183.000',
    lastVisit: '27 Okt 2026',
    status: 'BAGUS',
    note: 'Laku cepat, jarang retur, bayar tepat waktu',
  },
  {
    rank: 4,
    id: 'p-4',
    name: 'Koperasi Kantor Pos',
    area: 'Genteng',
    sold: 164,
    returnRate: '7,9%',
    debt: '74.000',
    lastVisit: '23 Okt 2026',
    status: 'PANTAU',
    note: 'Cokelat tidak laku 2 kunjungan',
  },
  {
    rank: 5,
    id: 'p-5',
    name: 'Warung Bu Hartini',
    area: 'Tenggilis',
    sold: 121,
    returnRate: '6,2%',
    debt: '61.500',
    lastVisit: '24 Okt 2026',
    status: 'PANTAU',
    note: 'Sering bayar sebagian',
  },
  {
    rank: 6,
    id: 'p-6',
    name: 'Kios Pasar Pucang',
    area: 'Gubeng',
    sold: 109,
    returnRate: '8,4%',
    debt: '84.500',
    lastVisit: '19 Okt 2026',
    status: 'PANTAU',
    note: 'Retur naik 2 kunjungan terakhir',
  },
  {
    rank: 7,
    id: 'p-7',
    name: 'Toko Maju Jaya',
    area: 'Tenggilis',
    sold: 96,
    returnRate: '9,8%',
    isReturnHigh: true,
    debt: '142.000',
    lastVisit: '10 Okt 2026',
    status: 'EVALUASI',
    note: 'Belum bayar 18 hari',
  },
  {
    rank: 8,
    id: 'p-8',
    name: 'Warung Pak Darto',
    area: 'Rungkut',
    sold: 88,
    returnRate: '7,3%',
    debt: '168.500',
    lastVisit: '7 Okt 2026',
    status: 'EVALUASI',
    note: 'Belum bayar 21 hari',
  },
  {
    rank: 9,
    id: 'p-9',
    name: 'Warung Mbak Yuli',
    area: 'Sidoarjo',
    sold: 74,
    returnRate: '18,2%',
    isReturnHigh: true,
    debt: '118.000',
    lastVisit: '12 Okt 2026',
    status: 'EVALUASI',
    note: 'Retur 18%, belum bayar 16 hari',
  },
]



// ============================================================================
// KOMPONEN UTAMA BERANDA
// ============================================================================

export default function HomeRoute() {
  const navigate = useNavigate()

  const handleStartVisit = (warungId?: string) => {
    if (warungId) {
      navigate(`/kunjungan/baru?warung_id=${warungId}`)
    } else {
      navigate('/kunjungan/baru')
    }
  }

  return (
    <div className="px-4 py-5 md:px-8 md:py-8 max-w-7xl mx-auto flex flex-col gap-6 font-sans">
      {/* --------------------------------------------------------------------
          1. HEADER ATAS (Salam Pengguna & Tanggal Hari Ini)
          -------------------------------------------------------------------- */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-ink tracking-tight">
            Selamat pagi, Bu Rina
          </h1>
          <p className="text-caption md:text-body text-ink-soft mt-0.5">
            Rabu, 28 Okt 2026
          </p>
        </div>

        {/* Tombol Catat Kunjungan (Hanya tampil di Desktop kanan atas) */}
        <div className="hidden md:block">
          <Button
            variant="primary"
            size="md"
            onClick={() => handleStartVisit()}
            className="rounded-lg px-5 shadow-xs flex items-center gap-2 font-semibold"
          >
            <span className="text-lg leading-none">+</span>
            <span>Catat Kunjungan</span>
          </Button>
        </div>
      </div>

      {/* ====================================================================
          2. TAMPILAN MOBILE (Persis Gambar Mockup HP)
          ==================================================================== */}
      <div className="flex flex-col gap-5 md:hidden">
        {/* Kartu: Kunjungi Hari Ini (Prioritas 3 Warung di HP) */}
        <div className="bg-surface rounded-2xl border-2 border-primary/90 p-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-line">
            <h2 className="text-base font-bold text-ink">Kunjungi hari ini</h2>
            <span className="text-xs font-medium text-ink-soft">3 warung</span>
          </div>

          <div className="divide-y divide-line">
            {PRIORITY_WARUNG.map((warung) => (
              <div key={warung.id} className="py-3.5 first:pt-3 last:pb-1 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-ink leading-snug truncate">
                    {warung.name} <span className="font-normal text-ink-soft">· {warung.area}</span>
                  </p>
                  <p
                    className={`text-xs mt-1 flex items-center gap-1.5 font-medium ${
                      warung.type === 'utang' ? 'text-danger' : 'text-accent'
                    }`}
                  >
                    <span className="text-[10px] leading-none">●</span>
                    <span className="truncate">{warung.reason}</span>
                  </p>
                </div>

                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => handleStartVisit(warung.id)}
                  className="rounded-lg h-9 px-4 text-xs font-bold shrink-0"
                >
                  Mulai
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Tombol Aksi Utama Catat Kunjungan (Mobile Full Width) */}
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={() => handleStartVisit()}
          className="rounded-xl h-[52px] text-base font-bold shadow-xs flex items-center justify-center gap-2"
        >
          <span className="text-xl leading-none">+</span>
          <span>Catat Kunjungan</span>
        </Button>

        {/* Garis Pembatas Lembut */}
        <hr className="border-line my-1" />

        {/* Metrik Kunci Terbesar: Uang Masih di Warung */}
        <div className="pt-1">
          <span className="text-caption font-medium text-ink-soft">Uang masih di warung</span>
          <div className="text-[34px] font-extrabold text-ink tabular-nums tracking-tight my-1">
            Rp1.240.000
          </div>
          <p className="text-caption text-ink-soft">
            di 9 warung ·{' '}
            <Link to="/tagihan" className="text-primary font-bold hover:underline">
              Lihat tagihan
            </Link>
          </p>
        </div>

        {/* Kartu Ringkasan Penjualan Bulan Ini (Mobile) */}
        <div className="bg-surface rounded-2xl border border-line divide-y divide-line shadow-2xs mt-1">
          <div className="p-4 flex items-center justify-between">
            <div>
              <p className="text-caption font-medium text-ink">Penjualan Oktober</p>
              <p className="text-xs text-success font-semibold mt-0.5">+12% dari 1–27 Sep</p>
            </div>
            <span className="text-lg font-extrabold text-ink tabular-nums">Rp6.850.000</span>
          </div>

          <div className="p-4 flex items-center justify-between">
            <p className="text-caption font-medium text-ink">Bungkus terjual</p>
            <span className="text-lg font-extrabold text-ink tabular-nums">2.140</span>
          </div>

          <div className="p-4 flex items-center justify-between">
            <p className="text-caption font-medium text-ink">Retur</p>
            <span className="text-lg font-extrabold text-ink tabular-nums">6,8%</span>
          </div>
        </div>
      </div>

      {/* ====================================================================
          3. TAMPILAN DESKTOP / LAPTOP (Persis Gambar Mockup Laptop)
          ==================================================================== */}
      <div className="hidden md:flex md:flex-col md:gap-6">
        {/* Baris 1: Grid Atas (Uang Masih di Warung + Kunjungi Hari Ini) */}
        <div className="grid grid-cols-12 gap-6 items-stretch">
          {/* Kartu Uang Masih di Warung & 3 Metrik Utama (8 kolom) */}
          <div className="col-span-8 bg-surface rounded-2xl border border-line p-6 flex flex-col justify-between shadow-2xs">
            <div>
              <span className="text-caption font-medium text-ink-soft">Uang masih di warung</span>
              <div className="text-4xl font-extrabold text-ink tabular-nums tracking-tight mt-1 mb-2">
                Rp1.240.000
              </div>
              <p className="text-caption text-ink-soft">
                di 9 warung ·{' '}
                <span className="text-danger font-semibold">3 belum bayar lebih dari 14 hari</span> ·{' '}
                <Link to="/tagihan" className="text-primary font-bold hover:underline">
                  Buka Tagihan
                </Link>
              </p>
            </div>

            <div className="pt-6 mt-6 border-t border-line grid grid-cols-3 gap-6">
              <div>
                <p className="text-caption text-ink-soft">Penjualan Oktober</p>
                <p className="text-xl font-extrabold text-ink tabular-nums mt-1">Rp6.850.000</p>
                <p className="text-xs text-success font-semibold mt-1">+12% dari 1–27 Sep</p>
              </div>

              <div className="border-l border-line pl-6">
                <p className="text-caption text-ink-soft">Bungkus terjual</p>
                <p className="text-xl font-extrabold text-ink tabular-nums mt-1">2.140</p>
                <p className="text-xs text-ink-soft mt-1">di 15 warung</p>
              </div>

              <div className="border-l border-line pl-6">
                <p className="text-caption text-ink-soft">Retur</p>
                <p className="text-xl font-extrabold text-ink tabular-nums mt-1">6,8%</p>
                <p className="text-xs text-ink-soft mt-1">157 bungkus basi</p>
              </div>
            </div>
          </div>

          {/* Kartu Kunjungi Hari Ini (4 kolom) */}
          <div className="col-span-4 bg-surface rounded-2xl border border-line p-5 flex flex-col justify-between shadow-2xs">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-line">
                <h2 className="text-base font-bold text-ink">Kunjungi hari ini</h2>
                <span className="text-xs text-ink-soft">3 warung</span>
              </div>

              <div className="divide-y divide-line">
                {PRIORITY_WARUNG.map((warung) => (
                  <div key={warung.id} className="py-3.5 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-ink leading-tight truncate">
                        {warung.name} <span className="font-normal text-ink-soft">· {warung.area}</span>
                      </p>
                      <p
                        className={`text-xs mt-1 flex items-center gap-1.5 font-medium ${
                          warung.type === 'utang' ? 'text-danger' : 'text-accent'
                        }`}
                      >
                        <span className="text-[10px] leading-none">●</span>
                        <span className="truncate">{warung.reason}</span>
                      </p>
                    </div>

                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => handleStartVisit(warung.id)}
                      className="rounded-lg h-8 px-3 text-xs font-bold shrink-0"
                    >
                      Mulai
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Baris 2: Grid Tengah (Grafik Penjualan 30 Hari + Perlu Perhatian) */}
        <div className="grid grid-cols-12 gap-6 items-stretch">
          {/* Grafik Penjualan 30 Hari (8 kolom) */}
          <div className="col-span-8 bg-surface rounded-2xl border border-line p-5 shadow-2xs flex flex-col justify-between overflow-hidden">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-ink">Penjualan 30 hari</h2>
              <span className="text-xs text-ink-soft font-normal">
                per hari, harga titip · Minggu tidak ada kunjungan
              </span>
            </div>

            <SalesChart />
          </div>

          {/* Kotak Perlu Perhatian (4 kolom) */}
          <div className="col-span-4 bg-surface rounded-2xl border border-line p-5 shadow-2xs flex flex-col">
            <h2 className="text-base font-bold text-ink mb-3">Perlu perhatian</h2>

            <div className="divide-y divide-line flex-1 flex flex-col justify-around">
              <div className="py-2.5 flex items-start gap-2.5">
                <span className="text-danger text-sm leading-none mt-1">●</span>
                <div>
                  <p className="text-caption font-bold text-ink">Toko Maju Jaya</p>
                  <p className="text-xs text-ink-soft mt-0.5">Belum bayar 18 hari · Rp142.000</p>
                </div>
              </div>

              <div className="py-2.5 flex items-start gap-2.5">
                <span className="text-danger text-sm leading-none mt-1">●</span>
                <div>
                  <p className="text-caption font-bold text-ink">Warung Mbak Yuli</p>
                  <p className="text-xs text-ink-soft mt-0.5">Retur 18,2% bulan ini, hampir 3x rata-rata</p>
                </div>
              </div>

              <div className="py-2.5 flex items-start gap-2.5">
                <span className="text-danger text-sm leading-none mt-1">●</span>
                <div>
                  <p className="text-caption font-bold text-ink">Koperasi Kantor Pos</p>
                  <p className="text-xs text-ink-soft mt-0.5">Keripik Pisang Cokelat tidak laku 2 kunjungan</p>
                </div>
              </div>

              <div className="py-2.5 flex items-start gap-2.5">
                <span className="text-danger text-sm leading-none mt-1">●</span>
                <div>
                  <p className="text-caption font-bold text-ink">Keripik Tempe</p>
                  <p className="text-xs text-ink-soft mt-0.5">14 bungkus basi sebelum 4 Nov di 3 warung</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Baris 3: Tabel Peringkat Warung · Oktober (Persis Bawah Mockup Desktop) */}
        <div className="bg-surface rounded-2xl border border-line p-6 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-ink">Peringkat warung · Oktober</h2>
            <Link to="/warung" className="text-caption font-semibold text-primary hover:underline">
              Lihat 15 warung
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-caption font-sans border-collapse">
              <thead>
                <tr className="border-b border-line text-[11px] font-bold text-ink-soft tracking-wider">
                  <th className="py-2.5 px-3 w-8">#</th>
                  <th className="py-2.5 px-3">WARUNG</th>
                  <th className="py-2.5 px-3 text-right">TERJUAL</th>
                  <th className="py-2.5 px-3 text-right">RETUR</th>
                  <th className="py-2.5 px-3 text-right">UTANG</th>
                  <th className="py-2.5 px-3">KUNJUNGAN TERAKHIR</th>
                  <th className="py-2.5 px-3">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {PARTNER_RANKS.map((warung) => (
                  <tr key={warung.id} className="hover:bg-surface-raised transition-colors">
                    <td className="py-3 px-3 text-ink-soft font-medium tabular-nums">{warung.rank}</td>
                    <td className="py-3 px-3 font-bold text-ink">
                      {warung.name}{' '}
                      <span className="font-normal text-ink-soft">· {warung.area}</span>
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums font-medium text-ink">
                      {warung.sold}
                    </td>
                    <td
                      className={`py-3 px-3 text-right tabular-nums font-medium ${
                        warung.isReturnHigh ? 'text-danger font-bold' : 'text-ink'
                      }`}
                    >
                      {warung.returnRate}
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums font-medium text-ink">
                      {warung.debt}
                    </td>
                    <td className="py-3 px-3 tabular-nums text-ink">{warung.lastVisit}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        <StatusBadge status={warung.status} />
                        <span className="text-xs text-ink-soft truncate max-w-xs">{warung.note}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
