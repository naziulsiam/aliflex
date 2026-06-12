'use client';

interface SkeletonRowProps {
  cardCount?: number;
}

function SkeletonCard() {
  return (
    <div className="flex-shrink-0 w-[152px] sm:w-[168px]">
      <div className="rounded-xl overflow-hidden bg-surface border border-border/50">
        <div className="w-full aspect-video shimmer-bg" />
        <div className="px-2.5 py-2 space-y-1.5">
          <div className="h-3 w-4/5 rounded shimmer-bg" />
          <div className="h-2.5 w-2/5 rounded shimmer-bg" />
        </div>
      </div>
    </div>
  );
}

export default function SkeletonRow({ cardCount = 8 }: SkeletonRowProps) {
  return (
    <section className="mb-6 sm:mb-8">
      {/* Title shimmer */}
      <div className="flex items-center mb-3 px-4 sm:px-6">
        <div className="h-5 w-32 rounded shimmer-bg" />
      </div>

      {/* Cards shimmer */}
      <div className="flex gap-3 overflow-hidden px-4 sm:px-6 pb-2">
        {Array.from({ length: cardCount }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </section>
  );
}
