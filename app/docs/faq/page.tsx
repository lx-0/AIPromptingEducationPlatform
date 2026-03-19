import Link from "next/link";

export const metadata = {
  title: "FAQ – PromptingSchool",
  description: "Frequently asked questions about PromptingSchool: scoring, privacy, subscriptions, and more.",
};

type FAQItem = { q: string; a: React.ReactNode };

const generalFAQs: FAQItem[] = [
  {
    q: "What is PromptingSchool?",
    a: "PromptingSchool is an AI-powered education platform where instructors create prompt-engineering workshops and trainees practice writing prompts that are automatically scored by an AI model.",
  },
  {
    q: "Who is PromptingSchool for?",
    a: "Anyone who wants to improve their AI prompting skills. Instructors — such as educators, team leads, or consultants — create workshops. Trainees practice and receive instant, rubric-based feedback.",
  },
  {
    q: "Is PromptingSchool free to use?",
    a: "Trainees can join and complete workshops for free. Instructors need an active subscription to create and publish workshops. See the Pricing page for current plans.",
  },
];

const scoringFAQs: FAQItem[] = [
  {
    q: "How does AI scoring work?",
    a: "When you submit a prompt response, it is sent to an AI model along with the exercise rubric. The model evaluates your response against each rubric criterion and returns a score plus written feedback for each criterion.",
  },
  {
    q: "Can I re-submit an exercise?",
    a: "Yes, you can re-submit as many times as you like. Each attempt is saved individually and your best score is tracked across all attempts.",
  },
  {
    q: "Why did I score lower than I expected?",
    a: "Review the per-criterion feedback in your scorecard. The AI scores each criterion based on the rubric description set by the instructor. If a criterion was marked down, the feedback will explain what was missing or could be improved.",
  },
  {
    q: "Is AI scoring always accurate?",
    a: "AI scoring is highly consistent but not infallible. It performs best on well-defined rubric criteria. If you believe a score is incorrect, contact your instructor — they can review submissions manually.",
  },
];

const privacyFAQs: FAQItem[] = [
  {
    q: "Who can see my submissions?",
    a: "Your submissions are visible to you and the instructor of the workshop you enrolled in. Other trainees cannot see your prompt text or scores.",
  },
  {
    q: "Is my data stored securely?",
    a: "Yes. All data is stored in a secured PostgreSQL database. Passwords are hashed with bcrypt and never stored in plaintext. Communications are encrypted in transit.",
  },
  {
    q: "Can I delete my account?",
    a: "Yes. Contact support to request an account deletion. All your personal data and submissions will be removed.",
  },
];

const billingFAQs: FAQItem[] = [
  {
    q: "How do I upgrade to an instructor plan?",
    a: (
      <>
        Sign in as an instructor, then visit the{" "}
        <Link href="/billing" className="text-blue-600 hover:underline dark:text-blue-400">
          Billing page
        </Link>{" "}
        and select a plan. Payment is processed securely via Stripe.
      </>
    ),
  },
  {
    q: "Can I cancel my subscription?",
    a: "Yes, you can cancel at any time from the Billing page. Your access continues until the end of the current billing period, after which workshops will no longer be publishable.",
  },
  {
    q: "What happens to my workshops if I cancel?",
    a: "Existing workshops remain accessible to enrolled trainees. You will not be able to create new workshops or publish unpublished ones until you re-subscribe.",
  },
  {
    q: "Do you offer refunds?",
    a: "We offer a refund within 7 days of your initial subscription if you have not yet published any workshops. Contact support with your request.",
  },
];

function FAQSection({ title, items }: { title: string; items: FAQItem[] }) {
  return (
    <section className="mb-10">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
        {title}
      </h2>
      <dl className="space-y-5">
        {items.map((item) => (
          <div key={item.q}>
            <dt className="font-medium text-gray-900 dark:text-gray-100 text-sm mb-1">{item.q}</dt>
            <dd className="text-sm text-gray-700 dark:text-gray-300">{item.a}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export default function FAQPage() {
  return (
    <article className="max-w-none">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        Frequently Asked Questions
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Common questions about PromptingSchool. Can&apos;t find an answer?{" "}
        <a href="mailto:support@promptingschool.com" className="text-blue-600 hover:underline dark:text-blue-400">
          Contact support
        </a>
        .
      </p>

      <FAQSection title="General" items={generalFAQs} />
      <FAQSection title="Scoring" items={scoringFAQs} />
      <FAQSection title="Privacy & Data" items={privacyFAQs} />
      <FAQSection title="Billing & Subscriptions" items={billingFAQs} />

      <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6 flex gap-4 text-sm">
        <Link href="/docs" className="text-blue-600 hover:underline dark:text-blue-400">← Back to docs</Link>
        <Link href="/docs/instructor-guide" className="text-blue-600 hover:underline dark:text-blue-400">Instructor guide →</Link>
      </div>
    </article>
  );
}
