import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";
import { getTemplateById, WORKSHOP_TEMPLATES } from "@/lib/templates";

export async function GET() {
  const session = await getSession();

  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const templates = WORKSHOP_TEMPLATES.map(({ id, name, description, difficulty, estimatedMinutes, exercises }) => ({
    id,
    name,
    description,
    difficulty,
    estimatedMinutes,
    exerciseCount: exercises.length,
    exercises: exercises.map(({ title, instructions, rubric }) => ({
      title,
      instructions,
      rubric,
    })),
  }));

  return NextResponse.json(templates);
}

export async function POST(request: Request) {
  const session = await getSession();

  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.role !== "instructor") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { templateId } = body;

  if (!templateId) {
    return NextResponse.json({ error: "templateId is required" }, { status: 400 });
  }

  const template = getTemplateById(templateId);

  if (!template) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const workshopResult = await client.query(
      "INSERT INTO workshops (title, description, instructor_id) VALUES ($1, $2, $3) RETURNING *",
      [template.name, template.description, session.userId]
    );
    const workshop = workshopResult.rows[0];

    for (let i = 0; i < template.exercises.length; i++) {
      const ex = template.exercises[i];
      await client.query(
        `INSERT INTO exercises (workshop_id, title, instructions, system_prompt, model_config, rubric, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          workshop.id,
          ex.title,
          ex.instructions,
          ex.system_prompt ?? null,
          JSON.stringify(ex.model_config),
          JSON.stringify(ex.rubric),
          i,
        ]
      );
    }

    await client.query("COMMIT");
    return NextResponse.json(workshop, { status: 201 });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Failed to create workshop from template:", err);
    return NextResponse.json({ error: "Failed to create workshop from template" }, { status: 500 });
  } finally {
    client.release();
  }
}
