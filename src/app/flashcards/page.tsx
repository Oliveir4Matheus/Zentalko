import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/server/session';
import { FlashcardsClient } from './flashcards-client';

export default async function FlashcardsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  return <FlashcardsClient />;
}
