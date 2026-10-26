// Initial-letter avatar with a stable color per member. Pass the member's index in
// group.members so the same person keeps the same color on every screen.

const PALETTE = [
  "bg-teal-100 text-teal-800 dark:bg-teal-900/70 dark:text-teal-100",
  "bg-amber-100 text-amber-800 dark:bg-amber-900/70 dark:text-amber-100",
  "bg-sky-100 text-sky-800 dark:bg-sky-900/70 dark:text-sky-100",
  "bg-rose-100 text-rose-800 dark:bg-rose-900/70 dark:text-rose-100",
  "bg-lime-100 text-lime-800 dark:bg-lime-900/70 dark:text-lime-100",
  "bg-violet-100 text-violet-800 dark:bg-violet-900/70 dark:text-violet-100",
  "bg-orange-100 text-orange-800 dark:bg-orange-900/70 dark:text-orange-100",
  "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/70 dark:text-cyan-100",
] as const;

const SIZES = {
  xs: "size-5 text-[10px]",
  sm: "size-7 text-xs",
  md: "size-9 text-sm",
  lg: "size-11 text-base",
} as const;

export function MemberAvatar({
  name,
  index,
  size = "sm",
  className = "",
}: {
  name: string;
  /** Position of the member in group.members (any non-negative integer). */
  index: number;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const initial = Array.from(name.trim())[0]?.toUpperCase() ?? "?";
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold ${SIZES[size]} ${PALETTE[index % PALETTE.length]} ${className}`}
    >
      {initial}
    </span>
  );
}
