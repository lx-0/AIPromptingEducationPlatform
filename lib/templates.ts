export interface TemplateRubricCriterion {
  criterion: string;
  max_points: number;
  description: string;
}

export interface TemplateExercise {
  title: string;
  instructions: string;
  system_prompt?: string;
  rubric: TemplateRubricCriterion[];
  model_config: {
    model: string;
    temperature: number;
    max_tokens: number;
  };
}

export interface WorkshopTemplate {
  id: string;
  name: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedMinutes: number;
  exercises: TemplateExercise[];
}

export const WORKSHOP_TEMPLATES: WorkshopTemplate[] = [
  {
    id: "intro-to-prompting",
    name: "Intro to Prompting",
    description:
      "A beginner-friendly workshop covering the core principles of writing effective prompts. Trainees will learn how clarity, context, and structure transform AI outputs.",
    difficulty: "beginner",
    estimatedMinutes: 45,
    exercises: [
      {
        title: "The Art of Clear Instructions",
        instructions: `Write a prompt that asks an AI to explain a complex topic to a complete beginner.

Choose **one** of the following topics:
- How the internet works
- What a database is
- How a search engine finds results

Your prompt should result in an explanation that a 10-year-old could understand. Avoid jargon, use analogies, and keep it engaging.

**Goal:** Practice writing prompts that specify audience, tone, and format.`,
        system_prompt:
          "You are a friendly and patient teacher who specializes in making complex ideas simple and fun. Always use relatable analogies and everyday examples.",
        rubric: [
          {
            criterion: "Audience Specification",
            max_points: 10,
            description:
              "The prompt clearly specifies the target audience (beginner / child) and the expected reading level.",
          },
          {
            criterion: "Clarity of Request",
            max_points: 10,
            description:
              "The prompt is unambiguous about what topic to explain and what format or length is expected.",
          },
          {
            criterion: "Output Quality",
            max_points: 10,
            description:
              "The AI response is genuinely easy to understand, uses analogies, and avoids jargon.",
          },
        ],
        model_config: {
          model: "claude-haiku-4-5-20251001",
          temperature: 0.7,
          max_tokens: 512,
        },
      },
      {
        title: "Adding Context Changes Everything",
        instructions: `Compare how the same request produces different results with and without context.

**Task:**
Write a prompt asking for advice on "improving performance." Then rewrite the same prompt but with rich context (e.g., you are a software engineer working on a slow API, or a marathon runner hitting a plateau).

Submit **only** the context-rich version. The goal is to see how specific context drives a more useful, targeted response.

**Goal:** Understand how background information shapes AI answers.`,
        rubric: [
          {
            criterion: "Context Richness",
            max_points: 15,
            description:
              "The prompt provides specific, relevant background: who the user is, the situation, constraints, and goals.",
          },
          {
            criterion: "Relevance of Response",
            max_points: 10,
            description:
              "The AI response is tailored to the provided context — not generic.",
          },
          {
            criterion: "Specificity of Advice",
            max_points: 5,
            description:
              "The response includes actionable, domain-specific suggestions rather than vague platitudes.",
          },
        ],
        model_config: {
          model: "claude-haiku-4-5-20251001",
          temperature: 0.5,
          max_tokens: 512,
        },
      },
      {
        title: "Format Matters",
        instructions: `Write a prompt that requests structured output in a specific format.

**Task:**
Ask the AI to list the 5 most important skills for a software developer. But your prompt must specify:
1. The output format (e.g., numbered list, table, bullet points with sub-bullets)
2. What information each entry should include (e.g., skill name + why it matters + one way to practice it)

**Goal:** Practice using format instructions to get consistently structured output.`,
        rubric: [
          {
            criterion: "Format Specification",
            max_points: 15,
            description:
              "The prompt explicitly states the desired output format (table, list, etc.) and structure.",
          },
          {
            criterion: "Structure Compliance",
            max_points: 10,
            description:
              "The AI response follows the requested format faithfully.",
          },
          {
            criterion: "Content Quality",
            max_points: 5,
            description:
              "The listed skills are genuinely valuable and the descriptions are accurate and helpful.",
          },
        ],
        model_config: {
          model: "claude-haiku-4-5-20251001",
          temperature: 0.5,
          max_tokens: 600,
        },
      },
      {
        title: "Persona Prompting",
        instructions: `Use a persona to shape the tone and style of an AI response.

**Task:**
Write a prompt asking for an explanation of **how to manage time effectively**. But assign the AI a specific persona — for example:
- A no-nonsense drill sergeant
- A Zen Buddhist monk
- A startup founder obsessed with productivity hacks

The persona should meaningfully change the tone, vocabulary, and framing of the advice.

**Goal:** Learn how persona instructions influence communication style.`,
        rubric: [
          {
            criterion: "Persona Clarity",
            max_points: 10,
            description:
              "The prompt clearly defines the persona with enough detail to guide tone and style.",
          },
          {
            criterion: "Persona Consistency",
            max_points: 15,
            description:
              "The AI response stays in character throughout — vocabulary, tone, and framing match the assigned persona.",
          },
          {
            criterion: "Advice Quality",
            max_points: 5,
            description:
              "Despite the persona, the time management advice is still practical and useful.",
          },
        ],
        model_config: {
          model: "claude-haiku-4-5-20251001",
          temperature: 0.8,
          max_tokens: 512,
        },
      },
    ],
  },
  {
    id: "advanced-prompt-engineering",
    name: "Advanced Prompt Engineering",
    description:
      "Deep-dive into professional prompting techniques including chain-of-thought reasoning, few-shot learning, system prompt design, and output formatting strategies used in production AI systems.",
    difficulty: "advanced",
    estimatedMinutes: 90,
    exercises: [
      {
        title: "Chain-of-Thought Reasoning",
        instructions: `Elicit step-by-step reasoning from an AI to solve a multi-step problem.

**Task:**
Write a prompt that asks the AI to solve the following problem **by thinking through each step explicitly**:

> A store sells apples for \$0.50 each and bags of 6 apples for \$2.50. If you need exactly 20 apples and want to spend as little as possible, what's the cheapest way to buy them?

Your prompt should instruct the AI to show its reasoning before giving the final answer.

**Goal:** Master chain-of-thought prompting to improve accuracy on reasoning tasks.`,
        rubric: [
          {
            criterion: "CoT Instruction",
            max_points: 15,
            description:
              "The prompt explicitly asks for step-by-step reasoning, showing work before reaching a conclusion.",
          },
          {
            criterion: "Reasoning Quality",
            max_points: 15,
            description:
              "The AI response walks through each logical step clearly before arriving at the answer.",
          },
          {
            criterion: "Correct Answer",
            max_points: 10,
            description:
              "The final answer is mathematically correct (3 bags + 2 individual = $9.50).",
          },
        ],
        model_config: {
          model: "claude-sonnet-4-6",
          temperature: 0.3,
          max_tokens: 800,
        },
      },
      {
        title: "Few-Shot Learning",
        instructions: `Use examples in your prompt to teach the AI a pattern it should follow.

**Task:**
Write a few-shot prompt that teaches the AI to classify customer support messages into categories: **Billing**, **Technical**, **Account**, or **General**.

Include 3–4 example message/category pairs in your prompt, then have the AI classify this new message:

> "I've been charged twice for my subscription this month and I can't find a way to request a refund."

**Goal:** Learn how in-context examples shape AI behavior without fine-tuning.`,
        rubric: [
          {
            criterion: "Example Quality",
            max_points: 15,
            description:
              "The few-shot examples clearly demonstrate the desired classification pattern and cover diverse cases.",
          },
          {
            criterion: "Pattern Consistency",
            max_points: 10,
            description:
              "The examples follow a consistent format (input → output) that the AI can learn from.",
          },
          {
            criterion: "Correct Classification",
            max_points: 15,
            description:
              "The AI correctly classifies the test message as 'Billing' based on the examples.",
          },
        ],
        model_config: {
          model: "claude-haiku-4-5-20251001",
          temperature: 0.2,
          max_tokens: 256,
        },
      },
      {
        title: "System Prompt Architecture",
        instructions: `Design a comprehensive system prompt for a specialized AI assistant.

**Task:**
Write a system prompt for a **Legal Document Reviewer AI** that will help lawyers quickly identify key clauses in contracts. Your system prompt should define:
1. The AI's role and expertise
2. Its communication style (formal, precise, structured)
3. What it should always do (e.g., cite clause locations, flag ambiguous language)
4. What it should never do (e.g., provide legal advice, make final judgments)
5. Output format for its reviews

Then test it by writing a user message asking the AI to review this clause:
> "The licensor grants the licensee a non-exclusive, non-transferable right to use the software."

**Goal:** Learn to design system prompts that constrain and guide AI behavior reliably.`,
        system_prompt: undefined,
        rubric: [
          {
            criterion: "Role Definition",
            max_points: 10,
            description:
              "The system prompt clearly defines the AI's expertise, persona, and purpose.",
          },
          {
            criterion: "Behavioral Constraints",
            max_points: 15,
            description:
              "The prompt includes explicit dos and don'ts that meaningfully constrain the AI's behavior.",
          },
          {
            criterion: "Output Structure",
            max_points: 10,
            description:
              "The system prompt specifies a clear output format, and the AI response follows it.",
          },
          {
            criterion: "Review Quality",
            max_points: 5,
            description:
              "The AI's analysis of the test clause is accurate and reflects the system prompt's guidelines.",
          },
        ],
        model_config: {
          model: "claude-sonnet-4-6",
          temperature: 0.3,
          max_tokens: 1024,
        },
      },
      {
        title: "Output Format Engineering",
        instructions: `Write a prompt that produces machine-parseable JSON output from unstructured text.

**Task:**
Write a prompt that takes the following unstructured job posting description and extracts key information as valid JSON:

> "We're looking for a senior backend engineer with 5+ years of experience in Python and PostgreSQL. The role is remote-friendly, based in the US, with a salary range of $140,000–$180,000. Strong experience with distributed systems and Kubernetes is a plus. Apply by March 31st."

Your JSON output should include fields like: \`role\`, \`experience_years\`, \`required_skills\`, \`preferred_skills\`, \`location\`, \`salary_min\`, \`salary_max\`, \`deadline\`, \`remote\`.

**Goal:** Master structured output extraction — essential for building AI-powered data pipelines.`,
        rubric: [
          {
            criterion: "JSON Instruction",
            max_points: 10,
            description:
              "The prompt clearly requests JSON output and specifies the required fields and their types.",
          },
          {
            criterion: "Valid JSON",
            max_points: 15,
            description:
              "The AI response is valid, parseable JSON with no syntax errors.",
          },
          {
            criterion: "Extraction Accuracy",
            max_points: 15,
            description:
              "All key fields are correctly extracted and populated from the source text.",
          },
        ],
        model_config: {
          model: "claude-haiku-4-5-20251001",
          temperature: 0.1,
          max_tokens: 512,
        },
      },
      {
        title: "Iterative Prompt Refinement",
        instructions: `Use a self-critique loop to improve AI output quality.

**Task:**
Write a prompt that asks the AI to:
1. Write a short (3-sentence) product description for a fictional smart water bottle
2. Critique its own description against 3 criteria: clarity, emotional appeal, and call-to-action
3. Rewrite an improved version incorporating its own feedback

This "generate → critique → revise" pattern is foundational for building self-improving AI workflows.

**Goal:** Learn meta-prompting techniques that produce higher-quality outputs through structured self-reflection.`,
        rubric: [
          {
            criterion: "Loop Structure",
            max_points: 15,
            description:
              "The prompt clearly instructs all three phases: generate, critique, and revise.",
          },
          {
            criterion: "Critique Quality",
            max_points: 10,
            description:
              "The AI's self-critique is specific, honest, and references the stated criteria.",
          },
          {
            criterion: "Improvement Demonstrated",
            max_points: 15,
            description:
              "The revised version is measurably better than the first — the critique's feedback is reflected.",
          },
        ],
        model_config: {
          model: "claude-sonnet-4-6",
          temperature: 0.7,
          max_tokens: 1024,
        },
      },
    ],
  },
  {
    id: "domain-specific-prompting",
    name: "Domain-Specific Prompting",
    description:
      "Apply prompting skills to real-world professional domains: software development, data analysis, business writing, and knowledge Q&A. Build practical intuition for domain-adapted AI workflows.",
    difficulty: "intermediate",
    estimatedMinutes: 60,
    exercises: [
      {
        title: "Code Generation & Review",
        instructions: `Write a prompt that generates a well-documented, production-ready code snippet.

**Task:**
Prompt the AI to write a Python function that:
- Accepts a list of dictionaries representing products (each with \`name\`, \`price\`, \`quantity\`)
- Returns the top 3 most valuable products by total inventory value (price × quantity)
- Includes type hints, a docstring, and handles edge cases (empty list, fewer than 3 items)

Then, ask the AI to also add a brief code review noting any potential improvements.

**Goal:** Practice using AI as a coding assistant for implementation + review in a single prompt.`,
        system_prompt:
          "You are a senior Python engineer who writes clean, efficient, and well-documented code following PEP 8 and best practices. Always include type hints and comprehensive docstrings.",
        rubric: [
          {
            criterion: "Requirement Coverage",
            max_points: 15,
            description:
              "The generated function handles all specified requirements: sorting, top-3 filtering, edge cases.",
          },
          {
            criterion: "Code Quality",
            max_points: 10,
            description:
              "The code includes type hints, a docstring, and follows Python best practices.",
          },
          {
            criterion: "Self-Review",
            max_points: 10,
            description:
              "The code review section identifies genuine improvements or confirms the implementation is solid.",
          },
          {
            criterion: "Prompt Clarity",
            max_points: 5,
            description:
              "The submitted prompt clearly specifies all requirements without ambiguity.",
          },
        ],
        model_config: {
          model: "claude-sonnet-4-6",
          temperature: 0.3,
          max_tokens: 1024,
        },
      },
      {
        title: "Data Analysis Narrative",
        instructions: `Write a prompt that turns raw data into an executive-ready business narrative.

**Task:**
Ask the AI to analyze the following quarterly sales data and write a concise executive summary (3–4 paragraphs) suitable for a board presentation:

| Quarter | Revenue | Units Sold | New Customers | Churn Rate |
|---------|---------|------------|---------------|------------|
| Q1 2025 | $1.2M   | 4,800      | 320           | 4.2%       |
| Q2 2025 | $1.5M   | 5,900      | 410           | 3.8%       |
| Q3 2025 | $1.4M   | 5,400      | 280           | 5.1%       |
| Q4 2025 | $1.9M   | 7,200      | 520           | 3.2%       |

Your prompt should specify: audience (board), tone (professional), key metrics to highlight, and what concerns or opportunities to flag.

**Goal:** Learn to prompt for analytical summaries that blend data interpretation with business storytelling.`,
        rubric: [
          {
            criterion: "Audience & Tone",
            max_points: 10,
            description:
              "The prompt specifies the board audience and professional tone, and the response reflects this.",
          },
          {
            criterion: "Data Accuracy",
            max_points: 15,
            description:
              "The summary correctly identifies trends: Q4 peak, Q3 dip, improving churn, growth trajectory.",
          },
          {
            criterion: "Business Insight",
            max_points: 10,
            description:
              "The response goes beyond raw numbers to offer interpretation, risks, or recommendations.",
          },
          {
            criterion: "Narrative Quality",
            max_points: 5,
            description:
              "The writing is clear, concise, and appropriate for a board-level audience.",
          },
        ],
        model_config: {
          model: "claude-sonnet-4-6",
          temperature: 0.5,
          max_tokens: 800,
        },
      },
      {
        title: "Professional Writing & Editing",
        instructions: `Use AI to improve a piece of professional writing through targeted editing prompts.

**Task:**
Write a prompt that asks the AI to rewrite the following poorly-written email to make it professional, concise, and actionable:

> "Hey so I was just thinking about the project and stuff and it seems like we're kind of behind? Like idk if anyone noticed but the deadline is coming up real fast and maybe we should do a meeting or something to figure out what's happening. Let me know if that works or whatever."

Your prompt should specify:
- Target tone (professional, direct)
- Length constraints (under 80 words)
- Required elements (clear subject line suggestion, specific call-to-action with deadline)

**Goal:** Practice prompt-driven editing that transforms vague writing into clear professional communication.`,
        rubric: [
          {
            criterion: "Editing Instructions",
            max_points: 10,
            description:
              "The prompt specifies tone, length, and required structural elements for the rewrite.",
          },
          {
            criterion: "Tone Transformation",
            max_points: 15,
            description:
              "The rewritten email is professional and direct — all casual/vague language is removed.",
          },
          {
            criterion: "Constraint Adherence",
            max_points: 10,
            description:
              "The response stays under 80 words and includes a subject line and clear call-to-action.",
          },
          {
            criterion: "Actionability",
            max_points: 5,
            description:
              "The email clearly communicates the problem and proposes a specific next step.",
          },
        ],
        model_config: {
          model: "claude-haiku-4-5-20251001",
          temperature: 0.4,
          max_tokens: 400,
        },
      },
      {
        title: "Knowledge Q&A with Constraints",
        instructions: `Write a prompt that extracts precise knowledge while controlling hallucination risk.

**Task:**
You need factual information about **the TCP/IP model** for a technical blog post. Write a prompt that:
1. Asks for a breakdown of the 4 layers with their names and primary responsibilities
2. Instructs the AI to say "I'm not certain" if it's unsure about any detail
3. Requests a real-world analogy for one layer of your choice
4. Asks the AI to flag any aspect where it recommends you verify against an authoritative source

**Goal:** Learn techniques for reducing hallucination and getting appropriately calibrated AI responses.`,
        rubric: [
          {
            criterion: "Uncertainty Instruction",
            max_points: 15,
            description:
              "The prompt explicitly asks the AI to express uncertainty rather than guess — and the AI response respects this.",
          },
          {
            criterion: "Factual Accuracy",
            max_points: 15,
            description:
              "The 4 TCP/IP layers (Application, Transport, Internet, Link) are correctly identified with accurate descriptions.",
          },
          {
            criterion: "Analogy Quality",
            max_points: 10,
            description:
              "The analogy is accurate, illuminating, and clearly linked to the specific layer it describes.",
          },
        ],
        model_config: {
          model: "claude-sonnet-4-6",
          temperature: 0.3,
          max_tokens: 800,
        },
      },
    ],
  },
];

export function getTemplateById(id: string): WorkshopTemplate | undefined {
  return WORKSHOP_TEMPLATES.find((t) => t.id === id);
}
