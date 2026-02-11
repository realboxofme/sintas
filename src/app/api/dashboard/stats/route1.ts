import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Ambil statistik dashboard
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const month = parseInt(searchParams.get('month') || new Date().getMonth() + 1)
    const year = parseInt(searchParams.get('year') || new Date().getFullYear())

    // Jalankan semua query dasar secara paralel dengan Promise.all
    // Ini mengurangi total koneksi dari 22+ query menjadi 1 batch connection
    const [
      totalSuratMasuk,
      totalSuratKeluar,
      totalDisposisiPending,
      totalArsip,
      totalUsers,
      suratMasukByStatus,
      suratKeluarByStatus,
      suratMasukBySifat,
      suratKeluarBySifat,
    ] = await Promise.all([
      // Hitung total surat masuk
      db.suratMasuk.count(),
      // Hitung total surat keluar
      db.suratKeluar.count(),
      // Hitung total disposisi pending
      db.disposisi.count({
        where: { status: 'Pending' },
      }),
      // Hitung total arsip aktif
      db.arsip.count({
        where: { statusArsip: 'Aktif' },
      }),
      // Hitung total users aktif
      db.user.count({
        where: { isActive: true },
      }),
      // Hitung surat masuk by status
      db.suratMasuk.groupBy({
        by: ['status'],
        _count: true,
      }),
      // Hitung surat keluar by status
      db.suratKeluar.groupBy({
        by: ['status'],
        _count: true,
      }),
      // Hitung surat masuk by sifat
      db.suratMasuk.groupBy({
        by: ['sifatSurat'],
        _count: true,
      }),
      // Hitung surat keluar by sifat
      db.suratKeluar.groupBy({
        by: ['sifatSurat'],
        _count: true,
      }),
    ])

    // Hitung surat masuk dan keluar bulan ini secara paralel
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0)

    const [suratMasukBulanIni, suratKeluarBulanIni] = await Promise.all([
      db.suratMasuk.count({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),
      db.suratKeluar.count({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),
    ])

    // Data untuk chart bulanan (6 bulan terakhir)
    const monthlyData = []
    for (let i = 5; i >= 0; i--) {
      const chartDate = new Date(year, month - 1 - i, 1)
      const chartMonth = chartDate.getMonth() + 1
      const chartYear = chartDate.getFullYear()
      
      const chartStartDate = new Date(chartYear, chartMonth - 1, 1)
      const chartEndDate = new Date(chartYear, chartMonth, 0)

      const [masukCount, keluarCount] = await Promise.all([
        db.suratMasuk.count({
          where: {
            createdAt: {
              gte: chartStartDate,
              lte: chartEndDate,
            },
          },
        }),
        db.suratKeluar.count({
          where: {
            createdAt: {
              gte: chartStartDate,
              lte: chartEndDate,
            },
          },
        }),
      ])

      monthlyData.push({
        month: chartMonth,
        year: chartYear,
        monthName: chartDate.toLocaleString('id-ID', { month: 'long' }),
        suratMasuk: masukCount,
        suratKeluar: keluarCount,
      })
    }

    // Ambil aktivitas terbaru
    // TODO: Fix Prisma client caching issue with LogAktivitas
    const recentActivities = []
    // const recentActivities = await db.logAktivitas.findMany({
    //   take: 10,
    //   orderBy: { createdAt: 'desc' },
    //   include: {
    //     user: {
    //       select: {
    //         nama: true,
    //       },
    //     },
    //   },
    // })

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalSuratMasuk,
          totalSuratKeluar,
          totalDisposisiPending,
          totalArsip,
          totalUsers,
          suratMasukBulanIni,
          suratKeluarBulanIni,
        },
        byStatus: {
          suratMasuk: suratMasukByStatus,
          suratKeluar: suratKeluarByStatus,
        },
        bySifat: {
          suratMasuk: suratMasukBySifat,
          suratKeluar: suratKeluarBySifat,
        },
        monthlyChart: monthlyData,
        recentActivities,
      },
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data statistik' },
      { status: 500 }
    )
  }
}
