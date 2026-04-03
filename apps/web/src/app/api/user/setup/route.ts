import { auth, currentUser } from '@clerk/nextjs/server';
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

  // Get Clerk user info
  const clerkUser = await currentUser();
  const email = clerkUser?.emailAddresses[0]?.emailAddress ?? `${clerkId}@clerk.temp`;
  const name = clerkUser?.fullName ?? clerkUser?.firstName ?? null;

  const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  // Upsert: link clerkId to existing phone user, or create new
  const user = await prisma.user.upsert({
    where: { phone },
    update: {
      clerkId,
      email,
      ...(name ? { name } : {}),
    },
    create: {
      clerkId,
      email,
      phone,
      name,
      trialEndsAt,
      subscription: { create: { status: 'TRIAL' } },
    },
  });

  return NextResponse.json({ success: true, userId: user.id });
}
