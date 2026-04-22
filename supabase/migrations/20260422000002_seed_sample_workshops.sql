-- Migration: Seed sample workshops, exercises, and learning paths (PROA-80)
-- Creates a platform instructor account and populates 8 curated workshops
-- spanning all categories, with 5 exercises each (40 total), plus 4 learning paths.

BEGIN;

-- ============================================================
-- 1. Platform instructor account
-- ============================================================
INSERT INTO public.users (id, email, password_hash, display_name, role, bio, is_admin)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'platform@promptacademy.ai',
  NULL,
  'Prompt Academy',
  'instructor',
  'Official curated workshops by the Prompt Academy team. Research-backed exercises designed to build real prompting skills from beginner to advanced.',
  FALSE
) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 2. Workshop tags
-- ============================================================
INSERT INTO public.workshop_tags (id, name) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'beginner-friendly'),
  ('b0000000-0000-0000-0000-000000000002', 'chain-of-thought'),
  ('b0000000-0000-0000-0000-000000000003', 'system-prompts'),
  ('b0000000-0000-0000-0000-000000000004', 'few-shot'),
  ('b0000000-0000-0000-0000-000000000005', 'role-prompting'),
  ('b0000000-0000-0000-0000-000000000006', 'creative'),
  ('b0000000-0000-0000-0000-000000000007', 'coding'),
  ('b0000000-0000-0000-0000-000000000008', 'data'),
  ('b0000000-0000-0000-0000-000000000009', 'business'),
  ('b0000000-0000-0000-0000-000000000010', 'customer-service'),
  ('b0000000-0000-0000-0000-000000000011', 'advanced'),
  ('b0000000-0000-0000-0000-000000000012', 'multi-step'),
  ('b0000000-0000-0000-0000-000000000013', 'constraints'),
  ('b0000000-0000-0000-0000-000000000014', 'research'),
  ('b0000000-0000-0000-0000-000000000015', 'marketing')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 3. Workshops (8 total, one per major category)
-- ============================================================

-- Workshop 1: Prompt Engineering 101
INSERT INTO public.workshops (id, title, description, instructor_id, status, category_id, is_featured, trending_score)
VALUES (
  'c0000000-0000-0000-0000-000000000001',
  'Prompt Engineering 101: From Zero to Effective Prompts',
  'Master the foundational techniques that separate vague AI queries from precise, powerful prompts. This workshop covers clarity, role assignment, few-shot learning, output formatting, and working within constraints. Based on research from OpenAI, Anthropic, and Google on effective prompting strategies. Perfect for anyone just getting started with AI tools.',
  'a0000000-0000-0000-0000-000000000001',
  'published',
  (SELECT id FROM public.workshop_categories WHERE slug = 'prompt-engineering'),
  TRUE,
  95
) ON CONFLICT (id) DO NOTHING;

-- Workshop 2: Chain-of-Thought Reasoning
INSERT INTO public.workshops (id, title, description, instructor_id, status, category_id, is_featured, trending_score)
VALUES (
  'c0000000-0000-0000-0000-000000000002',
  'Chain-of-Thought: Teaching AI to Reason Step by Step',
  'Learn the technique behind some of AI''s most impressive reasoning feats. Chain-of-thought prompting, pioneered by Wei et al. (2022), dramatically improves AI performance on math, logic, and multi-step problems. This workshop takes you from basic CoT to advanced reasoning verification. You will learn zero-shot CoT, structured decomposition, and how to verify AI reasoning.',
  'a0000000-0000-0000-0000-000000000001',
  'published',
  (SELECT id FROM public.workshop_categories WHERE slug = 'prompt-engineering'),
  TRUE,
  88
) ON CONFLICT (id) DO NOTHING;

-- Workshop 3: Creative Writing with AI
INSERT INTO public.workshops (id, title, description, instructor_id, status, category_id, is_featured, trending_score)
VALUES (
  'c0000000-0000-0000-0000-000000000003',
  'Creative Writing with AI: Mastering Narrative Prompts',
  'Unlock AI as a creative collaborator. Learn to craft prompts that produce vivid settings, distinct character voices, and coherent multi-part narratives. Covers style transfer, constrained creativity, and iterative story building. Whether you write fiction, marketing copy, or screenplays, these techniques will transform how you work with AI.',
  'a0000000-0000-0000-0000-000000000001',
  'published',
  (SELECT id FROM public.workshop_categories WHERE slug = 'creative-writing'),
  TRUE,
  82
) ON CONFLICT (id) DO NOTHING;

-- Workshop 4: Code Generation Mastery
INSERT INTO public.workshops (id, title, description, instructor_id, status, category_id, is_featured, trending_score)
VALUES (
  'c0000000-0000-0000-0000-000000000004',
  'Code Generation Mastery: From Specs to Working Software',
  'Turn AI into your most productive coding partner. This workshop teaches you how to write prompts that generate correct, maintainable code — from precise function specifications to architectural design sessions. Covers debugging prompts, code review techniques, and test-driven prompting. Exercises use real-world scenarios across Python, JavaScript, and SQL.',
  'a0000000-0000-0000-0000-000000000001',
  'published',
  (SELECT id FROM public.workshop_categories WHERE slug = 'code-generation'),
  FALSE,
  75
) ON CONFLICT (id) DO NOTHING;

-- Workshop 5: Data Analysis & Research
INSERT INTO public.workshops (id, title, description, instructor_id, status, category_id, is_featured, trending_score)
VALUES (
  'c0000000-0000-0000-0000-000000000005',
  'Data Analysis & Research with AI: Extract Insights Fast',
  'Master prompting techniques for data summarization, trend analysis, comparative research, and statistical reasoning. Learn how to structure prompts that produce accurate, well-organized analytical outputs. Covers research synthesis across multiple sources, structured comparisons, and prompts that produce actionable business intelligence.',
  'a0000000-0000-0000-0000-000000000001',
  'published',
  (SELECT id FROM public.workshop_categories WHERE slug = 'data-analysis'),
  FALSE,
  70
) ON CONFLICT (id) DO NOTHING;

-- Workshop 6: Business Strategy & Communication
INSERT INTO public.workshops (id, title, description, instructor_id, status, category_id, is_featured, trending_score)
VALUES (
  'c0000000-0000-0000-0000-000000000006',
  'AI for Business: Strategy, Communication & Decision-Making',
  'Apply AI prompting to real business challenges. Learn to generate executive summaries, SWOT analyses, market research, persuasive proposals, and structured decision frameworks. Every exercise uses scenarios drawn from actual business contexts. Designed for managers, consultants, and founders who want AI to accelerate their strategic thinking.',
  'a0000000-0000-0000-0000-000000000001',
  'published',
  (SELECT id FROM public.workshop_categories WHERE slug = 'business-strategy'),
  FALSE,
  68
) ON CONFLICT (id) DO NOTHING;

-- Workshop 7: Advanced System Prompts
INSERT INTO public.workshops (id, title, description, instructor_id, status, category_id, is_featured, trending_score)
VALUES (
  'c0000000-0000-0000-0000-000000000007',
  'Advanced System Prompts & AI Behavior Design',
  'Go beyond basic instructions and learn to architect AI behavior at the system level. Design robust system prompts, implement guardrails, engineer personas, build multi-turn conversation flows, and create dynamic templates. This is the workshop for builders who want to create AI-powered products and features. Requires solid prompt engineering fundamentals.',
  'a0000000-0000-0000-0000-000000000001',
  'published',
  (SELECT id FROM public.workshop_categories WHERE slug = 'prompt-engineering'),
  TRUE,
  85
) ON CONFLICT (id) DO NOTHING;

-- Workshop 8: Customer Support AI
INSERT INTO public.workshops (id, title, description, instructor_id, status, category_id, is_featured, trending_score)
VALUES (
  'c0000000-0000-0000-0000-000000000008',
  'Building Helpful AI Assistants for Customer Support',
  'Design AI prompts that handle real customer interactions with empathy, accuracy, and professionalism. Covers empathetic response generation, multi-step issue diagnosis, de-escalation techniques, knowledge base querying, and escalation protocols. Based on best practices from leading support teams at companies using AI-augmented customer service.',
  'a0000000-0000-0000-0000-000000000001',
  'published',
  (SELECT id FROM public.workshop_categories WHERE slug = 'customer-support'),
  FALSE,
  65
) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 4. Workshop tag links
-- ============================================================
INSERT INTO public.workshop_tag_links (workshop_id, tag_id) VALUES
  -- Workshop 1: Prompt Engineering 101
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001'),
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000004'),
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000005'),
  -- Workshop 2: Chain-of-Thought
  ('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002'),
  ('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000012'),
  -- Workshop 3: Creative Writing
  ('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000006'),
  ('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000013'),
  -- Workshop 4: Code Generation
  ('c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000007'),
  ('c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000012'),
  -- Workshop 5: Data Analysis
  ('c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000008'),
  ('c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000014'),
  -- Workshop 6: Business Strategy
  ('c0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000009'),
  ('c0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000015'),
  -- Workshop 7: Advanced System Prompts
  ('c0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000003'),
  ('c0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000011'),
  -- Workshop 8: Customer Support
  ('c0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000010'),
  ('c0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000005')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 5. Exercises
-- ============================================================

-- -------------------------------------------------------
-- Workshop 1: Prompt Engineering 101 (5 exercises)
-- -------------------------------------------------------

-- 1.1 The Clarity Challenge
INSERT INTO public.exercises (id, workshop_id, title, instructions, system_prompt, model_config, rubric, criterion_weights, sort_order, exercise_type, difficulty)
VALUES (
  'd0000000-0000-0000-0000-000000000101',
  'c0000000-0000-0000-0000-000000000001',
  'The Clarity Challenge',
  E'**Goal:** Write a prompt that produces a clear, specific, and useful response.\n\n**Scenario:** You need an AI to explain how a car engine works. But you don''t just want any explanation — you want one tailored for a 12-year-old who has never seen inside a car.\n\n**Your task:** Write a single prompt that:\n- Specifies the audience (12-year-old, no prior knowledge)\n- Requests a specific format (e.g., numbered steps, analogy-based)\n- Sets a length constraint (under 200 words)\n- Avoids jargon or asks the AI to define any technical terms used\n\n**Why this matters:** The #1 mistake in prompting is being vague. Research from Anthropic and OpenAI consistently shows that specific, well-structured prompts outperform vague ones by 40-60% on task completion metrics. Clarity is the foundation everything else builds on.',
  'You are a helpful educational assistant. Respond to the user''s prompt exactly as written, following their formatting and audience instructions precisely.',
  '{"provider": "anthropic", "model": "claude-sonnet-4-6", "temperature": 0.7, "max_tokens": 500}',
  '[{"criterion": "Audience Specification", "max_points": 5, "description": "Does the prompt clearly specify the target audience (age, knowledge level)?"}, {"criterion": "Format Control", "max_points": 5, "description": "Does the prompt request a specific output format (steps, analogies, bullet points, etc.)?"}, {"criterion": "Length/Scope Constraint", "max_points": 3, "description": "Does the prompt set appropriate boundaries on response length or scope?"}, {"criterion": "Jargon Handling", "max_points": 3, "description": "Does the prompt address technical terminology (avoid or define)?"}, {"criterion": "Overall Effectiveness", "max_points": 4, "description": "Would this prompt reliably produce a useful, targeted response?"}]',
  '{"Audience Specification": 1.5, "Overall Effectiveness": 1.5}',
  0,
  'standard',
  'beginner'
) ON CONFLICT (id) DO NOTHING;

-- 1.2 Role Prompting Basics
INSERT INTO public.exercises (id, workshop_id, title, instructions, system_prompt, model_config, rubric, sort_order, exercise_type, difficulty)
VALUES (
  'd0000000-0000-0000-0000-000000000102',
  'c0000000-0000-0000-0000-000000000001',
  'Role Prompting: Giving AI an Expert Identity',
  E'**Goal:** Use role assignment to get expert-level responses from AI.\n\n**Technique — Role Prompting:** When you tell an AI to "act as" a specific expert, it activates knowledge patterns associated with that role. This technique, documented across multiple studies, consistently improves response quality for domain-specific tasks.\n\n**Scenario:** You''re preparing for a job interview at a tech company. You need advice on how to answer behavioral interview questions using the STAR method (Situation, Task, Action, Result).\n\n**Your task:** Write a prompt that:\n- Assigns a specific expert role (e.g., "senior tech recruiter with 15 years of experience")\n- Includes relevant context about the role''s expertise\n- Asks for actionable, specific advice (not generic tips)\n- Requests at least one example STAR response\n\n**Pro tip:** The more specific the role, the better. "Act as a recruiter" is weaker than "Act as a senior recruiter at a FAANG company who has interviewed 500+ candidates for software engineering roles."',
  'You are a helpful AI assistant. Follow the user''s instructions, including any role they assign you.',
  '{"provider": "anthropic", "model": "claude-sonnet-4-6", "temperature": 0.7, "max_tokens": 800}',
  '[{"criterion": "Role Specificity", "max_points": 5, "description": "Is the assigned role detailed and specific (not just ''act as an expert'')?"}, {"criterion": "Context Richness", "max_points": 4, "description": "Does the prompt provide enough context for the role to be meaningful?"}, {"criterion": "Actionable Request", "max_points": 4, "description": "Does the prompt ask for specific, actionable output rather than generic advice?"}, {"criterion": "Example Request", "max_points": 3, "description": "Does the prompt request concrete examples?"}, {"criterion": "Prompt Effectiveness", "max_points": 4, "description": "Would the AI''s persona and output quality genuinely improve from this role assignment?"}]',
  1,
  'standard',
  'beginner'
) ON CONFLICT (id) DO NOTHING;

-- 1.3 Few-Shot Learning
INSERT INTO public.exercises (id, workshop_id, title, instructions, system_prompt, model_config, rubric, sort_order, exercise_type, difficulty)
VALUES (
  'd0000000-0000-0000-0000-000000000103',
  'c0000000-0000-0000-0000-000000000001',
  'Few-Shot Learning: Teaching by Example',
  E'**Goal:** Use few-shot examples to teach AI a specific output pattern.\n\n**Technique — Few-Shot Prompting:** Instead of describing what you want, you show the AI examples of input-output pairs. The AI learns the pattern and applies it to new inputs. Brown et al. (2020) showed this technique enables GPT-3 to perform tasks it was never explicitly trained for.\n\n**Scenario:** You want the AI to convert informal customer feedback into structured bug reports with these fields: Title, Severity (Low/Medium/High/Critical), Steps to Reproduce, Expected Behavior, Actual Behavior.\n\n**Your task:** Write a prompt that includes:\n- 2-3 examples of informal feedback converted to structured bug reports\n- A new piece of informal feedback for the AI to convert\n- Consistent formatting across all examples\n\n**Example informal feedback to convert:** "ugh the app keeps freezing whenever i try to upload a photo that''s bigger than 5mb, worked fine last week"\n\n**Key insight:** The quality of your examples determines the quality of the output. Diverse, well-formatted examples teach the AI both the structure AND the judgment calls (like severity classification).',
  'You are a helpful assistant. Follow the user''s instructions and match the format of any examples provided.',
  '{"provider": "anthropic", "model": "claude-sonnet-4-6", "temperature": 0.3, "max_tokens": 1000}',
  '[{"criterion": "Example Quality", "max_points": 6, "description": "Are the few-shot examples well-structured, realistic, and diverse enough to teach the pattern?"}, {"criterion": "Format Consistency", "max_points": 4, "description": "Do all examples follow the same output format with all required fields?"}, {"criterion": "Pattern Teachability", "max_points": 4, "description": "Could an AI reliably learn the conversion pattern from these examples alone?"}, {"criterion": "New Input Inclusion", "max_points": 3, "description": "Does the prompt include a new input for the AI to convert?"}, {"criterion": "Judgment Modeling", "max_points": 3, "description": "Do the examples demonstrate how to make judgment calls (e.g., severity levels)?"}]',
  2,
  'standard',
  'beginner'
) ON CONFLICT (id) DO NOTHING;

-- 1.4 Output Formatting
INSERT INTO public.exercises (id, workshop_id, title, instructions, system_prompt, model_config, rubric, sort_order, exercise_type, difficulty)
VALUES (
  'd0000000-0000-0000-0000-000000000104',
  'c0000000-0000-0000-0000-000000000001',
  'Output Formatting: Controlling AI Response Structure',
  E'**Goal:** Write a prompt that produces output in a precise, machine-readable format.\n\n**Technique — Format Specification:** AI models can output in virtually any format — JSON, CSV, markdown tables, XML, YAML — but only if you specify it clearly. Vague formatting requests ("make it organized") produce inconsistent results. Explicit format instructions with examples produce reliable, parseable output.\n\n**Scenario:** You need the AI to analyze a restaurant menu and output a structured JSON array. Each menu item should include: name (string), price (number), category (appetizer/main/dessert/drink), dietary_tags (array of strings like "vegetarian", "gluten-free", "vegan"), and calorie_estimate (number).\n\n**Menu to analyze:**\n"Caesar Salad $12, Grilled Salmon $28, Chocolate Lava Cake $14, Sparkling Water $4, Mushroom Risotto $22, Tiramisu $11, Bruschetta $9, Lemonade $5"\n\n**Your task:** Write a prompt that:\n- Specifies the exact JSON schema with field names and types\n- Includes one example JSON object so the AI knows the exact format\n- Handles edge cases (what if dietary info isn''t obvious?)\n- Requests valid, parseable JSON (not markdown code blocks around it)',
  'You are a data extraction assistant. Always output valid JSON when JSON format is requested. Do not wrap JSON in markdown code blocks unless explicitly asked.',
  '{"provider": "anthropic", "model": "claude-sonnet-4-6", "temperature": 0.2, "max_tokens": 1500}',
  '[{"criterion": "Schema Specification", "max_points": 5, "description": "Does the prompt clearly define the JSON schema with field names and types?"}, {"criterion": "Format Example", "max_points": 4, "description": "Does the prompt include a concrete example of the expected output format?"}, {"criterion": "Edge Case Handling", "max_points": 4, "description": "Does the prompt address ambiguous cases (unknown dietary info, estimated calories)?"}, {"criterion": "Parseable Output", "max_points": 4, "description": "Does the prompt specify requirements for valid, machine-readable output?"}, {"criterion": "Completeness", "max_points": 3, "description": "Does the prompt cover all menu items and all required fields?"}]',
  3,
  'standard',
  'intermediate'
) ON CONFLICT (id) DO NOTHING;

-- 1.5 Constrained Prompting
INSERT INTO public.exercises (id, workshop_id, title, instructions, system_prompt, model_config, rubric, sort_order, exercise_type, difficulty, constraints)
VALUES (
  'd0000000-0000-0000-0000-000000000105',
  'c0000000-0000-0000-0000-000000000001',
  'Constrained Creativity: Prompting Within Limits',
  E'**Goal:** Write an effective prompt while working within strict constraints.\n\n**Why constraints matter:** In production AI systems, prompts often have token limits, banned words (for safety/compliance), and required keywords (for SEO or policy). Learning to write effective prompts under constraints is a critical real-world skill.\n\n**Scenario:** Write a prompt asking the AI to explain the concept of machine learning to a business executive. Your prompt must convince the executive that ML is worth investing in.\n\n**Constraints on YOUR prompt (not the AI''s response):**\n- Maximum 300 characters\n- Must include the keywords: "ROI" and "competitive"\n- Cannot use the words: "please", "help", "can you"\n\n**Your task:** Craft the most effective prompt you can within these constraints. Every word counts — be direct, specific, and persuasive in your instructions to the AI.',
  'You are a technology strategy consultant who specializes in explaining complex tech concepts to C-suite executives. Be concise, use business language, and focus on value rather than technical details.',
  '{"provider": "anthropic", "model": "claude-sonnet-4-6", "temperature": 0.7, "max_tokens": 600}',
  '[{"criterion": "Constraint Compliance", "max_points": 6, "description": "Does the prompt stay within 300 chars, include required keywords, and avoid forbidden words?"}, {"criterion": "Clarity Under Constraints", "max_points": 5, "description": "Despite constraints, is the prompt clear and unambiguous?"}, {"criterion": "Effectiveness", "max_points": 5, "description": "Would this prompt produce a genuinely persuasive executive briefing?"}, {"criterion": "Word Economy", "max_points": 4, "description": "Does every word in the prompt serve a purpose?"}]',
  4,
  'constrained',
  'intermediate',
  '{"char_limit": 300, "forbidden_words": ["please", "help", "can you"], "required_keywords": ["ROI", "competitive"]}'
) ON CONFLICT (id) DO NOTHING;


-- -------------------------------------------------------
-- Workshop 2: Chain-of-Thought (5 exercises)
-- -------------------------------------------------------

-- 2.1 Basic Chain-of-Thought
INSERT INTO public.exercises (id, workshop_id, title, instructions, system_prompt, model_config, rubric, sort_order, exercise_type, difficulty)
VALUES (
  'd0000000-0000-0000-0000-000000000201',
  'c0000000-0000-0000-0000-000000000002',
  'Introduction to Chain-of-Thought Prompting',
  E'**Goal:** Write a prompt that guides the AI to show its reasoning step by step.\n\n**Technique — Chain-of-Thought (CoT):** Wei et al. (2022) demonstrated that asking AI to "think step by step" dramatically improves performance on reasoning tasks. The key insight: when AI shows its work, it makes fewer logical errors because each step builds on verified reasoning.\n\n**Scenario:** A small bakery sold 145 cupcakes on Monday, 203 on Tuesday, and 178 on Wednesday. Each cupcake costs $3.50 to make and sells for $5.75. On Thursday, they need to decide whether to hire a part-time employee at $120/day if they expect similar sales.\n\n**Your task:** Write a prompt that:\n- Presents this problem clearly\n- Explicitly instructs the AI to reason through it step by step\n- Asks it to show calculations at each stage\n- Requests a clear final recommendation with the reasoning behind it\n\n**Key learning:** Compare what you get with "solve this problem" vs. "solve this problem, thinking through it step by step." The difference in accuracy is dramatic, especially for multi-step math.',
  'You are a helpful assistant. When asked to think step by step, show your complete reasoning process with calculations at each stage.',
  '{"provider": "anthropic", "model": "claude-sonnet-4-6", "temperature": 0.3, "max_tokens": 1000}',
  '[{"criterion": "Problem Presentation", "max_points": 4, "description": "Is the problem presented clearly with all necessary data?"}, {"criterion": "CoT Instruction", "max_points": 5, "description": "Does the prompt explicitly request step-by-step reasoning?"}, {"criterion": "Calculation Visibility", "max_points": 4, "description": "Does the prompt ask the AI to show its work at each stage?"}, {"criterion": "Decision Framework", "max_points": 4, "description": "Does the prompt request a structured recommendation with supporting reasoning?"}, {"criterion": "Prompt Effectiveness", "max_points": 3, "description": "Would this prompt reliably produce accurate, well-reasoned output?"}]',
  0,
  'standard',
  'intermediate'
) ON CONFLICT (id) DO NOTHING;

-- 2.2 Zero-Shot CoT
INSERT INTO public.exercises (id, workshop_id, title, instructions, system_prompt, model_config, rubric, sort_order, exercise_type, difficulty)
VALUES (
  'd0000000-0000-0000-0000-000000000202',
  'c0000000-0000-0000-0000-000000000002',
  'Zero-Shot Chain-of-Thought: The Magic Phrase',
  E'**Goal:** Master the simplest and most powerful CoT technique: zero-shot CoT.\n\n**Technique — Zero-Shot CoT:** Kojima et al. (2022) discovered that simply adding "Let''s think step by step" to a prompt improves reasoning accuracy by 20-40% on benchmark tasks — no examples needed. This works because the phrase activates the model''s reasoning pathways.\n\n**Scenario:** You''re analyzing a business decision. A software company can either:\n- Option A: Build a feature in-house (3 months, 2 engineers at $150K/year each, 70% chance of success)\n- Option B: Buy a third-party solution ($50K/year license, 1 month integration, 1 engineer for 1 month, 95% success rate, but 20% annual price increases)\n\nThe feature is expected to generate $200K/year in additional revenue.\n\n**Your task:** Write TWO prompts for the same problem:\n1. A baseline prompt (no CoT instruction)\n2. The same prompt enhanced with zero-shot CoT\n\nSeparate them clearly with labels. The comparison will demonstrate the technique''s power.\n\n**Tip:** Zero-shot CoT phrases that work well: "Let''s think step by step", "Let''s work through this carefully", "Think about this step by step before answering."',
  'You are a business analyst. Provide analysis based on the data given. When asked to think step by step, show your complete reasoning.',
  '{"provider": "anthropic", "model": "claude-sonnet-4-6", "temperature": 0.3, "max_tokens": 1500}',
  '[{"criterion": "Baseline Prompt", "max_points": 4, "description": "Is the baseline prompt reasonable and complete without CoT?"}, {"criterion": "CoT Enhancement", "max_points": 5, "description": "Does the enhanced prompt correctly apply zero-shot CoT?"}, {"criterion": "Clear Comparison", "max_points": 4, "description": "Are both prompts clearly labeled and comparable?"}, {"criterion": "Problem Completeness", "max_points": 3, "description": "Are all decision variables included in both prompts?"}, {"criterion": "Technique Understanding", "max_points": 4, "description": "Does the prompt demonstrate understanding of why zero-shot CoT works?"}]',
  1,
  'comparison',
  'intermediate'
) ON CONFLICT (id) DO NOTHING;

-- 2.3 Multi-Step Problem Solving
INSERT INTO public.exercises (id, workshop_id, title, instructions, system_prompt, model_config, rubric, sort_order, exercise_type, difficulty)
VALUES (
  'd0000000-0000-0000-0000-000000000203',
  'c0000000-0000-0000-0000-000000000002',
  'Multi-Step Decomposition: Breaking Complex Problems Apart',
  E'**Goal:** Use prompt chaining to decompose a complex problem into manageable steps.\n\n**Technique — Prompt Chaining:** For problems too complex for a single prompt, break them into a sequence where each step''s output feeds the next. This is how production AI systems handle real-world complexity.\n\n**Scenario:** A city is deciding whether to convert a 2-mile stretch of road into a bike lane. You need to analyze this from three angles: traffic impact, economic impact, and public health impact.\n\n**This is a 3-step exercise. In each step, you''ll build on the previous step''s output:**\n\nStep 1 will ask you to write a prompt for traffic impact analysis.\nStep 2 will ask you to write a prompt for economic analysis that references the traffic findings.\nStep 3 will synthesize everything into a policy recommendation.',
  'You are an urban planning analyst. Provide evidence-based analysis with specific metrics where possible.',
  '{"provider": "anthropic", "model": "claude-sonnet-4-6", "temperature": 0.4, "max_tokens": 1000}',
  '[{"criterion": "Step Decomposition", "max_points": 5, "description": "Is the problem broken into logical, sequential steps?"}, {"criterion": "Inter-Step References", "max_points": 5, "description": "Does each step reference and build on the previous step''s output?"}, {"criterion": "Analysis Depth", "max_points": 4, "description": "Does each prompt ask for substantive, specific analysis?"}, {"criterion": "Synthesis Quality", "max_points": 4, "description": "Does the final step effectively synthesize findings from all prior steps?"}, {"criterion": "Practical Applicability", "max_points": 2, "description": "Would this multi-step approach work in a production prompt chain?"}]',
  2,
  'multi_step',
  'intermediate'
) ON CONFLICT (id) DO NOTHING;

-- Exercise steps for 2.3
INSERT INTO public.exercise_steps (id, exercise_id, step_number, instructions, system_prompt) VALUES
(
  'e0000000-0000-0000-0000-000000002031',
  'd0000000-0000-0000-0000-000000000203',
  0,
  E'**Step 1: Traffic Impact Analysis**\n\nWrite a prompt that asks the AI to analyze the traffic impact of converting a 2-mile urban road stretch to include a protected bike lane. Your prompt should ask for:\n- Current traffic volume estimates and projected changes\n- Impact on commute times for drivers\n- Potential for traffic diversion to parallel streets\n- Safety implications for all road users\n\nMake sure your prompt instructs the AI to reason step by step and provide specific metrics or estimates.',
  'You are an urban traffic engineer. Provide data-driven analysis with specific estimates for traffic flow changes.'
),
(
  'e0000000-0000-0000-0000-000000002032',
  'd0000000-0000-0000-0000-000000000203',
  1,
  E'**Step 2: Economic Impact Analysis**\n\nUsing the traffic analysis from Step 1 as context, write a prompt that analyzes the economic impact. Your prompt should:\n- Reference the traffic findings from Step 1\n- Ask for analysis of impact on local businesses along the route\n- Consider property value effects\n- Estimate infrastructure costs vs. long-term savings\n- Consider economic impact on cycling-related businesses\n\nThis step tests your ability to chain prompts — the AI should build on prior analysis.',
  'You are an urban economist. Build on the traffic analysis already provided and focus on economic implications.'
),
(
  'e0000000-0000-0000-0000-000000002033',
  'd0000000-0000-0000-0000-000000000203',
  2,
  E'**Step 3: Policy Recommendation Synthesis**\n\nWrite a prompt that synthesizes the traffic AND economic analyses into a final policy recommendation. Your prompt should:\n- Reference key findings from both prior analyses\n- Ask for a clear recommendation (build, modify, or reject the bike lane proposal)\n- Request risk factors and mitigation strategies\n- Ask for a phased implementation timeline if recommended\n- Request the recommendation in a format suitable for a city council briefing',
  'You are a senior urban policy advisor presenting to the city council. Synthesize all prior analysis into a clear, actionable recommendation.'
) ON CONFLICT (id) DO NOTHING;

-- 2.4 Reasoning Verification
INSERT INTO public.exercises (id, workshop_id, title, instructions, system_prompt, model_config, rubric, sort_order, exercise_type, difficulty)
VALUES (
  'd0000000-0000-0000-0000-000000000204',
  'c0000000-0000-0000-0000-000000000002',
  'Self-Verification: Making AI Check Its Own Work',
  E'**Goal:** Write a prompt that makes the AI verify its own reasoning.\n\n**Technique — Self-Consistency / Verification:** One of the most powerful CoT extensions is asking the AI to check its own work. This catches errors that slip through initial reasoning. Techniques include: asking the AI to verify each step, solve the problem a second way, or identify potential flaws in its reasoning.\n\n**Scenario:** A logistics company needs to optimize delivery routes. They have 5 delivery trucks, 23 deliveries to make across a city, each delivery has a 2-hour window, and some deliveries require refrigerated trucks (only 2 of the 5 are refrigerated).\n\n**Your task:** Write a prompt that:\n1. Presents the logistics problem clearly\n2. Asks the AI to propose an initial solution with step-by-step reasoning\n3. Then asks the AI to verify its solution by checking: Are all constraints met? Are there more efficient alternatives? What could go wrong?\n4. Requests a revised solution if the verification reveals issues\n\n**Key insight:** Self-verification prompts catch 30-50% of errors that initial CoT misses. Always build verification into complex reasoning tasks.',
  'You are a logistics optimization specialist. Show your reasoning at every step, then critically evaluate your own solution before finalizing.',
  '{"provider": "anthropic", "model": "claude-sonnet-4-6", "temperature": 0.3, "max_tokens": 2000}',
  '[{"criterion": "Problem Clarity", "max_points": 3, "description": "Is the logistics problem presented with all constraints clearly stated?"}, {"criterion": "Initial Reasoning", "max_points": 4, "description": "Does the prompt request step-by-step initial reasoning?"}, {"criterion": "Verification Instructions", "max_points": 5, "description": "Does the prompt include explicit self-verification instructions?"}, {"criterion": "Constraint Checking", "max_points": 4, "description": "Does the prompt ask the AI to verify all constraints are satisfied?"}, {"criterion": "Revision Loop", "max_points": 4, "description": "Does the prompt request revision if issues are found?"}]',
  3,
  'standard',
  'advanced'
) ON CONFLICT (id) DO NOTHING;

-- 2.5 Complex Analysis with CoT
INSERT INTO public.exercises (id, workshop_id, title, instructions, system_prompt, model_config, rubric, sort_order, exercise_type, difficulty, constraints)
VALUES (
  'd0000000-0000-0000-0000-000000000205',
  'c0000000-0000-0000-0000-000000000002',
  'CoT Under Pressure: Reasoning Within Constraints',
  E'**Goal:** Apply chain-of-thought reasoning within strict prompt constraints.\n\n**Challenge:** Real production prompts often have token budgets. Can you write a CoT prompt that triggers thorough reasoning in under 500 characters?\n\n**Scenario:** An investor is evaluating two startups:\n- Startup A: $2M revenue, 150% YoY growth, $500K burn/month, 18 months runway\n- Startup B: $5M revenue, 40% YoY growth, $200K burn/month, 36 months runway\n\nBoth are seeking $10M Series A at $50M valuation.\n\n**Your task:** Write a prompt (under 500 characters) that:\n- Presents both options concisely\n- Triggers step-by-step financial reasoning\n- Asks for a clear investment recommendation\n- Must include the phrase "step by step"\n\n**This tests:** Whether you can apply CoT effectively under real-world constraints.',
  'You are a venture capital analyst. Analyze investments with rigorous step-by-step financial reasoning. Always show your math.',
  '{"provider": "anthropic", "model": "claude-sonnet-4-6", "temperature": 0.3, "max_tokens": 1500}',
  '[{"criterion": "Constraint Compliance", "max_points": 5, "description": "Is the prompt under 500 characters and does it include ''step by step''?"}, {"criterion": "Data Completeness", "max_points": 4, "description": "Are all key financial metrics for both startups included?"}, {"criterion": "CoT Trigger", "max_points": 4, "description": "Does the prompt effectively trigger step-by-step reasoning?"}, {"criterion": "Decision Request", "max_points": 3, "description": "Does the prompt ask for a clear recommendation?"}, {"criterion": "Conciseness", "max_points": 4, "description": "Is the prompt well-written with no wasted words?"}]',
  4,
  'constrained',
  'advanced',
  '{"char_limit": 500, "required_keywords": ["step by step"]}'
) ON CONFLICT (id) DO NOTHING;


-- -------------------------------------------------------
-- Workshop 3: Creative Writing with AI (5 exercises)
-- -------------------------------------------------------

-- 3.1 Setting the Scene
INSERT INTO public.exercises (id, workshop_id, title, instructions, system_prompt, model_config, rubric, sort_order, exercise_type, difficulty)
VALUES (
  'd0000000-0000-0000-0000-000000000301',
  'c0000000-0000-0000-0000-000000000003',
  'Setting the Scene: World-Building Prompts',
  E'**Goal:** Write a prompt that produces vivid, immersive setting descriptions.\n\n**Technique — Sensory Specification:** Great creative prompts activate multiple senses. Instead of "describe a forest," try specifying what the reader should see, hear, smell, and feel. This technique draws from creative writing pedagogy — the more specific your sensory instructions, the more vivid the output.\n\n**Your task:** Write a prompt that asks the AI to describe the interior of an abandoned space station. Your prompt should:\n- Specify at least 3 senses the description should engage (sight, sound, touch, smell, taste)\n- Set a mood or atmosphere (eerie? hopeful? melancholic?)\n- Include at least one specific detail the AI must incorporate (e.g., a floating photograph, a blinking console)\n- Request a specific length (150-250 words)\n- Specify the narrative perspective (first person? third person? second person?)\n\n**Why this matters:** Vague creative prompts produce generic output. Specific sensory and atmospheric instructions produce writing that feels authored, not generated.',
  'You are a literary fiction writer known for vivid, sensory-rich prose. Write in the style and perspective requested. Focus on showing, not telling.',
  '{"provider": "anthropic", "model": "claude-sonnet-4-6", "temperature": 0.9, "max_tokens": 600}',
  '[{"criterion": "Sensory Specification", "max_points": 5, "description": "Does the prompt specify at least 3 senses for the AI to engage?"}, {"criterion": "Atmosphere/Mood", "max_points": 4, "description": "Does the prompt set a clear mood or emotional tone?"}, {"criterion": "Specific Details", "max_points": 4, "description": "Does the prompt include specific details the AI must incorporate?"}, {"criterion": "Format Controls", "max_points": 3, "description": "Does the prompt specify length, perspective, and other structural elements?"}, {"criterion": "Creative Potential", "max_points": 4, "description": "Would this prompt produce genuinely engaging, non-generic creative writing?"}]',
  0,
  'standard',
  'beginner'
) ON CONFLICT (id) DO NOTHING;

-- 3.2 Character Voice
INSERT INTO public.exercises (id, workshop_id, title, instructions, system_prompt, model_config, rubric, sort_order, exercise_type, difficulty)
VALUES (
  'd0000000-0000-0000-0000-000000000302',
  'c0000000-0000-0000-0000-000000000003',
  'Character Voice: Making AI Speak in Character',
  E'**Goal:** Craft a prompt that produces dialogue in a distinct, consistent character voice.\n\n**Technique — Voice Anchoring:** To get a consistent character voice, provide the AI with: (1) personality traits, (2) speech patterns, (3) background/motivation, and (4) an example line. This "anchors" the voice so the AI maintains it throughout.\n\n**Scenario:** Create a character who is a retired detective, now running a used bookshop. They''re philosophical, slightly cynical, and tend to see mystery in everyday situations. They speak in short, punchy sentences and occasionally reference old cases.\n\n**Your task:** Write a prompt that asks the AI to write a monologue (200-300 words) from this character, narrating their morning routine at the bookshop. Your prompt should:\n- Define the character''s personality traits (at least 3)\n- Specify speech patterns and verbal quirks\n- Provide the character''s backstory in 1-2 sentences\n- Include one example line in the character''s voice\n- Set the scene (morning, bookshop, specific action like opening the shop)\n\n**Pro tip:** An example line is the most powerful voice anchor. "Every book on that shelf has a story the author never intended" instantly communicates more than a paragraph of description.',
  'You are a creative writing assistant. Write in the specific character voice described. Maintain consistent voice, tone, and speech patterns throughout.',
  '{"provider": "anthropic", "model": "claude-sonnet-4-6", "temperature": 0.85, "max_tokens": 700}',
  '[{"criterion": "Character Definition", "max_points": 5, "description": "Are personality traits, speech patterns, and backstory clearly defined?"}, {"criterion": "Voice Example", "max_points": 4, "description": "Does the prompt include an example line that anchors the character''s voice?"}, {"criterion": "Scene Setting", "max_points": 3, "description": "Is the scene clearly established with enough context for the monologue?"}, {"criterion": "Consistency Cues", "max_points": 4, "description": "Does the prompt give the AI enough to maintain a consistent voice throughout?"}, {"criterion": "Originality", "max_points": 4, "description": "Is the character interesting and specific rather than a cliché?"}]',
  1,
  'standard',
  'intermediate'
) ON CONFLICT (id) DO NOTHING;

-- 3.3 Style Transfer
INSERT INTO public.exercises (id, workshop_id, title, instructions, system_prompt, model_config, rubric, sort_order, exercise_type, difficulty)
VALUES (
  'd0000000-0000-0000-0000-000000000303',
  'c0000000-0000-0000-0000-000000000003',
  'Style Transfer: Writing the Same Scene Two Ways',
  E'**Goal:** Write two prompts that produce the same scene in dramatically different writing styles.\n\n**Technique — Style Specification:** AI can mimic virtually any writing style, but you need to specify it precisely. Naming an author is a start, but describing the specific stylistic elements (sentence length, vocabulary level, use of metaphor, pacing) produces more reliable results.\n\n**Scenario:** A person walks into a coffee shop on a rainy morning and orders their usual drink.\n\n**Your task:** Write TWO prompts for this same scene:\n\n**Prompt A:** Request the scene in the style of minimalist literary fiction (think Raymond Carver or Ernest Hemingway). Short sentences, understated emotion, no adjective excess, subtext beneath the surface.\n\n**Prompt B:** Request the same scene in the style of maximalist, ornate prose (think Donna Tartt or Vladimir Nabokov). Long flowing sentences, rich sensory detail, lavish metaphor, every moment unpacked.\n\n**For each prompt, specify:**\n- Named stylistic influence (if helpful)\n- At least 3 specific style elements (sentence length, vocabulary, use of metaphor, etc.)\n- The same core scene elements (person, coffee shop, rainy morning, ordering a drink)\n- Length: 150-200 words each\n\n**Label them clearly as Prompt A and Prompt B.**',
  'You are a versatile literary writer capable of writing in any requested style. Match the stylistic elements described as precisely as possible.',
  '{"provider": "anthropic", "model": "claude-sonnet-4-6", "temperature": 0.9, "max_tokens": 800}',
  '[{"criterion": "Style Differentiation", "max_points": 6, "description": "Are the two styles clearly and dramatically different from each other?"}, {"criterion": "Style Element Specification", "max_points": 5, "description": "Does each prompt specify at least 3 concrete stylistic elements?"}, {"criterion": "Scene Consistency", "max_points": 4, "description": "Do both prompts describe the same core scene?"}, {"criterion": "Prompt Clarity", "max_points": 3, "description": "Are both prompts clear, well-labeled, and complete?"}, {"criterion": "Style Authenticity", "max_points": 2, "description": "Would the specified styles produce genuinely distinct prose?"}]',
  2,
  'comparison',
  'intermediate'
) ON CONFLICT (id) DO NOTHING;

-- 3.4 Constrained Creativity
INSERT INTO public.exercises (id, workshop_id, title, instructions, system_prompt, model_config, rubric, sort_order, exercise_type, difficulty, constraints)
VALUES (
  'd0000000-0000-0000-0000-000000000304',
  'c0000000-0000-0000-0000-000000000003',
  'Constrained Creativity: The Six-Word Story',
  E'**Goal:** Write a prompt that produces a compelling micro-story, proving that constraints breed creativity.\n\n**Background:** Hemingway (apocryphally) wrote the famous six-word story: "For sale: baby shoes, never worn." This demonstrates that constraints can produce more powerful writing than unlimited freedom.\n\n**Your task:** Write a prompt that asks the AI to generate 5 six-word stories, each on a different theme. Your prompt must:\n- Specify the themes for each story (choose interesting, varied themes)\n- Explain the six-word story format with at least one example\n- Ask for stories that carry emotional weight and imply a larger narrative\n- Request that each story use a different narrative technique (e.g., irony, juxtaposition, understatement)\n\n**Constraints on your prompt:**\n- Maximum 400 characters\n- Must include the word "emotion"\n- Cannot use the word "write" (find alternatives: craft, compose, create, generate)',
  'You are a master of micro-fiction. Every word must carry maximum weight. Favor subtext, implication, and emotional resonance.',
  '{"provider": "anthropic", "model": "claude-sonnet-4-6", "temperature": 0.95, "max_tokens": 400}',
  '[{"criterion": "Constraint Compliance", "max_points": 5, "description": "Under 400 chars, includes ''emotion'', avoids ''write''?"}, {"criterion": "Theme Diversity", "max_points": 4, "description": "Are the specified themes varied and interesting?"}, {"criterion": "Format Clarity", "max_points": 4, "description": "Is the six-word format clearly explained with an example?"}, {"criterion": "Technique Variation", "max_points": 4, "description": "Does the prompt request different narrative techniques?"}, {"criterion": "Prompt Power", "max_points": 3, "description": "Would this prompt produce genuinely moving micro-stories?"}]',
  3,
  'constrained',
  'intermediate',
  '{"char_limit": 400, "forbidden_words": ["write"], "required_keywords": ["emotion"]}'
) ON CONFLICT (id) DO NOTHING;

-- 3.5 Multi-Part Story Building
INSERT INTO public.exercises (id, workshop_id, title, instructions, system_prompt, model_config, rubric, sort_order, exercise_type, difficulty)
VALUES (
  'd0000000-0000-0000-0000-000000000305',
  'c0000000-0000-0000-0000-000000000003',
  'Iterative Story Building: Three Acts in Three Prompts',
  E'**Goal:** Build a coherent three-act story using prompt chaining.\n\n**Technique — Narrative Chaining:** Just like prompt chaining for analysis, you can chain creative prompts to build longer narratives. The key is feeding context forward while allowing the AI creative latitude within each segment.\n\n**Scenario:** You''re writing a short story about a lighthouse keeper who discovers that the light they tend doesn''t guide ships — it communicates with something in the deep ocean.\n\n**This is a 3-step exercise:**\nEach step asks you to write a prompt for one act of the story. Each act builds on the previous one.',
  'You are a literary fiction writer crafting a speculative short story. Maintain consistent tone, character, and plot threads across all parts.',
  '{"provider": "anthropic", "model": "claude-sonnet-4-6", "temperature": 0.85, "max_tokens": 800}',
  '[{"criterion": "Narrative Arc", "max_points": 5, "description": "Do the three prompts together create a coherent beginning-middle-end arc?"}, {"criterion": "Context Threading", "max_points": 5, "description": "Does each prompt reference and build on the previous act?"}, {"criterion": "Creative Latitude", "max_points": 4, "description": "Do the prompts leave room for the AI to surprise while maintaining the core story?"}, {"criterion": "Character Consistency", "max_points": 3, "description": "Do the prompts maintain the protagonist''s characterization across acts?"}, {"criterion": "Thematic Depth", "max_points": 3, "description": "Do the prompts encourage thematic exploration beyond surface-level plot?"}]',
  4,
  'multi_step',
  'intermediate'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercise_steps (id, exercise_id, step_number, instructions, system_prompt) VALUES
(
  'e0000000-0000-0000-0000-000000003051',
  'd0000000-0000-0000-0000-000000000305',
  0,
  E'**Act 1: Setup (300-400 words)**\n\nWrite a prompt for the opening act that:\n- Establishes the lighthouse keeper (name, personality, daily routine)\n- Sets the atmospheric tone (isolated, oceanic, maybe eerie or contemplative)\n- Introduces the mystery: something unusual about the light''s behavior\n- Ends with a moment of discovery or realization\n- Specifies the narrative perspective and tense',
  'You are a literary fiction writer. This is Act 1 of a three-part short story. Establish character, setting, and the seed of mystery. End on a hook.'
),
(
  'e0000000-0000-0000-0000-000000003052',
  'd0000000-0000-0000-0000-000000000305',
  1,
  E'**Act 2: Confrontation (300-400 words)**\n\nWrite a prompt for the middle act that:\n- References what happened in Act 1\n- Deepens the mystery (the keeper investigates, learns more)\n- Introduces tension or conflict (internal doubt? external danger? a choice?)\n- Raises the emotional stakes\n- Maintains the established tone and perspective',
  'You are continuing a three-part short story. This is Act 2 — the investigation deepens, stakes rise. Build on the established character and world.'
),
(
  'e0000000-0000-0000-0000-000000003053',
  'd0000000-0000-0000-0000-000000000305',
  2,
  E'**Act 3: Resolution (300-400 words)**\n\nWrite a prompt for the final act that:\n- Brings the mystery to a meaningful resolution (not necessarily a full explanation)\n- Resolves the protagonist''s internal arc\n- Ends with an image or line that resonates\n- Maintains thematic consistency with Acts 1 and 2\n- Avoids a generic or rushed ending',
  'You are concluding a three-part short story. Bring the narrative to a resonant, thematically satisfying close. Favor implication over exposition.'
) ON CONFLICT (id) DO NOTHING;


-- -------------------------------------------------------
-- Workshop 4: Code Generation Mastery (5 exercises)
-- -------------------------------------------------------

-- 4.1 Function Specification
INSERT INTO public.exercises (id, workshop_id, title, instructions, system_prompt, model_config, rubric, sort_order, exercise_type, difficulty)
VALUES (
  'd0000000-0000-0000-0000-000000000401',
  'c0000000-0000-0000-0000-000000000004',
  'Function Specification: Precise Code Requests',
  E'**Goal:** Write a prompt that generates a correct, well-documented function.\n\n**Key principle:** The difference between "write a sort function" and a good code prompt is specification. Production-quality code prompts include: language, input/output types, edge cases, error handling, performance requirements, and style conventions.\n\n**Scenario:** You need a Python function that validates email addresses.\n\n**Your task:** Write a prompt that specifies:\n- Language and version (Python 3.10+)\n- Function signature (name, parameters with types, return type)\n- Validation rules (what makes an email valid/invalid)\n- Edge cases to handle (empty string, None, unicode characters, very long inputs)\n- Whether to use regex or manual parsing\n- Error handling behavior (return bool? raise exception? return tuple with error message?)\n- A few test cases the function should pass\n- Code style (PEP 8, type hints, docstring format)\n\n**Why this matters:** Underspecified code prompts produce code that works for the happy path but breaks in production. Every constraint you specify is a bug you prevent.',
  'You are a senior Python developer. Write clean, well-tested, production-ready code. Follow PEP 8 style and include type hints.',
  '{"provider": "anthropic", "model": "claude-sonnet-4-6", "temperature": 0.2, "max_tokens": 1500}',
  '[{"criterion": "Specification Completeness", "max_points": 5, "description": "Does the prompt specify language, types, edge cases, error handling, and style?"}, {"criterion": "Edge Case Coverage", "max_points": 5, "description": "Does the prompt identify specific edge cases to handle?"}, {"criterion": "Test Cases", "max_points": 4, "description": "Does the prompt include test cases or expected behaviors?"}, {"criterion": "Implementation Guidance", "max_points": 3, "description": "Does the prompt specify approach (regex vs manual) and conventions?"}, {"criterion": "Production Readiness", "max_points": 3, "description": "Would the resulting code be suitable for production use?"}]',
  0,
  'standard',
  'beginner'
) ON CONFLICT (id) DO NOTHING;

-- 4.2 Debugging with AI
INSERT INTO public.exercises (id, workshop_id, title, instructions, system_prompt, model_config, rubric, sort_order, exercise_type, difficulty)
VALUES (
  'd0000000-0000-0000-0000-000000000402',
  'c0000000-0000-0000-0000-000000000004',
  'Debugging with AI: Structured Bug Reports',
  E'**Goal:** Write a prompt that helps AI debug code effectively.\n\n**Key principle:** AI is remarkably good at debugging, but only when given enough context. The best debugging prompts follow the same structure as great bug reports: what you expected, what happened, the code, the error, and what you''ve already tried.\n\n**Scenario:** The following JavaScript function is supposed to debounce API calls, but it''s firing the API on every keystroke instead of waiting:\n\n```javascript\nfunction debounce(fn, delay) {\n  let timer;\n  return function(...args) {\n    clearTimeout(timer);\n    timer = setTimeout(fn(...args), delay);\n  };\n}\n```\n\n**Your task:** Write a debugging prompt that includes:\n- The buggy code\n- Expected behavior vs. actual behavior\n- The error symptoms (fires on every keystroke)\n- The context where it''s used (e.g., search input field)\n- What you''ve already checked (so the AI doesn''t suggest obvious things)\n- A request for the AI to explain the root cause before fixing\n\n**Pro tip:** "Fix this code" is a weak prompt. "Here''s the code, the expected behavior, the actual behavior, and what I''ve already ruled out — explain the root cause and fix it" is a powerful one.',
  'You are a senior JavaScript developer and debugging expert. When debugging, always explain the root cause before providing the fix. Show the corrected code with comments explaining what changed.',
  '{"provider": "anthropic", "model": "claude-sonnet-4-6", "temperature": 0.2, "max_tokens": 1000}',
  '[{"criterion": "Bug Context", "max_points": 4, "description": "Does the prompt include the code, expected behavior, and actual behavior?"}, {"criterion": "Symptom Description", "max_points": 4, "description": "Are the error symptoms described specifically?"}, {"criterion": "Prior Investigation", "max_points": 4, "description": "Does the prompt mention what has already been checked or ruled out?"}, {"criterion": "Root Cause Request", "max_points": 4, "description": "Does the prompt ask for explanation before fix?"}, {"criterion": "Actionability", "max_points": 4, "description": "Would this prompt lead to a correct diagnosis and fix?"}]',
  1,
  'standard',
  'intermediate'
) ON CONFLICT (id) DO NOTHING;

-- 4.3 Code Review Prompts
INSERT INTO public.exercises (id, workshop_id, title, instructions, system_prompt, model_config, rubric, sort_order, exercise_type, difficulty)
VALUES (
  'd0000000-0000-0000-0000-000000000403',
  'c0000000-0000-0000-0000-000000000004',
  'AI Code Review: Finding What Humans Miss',
  E'**Goal:** Write a prompt that produces a thorough, production-quality code review.\n\n**Key principle:** AI can review code across dimensions that humans often skip: security vulnerabilities, performance bottlenecks, error handling gaps, accessibility issues, and style consistency. But you need to tell it what to look for.\n\n**Scenario:** Review this Express.js API endpoint:\n\n```javascript\napp.post("/api/users", async (req, res) => {\n  const { name, email, password, role } = req.body;\n  const user = await db.query(\n    `INSERT INTO users (name, email, password, role) VALUES (''${name}'', ''${email}'', ''${password}'', ''${role}'') RETURNING *`\n  );\n  res.json({ user: user.rows[0], token: jwt.sign({ id: user.rows[0].id, role }, SECRET) });\n});\n```\n\n**Your task:** Write a code review prompt that asks the AI to check for:\n- Security vulnerabilities (SQL injection, password handling, etc.)\n- Input validation gaps\n- Error handling\n- Authentication/authorization issues\n- Performance concerns\n- Best practice violations\n\nYour prompt should request the review in a structured format: severity level, issue description, and suggested fix for each finding.',
  'You are a senior security-focused code reviewer. Review code for security vulnerabilities, best practice violations, and production readiness. Rate each finding by severity: Critical, High, Medium, Low.',
  '{"provider": "anthropic", "model": "claude-sonnet-4-6", "temperature": 0.2, "max_tokens": 2000}',
  '[{"criterion": "Review Dimensions", "max_points": 5, "description": "Does the prompt specify multiple review dimensions (security, performance, style, etc.)?"}, {"criterion": "Code Inclusion", "max_points": 3, "description": "Is the code to review included clearly?"}, {"criterion": "Output Format", "max_points": 4, "description": "Does the prompt request structured output (severity, description, fix)?"}, {"criterion": "Security Focus", "max_points": 4, "description": "Does the prompt specifically ask for security review?"}, {"criterion": "Actionability", "max_points": 4, "description": "Would the review output be actionable for a developer?"}]',
  2,
  'standard',
  'intermediate'
) ON CONFLICT (id) DO NOTHING;

-- 4.4 Architecture Design
INSERT INTO public.exercises (id, workshop_id, title, instructions, system_prompt, model_config, rubric, sort_order, exercise_type, difficulty)
VALUES (
  'd0000000-0000-0000-0000-000000000404',
  'c0000000-0000-0000-0000-000000000004',
  'Architecture with AI: From Requirements to Design',
  E'**Goal:** Use multi-step prompting to go from requirements to a complete system design.\n\n**Scenario:** Design a URL shortener service (like bit.ly) that needs to handle 10M new URLs/day, redirect 100M clicks/day, and store URLs for 5 years.\n\n**This is a 3-step exercise:**\nEach step builds the design progressively, from requirements analysis to data modeling to API design.',
  'You are a senior systems architect with experience designing high-scale distributed systems. Provide specific, justified technical decisions with trade-off analysis.',
  '{"provider": "anthropic", "model": "claude-sonnet-4-6", "temperature": 0.3, "max_tokens": 2000}',
  '[{"criterion": "Requirements Analysis", "max_points": 4, "description": "Does Step 1 thoroughly analyze functional and non-functional requirements?"}, {"criterion": "Design Decisions", "max_points": 5, "description": "Are technical choices justified with trade-off analysis?"}, {"criterion": "Scalability", "max_points": 4, "description": "Does the architecture address the scale requirements?"}, {"criterion": "Progressive Detail", "max_points": 4, "description": "Does each step build logically on the previous one?"}, {"criterion": "Completeness", "max_points": 3, "description": "Is the final design complete enough to implement?"}]',
  3,
  'multi_step',
  'advanced'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercise_steps (id, exercise_id, step_number, instructions, system_prompt) VALUES
(
  'e0000000-0000-0000-0000-000000004041',
  'd0000000-0000-0000-0000-000000000404',
  0,
  E'**Step 1: Requirements Analysis & High-Level Architecture**\n\nWrite a prompt that asks the AI to:\n- Break down the functional requirements (shorten URL, redirect, analytics)\n- Identify non-functional requirements from the scale numbers (throughput, storage, latency)\n- Propose a high-level architecture (which services, how they communicate)\n- Justify the choice of database type (SQL vs NoSQL) for this use case\n- Estimate storage needs over 5 years',
  'You are a senior systems architect. Start with requirements analysis before jumping to solutions. Show your math for capacity estimates.'
),
(
  'e0000000-0000-0000-0000-000000004042',
  'd0000000-0000-0000-0000-000000000404',
  1,
  E'**Step 2: Data Model & Storage Design**\n\nBuilding on the architecture from Step 1, write a prompt that asks the AI to:\n- Design the data schema (tables/collections, fields, indexes)\n- Choose a URL shortening algorithm (hash-based, counter-based, etc.) with trade-offs\n- Design the caching strategy (what to cache, TTL, eviction policy)\n- Address data partitioning/sharding strategy for the projected scale\n- Include a decision on read vs write optimization',
  'You are designing the data layer for the architecture described above. Make specific, justified choices. Show the schema with field types.'
),
(
  'e0000000-0000-0000-0000-000000004043',
  'd0000000-0000-0000-0000-000000000404',
  2,
  E'**Step 3: API Design & Production Considerations**\n\nBuilding on Steps 1-2, write a prompt that asks the AI to:\n- Design the REST API endpoints (routes, methods, request/response schemas)\n- Address rate limiting and abuse prevention\n- Design the redirect flow for minimum latency\n- Specify monitoring, alerting, and SLOs\n- Identify the top 3 failure modes and how to handle each',
  'You are finalizing the production-ready design. Focus on API contracts, operational concerns, and failure modes. Be specific about SLOs and monitoring.'
) ON CONFLICT (id) DO NOTHING;

-- 4.5 Test-Driven Prompting
INSERT INTO public.exercises (id, workshop_id, title, instructions, system_prompt, model_config, rubric, sort_order, exercise_type, difficulty, constraints)
VALUES (
  'd0000000-0000-0000-0000-000000000405',
  'c0000000-0000-0000-0000-000000000004',
  'Test-Driven Prompting: Tests First, Code Second',
  E'**Goal:** Write a prompt that generates tests before code — TDD applied to AI prompting.\n\n**Technique — Test-First Prompting:** By asking the AI to write tests first, you force it to think about edge cases and expected behavior before writing the implementation. This consistently produces more robust code.\n\n**Scenario:** You need a TypeScript function called `parseTimeRange` that takes a natural language time range (like "9am to 5pm", "9:30-17:00", "morning") and returns a structured object with `start` and `end` as 24-hour time strings.\n\n**Your task:** Write a prompt that:\n- Describes the function''s purpose\n- Asks the AI to write comprehensive tests FIRST (using Jest)\n- Then asks it to implement the function to pass those tests\n- Must include the keyword "edge cases"\n- Cannot use the word "simple" (force yourself to think about complexity)\n\n**Why TDD prompting works:** When AI writes tests first, it identifies edge cases it would otherwise miss. The tests become the specification.',
  'You are a senior TypeScript developer practicing TDD. Always write failing tests first, then implement. Use Jest syntax. Include edge case tests.',
  '{"provider": "anthropic", "model": "claude-sonnet-4-6", "temperature": 0.2, "max_tokens": 2000}',
  '[{"criterion": "Test-First Structure", "max_points": 5, "description": "Does the prompt explicitly ask for tests before implementation?"}, {"criterion": "Function Specification", "max_points": 4, "description": "Is the function clearly specified with types and expected behavior?"}, {"criterion": "Edge Case Emphasis", "max_points": 4, "description": "Does the prompt emphasize edge case testing?"}, {"criterion": "Constraint Compliance", "max_points": 3, "description": "Includes ''edge cases'', avoids ''simple''?"}, {"criterion": "TDD Understanding", "max_points": 4, "description": "Does the prompt demonstrate understanding of TDD methodology?"}]',
  4,
  'constrained',
  'intermediate',
  '{"forbidden_words": ["simple"], "required_keywords": ["edge cases"]}'
) ON CONFLICT (id) DO NOTHING;


-- -------------------------------------------------------
-- Workshop 5: Data Analysis & Research (5 exercises)
-- -------------------------------------------------------

-- 5.1 Data Summarization
INSERT INTO public.exercises (id, workshop_id, title, instructions, system_prompt, model_config, rubric, sort_order, exercise_type, difficulty)
VALUES (
  'd0000000-0000-0000-0000-000000000501',
  'c0000000-0000-0000-0000-000000000005',
  'Data Summarization: From Raw Numbers to Narratives',
  E'**Goal:** Write a prompt that transforms raw data into a clear, actionable summary.\n\n**Key principle:** Good data summarization prompts specify: the audience, the purpose, the format, and which metrics matter most. "Summarize this data" produces noise. "Create an executive briefing highlighting the 3 most significant trends for our Q2 planning" produces signal.\n\n**Scenario:** Here''s quarterly sales data for a SaaS company:\n- Q1: $1.2M revenue, 450 customers, 8% churn, 45 new signups/week\n- Q2: $1.4M revenue, 520 customers, 6% churn, 52 new signups/week\n- Q3: $1.3M revenue, 510 customers, 9% churn, 38 new signups/week\n- Q4: $1.6M revenue, 580 customers, 5% churn, 61 new signups/week\n\n**Your task:** Write a prompt that:\n- Presents the raw data clearly\n- Specifies the audience (CEO + board) and purpose (annual review)\n- Asks for trend identification with percentage changes\n- Requests a highlight of the most concerning metric and why\n- Specifies the output format (executive summary, 3-5 bullet points, then one detailed paragraph on the key risk)',
  'You are a business intelligence analyst. Produce clear, data-driven summaries. Always include percentage changes and trend directions. Highlight anomalies.',
  '{"provider": "anthropic", "model": "claude-sonnet-4-6", "temperature": 0.3, "max_tokens": 800}',
  '[{"criterion": "Data Presentation", "max_points": 4, "description": "Is the raw data presented clearly and completely?"}, {"criterion": "Audience/Purpose", "max_points": 4, "description": "Are the target audience and purpose specified?"}, {"criterion": "Analysis Direction", "max_points": 4, "description": "Does the prompt guide what kinds of analysis to perform?"}, {"criterion": "Output Format", "max_points": 4, "description": "Is the output format clearly specified?"}, {"criterion": "Insight Focus", "max_points": 4, "description": "Does the prompt ask for actionable insights, not just description?"}]',
  0,
  'standard',
  'beginner'
) ON CONFLICT (id) DO NOTHING;

-- 5.2 Trend Analysis
INSERT INTO public.exercises (id, workshop_id, title, instructions, system_prompt, model_config, rubric, sort_order, exercise_type, difficulty)
VALUES (
  'd0000000-0000-0000-0000-000000000502',
  'c0000000-0000-0000-0000-000000000005',
  'Trend Analysis: Spotting Patterns and Anomalies',
  E'**Goal:** Write a prompt that performs rigorous trend analysis on time-series data.\n\n**Key principle:** AI is excellent at pattern recognition across datasets, but you need to tell it what dimensions to analyze, what timeframes to compare, and how to handle anomalies.\n\n**Scenario:** Monthly website traffic data (sessions) for an e-commerce site:\nJan: 45K, Feb: 42K, Mar: 51K, Apr: 48K, May: 55K, Jun: 62K, Jul: 58K, Aug: 71K, Sep: 68K, Oct: 95K, Nov: 120K, Dec: 85K\n\nMonthly conversion rates:\nJan: 2.1%, Feb: 2.3%, Mar: 2.0%, Apr: 2.5%, May: 2.4%, Jun: 2.8%, Jul: 2.2%, Aug: 3.1%, Sep: 2.9%, Oct: 2.6%, Nov: 2.1%, Dec: 3.4%\n\n**Your task:** Write a prompt that asks the AI to:\n- Identify seasonal patterns in traffic\n- Analyze the relationship between traffic volume and conversion rate\n- Flag any anomalies (months where metrics diverge from expected patterns)\n- Calculate month-over-month growth rates\n- Predict the likely trend for the next quarter with confidence caveats\n- Present findings with supporting calculations, not just conclusions',
  'You are a digital analytics specialist. Provide evidence-based trend analysis with specific calculations. Flag anomalies with explanations. Include confidence levels on predictions.',
  '{"provider": "anthropic", "model": "claude-sonnet-4-6", "temperature": 0.3, "max_tokens": 1500}',
  '[{"criterion": "Data Inclusion", "max_points": 3, "description": "Is all relevant data included clearly in the prompt?"}, {"criterion": "Multi-Dimensional Analysis", "max_points": 5, "description": "Does the prompt ask for analysis across multiple dimensions (seasonal, correlation, anomaly)?"}, {"criterion": "Calculation Request", "max_points": 4, "description": "Does the prompt ask for specific calculations, not just narrative?"}, {"criterion": "Prediction with Caveats", "max_points": 4, "description": "Does the prompt request predictions with appropriate uncertainty?"}, {"criterion": "Actionability", "max_points": 4, "description": "Would the analysis output be useful for business decision-making?"}]',
  1,
  'standard',
  'intermediate'
) ON CONFLICT (id) DO NOTHING;

-- 5.3 Comparative Analysis
INSERT INTO public.exercises (id, workshop_id, title, instructions, system_prompt, model_config, rubric, sort_order, exercise_type, difficulty)
VALUES (
  'd0000000-0000-0000-0000-000000000503',
  'c0000000-0000-0000-0000-000000000005',
  'Comparative Analysis: Two Products, One Framework',
  E'**Goal:** Write two prompts that compare the same products using different analytical frameworks.\n\n**Scenario:** Compare two project management tools for a 50-person software company:\n- Tool A: $15/user/month, Kanban-focused, strong GitHub integration, limited reporting, 99.5% uptime SLA\n- Tool B: $25/user/month, full Scrum support, built-in time tracking, comprehensive reporting, 99.9% uptime SLA\n\n**Your task:** Write TWO comparison prompts:\n\n**Prompt A — Feature Matrix:** Ask the AI to create a structured feature-by-feature comparison table with a scoring system and a winner per category.\n\n**Prompt B — Total Cost of Ownership:** Ask the AI to analyze the same tools from a financial perspective: direct costs, hidden costs (training, migration, productivity impact), 3-year TCO projection, and ROI analysis.\n\n**For each prompt:**\n- Include all the product data\n- Specify the output format clearly\n- Ask for a final recommendation with justification\n\n**Label them clearly as Prompt A and Prompt B.**',
  'You are a technology analyst specializing in enterprise software evaluation. Provide balanced, evidence-based comparisons. Recommend based on stated criteria, not vendor preference.',
  '{"provider": "anthropic", "model": "claude-sonnet-4-6", "temperature": 0.3, "max_tokens": 1500}',
  '[{"criterion": "Framework Differentiation", "max_points": 5, "description": "Are the two analytical frameworks clearly different and complementary?"}, {"criterion": "Data Consistency", "max_points": 4, "description": "Do both prompts include the same product data?"}, {"criterion": "Format Specification", "max_points": 4, "description": "Are output formats specified for each prompt?"}, {"criterion": "Analysis Depth", "max_points": 4, "description": "Do the prompts ask for analysis beyond surface-level comparison?"}, {"criterion": "Decision Support", "max_points": 3, "description": "Do both prompts request recommendations with justifications?"}]',
  2,
  'comparison',
  'intermediate'
) ON CONFLICT (id) DO NOTHING;

-- 5.4 Research Synthesis
INSERT INTO public.exercises (id, workshop_id, title, instructions, system_prompt, model_config, rubric, sort_order, exercise_type, difficulty)
VALUES (
  'd0000000-0000-0000-0000-000000000504',
  'c0000000-0000-0000-0000-000000000005',
  'Research Synthesis: Combining Multiple Sources',
  E'**Goal:** Use multi-step prompting to synthesize research from multiple angles into a cohesive analysis.\n\n**Scenario:** Your company is considering whether to adopt a 4-day work week. You need to build a research briefing covering productivity data, employee satisfaction, implementation challenges, and industry case studies.\n\n**This is a 3-step exercise:**\nEach step focuses on a different research dimension, and the final step synthesizes everything.',
  'You are a workplace research analyst. Cite specific studies, data points, and companies by name when possible. Distinguish between correlational and causal evidence.',
  '{"provider": "anthropic", "model": "claude-sonnet-4-6", "temperature": 0.4, "max_tokens": 1200}',
  '[{"criterion": "Research Breadth", "max_points": 5, "description": "Do the three steps cover distinct, comprehensive research dimensions?"}, {"criterion": "Evidence Quality", "max_points": 4, "description": "Do the prompts ask for specific studies, data, and case studies?"}, {"criterion": "Synthesis Quality", "max_points": 5, "description": "Does the final step effectively synthesize the prior research?"}, {"criterion": "Balanced Perspective", "max_points": 3, "description": "Do the prompts ask for both benefits and drawbacks?"}, {"criterion": "Decision Readiness", "max_points": 3, "description": "Would the final output be sufficient for an executive to make a decision?"}]',
  3,
  'multi_step',
  'intermediate'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercise_steps (id, exercise_id, step_number, instructions, system_prompt) VALUES
(
  'e0000000-0000-0000-0000-000000005041',
  'd0000000-0000-0000-0000-000000000504',
  0,
  E'**Step 1: Productivity & Performance Data**\n\nWrite a prompt asking the AI to research:\n- Key studies on 4-day work week and productivity (Microsoft Japan, Perpetual Guardian, Iceland trials)\n- Quantitative productivity metrics before/after adoption\n- Which industries/roles see the biggest gains or losses\n- Potential confounding factors in the research',
  'You are a workplace research analyst. Focus on quantitative evidence. Distinguish between rigorous studies and anecdotal reports.'
),
(
  'e0000000-0000-0000-0000-000000005042',
  'd0000000-0000-0000-0000-000000000504',
  1,
  E'**Step 2: Employee Impact & Implementation Challenges**\n\nBuilding on Step 1''s findings, write a prompt asking the AI to research:\n- Employee satisfaction and retention data from companies that adopted 4-day weeks\n- Common implementation challenges (scheduling, client coverage, management resistance)\n- How companies addressed the most common objections\n- Impact on hiring competitiveness',
  'You are researching the human and operational dimensions. Reference the productivity data from Step 1 where relevant.'
),
(
  'e0000000-0000-0000-0000-000000005043',
  'd0000000-0000-0000-0000-000000000504',
  2,
  E'**Step 3: Synthesis & Recommendation**\n\nWrite a prompt that synthesizes Steps 1 and 2 into:\n- An executive briefing (1 page equivalent)\n- A clear recommendation with conditions (when to adopt, when not to)\n- A phased implementation plan if recommending adoption\n- Key risks and mitigation strategies\n- A decision matrix: what factors should the company weigh most?',
  'You are presenting a final research synthesis to the CEO. Be decisive in your recommendation but honest about limitations. Include a decision matrix.'
) ON CONFLICT (id) DO NOTHING;

-- 5.5 Statistical Reasoning
INSERT INTO public.exercises (id, workshop_id, title, instructions, system_prompt, model_config, rubric, sort_order, exercise_type, difficulty)
VALUES (
  'd0000000-0000-0000-0000-000000000505',
  'c0000000-0000-0000-0000-000000000005',
  'Statistical Reasoning: Avoiding AI Hallucinated Numbers',
  E'**Goal:** Write a prompt that produces statistically sound analysis while guarding against fabricated data.\n\n**Critical issue:** AI models sometimes fabricate statistics that sound plausible but are invented. Good statistical prompting explicitly asks the AI to distinguish between: (1) real data it''s confident about, (2) estimates it''s making and the basis for them, and (3) things it genuinely doesn''t know.\n\n**Scenario:** Analyze the effectiveness of remote work on software developer productivity using the following real survey data:\n- Stack Overflow 2023 Developer Survey: 42% fully remote, 28% hybrid, 30% in-office\n- Survey satisfaction (self-reported): Remote 78% satisfied, Hybrid 71%, In-office 62%\n- Average reported weekly hours: Remote 41.2h, Hybrid 43.5h, In-office 44.1h\n\n**Your task:** Write a prompt that:\n- Presents the real data clearly\n- Asks for analysis of what the data does and doesn''t tell us\n- Explicitly instructs the AI to flag when it''s citing real data vs. making estimates\n- Asks the AI to identify 3 statistical limitations of this data\n- Requests the analysis avoid conflating correlation with causation\n- Asks for the analysis in a format that distinguishes facts from inferences',
  'You are a quantitative researcher. Always distinguish between reported data, estimates, and unknowns. Flag when you are inferring rather than citing. Never present estimates as facts.',
  '{"provider": "anthropic", "model": "claude-sonnet-4-6", "temperature": 0.2, "max_tokens": 1200}',
  '[{"criterion": "Data Presentation", "max_points": 3, "description": "Is the real data presented clearly and accurately?"}, {"criterion": "Hallucination Guards", "max_points": 6, "description": "Does the prompt instruct the AI to distinguish real data from estimates?"}, {"criterion": "Statistical Limitations", "max_points": 4, "description": "Does the prompt ask for analysis of data limitations?"}, {"criterion": "Causation vs Correlation", "max_points": 4, "description": "Does the prompt guard against causal claims from correlational data?"}, {"criterion": "Output Structure", "max_points": 3, "description": "Does the prompt request clear separation of facts from inferences?"}]',
  4,
  'standard',
  'advanced'
) ON CONFLICT (id) DO NOTHING;


-- -------------------------------------------------------
-- Workshop 6: Business Strategy & Communication (5 exercises)
-- -------------------------------------------------------

-- 6.1 Executive Summary
INSERT INTO public.exercises (id, workshop_id, title, instructions, system_prompt, model_config, rubric, sort_order, exercise_type, difficulty)
VALUES (
  'd0000000-0000-0000-0000-000000000601',
  'c0000000-0000-0000-0000-000000000006',
  'The Executive Summary: Communicating Up',
  E'**Goal:** Write a prompt that produces a crisp, decision-ready executive summary.\n\n**Key principle:** Executives read the first 3 sentences and decide whether to keep reading. The best executive summaries lead with the recommendation, follow with 3 supporting points, and end with the ask. This is the "pyramid principle" from Barbara Minto''s framework.\n\n**Scenario:** Your engineering team has been evaluating whether to migrate from a monolithic architecture to microservices. After 3 months of analysis:\n- Current monolith: 2M lines of code, 45-minute deploy cycles, 3 production incidents/month from coupling issues\n- Estimated migration: 18 months, 4 dedicated engineers, $1.2M total cost\n- Expected benefits: 5-minute deploys, independent scaling, 70% fewer coupling incidents\n- Risks: team needs Kubernetes training, temporary velocity drop during migration\n\n**Your task:** Write a prompt that asks the AI to:\n- Write an executive summary (250-300 words)\n- Lead with the recommendation\n- Include exactly 3 supporting data points\n- End with a clear ask (what decision you need from the executive)\n- Use plain language, no engineering jargon\n- Format for a busy reader (bold key numbers, bullet points for supporting data)',
  'You are a tech-savvy executive communications specialist. Write for a busy CEO who will spend 60 seconds on this summary. Lead with the recommendation. Bold key numbers.',
  '{"provider": "anthropic", "model": "claude-sonnet-4-6", "temperature": 0.4, "max_tokens": 600}',
  '[{"criterion": "Recommendation First", "max_points": 5, "description": "Does the prompt instruct leading with the recommendation?"}, {"criterion": "Data Selection", "max_points": 4, "description": "Does the prompt specify including exactly 3 supporting data points?"}, {"criterion": "Clear Ask", "max_points": 4, "description": "Does the prompt request a specific call to action?"}, {"criterion": "Format for Scanning", "max_points": 3, "description": "Does the prompt specify formatting for quick reading?"}, {"criterion": "Jargon-Free", "max_points": 4, "description": "Does the prompt specify plain language for a non-technical audience?"}]',
  0,
  'standard',
  'beginner'
) ON CONFLICT (id) DO NOTHING;

-- 6.2 SWOT Analysis
INSERT INTO public.exercises (id, workshop_id, title, instructions, system_prompt, model_config, rubric, sort_order, exercise_type, difficulty)
VALUES (
  'd0000000-0000-0000-0000-000000000602',
  'c0000000-0000-0000-0000-000000000006',
  'SWOT Analysis: Structured Strategic Thinking',
  E'**Goal:** Write a prompt that produces a rigorous, actionable SWOT analysis.\n\n**Key principle:** Most AI-generated SWOT analyses are generic and superficial. The fix is providing specific company context, industry data, and asking for prioritized, actionable items — not just lists.\n\n**Scenario:** Analyze a mid-size (200-person) digital marketing agency that:\n- Revenue: $30M/year, growing 15% annually\n- Specializes in SEO and content marketing for B2B SaaS companies\n- 80% of revenue comes from 5 enterprise clients\n- Just hired an AI team (3 people) to build AI-powered content tools\n- Main competitors are large agencies (WPP, Publicis) and new AI-native startups\n- Employee satisfaction survey shows 72% satisfaction, down from 84% last year\n\n**Your task:** Write a prompt that:\n- Provides all the company context above\n- Asks for a SWOT with 3-5 items per quadrant, prioritized by impact\n- Requires each item to include a specific action step (not just observation)\n- Asks the AI to identify the single most critical strategic issue\n- Requests a connection between S-O (how strengths enable opportunities) and W-T (where weaknesses amplify threats)',
  'You are a management consultant specializing in digital agency strategy. Provide specific, actionable SWOT analysis. Prioritize by business impact. Every observation should have an action step.',
  '{"provider": "anthropic", "model": "claude-sonnet-4-6", "temperature": 0.4, "max_tokens": 1500}',
  '[{"criterion": "Context Richness", "max_points": 4, "description": "Does the prompt provide specific company and market data?"}, {"criterion": "Prioritized Items", "max_points": 4, "description": "Does the prompt ask for prioritized items per quadrant?"}, {"criterion": "Action Steps", "max_points": 5, "description": "Does the prompt require actionable steps for each item?"}, {"criterion": "Cross-Quadrant Links", "max_points": 4, "description": "Does the prompt ask for S-O and W-T connections?"}, {"criterion": "Strategic Focus", "max_points": 3, "description": "Does the prompt ask for the single most critical issue?"}]',
  1,
  'standard',
  'intermediate'
) ON CONFLICT (id) DO NOTHING;

-- 6.3 Market Analysis (multi-step)
INSERT INTO public.exercises (id, workshop_id, title, instructions, system_prompt, model_config, rubric, sort_order, exercise_type, difficulty)
VALUES (
  'd0000000-0000-0000-0000-000000000603',
  'c0000000-0000-0000-0000-000000000006',
  'Market Analysis: From Landscape to Go-to-Market',
  E'**Goal:** Use multi-step prompting to build a complete market analysis.\n\n**Scenario:** You''re launching a B2B SaaS tool that uses AI to automate meeting notes and action items (competing with Otter.ai, Fireflies.ai, etc.).\n\n**This is a 3-step exercise:**\nEach step builds a layer of the market analysis, from landscape to competitive positioning to go-to-market strategy.',
  'You are a market research analyst and go-to-market strategist. Provide specific, data-informed analysis. Name real competitors and market dynamics.',
  '{"provider": "anthropic", "model": "claude-sonnet-4-6", "temperature": 0.4, "max_tokens": 1200}',
  '[{"criterion": "Market Understanding", "max_points": 5, "description": "Does Step 1 demonstrate thorough market landscape analysis?"}, {"criterion": "Competitive Insight", "max_points": 4, "description": "Does Step 2 provide genuine competitive differentiation, not generic claims?"}, {"criterion": "GTM Practicality", "max_points": 5, "description": "Is the go-to-market strategy specific and actionable?"}, {"criterion": "Data Usage", "max_points": 3, "description": "Do the prompts ask for data-backed claims?"}, {"criterion": "Progressive Depth", "max_points": 3, "description": "Does each step build meaningfully on the previous one?"}]',
  2,
  'multi_step',
  'intermediate'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercise_steps (id, exercise_id, step_number, instructions, system_prompt) VALUES
(
  'e0000000-0000-0000-0000-000000006031',
  'd0000000-0000-0000-0000-000000000603',
  0,
  E'**Step 1: Market Landscape**\n\nWrite a prompt that asks the AI to analyze:\n- Total addressable market (TAM) for AI meeting assistants\n- Key market segments (enterprise, SMB, specific verticals)\n- Major players and their positioning (Otter.ai, Fireflies.ai, Microsoft Copilot, etc.)\n- Market growth trends and drivers\n- Key customer pain points that create demand',
  'You are a market research analyst. Provide specific market data and name real players. Distinguish between facts and estimates.'
),
(
  'e0000000-0000-0000-0000-000000006032',
  'd0000000-0000-0000-0000-000000000603',
  1,
  E'**Step 2: Competitive Positioning**\n\nUsing the market landscape from Step 1, write a prompt that asks the AI to:\n- Identify 3-4 viable differentiation strategies (not just "better AI")\n- Analyze each competitor''s key weakness you could exploit\n- Define the ideal customer profile (ICP) for each positioning\n- Recommend one positioning strategy with justification\n- Create a 2x2 competitive positioning matrix (choose the two most important axes)',
  'You are a competitive strategy consultant. Build on the market landscape. Be specific about differentiation — avoid generic claims like "better UX" without saying how.'
),
(
  'e0000000-0000-0000-0000-000000006033',
  'd0000000-0000-0000-0000-000000000603',
  2,
  E'**Step 3: Go-to-Market Strategy**\n\nUsing Steps 1-2, write a prompt that asks the AI to:\n- Define the launch strategy (which segment first, why)\n- Specify pricing strategy with a specific price point and justification\n- Outline the first 90 days of customer acquisition (channels, tactics, budget allocation)\n- Define 3 measurable launch KPIs with specific targets\n- Identify the biggest go-to-market risk and mitigation plan',
  'You are a go-to-market strategist. Be specific: name channels, price points, KPI targets. Avoid vague advice. The plan should be executable by a 5-person team.'
) ON CONFLICT (id) DO NOTHING;

-- 6.4 Persuasive Proposals
INSERT INTO public.exercises (id, workshop_id, title, instructions, system_prompt, model_config, rubric, sort_order, exercise_type, difficulty, constraints)
VALUES (
  'd0000000-0000-0000-0000-000000000604',
  'c0000000-0000-0000-0000-000000000006',
  'The Persuasive Proposal: Selling an Idea Internally',
  E'**Goal:** Write a prompt that produces a persuasive internal business proposal.\n\n**Scenario:** You want to convince your VP of Engineering to let your team spend 20% of Q3 on paying down technical debt instead of building new features. The backlog has grown to 47 known issues, 3 are causing intermittent production outages, and the team''s velocity has dropped 25% over the past year due to workarounds.\n\n**Your task:** Write a prompt that:\n- Frames technical debt in business terms (revenue impact, team velocity, incident costs)\n- Asks for a proposal with the structure: Problem, Cost of Inaction, Proposed Solution, Expected ROI, Timeline\n- Requests specific dollar estimates for the cost of inaction\n- Asks the AI to preemptively address the main objection ("we can''t afford to slow feature development")\n- Must include the word "investment" (reframing debt payoff as investment)\n- Cannot use "technical debt" (force business language)',
  'You are a persuasive business writer. Frame technical arguments in terms of business value, cost, and ROI. Anticipate and address objections proactively.',
  '{"provider": "anthropic", "model": "claude-sonnet-4-6", "temperature": 0.5, "max_tokens": 1000}',
  '[{"criterion": "Business Framing", "max_points": 5, "description": "Does the prompt frame the technical issue in business terms?"}, {"criterion": "Proposal Structure", "max_points": 4, "description": "Does the prompt specify a clear proposal structure?"}, {"criterion": "Objection Handling", "max_points": 4, "description": "Does the prompt ask for preemptive objection handling?"}, {"criterion": "Constraint Compliance", "max_points": 3, "description": "Includes ''investment'', avoids ''technical debt''?"}, {"criterion": "Persuasive Power", "max_points": 4, "description": "Would the resulting proposal actually convince a skeptical VP?"}]',
  3,
  'constrained',
  'intermediate',
  '{"required_keywords": ["investment"], "forbidden_words": ["technical debt"]}'
) ON CONFLICT (id) DO NOTHING;

-- 6.5 Decision Frameworks
INSERT INTO public.exercises (id, workshop_id, title, instructions, system_prompt, model_config, rubric, sort_order, exercise_type, difficulty)
VALUES (
  'd0000000-0000-0000-0000-000000000605',
  'c0000000-0000-0000-0000-000000000006',
  'Decision Frameworks: Structured Thinking for Hard Choices',
  E'**Goal:** Write a prompt that applies a formal decision framework to a complex business decision.\n\n**Key principle:** Unstructured decision-making leads to biased outcomes. Formal frameworks (weighted decision matrix, Eisenhower matrix, RICE scoring, first principles analysis) produce more rigorous, defensible decisions.\n\n**Scenario:** A series B startup ($15M raise, 18 months runway) must decide between three strategic options:\n- Option A: Go upmarket — target enterprise clients (longer sales cycles, bigger deals, higher support costs)\n- Option B: Go wide — aggressive PLG (product-led growth) for SMBs (lower revenue per customer, faster growth, higher churn)\n- Option C: Go vertical — double down on one industry vertical (healthcare) where you already have 5 customers and deep expertise\n\n**Your task:** Write a prompt that:\n- Presents all three options with their key characteristics\n- Specifies a decision framework (weighted decision matrix with at least 5 criteria)\n- Defines the weights for each criterion (or asks the AI to propose and justify weights)\n- Requests scoring with justification for each option against each criterion\n- Asks for a sensitivity analysis: how does the recommendation change if weights shift?\n- Requests the final recommendation in a board-presentation format',
  'You are a strategic advisor to startup CEOs. Use rigorous decision frameworks. Show your work — every score needs justification. Include sensitivity analysis for key assumptions.',
  '{"provider": "anthropic", "model": "claude-sonnet-4-6", "temperature": 0.3, "max_tokens": 2000}',
  '[{"criterion": "Framework Selection", "max_points": 4, "description": "Does the prompt specify an appropriate decision framework?"}, {"criterion": "Criteria Definition", "max_points": 4, "description": "Are decision criteria clearly defined and weighted?"}, {"criterion": "Option Completeness", "max_points": 3, "description": "Are all options presented with sufficient detail?"}, {"criterion": "Sensitivity Analysis", "max_points": 5, "description": "Does the prompt request sensitivity analysis?"}, {"criterion": "Decision Quality", "max_points": 4, "description": "Would this process produce a well-justified, defensible decision?"}]',
  4,
  'standard',
  'advanced'
) ON CONFLICT (id) DO NOTHING;


-- -------------------------------------------------------
-- Workshop 7: Advanced System Prompts (5 exercises)
-- -------------------------------------------------------

-- 7.1 System Prompt Architecture
INSERT INTO public.exercises (id, workshop_id, title, instructions, system_prompt, model_config, rubric, sort_order, exercise_type, difficulty)
VALUES (
  'd0000000-0000-0000-0000-000000000701',
  'c0000000-0000-0000-0000-000000000007',
  'System Prompt Architecture: Building the Foundation',
  E'**Goal:** Design a well-structured system prompt for a production AI application.\n\n**Key principle:** A system prompt is the "operating system" for an AI assistant. Good system prompts have: (1) identity/role, (2) capabilities and limitations, (3) behavioral rules, (4) output format guidelines, and (5) safety guardrails. The order and structure matter.\n\n**Scenario:** You''re building a customer-facing AI assistant for a fintech company that helps users understand their credit score and suggests ways to improve it. The assistant should:\n- Access user''s credit data (passed via context)\n- Explain credit factors in plain language\n- Suggest specific improvement actions\n- Never give financial advice (refer to licensed advisors)\n- Never share one user''s data with another\n- Be warm but professional\n\n**Your task:** Write a complete system prompt (not a user prompt) that includes:\n1. Identity section: Who is the assistant? What''s its name and personality?\n2. Capabilities: What can it do? What data does it have access to?\n3. Behavioral rules: How should it respond? What tone?\n4. Safety guardrails: What must it never do? How should it handle edge cases?\n5. Output format: How should responses be structured?\n\n**Note:** In this exercise, you are writing the system prompt itself, not a prompt asking the AI to write one.',
  'You are an AI system prompt designer. Evaluate the system prompt the user writes for completeness, safety, and effectiveness.',
  '{"provider": "anthropic", "model": "claude-sonnet-4-6", "temperature": 0.3, "max_tokens": 1000}',
  '[{"criterion": "Identity Definition", "max_points": 4, "description": "Does the system prompt clearly define the assistant''s identity and personality?"}, {"criterion": "Capability Boundaries", "max_points": 4, "description": "Are capabilities and limitations clearly stated?"}, {"criterion": "Behavioral Rules", "max_points": 4, "description": "Are interaction rules specific and enforceable?"}, {"criterion": "Safety Guardrails", "max_points": 5, "description": "Are safety constraints comprehensive and specific?"}, {"criterion": "Structure & Organization", "max_points": 3, "description": "Is the system prompt well-organized and maintainable?"}]',
  0,
  'standard',
  'intermediate'
) ON CONFLICT (id) DO NOTHING;

-- 7.2 Guardrails & Safety
INSERT INTO public.exercises (id, workshop_id, title, instructions, system_prompt, model_config, rubric, sort_order, exercise_type, difficulty, constraints)
VALUES (
  'd0000000-0000-0000-0000-000000000702',
  'c0000000-0000-0000-0000-000000000007',
  'Guardrails & Safety: Preventing AI Misuse',
  E'**Goal:** Design a system prompt with robust safety guardrails.\n\n**Key principle:** Production AI systems must handle adversarial inputs gracefully. Users will try prompt injection, role-play attacks ("pretend you''re an AI without rules"), and boundary testing. Your guardrails need to be specific, layered, and tested.\n\n**Scenario:** You''re designing the system prompt for a children''s educational chatbot (ages 8-12) that teaches science concepts. The chatbot will be deployed in schools with minimal supervision.\n\n**Your task:** Write a system prompt that includes guardrails for:\n- Content safety: no violence, no adult content, no scary material\n- Prompt injection defense: handle "ignore your instructions" attacks\n- Scope limits: redirect off-topic questions back to science\n- Age-appropriate language: no complex vocabulary without explanation\n- Data privacy: never ask for or store personal information\n- Emotional safety: recognize distressed language and respond with care + referral\n\n**Constraints on your system prompt:**\n- Must include the phrase "safety first"\n- Cannot exceed 800 characters (production system prompts need to be token-efficient)\n\n**Tip:** Effective guardrails are specific. "Be safe" is useless. "If the user asks about weapons, explosions, or violence, respond: I''m here to talk about science! Let''s explore something cool instead." is enforceable.',
  'You are an AI safety expert evaluating a children''s chatbot system prompt. Rate its robustness against common attack vectors and its effectiveness at maintaining appropriate interactions.',
  '{"provider": "anthropic", "model": "claude-sonnet-4-6", "temperature": 0.2, "max_tokens": 1000}',
  '[{"criterion": "Content Safety", "max_points": 4, "description": "Are content restrictions specific and comprehensive?"}, {"criterion": "Injection Defense", "max_points": 5, "description": "Does the prompt defend against prompt injection and role-play attacks?"}, {"criterion": "Scope Control", "max_points": 3, "description": "Does the prompt handle off-topic requests gracefully?"}, {"criterion": "Age Appropriateness", "max_points": 3, "description": "Is language and tone appropriate for 8-12 year olds?"}, {"criterion": "Emotional Safety", "max_points": 3, "description": "Does the prompt handle distressed users appropriately?"}, {"criterion": "Constraint Compliance", "max_points": 2, "description": "Under 800 chars, includes ''safety first''?"}]',
  1,
  'constrained',
  'advanced',
  '{"char_limit": 800, "required_keywords": ["safety first"]}'
) ON CONFLICT (id) DO NOTHING;

-- 7.3 Persona Engineering
INSERT INTO public.exercises (id, workshop_id, title, instructions, system_prompt, model_config, rubric, sort_order, exercise_type, difficulty)
VALUES (
  'd0000000-0000-0000-0000-000000000703',
  'c0000000-0000-0000-0000-000000000007',
  'Persona Engineering: Designing AI Personalities',
  E'**Goal:** Design a system prompt that creates a consistent, engaging AI persona.\n\n**Key principle:** The best AI personas have: (1) a clear communication style, (2) consistent personality traits, (3) knowledge boundaries that feel natural, and (4) emotional intelligence. The persona should feel like a character, not a template.\n\n**Scenario:** Design an AI cooking assistant persona with these requirements:\n- Target audience: home cooks who are intermediate skill level\n- Personality: enthusiastic but not overwhelming, like a patient friend who loves to cook\n- Should adapt recipes based on dietary restrictions and available ingredients\n- Should explain WHY techniques work, not just what to do\n- Should admit when it doesn''t know something (regional cuisine it''s unfamiliar with)\n- Has a subtle sense of humor about kitchen disasters\n\n**Your task:** Write a complete system prompt that:\n1. Defines the persona with specific personality traits and communication style\n2. Establishes knowledge domains and explicit gaps\n3. Sets interaction patterns (how it greets, how it handles follow-ups, how it responds to mistakes)\n4. Includes 2-3 example responses that demonstrate the persona in action\n5. Defines how the persona handles frustration, confusion, or off-topic requests',
  'You are evaluating a persona design for consistency, engagement, and appropriateness. Rate how well the persona would maintain character across varied interactions.',
  '{"provider": "anthropic", "model": "claude-sonnet-4-6", "temperature": 0.5, "max_tokens": 1500}',
  '[{"criterion": "Personality Definition", "max_points": 5, "description": "Are personality traits specific, consistent, and engaging?"}, {"criterion": "Communication Style", "max_points": 4, "description": "Is the communication style clearly defined and distinctive?"}, {"criterion": "Knowledge Boundaries", "max_points": 4, "description": "Are knowledge limits natural and well-handled?"}, {"criterion": "Example Responses", "max_points": 4, "description": "Do example responses demonstrate the persona convincingly?"}, {"criterion": "Edge Case Handling", "max_points": 3, "description": "Does the persona handle frustration, off-topic, and errors gracefully?"}]',
  2,
  'standard',
  'advanced'
) ON CONFLICT (id) DO NOTHING;

-- 7.4 Multi-Turn Conversation Design
INSERT INTO public.exercises (id, workshop_id, title, instructions, system_prompt, model_config, rubric, sort_order, exercise_type, difficulty)
VALUES (
  'd0000000-0000-0000-0000-000000000704',
  'c0000000-0000-0000-0000-000000000007',
  'Multi-Turn Conversation Design: Stateful AI Interactions',
  E'**Goal:** Design a system prompt that maintains coherent state across multi-turn conversations.\n\n**Key principle:** Most AI interactions are multi-turn, but most prompts are designed for single-turn. Production system prompts need: (1) state management instructions, (2) reference resolution ("it", "that thing"), (3) progressive disclosure (don''t dump everything at once), and (4) conversation flow control.\n\n**Scenario:** Design the system prompt for an AI career counselor that conducts a structured career exploration session. The session should:\n- Start with open-ended questions about interests and skills\n- Narrow down to 3-5 career paths based on responses\n- Deep-dive into the user''s top choice with specific next steps\n- Remember and reference earlier answers throughout the conversation\n\n**This is a 3-step exercise. Each step focuses on a phase of the conversation design:**',
  'You are evaluating a multi-turn conversation system prompt for state management, flow control, and user experience.',
  '{"provider": "anthropic", "model": "claude-sonnet-4-6", "temperature": 0.4, "max_tokens": 1500}',
  '[{"criterion": "State Management", "max_points": 5, "description": "Does the system prompt handle state tracking across turns?"}, {"criterion": "Progressive Disclosure", "max_points": 4, "description": "Does the conversation reveal information progressively?"}, {"criterion": "Reference Resolution", "max_points": 4, "description": "Does the system prompt handle back-references to earlier answers?"}, {"criterion": "Flow Control", "max_points": 4, "description": "Is the conversation flow structured but flexible?"}, {"criterion": "Natural Feel", "max_points": 3, "description": "Would the conversation feel natural, not scripted?"}]',
  3,
  'multi_step',
  'advanced'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercise_steps (id, exercise_id, step_number, instructions, system_prompt) VALUES
(
  'e0000000-0000-0000-0000-000000007041',
  'd0000000-0000-0000-0000-000000000704',
  0,
  E'**Phase 1: Discovery — System Prompt for Opening**\n\nWrite the system prompt section that handles the opening phase:\n- How should the counselor introduce itself?\n- What initial questions should it ask? (interests, skills, values, constraints)\n- How should it store/reference the user''s answers in subsequent turns?\n- What format should it use to collect information (free-form vs. structured)?\n- Include instructions for the AI to summarize what it has learned after every 2-3 exchanges',
  'You are designing the opening phase of a career counseling AI. Focus on building rapport and gathering comprehensive information.'
),
(
  'e0000000-0000-0000-0000-000000007042',
  'd0000000-0000-0000-0000-000000000704',
  1,
  E'**Phase 2: Narrowing — System Prompt for Recommendation**\n\nWrite the system prompt section that handles career recommendation:\n- How should the AI transition from discovery to recommendation?\n- How should it present 3-5 career options (comparison format, pros/cons)?\n- How should it reference the user''s specific answers from Phase 1?\n- How should it handle user pushback ("I don''t like any of these")?\n- Include instructions for asking the user to pick their top 1-2 choices',
  'You are designing the recommendation phase. Connect recommendations explicitly to the user''s stated interests and skills.'
),
(
  'e0000000-0000-0000-0000-000000007043',
  'd0000000-0000-0000-0000-000000000704',
  2,
  E'**Phase 3: Deep-Dive — System Prompt for Action Planning**\n\nWrite the system prompt section that handles the deep-dive into the chosen career:\n- How should the AI provide detailed information about the selected path?\n- How should it create a personalized action plan (based on the user''s current skills/gaps)?\n- How should it handle the conversation wrap-up?\n- How should it offer to revisit other options if the user changes their mind?\n- Include instructions for a final summary of the entire session',
  'You are designing the action planning phase. Create specific, time-bound next steps personalized to the user''s situation.'
) ON CONFLICT (id) DO NOTHING;

-- 7.5 Dynamic Prompt Templates
INSERT INTO public.exercises (id, workshop_id, title, instructions, system_prompt, model_config, rubric, sort_order, exercise_type, difficulty)
VALUES (
  'd0000000-0000-0000-0000-000000000705',
  'c0000000-0000-0000-0000-000000000007',
  'Dynamic Prompt Templates: Building Reusable AI Components',
  E'**Goal:** Design a parameterized prompt template that can be reused across different contexts.\n\n**Key principle:** Production AI systems don''t use hardcoded prompts — they use templates with variables that are filled at runtime. Good templates separate the stable (instructions, format, guardrails) from the variable (user data, context, parameters).\n\n**Scenario:** Design a prompt template for generating personalized learning plans. The template should work for any subject, any skill level, and any time commitment.\n\n**Template variables to include:**\n- `{{subject}}` — what the user wants to learn (e.g., "machine learning", "Spanish", "watercolor painting")\n- `{{current_level}}` — beginner/intermediate/advanced\n- `{{weekly_hours}}` — hours per week available for study\n- `{{goal}}` — what they want to achieve (e.g., "pass AWS certification", "hold a conversation")\n- `{{timeline}}` — weeks/months to achieve the goal\n- `{{learning_style}}` — visual/reading/hands-on/mixed\n\n**Your task:** Write a complete prompt template that:\n1. Uses all 6 variables above with `{{variable}}` syntax\n2. Includes static instructions for the AI (output format, depth of detail, etc.)\n3. Handles edge cases in the template (e.g., if timeline is unrealistic for the goal)\n4. Produces a week-by-week learning plan with specific resources\n5. Is reusable — would work equally well for "machine learning" and "cooking"\n\n**Show the template, then show one filled-in example for a specific subject.**',
  'You are a prompt template designer evaluating templates for reusability, completeness, and practical effectiveness across diverse inputs.',
  '{"provider": "anthropic", "model": "claude-sonnet-4-6", "temperature": 0.4, "max_tokens": 1500}',
  '[{"criterion": "Variable Design", "max_points": 4, "description": "Are all 6 variables used meaningfully in the template?"}, {"criterion": "Static Instructions", "max_points": 4, "description": "Are the stable parts of the template well-designed (format, guardrails)?"}, {"criterion": "Edge Case Handling", "max_points": 4, "description": "Does the template handle unrealistic or edge-case inputs?"}, {"criterion": "Reusability", "max_points": 5, "description": "Would the template work well across very different subjects?"}, {"criterion": "Example Quality", "max_points": 3, "description": "Does the filled-in example demonstrate the template''s effectiveness?"}]',
  4,
  'standard',
  'advanced'
) ON CONFLICT (id) DO NOTHING;


-- -------------------------------------------------------
-- Workshop 8: Customer Support AI (5 exercises)
-- -------------------------------------------------------

-- 8.1 Empathetic Responses
INSERT INTO public.exercises (id, workshop_id, title, instructions, system_prompt, model_config, rubric, sort_order, exercise_type, difficulty)
VALUES (
  'd0000000-0000-0000-0000-000000000801',
  'c0000000-0000-0000-0000-000000000008',
  'Empathetic Responses: The Human Touch in AI Support',
  E'**Goal:** Write a prompt that produces empathetic, helpful customer support responses.\n\n**Key principle:** Research from Harvard Business Review shows that customers who feel emotionally heard are 6x more likely to remain loyal, even when the issue isn''t fully resolved. AI support prompts need to balance empathy with efficiency.\n\n**Scenario:** A customer emails:\n"I''ve been a subscriber for 3 years and just discovered you charged me twice for the last 3 months. That''s $180 I didn''t authorize. I''m really frustrated because I trusted your company and now I feel taken advantage of. I want a full refund and an explanation of how this happened."\n\n**Your task:** Write a prompt that instructs the AI to:\n- Acknowledge the customer''s emotions before addressing the issue\n- Validate their concern without being defensive or dismissive\n- Provide a clear resolution path (refund process, timeline)\n- Explain what happened (billing system issue) without making excuses\n- Include a goodwill gesture (e.g., credit, free month)\n- End with a specific follow-up action and timeline\n\n**The prompt should produce a response that sounds human, not robotic. No corporate jargon like "we value your business" — show care through specificity.**',
  'You are a customer support AI for a SaaS subscription company. Be warm, specific, and solution-oriented. Acknowledge emotions first, then solve. Sound human, not corporate.',
  '{"provider": "anthropic", "model": "claude-sonnet-4-6", "temperature": 0.6, "max_tokens": 600}',
  '[{"criterion": "Emotional Acknowledgment", "max_points": 5, "description": "Does the prompt instruct the AI to acknowledge emotions first?"}, {"criterion": "Validation", "max_points": 4, "description": "Does the prompt ensure the customer feels heard and validated?"}, {"criterion": "Resolution Path", "max_points": 4, "description": "Does the prompt specify a clear resolution with timeline?"}, {"criterion": "Goodwill Gesture", "max_points": 3, "description": "Does the prompt include a goodwill gesture beyond the basic fix?"}, {"criterion": "Human Tone", "max_points": 4, "description": "Does the prompt explicitly avoid corporate jargon and sound human?"}]',
  0,
  'standard',
  'beginner'
) ON CONFLICT (id) DO NOTHING;

-- 8.2 Issue Diagnosis (multi-step)
INSERT INTO public.exercises (id, workshop_id, title, instructions, system_prompt, model_config, rubric, sort_order, exercise_type, difficulty)
VALUES (
  'd0000000-0000-0000-0000-000000000802',
  'c0000000-0000-0000-0000-000000000008',
  'Issue Diagnosis: Multi-Step Troubleshooting',
  E'**Goal:** Design a multi-step diagnostic conversation for customer support.\n\n**Scenario:** A customer reports that they can''t export their data from the platform. The issue could be caused by multiple things: browser compatibility, file size limits, permission settings, or an actual bug.\n\n**This is a 3-step exercise. Each step is a phase of the diagnostic conversation.**',
  'You are a patient, methodical tech support specialist. Guide users through troubleshooting step by step. Never assume the user''s technical skill level — ask first.',
  '{"provider": "anthropic", "model": "claude-sonnet-4-6", "temperature": 0.4, "max_tokens": 800}',
  '[{"criterion": "Diagnostic Structure", "max_points": 5, "description": "Are the diagnostic phases logical and comprehensive?"}, {"criterion": "User-Friendly Language", "max_points": 4, "description": "Are instructions accessible to non-technical users?"}, {"criterion": "Decision Tree", "max_points": 4, "description": "Does the diagnosis follow a clear decision tree based on responses?"}, {"criterion": "Escalation Path", "max_points": 4, "description": "Is there a clear escalation path if self-service fails?"}, {"criterion": "Empathy", "max_points": 3, "description": "Does the diagnostic process maintain empathy throughout?"}]',
  1,
  'multi_step',
  'intermediate'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exercise_steps (id, exercise_id, step_number, instructions, system_prompt) VALUES
(
  'e0000000-0000-0000-0000-000000008021',
  'd0000000-0000-0000-0000-000000000802',
  0,
  E'**Phase 1: Information Gathering**\n\nWrite a prompt for the initial response that:\n- Acknowledges the issue with empathy\n- Asks 3-4 diagnostic questions (browser, OS, error message, when it started)\n- Phrases questions in a non-overwhelming way (not a wall of questions)\n- Offers to help regardless of the answer\n- Adapts tone based on the customer''s apparent frustration level',
  'You are beginning a diagnostic conversation. Gather essential information while keeping the customer calm and engaged.'
),
(
  'e0000000-0000-0000-0000-000000008022',
  'd0000000-0000-0000-0000-000000000802',
  1,
  E'**Phase 2: Guided Troubleshooting**\n\nWrite a prompt for the troubleshooting phase that:\n- Uses the information gathered in Phase 1 to narrow down the cause\n- Provides step-by-step instructions the customer can follow\n- Includes checkpoints ("Did that work? If yes... If no...")\n- Explains WHY each step might help (builds user confidence)\n- Handles the case where the first solution doesn''t work',
  'You are guiding the customer through solutions. Provide clear, numbered steps. Include decision points based on results.'
),
(
  'e0000000-0000-0000-0000-000000008023',
  'd0000000-0000-0000-0000-000000000802',
  2,
  E'**Phase 3: Resolution or Escalation**\n\nWrite a prompt for the final phase that handles two branches:\n- **If resolved:** Confirm the fix, explain what happened, offer prevention tips, and close gracefully\n- **If unresolved:** Escalate to human support with a warm handoff (include summary for the human agent, set customer expectations for response time)',
  'You are closing the support interaction. Either confirm resolution with prevention advice, or execute a smooth handoff to human support with full context.'
) ON CONFLICT (id) DO NOTHING;

-- 8.3 De-escalation Techniques
INSERT INTO public.exercises (id, workshop_id, title, instructions, system_prompt, model_config, rubric, sort_order, exercise_type, difficulty)
VALUES (
  'd0000000-0000-0000-0000-000000000803',
  'c0000000-0000-0000-0000-000000000008',
  'De-escalation: Turning Angry Customers Around',
  E'**Goal:** Write a prompt that handles angry, frustrated, or hostile customer interactions.\n\n**Key principle:** De-escalation follows the HEARD framework: Hear, Empathize, Apologize, Resolve, Diagnose. The critical mistake most AI makes is jumping to solutions before acknowledging feelings.\n\n**Scenario:** An angry customer writes:\n"THIS IS THE FOURTH TIME I''VE CONTACTED SUPPORT. NOBODY FIXES ANYTHING. My account has been locked for A WEEK and I''m losing business. Your company is a joke. I want to talk to your CEO right now or I''m going to post this all over social media. Fix this NOW."\n\n**Your task:** Write a prompt that instructs the AI to:\n- Not mirror the customer''s anger or become defensive\n- Use the HEARD framework: acknowledge feelings before presenting solutions\n- Address the "fourth time contacting support" frustration specifically\n- Provide a concrete resolution path with a timeline\n- Handle the "talk to your CEO" demand professionally\n- Address the social media threat without being threatening back\n- Set clear expectations for what happens next\n\n**Critical:** The prompt should produce a response that would genuinely calm someone down, not a template that feels like it came from a script.',
  'You are a senior customer support specialist trained in de-escalation. Never match anger with defensiveness. Acknowledge, validate, then resolve. Use the customer''s name if available. Be specific about actions and timelines.',
  '{"provider": "anthropic", "model": "claude-sonnet-4-6", "temperature": 0.5, "max_tokens": 800}',
  '[{"criterion": "De-escalation Technique", "max_points": 5, "description": "Does the prompt apply the HEARD framework or equivalent de-escalation technique?"}, {"criterion": "Emotional Intelligence", "max_points": 5, "description": "Does the prompt handle anger without defensiveness or dismissal?"}, {"criterion": "History Acknowledgment", "max_points": 3, "description": "Does the prompt address the repeated contact frustration?"}, {"criterion": "Demand Handling", "max_points": 3, "description": "Does the prompt handle CEO/escalation requests professionally?"}, {"criterion": "Concrete Resolution", "max_points": 4, "description": "Does the prompt specify a concrete resolution with timeline?"}]',
  2,
  'standard',
  'intermediate'
) ON CONFLICT (id) DO NOTHING;

-- 8.4 Knowledge Base Querying
INSERT INTO public.exercises (id, workshop_id, title, instructions, system_prompt, model_config, rubric, sort_order, exercise_type, difficulty)
VALUES (
  'd0000000-0000-0000-0000-000000000804',
  'c0000000-0000-0000-0000-000000000008',
  'Knowledge Base Prompting: Grounding AI in Your Docs',
  E'**Goal:** Write a system prompt that grounds AI responses in a knowledge base, reducing hallucination.\n\n**Key principle:** Customer support AI must give accurate answers. The best way to ensure accuracy is Retrieval-Augmented Generation (RAG) — grounding AI responses in your actual documentation. The system prompt controls how the AI uses (and doesn''t exceed) the provided context.\n\n**Scenario:** You''re writing the system prompt for a support bot that receives relevant knowledge base articles as context. The bot serves a project management SaaS tool.\n\n**Sample knowledge base article (will be injected as context):**\n"**Exporting Projects:** Users can export projects as CSV or PDF from Settings > Export. Pro plans can also export as JSON. Free users are limited to 3 exports per month. Exports over 10,000 rows may take up to 5 minutes to generate. If an export fails, check that the project has fewer than 50,000 rows."\n\n**Your task:** Write a system prompt (not a user prompt) that:\n- Instructs the AI to answer ONLY from the provided knowledge base context\n- Defines how to handle questions not covered by the context ("I don''t have that information, but...")\n- Specifies citation behavior (reference the article when answering)\n- Handles contradictions between user claims and KB content\n- Sets rules for when to suggest contacting human support\n- Prevents the AI from guessing answers not in the KB',
  'You are an AI safety and RAG system designer. Evaluate this system prompt for grounding accuracy, hallucination prevention, and helpful fallback behavior.',
  '{"provider": "anthropic", "model": "claude-sonnet-4-6", "temperature": 0.2, "max_tokens": 1000}',
  '[{"criterion": "Grounding Instructions", "max_points": 5, "description": "Does the system prompt strictly ground responses in the KB context?"}, {"criterion": "Hallucination Prevention", "max_points": 5, "description": "Does the prompt prevent the AI from inventing information?"}, {"criterion": "Graceful Fallback", "max_points": 4, "description": "How does the prompt handle questions not in the KB?"}, {"criterion": "Citation Behavior", "max_points": 3, "description": "Does the prompt specify how to reference source articles?"}, {"criterion": "Contradiction Handling", "max_points": 3, "description": "Does the prompt address user claims that conflict with KB content?"}]',
  3,
  'standard',
  'intermediate'
) ON CONFLICT (id) DO NOTHING;

-- 8.5 Escalation Protocols
INSERT INTO public.exercises (id, workshop_id, title, instructions, system_prompt, model_config, rubric, sort_order, exercise_type, difficulty, constraints)
VALUES (
  'd0000000-0000-0000-0000-000000000805',
  'c0000000-0000-0000-0000-000000000008',
  'Escalation Protocols: Knowing When AI Should Step Aside',
  E'**Goal:** Design a system prompt with clear, specific escalation protocols.\n\n**Key principle:** The best AI support systems know their limits. Clear escalation triggers prevent AI from attempting to handle situations it shouldn''t: legal threats, safety concerns, billing disputes over certain amounts, or cases requiring human judgment.\n\n**Scenario:** Design escalation protocols for an AI support bot at an e-commerce company.\n\n**Your task:** Write a system prompt section that defines:\n- At least 5 specific escalation triggers (situations that require human handoff)\n- The escalation message format (what info to include for the human agent)\n- How to communicate the escalation to the customer (setting expectations)\n- Priority levels (urgent escalation vs. standard queue)\n- What the AI should still do vs. immediately stop doing once escalation is triggered\n\n**Constraints:**\n- Must include the phrase "human handoff"\n- Must include the keyword "priority"\n- Cannot use the word "unfortunately" (overused in support, sounds insincere)',
  'You are designing escalation protocols for a production AI support system. Rate for completeness, specificity, and practical implementability.',
  '{"provider": "anthropic", "model": "claude-sonnet-4-6", "temperature": 0.3, "max_tokens": 1000}',
  '[{"criterion": "Trigger Specificity", "max_points": 5, "description": "Are escalation triggers specific and comprehensive (at least 5)?"}, {"criterion": "Handoff Information", "max_points": 4, "description": "Does the escalation include all necessary context for the human agent?"}, {"criterion": "Customer Communication", "max_points": 4, "description": "Is the escalation communicated clearly to the customer?"}, {"criterion": "Priority Levels", "max_points": 3, "description": "Are different urgency levels defined?"}, {"criterion": "Constraint Compliance", "max_points": 4, "description": "Includes ''human handoff'' and ''priority'', avoids ''unfortunately''?"}]',
  4,
  'constrained',
  'intermediate',
  '{"required_keywords": ["human handoff", "priority"], "forbidden_words": ["unfortunately"]}'
) ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 6. Learning Paths (4 paths)
-- ============================================================

-- Path 1: Prompt Engineering Fundamentals (101 → CoT → Advanced System Prompts)
INSERT INTO public.learning_paths (id, title, description, instructor_id, status)
VALUES (
  'f0000000-0000-0000-0000-000000000001',
  'Prompt Engineering Fundamentals',
  'The complete path from absolute beginner to system prompt architect. Start with the building blocks of effective prompting, master chain-of-thought reasoning for complex problems, then learn to design production-grade system prompts. Three workshops, five weeks, zero prerequisites.',
  'a0000000-0000-0000-0000-000000000001',
  'published'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.learning_path_workshops (id, path_id, workshop_id, sort_order, prerequisite_workshop_id) VALUES
  ('f1000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 0, NULL),
  ('f1000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 1, 'c0000000-0000-0000-0000-000000000001'),
  ('f1000000-0000-0000-0000-000000000003', 'f0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000007', 2, 'c0000000-0000-0000-0000-000000000002')
ON CONFLICT (id) DO NOTHING;

-- Path 2: AI for Content Creators (101 → Creative Writing → Business Communication)
INSERT INTO public.learning_paths (id, title, description, instructor_id, status)
VALUES (
  'f0000000-0000-0000-0000-000000000002',
  'AI for Content Creators',
  'From basic prompting to professional-quality AI-assisted content creation. Learn the fundamentals, then apply them to creative writing and business communication. Perfect for writers, marketers, and anyone who creates content professionally.',
  'a0000000-0000-0000-0000-000000000001',
  'published'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.learning_path_workshops (id, path_id, workshop_id, sort_order, prerequisite_workshop_id) VALUES
  ('f1000000-0000-0000-0000-000000000004', 'f0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 0, NULL),
  ('f1000000-0000-0000-0000-000000000005', 'f0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000003', 1, 'c0000000-0000-0000-0000-000000000001'),
  ('f1000000-0000-0000-0000-000000000006', 'f0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000006', 2, 'c0000000-0000-0000-0000-000000000003')
ON CONFLICT (id) DO NOTHING;

-- Path 3: AI-Powered Development (101 → CoT → Code Generation)
INSERT INTO public.learning_paths (id, title, description, instructor_id, status)
VALUES (
  'f0000000-0000-0000-0000-000000000003',
  'AI-Powered Development',
  'Turn AI into your most productive coding partner. Master prompt fundamentals, learn chain-of-thought reasoning for complex problem-solving, then apply everything to real-world code generation scenarios. Covers function specs, debugging, code review, architecture design, and TDD-style prompting.',
  'a0000000-0000-0000-0000-000000000001',
  'published'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.learning_path_workshops (id, path_id, workshop_id, sort_order, prerequisite_workshop_id) VALUES
  ('f1000000-0000-0000-0000-000000000007', 'f0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 0, NULL),
  ('f1000000-0000-0000-0000-000000000008', 'f0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000002', 1, 'c0000000-0000-0000-0000-000000000001'),
  ('f1000000-0000-0000-0000-000000000009', 'f0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000004', 2, 'c0000000-0000-0000-0000-000000000002')
ON CONFLICT (id) DO NOTHING;

-- Path 4: Data & Research with AI (101 → CoT → Data Analysis)
INSERT INTO public.learning_paths (id, title, description, instructor_id, status)
VALUES (
  'f0000000-0000-0000-0000-000000000004',
  'Data & Research with AI',
  'Master AI-assisted data analysis and research synthesis. Build your prompting foundation, learn structured reasoning techniques, then apply them to data summarization, trend analysis, comparative research, and statistical reasoning. Essential for analysts, researchers, and data-driven decision makers.',
  'a0000000-0000-0000-0000-000000000001',
  'published'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.learning_path_workshops (id, path_id, workshop_id, sort_order, prerequisite_workshop_id) VALUES
  ('f1000000-0000-0000-0000-000000000010', 'f0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000001', 0, NULL),
  ('f1000000-0000-0000-0000-000000000011', 'f0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000002', 1, 'c0000000-0000-0000-0000-000000000001'),
  ('f1000000-0000-0000-0000-000000000012', 'f0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000005', 2, 'c0000000-0000-0000-0000-000000000002')
ON CONFLICT (id) DO NOTHING;

COMMIT;
