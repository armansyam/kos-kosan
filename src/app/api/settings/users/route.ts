import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// 1. GET: Fetch all staff accounts (only allowed for super_admin)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (session.user as any).role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized. Hanya Owner yang bisa mengelola staff.' }, { status: 401 });
    }

    const staffUsers = await prisma.user.findMany({
      where: { role: 'admin' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(staffUsers);
  } catch (error) {
    console.error('Staff GET error:', error);
    return NextResponse.json({ error: 'Gagal mengambil data staff' }, { status: 500 });
  }
}

// 2. POST: Manage staff accounts (create, update, delete)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (session.user as any).role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, id, email, password, name } = body;

    // A. ACTION: DELETE
    if (action === 'delete') {
      if (!id) return NextResponse.json({ error: 'ID staff tidak valid' }, { status: 400 });
      
      // Ensure the target is actually an admin (cannot delete super_admin)
      const targetUser = await prisma.user.findUnique({ where: { id } });
      if (!targetUser || targetUser.role === 'super_admin') {
        return NextResponse.json({ error: 'Tidak dapat menghapus user ini' }, { status: 400 });
      }

      await prisma.user.delete({ where: { id } });
      return NextResponse.json({ success: true, message: 'Akun staff berhasil dihapus' });
    }

    // B. ACTION: CREATE
    if (action === 'create') {
      if (!email || !password || !name) {
        return NextResponse.json({ error: 'Email, password, dan nama harus diisi' }, { status: 400 });
      }

      // Check if email already exists
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return NextResponse.json({ error: 'Email / Username sudah terdaftar' }, { status: 400 });
      }

      const hashedPassword = await hash(password, 12);
      const newStaff = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role: 'admin'
        }
      });

      return NextResponse.json({
        success: true,
        user: {
          id: newStaff.id,
          email: newStaff.email,
          name: newStaff.name
        }
      });
    }

    // C. ACTION: UPDATE (Reset password / edit)
    if (action === 'update') {
      if (!id) return NextResponse.json({ error: 'ID staff tidak valid' }, { status: 400 });
      
      const targetUser = await prisma.user.findUnique({ where: { id } });
      if (!targetUser || targetUser.role === 'super_admin') {
        return NextResponse.json({ error: 'Tidak dapat mengedit user ini' }, { status: 400 });
      }

      const updateData: any = {};
      if (email) {
        if (email !== targetUser.email) {
          const existing = await prisma.user.findUnique({ where: { email } });
          if (existing) return NextResponse.json({ error: 'Email sudah terdaftar' }, { status: 400 });
        }
        updateData.email = email;
      }
      if (name) updateData.name = name;
      if (password) {
        updateData.password = await hash(password, 12);
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: updateData
      });

      return NextResponse.json({
        success: true,
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name
        }
      });
    }

    return NextResponse.json({ error: 'Action tidak valid' }, { status: 400 });
  } catch (error) {
    console.error('Staff POST error:', error);
    return NextResponse.json({ error: 'Gagal memproses data staff' }, { status: 500 });
  }
}
