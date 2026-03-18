import Image from "next/image";
import dynamic from "next/dynamic";

const LandingCTA = dynamic(() => import("@/components/LandingCTA"), {
  loading: () => (
    <div className="flex flex-col gap-4 sm:flex-row">
      <div className="h-12 w-full rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse md:w-[200px]" />
      <div className="h-12 w-full rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse md:w-[160px]" />
    </div>
  ),
  ssr: false,
});

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-16 px-4 sm:py-32 sm:px-16 bg-white dark:bg-black sm:items-start">
        {/* Above fold: logo — loaded eagerly with priority */}
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="PromptingSchool"
          width={120}
          height={24}
          priority
        />

        {/* Above fold: headline */}
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            Learn to write better AI prompts.
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            PromptingSchool is an interactive platform where you practise prompt
            engineering through guided workshops, get scored feedback, and track
            your progress.
          </p>
        </div>

        {/* Below fold: CTAs — lazy loaded */}
        <LandingCTA />
      </main>
    </div>
  );
}
