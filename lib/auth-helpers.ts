import { auth } from "./auth";
import { headers } from "next/headers";
import { cache } from "react";
import type { User } from './abac';

export const getCurrentUser = cache(async (): Promise<User | null> => {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return null;
    }

    return {
      id: session.user.id,
      email: session.user.email,
      role: (session.user as any).role || 'user',
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
});

export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error('Unauthorized');
  }
  
  return user;
}