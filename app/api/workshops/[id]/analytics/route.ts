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

  // Export analytics summary as CSV
  const result = await pool.query(
    `SELECT
       e.title AS exercise_title,
       e.sort_order,
       COUNT(DISTINCT s.id)::int AS submission_count,
       COUNT(DISTINCT s.trainee_id)::int AS unique_submitters,
       ROUND(AVG(sc.total_score / NULLIF(sc.max_score, 0) * 100), 1) AS avg_score_pct,
       (SELECT COUNT(*) FROM enrollments WHERE workshop_id = $1) AS enrolled_count
     FROM exercises e
     LEFT JOIN submissions s ON s.exercise_id = e.id
     LEFT JOIN scores sc ON sc.submission_id = s.id
     WHERE e.workshop_id = $1
     GROUP BY e.id, e.title, e.sort_order
     ORDER BY e.sort_order ASC`,
    [id]
  );

  const headers = [
    "Exercise",
    "Submissions",
    "Unique Trainees",
    "Avg Score %",
    "Enrolled Count",
  ];

  const rows = result.rows.map((row) =>
    [
      escapeCSV(row.exercise_title),
      escapeCSV(row.submission_count),
      escapeCSV(row.unique_submitters),
      escapeCSV(row.avg_score_pct),
      escapeCSV(row.enrolled_count),
    ].join(",")
  );

  const csv = [headers.join(","), ...rows].join("\n");
  const filename = `${workshop.title.replace(/[^a-z0-9]/gi, "_")}_analytics.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
