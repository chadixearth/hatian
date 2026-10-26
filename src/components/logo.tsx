export function HatianLogo({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <rect width="32" height="32" rx="8" fill="#0F766E" />
      <path
        d="M7 15.5C7 10.8056 10.8056 7 15.5 7H22.5L7 22.5V15.5Z"
        fill="#FAF8F5"
      />
      <path
        d="M25 16.5C25 21.1944 21.1944 25 16.5 25H9.5L25 9.5V16.5Z"
        fill="#99F6E4"
      />
    </svg>
  );
}
