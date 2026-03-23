import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import pool from "@/lib/db";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

type RouteContext = { params: Promise<{ id: string }> };

function clamp(v: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, v));
}

function scoreColor(pct: number): [number, number, number] {
  if (pct >= 80) return [0.13, 0.77, 0.37]; // green
  if (pct >= 60) return [0.23, 0.51, 0.97]; // blue
  if (pct >= 40) return [0.98, 0.62, 0.02]; // orange
  return [0.94, 0.27, 0.27]; // red
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { id: workshopId } = await params;
  const session = await getSession();
  if (!session.userId || session.role !== "instructor") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const workshopRes = await pool.query(
    "SELECT id, title FROM workshops WHERE id = $1 AND instructor_id = $2",
    [workshopId, session.userId]
  );
  if (!workshopRes.rows[0]) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const workshop = workshopRes.rows[0] as { id: string; title: string };

  const [overviewRes, exerciseStatsRes, leaderboardRes] = await Promise.all([
    pool.query(
      `SELECT
         (SELECT COUNT(*)::int FROM enrollments WHERE workshop_id = $1) AS enrolled,
         COUNT(DISTINCT s.id)::int AS total_submissions,
         COUNT(DISTINCT s.trainee_id)::int AS unique_trainees,
         ROUND(AVG(sc.total_score / NULLIF(sc.max_score, 0) * 100), 1) AS avg_score_pct,
         (SELECT COUNT(*)::int FROM exercises WHERE workshop_id = $1) AS total_exercises
       FROM exercises e
       LEFT JOIN submissions s ON s.exercise_id = e.id
       LEFT JOIN scores sc ON sc.submission_id = s.id
       WHERE e.workshop_id = $1`,
      [workshopId]
    ),
    pool.query(
      `SELECT
         e.title AS exercise_title,
         COUNT(DISTINCT s.id)::int AS submission_count,
         ROUND(AVG(sc.total_score / NULLIF(sc.max_score, 0) * 100), 1) AS avg_score_pct
       FROM exercises e
       LEFT JOIN submissions s ON s.exercise_id = e.id
       LEFT JOIN scores sc ON sc.submission_id = s.id
       WHERE e.workshop_id = $1
       GROUP BY e.id, e.title, e.sort_order
       ORDER BY e.sort_order ASC`,
      [workshopId]
    ),
    pool.query(
      `SELECT
         u.display_name,
         ROUND(AVG(sc.total_score / NULLIF(sc.max_score, 0) * 100), 1) AS avg_score_pct,
         COUNT(DISTINCT s.exercise_id)::int AS exercises_completed
       FROM users u
       JOIN submissions s ON s.trainee_id = u.id
       JOIN exercises e ON s.exercise_id = e.id
       JOIN scores sc ON sc.submission_id = s.id
       WHERE e.workshop_id = $1
       GROUP BY u.id, u.display_name
       ORDER BY avg_score_pct DESC
       LIMIT 10`,
      [workshopId]
    ),
  ]);

  const ov = overviewRes.rows[0];
  const exercises = exerciseStatsRes.rows as { exercise_title: string; submission_count: number; avg_score_pct: number | null }[];
  const leaderboard = leaderboardRes.rows as { display_name: string; avg_score_pct: number; exercises_completed: number }[];

  // Build PDF
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const pageW = 595;
  const pageH = 842;
  const margin = 50;

  let page = doc.addPage([pageW, pageH]);
  let y = pageH - margin;

  const write = (text: string, x: number, yPos: number, size: number, bold = false, color: [number, number, number] = [0.1, 0.1, 0.1]) => {
    page.drawText(text, {
      x,
      y: yPos,
      size,
      font: bold ? fontBold : font,
      color: rgb(...color),
    });
  };

  // Header bar
  page.drawRectangle({ x: 0, y: pageH - 70, width: pageW, height: 70, color: rgb(0.22, 0.42, 0.93) });
  write("Workshop Analytics Report", margin, pageH - 38, 18, true, [1, 1, 1]);
  write(new Date().toLocaleDateString(), pageW - margin - 80, pageH - 38, 10, false, [0.85, 0.9, 1]);

  y = pageH - 90;

  // Workshop title
  write(workshop.title, margin, y, 14, true);
  y -= 25;

  // Overview stats
  const statItems = [
    { label: "Enrolled", value: String(ov?.enrolled ?? 0) },
    { label: "Submissions", value: String(ov?.total_submissions ?? 0) },
    { label: "Unique trainees", value: String(ov?.unique_trainees ?? 0) },
    { label: "Avg score", value: ov?.avg_score_pct != null ? `${ov.avg_score_pct}%` : "—" },
  ];

  const colW = (pageW - margin * 2) / 4;
  statItems.forEach((s, i) => {
    const x = margin + i * colW;
    page.drawRectangle({ x, y: y - 40, width: colW - 8, height: 42, color: rgb(0.95, 0.96, 0.98), borderColor: rgb(0.85, 0.87, 0.92), borderWidth: 1 });
    write(s.label, x + 8, y - 10, 8, false, [0.45, 0.5, 0.6]);
    write(s.value, x + 8, y - 28, 14, true);
  });
  y -= 60;

  // Per-exercise breakdown
  write("Exercise Performance", margin, y, 12, true);
  y -= 18;
  page.drawLine({ start: { x: margin, y }, end: { x: pageW - margin, y }, thickness: 1, color: rgb(0.87, 0.89, 0.93) });
  y -= 14;

  write("Exercise", margin, y, 9, true, [0.4, 0.4, 0.5]);
  write("Submissions", margin + 280, y, 9, true, [0.4, 0.4, 0.5]);
  write("Avg Score", margin + 360, y, 9, true, [0.4, 0.4, 0.5]);
  y -= 14;

  for (const ex of exercises) {
    if (y < margin + 80) {
      page = doc.addPage([pageW, pageH]);
      y = pageH - margin;
    }
    const truncTitle = ex.exercise_title.length > 44 ? ex.exercise_title.slice(0, 44) + "…" : ex.exercise_title;
    write(truncTitle, margin, y, 9);
    write(String(ex.submission_count), margin + 280, y, 9);
    if (ex.avg_score_pct != null) {
      const col = scoreColor(ex.avg_score_pct);
      write(`${ex.avg_score_pct}%`, margin + 360, y, 9, true, col);
      // Mini bar
      const barW = clamp(ex.avg_score_pct / 100) * 80;
      page.drawRectangle({ x: margin + 390, y: y - 2, width: 80, height: 8, color: rgb(0.9, 0.92, 0.95) });
      page.drawRectangle({ x: margin + 390, y: y - 2, width: barW, height: 8, color: rgb(...col) });
    } else {
      write("—", margin + 360, y, 9, false, [0.6, 0.6, 0.7]);
    }
    y -= 16;
  }

  y -= 10;

  // Leaderboard section
  if (leaderboard.length > 0) {
    if (y < margin + 150) {
      page = doc.addPage([pageW, pageH]);
      y = pageH - margin;
    }
    write("Top Performers", margin, y, 12, true);
    y -= 18;
    page.drawLine({ start: { x: margin, y }, end: { x: pageW - margin, y }, thickness: 1, color: rgb(0.87, 0.89, 0.93) });
    y -= 14;

    write("#", margin, y, 9, true, [0.4, 0.4, 0.5]);
    write("Trainee", margin + 20, y, 9, true, [0.4, 0.4, 0.5]);
    write("Exercises", margin + 280, y, 9, true, [0.4, 0.4, 0.5]);
    write("Avg Score", margin + 360, y, 9, true, [0.4, 0.4, 0.5]);
    y -= 14;

    leaderboard.forEach((entry, i) => {
      if (y < margin + 20) {
        page = doc.addPage([pageW, pageH]);
        y = pageH - margin;
      }
      write(String(i + 1), margin, y, 9, false, [0.55, 0.55, 0.65]);
      const truncName = entry.display_name.length > 38 ? entry.display_name.slice(0, 38) + "…" : entry.display_name;
      write(truncName, margin + 20, y, 9);
      write(String(entry.exercises_completed), margin + 280, y, 9);
      const col = scoreColor(entry.avg_score_pct);
      write(`${entry.avg_score_pct}%`, margin + 360, y, 9, true, col);
      y -= 14;
    });
  }

  // Footer
  const lastPage = doc.getPages()[doc.getPageCount() - 1];
  lastPage.drawText("Generated by PromptingSchool", {
    x: margin, y: 20, size: 8, font, color: rgb(0.7, 0.7, 0.75),
  });

  const pdfBytes = await doc.save();

  return new NextResponse(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="workshop-report-${workshopId.slice(0, 8)}.pdf"`,
    },
  });
}
