import { MyGroupsSkeleton } from "@/app/groups/page";

export default function MyGroupsLoading() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-8 sm:px-6 sm:py-10">
      <MyGroupsSkeleton />
    </main>
  );
}
