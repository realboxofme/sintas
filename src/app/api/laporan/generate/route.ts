import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Generate laporan
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const jenisLaporan = searchParams.get('jenis') || 'semua'
    const tanggalMulai = searchParams.get('tanggalMulai')
    const tanggalSelesai = searchParams.get('tanggalSelesai')

    // Parse dates
    const startDate = tanggalMulai ? new Date(tanggalMulai) : undefined
    const endDate = tanggalSelesai ? new Date(tanggalSelesai) : undefined

    // Build date filter
    const dateFilter: any = {}
    if (startDate && endDate) {
      dateFilter.createdAt = {
        gte: startDate,
        lte: endDate,
      }
    } else if (startDate) {
      dateFilter.createdAt = {
        gte: startDate,
      }
    } else if (endDate) {
      dateFilter.createdAt = {
        lte: endDate,
      }
    }

    let reportData: any = {}

    switch (jenisLaporan) {
      case 'surat-masuk':
        reportData = await generateSuratMasukReport(dateFilter)
        break
      case 'surat-keluar':
        reportData = await generateSuratKeluarReport(dateFilter)
        break
      case 'disposisi':
        reportData = await generateDisposisiReport(dateFilter)
        break
      case 'arsip':
        reportData = await generateArsipReport(dateFilter)
        break
      case 'bulanan':
        reportData = await generateBulananReport(startDate, endDate)
        break
      case 'tahunan':
        reportData = await generateTahunanReport(startDate)
        break
      default:
        // Generate semua laporan
        const [masuk, keluar, disposisi, arsip] = await Promise.all([
          generateSuratMasukReport(dateFilter),
          generateSuratKeluarReport(dateFilter),
          generateDisposisiReport(dateFilter),
          generateArsipReport(dateFilter),
        ])
        reportData = {
          suratMasuk: masuk,
          suratKeluar: keluar,
          disposisi,
          arsip,
        }
    }

    return NextResponse.json({
      success: true,
      data: reportData,
      meta: {
        jenisLaporan,
        tanggalMulai: startDate?.toISOString(),
        tanggalSelesai: endDate?.toISOString(),
        generatedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('Error generating report:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal generate laporan' },
      { status: 500 }
    )
  }
}

// Helper functions
async function generateSuratMasukReport(dateFilter: any) {
  const [data, total, byStatus, bySifat] = await Promise.all([
    db.suratMasuk.findMany({
      where: dateFilter,
      include: {
        penerima: {
          select: {
            nama: true,
            jabatan: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    db.suratMasuk.count({ where: dateFilter }),
    db.suratMasuk.groupBy({
      by: ['status'],
      where: dateFilter,
      _count: true,
    }),
    db.suratMasuk.groupBy({
      by: ['sifatSurat'],
      where: dateFilter,
      _count: true,
    }),
  ])

  return {
    total,
    data,
    summary: {
      byStatus,
      bySifat,
    },
  }
}

async function generateSuratKeluarReport(dateFilter: any) {
  const [data, total, byStatus, bySifat] = await Promise.all([
    db.suratKeluar.findMany({
      where: dateFilter,
      include: {
        pengirim: {
          select: {
            nama: true,
            jabatan: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    db.suratKeluar.count({ where: dateFilter }),
    db.suratKeluar.groupBy({
      by: ['status'],
      where: dateFilter,
      _count: true,
    }),
    db.suratKeluar.groupBy({
      by: ['sifatSurat'],
      where: dateFilter,
      _count: true,
    }),
  ])

  return {
    total,
    data,
    summary: {
      byStatus,
      bySifat,
    },
  }
}

async function generateDisposisiReport(dateFilter: any) {
  const [data, total, byStatus] = await Promise.all([
    db.disposisi.findMany({
      where: dateFilter,
      include: {
        suratMasuk: {
          select: {
            nomorSurat: true,
            perihal: true,
            pengirim: true,
          },
        },
        dari: {
          select: {
            nama: true,
            jabatan: true,
          },
        },
        ke: {
          select: {
            nama: true,
            jabatan: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    db.disposisi.count({ where: dateFilter }),
    db.disposisi.groupBy({
      by: ['status'],
      where: dateFilter,
      _count: true,
    }),
  ])

  return {
    total,
    data,
    summary: {
      byStatus,
    },
  }
}

async function generateArsipReport(dateFilter: any) {
  const [data, total, byKategori, byStatusArsip, byJenisSurat] = await Promise.all([
    db.arsip.findMany({
      where: dateFilter,
      include: {
        suratMasuk: {
          select: {
            nomorSurat: true,
            perihal: true,
          },
        },
        suratKeluar: {
          select: {
            nomorSurat: true,
            perihal: true,
          },
        },
        diarsipkanOleh: {
          select: {
            nama: true,
            jabatan: true,
          },
        },
      },
      orderBy: { tanggalArsip: 'desc' },
    }),
    db.arsip.count({ where: dateFilter }),
    db.arsip.groupBy({
      by: ['kategori'],
      where: dateFilter,
      _count: true,
    }),
    db.arsip.groupBy({
      by: ['statusArsip'],
      where: dateFilter,
      _count: true,
    }),
    db.arsip.groupBy({
      by: ['jenisSurat'],
      where: dateFilter,
      _count: true,
    }),
  ])

  return {
    total,
    data,
    summary: {
      byKategori,
      byStatusArsip,
      byJenisSurat,
    },
  }
}

async function generateBulananReport(startDate?: Date, endDate?: Date) {
  const year = startDate?.getFullYear() || new Date().getFullYear()
  const month = startDate?.getMonth() + 1 || new Date().getMonth() + 1

  const reportStartDate = new Date(year, month - 1, 1)
  const reportEndDate = endDate || new Date(year, month, 0)

  const dateFilter = {
    createdAt: {
      gte: reportStartDate,
      lte: reportEndDate,
    },
  }

  const [suratMasuk, suratKeluar, disposisi, arsip, users] = await Promise.all([
    generateSuratMasukReport(dateFilter),
    generateSuratKeluarReport(dateFilter),
    generateDisposisiReport(dateFilter),
    generateArsipReport(dateFilter),
    db.user.count({ where: { isActive: true } }),
  ])

  return {
    periode: {
      bulan: month,
      tahun: year,
      namaBulan: reportStartDate.toLocaleString('id-ID', { month: 'long' }),
    },
    ringkasan: {
      totalSuratMasuk: suratMasuk.total,
      totalSuratKeluar: suratKeluar.total,
      totalDisposisi: disposisi.total,
      totalArsip: arsip.total,
      totalUsersAktif: users,
    },
    detail: {
      suratMasuk,
      suratKeluar,
      disposisi,
      arsip,
    },
  }
}

async function generateTahunanReport(startDate?: Date) {
  const year = startDate?.getFullYear() || new Date().getFullYear()

  const reportStartDate = new Date(year, 0, 1)
  const reportEndDate = new Date(year, 11, 31)

  const dateFilter = {
    createdAt: {
      gte: reportStartDate,
      lte: reportEndDate,
    },
  }

  // Data per bulan
  const monthlyData = []
  for (let i = 0; i < 12; i++) {
    const monthStartDate = new Date(year, i, 1)
    const monthEndDate = new Date(year, i + 1, 0)

    const [masukCount, keluarCount, disposisiCount] = await Promise.all([
      db.suratMasuk.count({
        where: {
          createdAt: {
            gte: monthStartDate,
            lte: monthEndDate,
          },
        },
      }),
      db.suratKeluar.count({
        where: {
          createdAt: {
            gte: monthStartDate,
            lte: monthEndDate,
          },
        },
      }),
      db.disposisi.count({
        where: {
          createdAt: {
            gte: monthStartDate,
            lte: monthEndDate,
          },
        },
      }),
    ])

    monthlyData.push({
      bulan: i + 1,
      namaBulan: monthStartDate.toLocaleString('id-ID', { month: 'long' }),
      suratMasuk: masukCount,
      suratKeluar: keluarCount,
      disposisi: disposisiCount,
    })
  }

  const [suratMasuk, suratKeluar, disposisi, arsip] = await Promise.all([
    generateSuratMasukReport(dateFilter),
    generateSuratKeluarReport(dateFilter),
    generateDisposisiReport(dateFilter),
    generateArsipReport(dateFilter),
  ])

  return {
    periode: {
      tahun: year,
    },
    ringkasan: {
      totalSuratMasuk: suratMasuk.total,
      totalSuratKeluar: suratKeluar.total,
      totalDisposisi: disposisi.total,
      totalArsip: arsip.total,
    },
    dataPerBulan: monthlyData,
    detail: {
      suratMasuk,
      suratKeluar,
      disposisi,
      arsip,
    },
  }
}
