'use client';

import dynamic from 'next/dynamic';

const WallCalendar = dynamic(
  () => import('@/components/Calendar/WallCalendar'),
  { ssr: false }
);

export default function Home() {
  return <WallCalendar />;
}
