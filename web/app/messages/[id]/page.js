'use client';

import { useParams } from 'next/navigation';
import AppShell from '@/components/AppShell';
import Inbox from '@/components/Inbox';

export default function Page() {
  const { id } = useParams();
  return (
    <AppShell>
      <Inbox partnerId={Number(id)} />
    </AppShell>
  );
}
