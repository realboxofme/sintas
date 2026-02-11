import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST - Initialize default roles
export async function POST() {
  try {
    // Check if roles already exist
    const existingRoles = await db.role.count()
    
    if (existingRoles > 0) {
      return NextResponse.json({
        success: true,
        message: 'Roles already initialized',
        data: { initialized: true }
      })
    }

    // Create default roles
    const roles = [
      {
        nama: 'Admin',
        deskripsi: 'Akses penuh ke semua fitur',
        permissions: JSON.stringify([
          'dashboard:read',
          'surat-masuk:read', 'surat-masuk:create', 'surat-masuk:update', 'surat-masuk:delete',
          'surat-keluar:read', 'surat-keluar:create', 'surat-keluar:update', 'surat-keluar:delete',
          'disposisi:read', 'disposisi:create', 'disposisi:update', 'disposisi:delete',
          'arsip:read', 'arsip:create', 'arsip:update', 'arsip:delete',
          'laporan:read', 'laporan:generate',
          'users:read', 'users:create', 'users:update', 'users:delete',
          'roles:read', 'roles:create', 'roles:update', 'roles:delete',
        ])
      },
      {
        nama: 'Kepala Dinas',
        deskripsi: 'Akses untuk persetujuan dan laporan',
        permissions: JSON.stringify([
          'dashboard:read',
          'surat-masuk:read',
          'surat-keluar:read', 'surat-keluar:create', 'surat-keluar:update',
          'disposisi:read', 'disposisi:create', 'disposisi:update',
          'arsip:read',
          'laporan:read', 'laporan:generate',
          'users:read',
        ])
      },
      {
        nama: 'Sekretaris',
        deskripsi: 'Akses untuk disposisi dan koordinasi',
        permissions: JSON.stringify([
          'dashboard:read',
          'surat-masuk:read', 'surat-masuk:create', 'surat-masuk:update',
          'surat-keluar:read', 'surat-keluar:create', 'surat-keluar:update',
          'disposisi:read', 'disposisi:create', 'disposisi:update',
          'arsip:read', 'arsip:create',
          'laporan:read', 'laporan:generate',
          'users:read',
        ])
      },
      {
        nama: 'Staff',
        deskripsi: 'Akses terbatas untuk operasional',
        permissions: JSON.stringify([
          'dashboard:read',
          'surat-masuk:read',
          'surat-keluar:read', 'surat-keluar:create',
          'arsip:read',
          'laporan:read',
        ])
      },
    ]

    const createdRoles = await Promise.all(
      roles.map(role => db.role.create({ data: role }))
    )

    // Create a default admin user
    const adminRole = createdRoles.find(r => r.nama === 'Admin')
    if (adminRole) {
      await db.user.create({
        data: {
          email: 'admin@sintas.com',
          password: 'admin123', // In production, this should be hashed
          nama: 'Administrator',
          nip: 'ADMIN001',
          jabatan: 'Administrator',
          roleId: adminRole.id,
          isActive: true,
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Default roles and admin user created successfully',
      data: {
        roles: createdRoles.length,
        user: adminRole ? 1 : 0
      }
    })
  } catch (error) {
    console.error('Error initializing data:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to initialize data' },
      { status: 500 }
    )
  }
}

// GET - Check initialization status
export async function GET() {
  try {
    const rolesCount = await db.role.count()
    const usersCount = await db.user.count()

    return NextResponse.json({
      success: true,
      data: {
        initialized: rolesCount > 0 && usersCount > 0,
        rolesCount,
        usersCount,
      }
    })
  } catch (error) {
    console.error('Error checking initialization:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to check initialization status' },
      { status: 500 }
    )
  }
}
