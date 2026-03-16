import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";

function escapeCSV(value: string | number | null | undefined): string {
  if (value == null) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();

  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.role !== "instructor") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const workshopResult = await pool.query(
    "SELECT id, title FROM workshops WHERE id = $1 AND instructor_id = $2",
    [id, session.userId]
  );

  if (workshopResult.rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const workshop = workshopResult.rows[0];

  const result = await pool.query(
    `SELECT
       s.prompt_text,
       s.submitted_at,
       p.display_name AS trainee_name,
       e.title AS exercise_title,
       sc.total_score,
       sc.max_score,
       sc.feedback
     FROM submissions s
     JOIN exercises e ON s.exercise_id = e.id
     JOIN profiles p ON s.trainee_id = p.id
     LEFT JOIN scores sc ON sc.submission_id = s.id
     WHERE e.workshop_id = $1
     ORDER BY s.submitted_at DESC`,
    [id]
  );

  const headers = [
    "Trainee Name",
    "Exercise Title",
    "Prompt Text",
    "Score",
    "Max Score",
    "Feedback Summary",
    "Submitted At",
  ];

  const rows = result.rows.map((row) => {
    const feedbackSummary =
      row.feedback && typeof row.feedback === "object"
        ? (row.feedback.overall ?? "")
        : "";

    return [
      escapeCSV(row.trainee_name),
      escapeCSV(row.exercise_title),
      escapeCSV(row.prompt_text),
      escapeCSV(row.total_score),
      escapeCSV(row.max_score),
      escapeCSV(feedbackSummary),
      escapeCSV(row.submitted_at ? new Date(row.submitted_at).toISOString() : ""),
    ].join(",");
  });

  const csv = [headers.join(","), ...rows].join("\n");
  const filename = `${workshop.title.replace(/[^a-z0-9]/gi, "_")}_submissions.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
