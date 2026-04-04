import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from '@axis/db';
import { redirect } from 'next/navigation';
import type { User } from '@axis/db';

/**
 * Returns the AXIS User for the currently authenticated Clerk session.
 * Redirects to /sign-in if not authenticated.
 * Auto-creates the user in DB on first access (no forced onboarding redirect).
 */
export async function getAxisUser(): Promise<User> {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    redirect('/sign-in');
  }

  const existing = await prisma.user.findUnique({ where: { clerkId } });
  if (existing) return existing;

  // First access after Clerk sign-up — auto-create user in DB
  const clerkUser = await currentUser();
  const email = clerkUser?.emailAddresses[0]?.emailAddress ?? `${clerkId}@clerk.temp`;
  const name = clerkUser?.fullName ?? clerkUser?.firstName ?? null;
  const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  try {
    const user = await prisma.user.create({
      data: {
        clerkId,
        email,
        name,
        trialEndsAt,
        subscription: { create: { status: 'TRIAL' } },
      },
    });
    return user;
  } catch (e: unknown) {
    // Email already exists (e.g. user recreated Clerk account) — update clerkId to current one
    const code = (e as { code?: string })?.code;
    if (code === 'P2002') {
      const user = await prisma.user.update({
        where: { email },
        data: { clerkId },
      });
      return user;
    }
    throw e;
  }
}
