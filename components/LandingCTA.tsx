"use client";

import Image from "next/image";
import Link from "next/link";

export default function LandingCTA() {
  return (
    <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
      <Link
        href="/auth/sign-up"
        className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[200px]"
      >
        Get started free
      </Link>
      <Link
        href="/auth/sign-in"
        className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[160px]"
      >
        Sign in
      </Link>
    </div>
  );
}
