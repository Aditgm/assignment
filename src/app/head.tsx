import { MONTH_THEMES } from '@/data/monthThemes';

export default function Head() {
  const now = new Date();
  const month = now.getMonth();
  const adjacentIndexes = [
    (month + 11) % 12,
    month,
    (month + 1) % 12,
  ];

  const prefetchImages = adjacentIndexes
    .map((index) => MONTH_THEMES[index]?.image)
    .filter((src): src is string => Boolean(src));

  return (
    <>
      {prefetchImages.map((src) => (
        <link key={src} rel="prefetch" as="image" href={src} />
      ))}
    </>
  );
}