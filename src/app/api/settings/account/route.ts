import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { email, password, name } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email / Username harus diisi' }, { status: 400 });
    }

    // Find current user using session info
    const currentUser = await prisma.user.findFirst({
      where: {
        OR: [
          { id: (session.user as any).id },
          { email: session.user.email || '' }
        ]
      }
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    // Check if new email is already taken by someone else
    if (email !== currentUser.email) {
      const existing = await prisma.user.findUnique({
        where: { email }
      });
      if (existing) {
        return NextResponse.json({ error: 'Email / Username sudah digunakan oleh akun lain' }, { status: 400 });
      }
    }

    const updateData: any = {
      email,
      name: name || currentUser.name
    };

    if (password) {
      updateData.password = await hash(password, 12);
    }

    const updatedUser = await prisma.user.update({
      where: { id: currentUser.id },
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
  } catch (error) {
    console.error('Account settings POST error:', error);
    return NextResponse.json({ error: 'Gagal memperbarui akun' }, { status: 500 });
  }
}
