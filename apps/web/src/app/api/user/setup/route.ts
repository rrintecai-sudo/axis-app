import { auth } from '@clerk/nextjs/server';
import { prisma } from '@axis/db';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const body = await req.json() as { phone?: string };
  const phone = body.phone?.replace(/\D/g, '');

  if (!phone || phone.length < 10) {
    return NextResponse.json({ error: 'Número inválido' }, { status: 400 });
  }

  // Check if phone is already taken by another user
  const existingByPhone = await prisma.user.findUnique({ where: { phone } });
  if (existingByPhone && existingByPhone.clerkId !== clerkId) {
    return NextResponse.json(
      { error: 'Ese número ya está registrado con otra cuenta.' },
      { status: 409 },
    );
  }

  // Update the existing user (auto-created by getAxisUser on first dashboard visit)
  const user = await prisma.user.update({
    where: { clerkId },
    data: { phone },
  });

  return NextResponse.json({ success: true, userId: user.id });
}
