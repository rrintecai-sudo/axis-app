import { auth } from '@clerk/nextjs/server';
import { prisma } from '@axis/db';
import { redirect } from 'next/navigation';
import type { User } from '@axis/db';

/**
 * Returns the AXIS User for the currently authenticated Clerk session.
 * Redirects to /sign-in if not authenticated, or to /onboarding if the
 * user hasn't completed web registration (no clerkId in DB yet).
 */
export async function getAxisUser(): Promise<User> {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    redirect('/sign-in');
  }

  const user = await prisma.user.findUnique({ where: { clerkId } });

  if (!user) {
    redirect('/onboarding');
  }

  return user;
}
