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
  {
    id: "everyday-ai-assistant",
    name: "Your Everyday AI Assistant",
    description:
      "A hands-on workshop for anyone who wants to use AI more effectively in daily work. Practice prompting for summaries, brainstorming, email drafting, and decision-making — no technical background required.",
    difficulty: "beginner",
    estimatedMinutes: 40,
    exercises: [
      {
        title: "Summarize Like a Pro",
        instructions: `Write a prompt that asks the AI to summarize a long piece of text for a specific purpose.

**Task:**
Summarize the following meeting notes into a concise action-item list that a busy manager can scan in 30 seconds:

> "In today's product sync we discussed the Q2 launch timeline. Maria said the design mockups will be ready by April 5th but flagged that the icon set still needs approval from brand. Jake confirmed the API integration is on track but raised a dependency on the auth team finishing the OAuth flow, expected April 10th. We agreed to move the internal beta from April 12th to April 15th to absorb the risk. Sarah will send the updated timeline to stakeholders by EOD Friday. Everyone should review the feature-flag plan before next Tuesday's standup."

Your prompt should specify:
- The output format (action items with owners and dates)
- The audience (a manager who wasn't at the meeting)
- Maximum length (5-7 bullet points)

**Goal:** Learn to write prompts that turn messy information into clear, actionable summaries.`,
        rubric: [
          {
            criterion: "Purpose Specification",
            max_points: 10,
            description:
              "The prompt specifies the summary's purpose (action items), audience (busy manager), and constraints (length, format).",
          },
          {
            criterion: "Output Clarity",
            max_points: 10,
            description:
              "The AI response is a scannable list of action items with clear owners and deadlines.",
          },
          {
            criterion: "Completeness",
            max_points: 10,
            description:
              "All key action items from the meeting notes are captured without omitting important details.",
          },
        ],
        model_config: {
          model: "claude-haiku-4-5-20251001",
          temperature: 0.3,
          max_tokens: 512,
        },
      },
      {
        title: "Brainstorm Partner",
        instructions: `Use the AI as a brainstorming partner to generate creative ideas.

**Task:**
You're planning a team offsite for 15 people. Write a prompt that generates 10 unique activity ideas. Your prompt should include:
- The group size and mix (e.g., engineers, designers, PMs)
- The goal of the offsite (e.g., team bonding, strategic planning, celebration)
- Constraints (e.g., budget of $500, 3-hour time block, accessible for all fitness levels)
- A request for variety (mix of indoor/outdoor, active/chill, creative/strategic)

**Goal:** Learn to set constraints that make brainstorming output practical, not generic.`,
        rubric: [
          {
            criterion: "Constraint Setting",
            max_points: 15,
            description:
              "The prompt provides clear constraints: group details, goals, budget, time, and accessibility needs.",
          },
          {
            criterion: "Idea Variety",
            max_points: 10,
            description:
              "The AI generates genuinely diverse ideas — not 10 variations of the same thing.",
          },
          {
            criterion: "Practical Feasibility",
            max_points: 5,
            description:
              "The ideas respect the stated constraints (budget, time, accessibility) and could realistically be executed.",
          },
        ],
        model_config: {
          model: "claude-haiku-4-5-20251001",
          temperature: 0.8,
          max_tokens: 600,
        },
      },
      {
        title: "Email Drafter",
        instructions: `Write a prompt that drafts a professional email for a sensitive situation.

**Task:**
You need to email a client to let them know that a project deliverable will be 2 weeks late. Write a prompt that produces a professional email. Your prompt should include:
- The relationship context (long-term client, generally positive)
- The reason for the delay (a key dependency was delayed, not negligence)
- What you're doing to mitigate (revised timeline, added resources)
- The tone you want (apologetic but confident, not groveling)
- Length constraint (under 150 words)

**Goal:** Practice prompt-driven writing for high-stakes communication where tone matters.`,
        rubric: [
          {
            criterion: "Context Provided",
            max_points: 10,
            description:
              "The prompt gives the AI enough situational context: relationship, reason, mitigation, and desired tone.",
          },
          {
            criterion: "Tone Accuracy",
            max_points: 15,
            description:
              "The AI's email strikes the right balance — professional, empathetic, and solution-oriented without excessive apology.",
          },
          {
            criterion: "Constraint Adherence",
            max_points: 5,
            description:
              "The email stays under 150 words and includes all required elements (acknowledgment, reason, next steps).",
          },
        ],
        model_config: {
          model: "claude-haiku-4-5-20251001",
          temperature: 0.5,
          max_tokens: 400,
        },
      },
      {
        title: "Decision Helper",
        instructions: `Use AI to structure a decision with pros, cons, and a recommendation.

**Task:**
You're choosing between two project management tools for your team: **Tool A** (feature-rich, expensive, steep learning curve) and **Tool B** (simple, affordable, limited integrations). Write a prompt that asks the AI to:
1. List 3 pros and 3 cons for each option
2. Identify the most important factor to weigh
3. Give a recommendation based on a team of 8 people, moderate budget, and a preference for fast onboarding

Your prompt should make the AI's reasoning transparent — not just "pick B."

**Goal:** Learn to use AI for structured decision-making that surfaces trade-offs clearly.`,
        rubric: [
          {
            criterion: "Decision Framing",
            max_points: 10,
            description:
              "The prompt clearly presents both options, the evaluation criteria, and the team's context.",
          },
          {
            criterion: "Balanced Analysis",
            max_points: 15,
            description:
              "The AI provides genuinely balanced pros and cons for both options — not a biased sell for one.",
          },
          {
            criterion: "Recommendation Quality",
            max_points: 5,
            description:
              "The recommendation follows logically from the stated constraints and the analysis, with transparent reasoning.",
          },
        ],
        model_config: {
          model: "claude-haiku-4-5-20251001",
          temperature: 0.4,
          max_tokens: 600,
        },
      },
    ],
  },
  {
    id: "prompt-debugging",
    name: "Prompt Debugging & Iteration",
    description:
      "Learn what to do when your prompts don't work. Practice diagnosing vague, misleading, or overly complex prompts, then fix them systematically. The essential skill for going from 'meh' to 'wow' with AI.",
    difficulty: "beginner",
    estimatedMinutes: 35,
    exercises: [
      {
        title: "Spot the Problem",
        instructions: `Diagnose and fix a bad prompt.

**Task:**
The following prompt produces unhelpful results:

> "Tell me about marketing."

Rewrite this prompt so it produces a useful, specific response. Your improved prompt should:
- Define what aspect of marketing you care about (e.g., social media strategy, email campaigns, brand positioning)
- Specify who the advice is for (e.g., a solo founder, a Fortune 500 CMO, a nonprofit)
- State the desired output format and length

Submit **only** the improved version.

**Goal:** Build the habit of diagnosing why a prompt fails and applying targeted fixes.`,
        rubric: [
          {
            criterion: "Problem Diagnosis",
            max_points: 10,
            description:
              "The rewritten prompt addresses the original's core problem: total lack of specificity.",
          },
          {
            criterion: "Specificity Added",
            max_points: 15,
            description:
              "The new prompt narrows the topic, audience, and format so the AI can give a targeted answer.",
          },
          {
            criterion: "Response Quality",
            max_points: 5,
            description:
              "The AI response is practical and relevant — a clear improvement over what the vague prompt would produce.",
          },
        ],
        model_config: {
          model: "claude-haiku-4-5-20251001",
          temperature: 0.5,
          max_tokens: 512,
        },
      },
      {
        title: "Too Much, Too Vague",
        instructions: `Fix a prompt that tries to do too many things at once.

**Task:**
The following prompt is overloaded and produces scattered output:

> "Write a blog post about artificial intelligence, cover its history, current applications in healthcare, education, and finance, discuss the ethical implications, predict what will happen in the next 10 years, and also give me 5 social media captions I can use to promote the post, make it fun and professional."

Rewrite this as a **single focused prompt** that tackles one clear goal. Choose the most valuable piece (e.g., just the blog post, or just the social captions) and write a prompt that will produce a high-quality result for that one goal.

**Goal:** Learn that less is more — focused prompts outperform kitchen-sink requests.`,
        rubric: [
          {
            criterion: "Scope Reduction",
            max_points: 15,
            description:
              "The rewritten prompt focuses on one clear deliverable rather than trying to do everything at once.",
          },
          {
            criterion: "Clarity of Focus",
            max_points: 10,
            description:
              "The prompt clearly defines the topic, audience, length, and tone for its chosen deliverable.",
          },
          {
            criterion: "Output Improvement",
            max_points: 5,
            description:
              "The AI response is coherent and polished — evidence that a focused prompt works better.",
          },
        ],
        model_config: {
          model: "claude-haiku-4-5-20251001",
          temperature: 0.6,
          max_tokens: 600,
        },
      },
      {
        title: "The Iteration Loop",
        instructions: `Practice improving a prompt through multiple rounds.

**Task:**
Start with this baseline prompt:

> "Give me a meal plan."

Your job is to write an improved version that produces a genuinely useful meal plan. Build up your prompt by adding:
1. **Who** it's for (dietary restrictions, goals, household size)
2. **What** constraints matter (budget, prep time, grocery accessibility)
3. **How** the output should be structured (daily breakdown, shopping list, calorie counts)

Submit your final, polished prompt. The goal is not perfection on attempt one — it's showing you can layer specificity effectively.

**Goal:** Internalize the iteration mindset: start simple, add detail, test, refine.`,
        rubric: [
          {
            criterion: "Progressive Specificity",
            max_points: 15,
            description:
              "The final prompt demonstrates clear layering: who, what constraints, and how to structure output.",
          },
          {
            criterion: "Practical Constraints",
            max_points: 10,
            description:
              "The prompt includes realistic constraints (budget, time, dietary needs) that shape useful output.",
          },
          {
            criterion: "Output Usability",
            max_points: 5,
            description:
              "The AI response is a meal plan someone could actually follow — not generic filler.",
          },
        ],
        model_config: {
          model: "claude-haiku-4-5-20251001",
          temperature: 0.5,
          max_tokens: 700,
        },
      },
    ],
  },
  {
    id: "creative-prompting",
    name: "Creative Prompting",
    description:
      "Unlock AI as a creative collaborator. Practice prompting for storytelling, brainstorming, worldbuilding, and content ideation — with techniques to steer creativity without killing it.",
    difficulty: "intermediate",
    estimatedMinutes: 50,
    exercises: [
      {
        title: "Storytelling Kickstart",
        instructions: `Write a prompt that generates the opening paragraph of a compelling short story.

**Task:**
Ask the AI to write the first 100-150 words of a short story. Your prompt should specify:
- The genre (e.g., sci-fi, mystery, literary fiction, horror)
- The point of view (first person, third person limited, etc.)
- The mood or tone (tense, whimsical, melancholic, etc.)
- A "hook" requirement — the opening must make the reader want to continue
- One specific sensory detail to include (e.g., "the smell of burnt coffee" or "a flickering neon sign")

**Goal:** Learn to guide creative output by constraining the right dimensions while leaving room for surprise.`,
        rubric: [
          {
            criterion: "Creative Direction",
            max_points: 10,
            description:
              "The prompt specifies genre, POV, tone, and a sensory anchor without over-constraining the content.",
          },
          {
            criterion: "Hook Quality",
            max_points: 15,
            description:
              "The AI's opening paragraph has a genuine hook — something that creates tension, curiosity, or emotional pull.",
          },
          {
            criterion: "Constraint Fidelity",
            max_points: 10,
            description:
              "The response honors the specified genre, POV, tone, and includes the requested sensory detail.",
          },
        ],
        model_config: {
          model: "claude-sonnet-4-6",
          temperature: 0.9,
          max_tokens: 400,
        },
      },
      {
        title: "Constrained Creativity",
        instructions: `Use constraints to make AI-generated content more original.

**Task:**
Write a prompt that asks the AI to generate a product name and tagline for a fictional product, but with creative constraints:
- The product: a smart notebook that digitizes handwritten notes in real time
- Constraint 1: The name must be exactly two words
- Constraint 2: The tagline must be under 8 words
- Constraint 3: Neither the name nor tagline can use these overused words: "smart," "intelligent," "revolutionary," "innovative," "next-gen"
- Ask for 5 options ranked by the AI's own assessment of memorability

**Goal:** Discover that well-chosen constraints produce more creative output than open-ended "be creative" prompts.`,
        rubric: [
          {
            criterion: "Constraint Design",
            max_points: 10,
            description:
              "The prompt clearly states all constraints (word count, banned words, ranking requirement).",
          },
          {
            criterion: "Creative Quality",
            max_points: 15,
            description:
              "The generated names and taglines are genuinely creative and avoid the banned cliches.",
          },
          {
            criterion: "Constraint Compliance",
            max_points: 10,
            description:
              "All 5 options respect the two-word name limit, sub-8-word tagline, and banned word list.",
          },
        ],
        model_config: {
          model: "claude-sonnet-4-6",
          temperature: 0.8,
          max_tokens: 512,
        },
      },
      {
        title: "Worldbuilding Partner",
        instructions: `Use AI to flesh out a fictional world with internal consistency.

**Task:**
You're building a fictional setting for a story or game. Write a prompt that asks the AI to generate a detailed description of a location in your world. Include:
- A 1-2 sentence premise for your world (e.g., "A desert planet where water is currency" or "A city that exists entirely underground")
- What you need described (e.g., the central marketplace, a forbidden zone, the ruler's palace)
- Consistency constraints (must align with your world's rules — e.g., no surface references if the world is underground)
- Request for 3 sensory details and 1 story hook embedded in the description

**Goal:** Practice collaborative worldbuilding where the AI extends your vision without contradicting it.`,
        rubric: [
          {
            criterion: "World Premise",
            max_points: 10,
            description:
              "The prompt establishes a clear world premise with enough rules for the AI to maintain internal consistency.",
          },
          {
            criterion: "Consistency",
            max_points: 15,
            description:
              "The AI's location description is internally consistent with the world's rules — no contradictions.",
          },
          {
            criterion: "Richness",
            max_points: 10,
            description:
              "The description includes the requested sensory details and story hook, making the location feel alive.",
          },
        ],
        model_config: {
          model: "claude-sonnet-4-6",
          temperature: 0.8,
          max_tokens: 700,
        },
      },
      {
        title: "Tone Remix",
        instructions: `Transform existing content into a completely different tone while preserving the core message.

**Task:**
Take the following dry, formal paragraph and write a prompt that asks the AI to rewrite it in a specific creative tone of your choice:

> "Quarterly revenue increased by 14% year-over-year, driven primarily by expansion in the enterprise segment. Customer acquisition costs decreased by 8%, while average contract value rose to $45,000. The company projects continued growth in the next fiscal quarter, contingent upon successful execution of the mid-market expansion strategy."

Choose a tone that is dramatically different from the original. Examples:
- A sports commentator narrating a championship game
- A bedtime story for a 5-year-old
- A dramatic movie trailer voiceover
- A rapper's verse

Your prompt should specify the tone clearly enough that anyone reading the AI's output would immediately recognize it.

**Goal:** Master tone control — the ability to make AI write the same content in radically different voices.`,
        rubric: [
          {
            criterion: "Tone Specification",
            max_points: 10,
            description:
              "The prompt clearly defines the target tone with enough detail to guide a distinctive voice.",
          },
          {
            criterion: "Tone Execution",
            max_points: 15,
            description:
              "The AI's rewrite is unmistakably in the requested tone — vocabulary, rhythm, and framing all match.",
          },
          {
            criterion: "Content Preservation",
            max_points: 10,
            description:
              "Despite the tone shift, the core facts (14% growth, lower CAC, $45K ACV) are preserved.",
          },
        ],
        model_config: {
          model: "claude-sonnet-4-6",
          temperature: 0.9,
          max_tokens: 500,
        },
      },
    ],
  },
  {
    id: "responsible-prompting",
    name: "Responsible AI Prompting",
    description:
      "Build habits for safe, ethical AI use. Learn to identify bias in outputs, verify factual claims, handle sensitive topics, and understand what AI should and shouldn't be used for.",
    difficulty: "beginner",
    estimatedMinutes: 35,
    exercises: [
      {
        title: "Fact-Check Your AI",
        instructions: `Write a prompt that asks for factual information with built-in verification guardrails.

**Task:**
You need to write a short briefing about **renewable energy adoption in Europe** for a presentation. Write a prompt that:
1. Asks for 5 key statistics about renewable energy in Europe
2. Instructs the AI to clearly label any statistic it is uncertain about
3. Asks the AI to note which statistics may be outdated and should be verified
4. Requests sources or source types (e.g., "Eurostat data," "IEA reports") the reader should check

**Goal:** Build the habit of prompting AI to be transparent about confidence levels instead of presenting everything as fact.`,
        rubric: [
          {
            criterion: "Verification Instructions",
            max_points: 15,
            description:
              "The prompt explicitly asks the AI to flag uncertainty, note potentially outdated info, and suggest verification sources.",
          },
          {
            criterion: "AI Transparency",
            max_points: 10,
            description:
              "The AI response appropriately flags areas of uncertainty rather than presenting everything with false confidence.",
          },
          {
            criterion: "Source Guidance",
            max_points: 5,
            description:
              "The response suggests specific, legitimate source types where the reader can verify claims.",
          },
        ],
        model_config: {
          model: "claude-haiku-4-5-20251001",
          temperature: 0.3,
          max_tokens: 600,
        },
      },
      {
        title: "Detecting Bias in Output",
        instructions: `Write a prompt and then evaluate the AI's response for potential bias.

**Task:**
Write a prompt asking the AI to describe the **ideal candidate** for a senior engineering manager position.

Then, in the same prompt, add a second instruction: ask the AI to review its own description for any assumptions about gender, age, background, communication style, or cultural norms that might unintentionally exclude qualified candidates.

**Goal:** Practice prompting AI to self-audit for bias — a critical skill for anyone using AI in hiring, evaluation, or people-related decisions.`,
        rubric: [
          {
            criterion: "Self-Audit Instruction",
            max_points: 15,
            description:
              "The prompt explicitly asks the AI to review its own output for bias across specific dimensions.",
          },
          {
            criterion: "Bias Awareness",
            max_points: 10,
            description:
              "The AI identifies genuine potential biases in its description (not just token disclaimers).",
          },
          {
            criterion: "Inclusive Revision",
            max_points: 5,
            description:
              "The self-audit leads to concrete suggestions for making the description more inclusive.",
          },
        ],
        model_config: {
          model: "claude-sonnet-4-6",
          temperature: 0.4,
          max_tokens: 700,
        },
      },
      {
        title: "Know When to Stop",
        instructions: `Practice identifying when AI should NOT be the answer.

**Task:**
For each of the following scenarios, write a one-sentence prompt and then explain (in 2-3 sentences) whether AI is appropriate to use, partially appropriate, or inappropriate — and why:

1. Drafting a first version of a marketing email
2. Diagnosing a medical condition from symptoms
3. Generating test data for a software demo
4. Writing a legal contract clause
5. Explaining a concept to a student

Write a prompt that asks the AI to evaluate these 5 scenarios. Instruct it to categorize each as **appropriate**, **use with caution**, or **inappropriate**, with a brief justification for each.

**Goal:** Develop judgment about AI's appropriate role — as a tool, not an authority.`,
        rubric: [
          {
            criterion: "Categorization Instruction",
            max_points: 10,
            description:
              "The prompt clearly requests categorization with the three-tier system and asks for justifications.",
          },
          {
            criterion: "Judgment Quality",
            max_points: 15,
            description:
              "The AI correctly identifies the medical and legal scenarios as requiring caution or being inappropriate for AI alone.",
          },
          {
            criterion: "Nuance",
            max_points: 5,
            description:
              "The justifications show nuance — e.g., 'use with caution + human review' rather than binary appropriate/inappropriate.",
          },
        ],
        model_config: {
          model: "claude-haiku-4-5-20251001",
          temperature: 0.3,
          max_tokens: 600,
        },
      },
    ],
  },
];

export function getTemplateById(id: string): WorkshopTemplate | undefined {
  return WORKSHOP_TEMPLATES.find((t) => t.id === id);
}
