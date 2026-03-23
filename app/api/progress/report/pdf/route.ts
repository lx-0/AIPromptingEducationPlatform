import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import pool from "@/lib/db";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

function scoreColor(pct: number): [number, number, number] {
  if (pct >= 80) return [0.13, 0.77, 0.37];
  if (pct >= 60) return [0.23, 0.51, 0.97];
  if (pct >= 40) return [0.98, 0.62, 0.02];
  return [0.94, 0.27, 0.27];
}

export async function GET() {
  const session = await getSession();
  if (!session.userId) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  if (session.role !== "trainee") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const userId = session.userId;

  const [overviewRes, criterionRes, workshopProgressRes, trendRes] = await Promise.all([
    pool.query(
      `SELECT
         COUNT(DISTINCT s.id)::int AS total_submissions,
         COUNT(DISTINCT sc.id)::int AS scored_submissions,
         ROUND(AVG(sc.total_score / NULLIF(sc.max_score, 0) * 100), 1) AS avg_score_pct
       FROM submissions s
       LEFT JOIN scores sc ON sc.submission_id = s.id
       WHERE s.trainee_id = $1`,
      [userId]
    ),
    pool.query(
      `SELECT
         (crit->>'criterion') AS criterion,
         ROUND(AVG((crit->>'score')::numeric / NULLIF((rubric_item->>'max_points')::numeric, 0) * 100), 1) AS avg_pct,
         COUNT(*)::int AS submission_count
       FROM submissions s
       JOIN scores sc ON sc.submission_id = s.id
       JOIN exercises e ON s.exercise_id = e.id
       JOIN LATERAL jsonb_array_elements(sc.feedback->'criteria') AS crit ON true
       JOIN LATERAL jsonb_array_elements(e.rubric) AS rubric_item
         ON rubric_item->>'criterion' = crit->>'criterion'
       WHERE s.trainee_id = $1
       GROUP BY crit->>'criterion'
       ORDER BY avg_pct DESC`,
      [userId]
    ),
    pool.query(
      `SELECT
         w.title AS workshop_title,
         COUNT(DISTINCT s.exercise_id)::int AS completed,
         (SELECT COUNT(*)::int FROM exercises WHERE workshop_id = w.id) AS total,
         ROUND(AVG(sc.total_score / NULLIF(sc.max_score, 0) * 100), 1) AS avg_score_pct
       FROM enrollments en
       JOIN workshops w ON w.id = en.workshop_id
       LEFT JOIN exercises ex ON ex.workshop_id = w.id
       LEFT JOIN submissions s ON s.exercise_id = ex.id AND s.trainee_id = en.trainee_id
       LEFT JOIN scores sc ON sc.submission_id = s.id
       WHERE en.trainee_id = $1
       GROUP BY w.id, w.title
       ORDER BY w.title ASC`,
      [userId]
    ),
    pool.query(
      `SELECT
         DATE_TRUNC('week', s.submitted_at)::date::text AS week,
         ROUND(AVG(sc.total_score / NULLIF(sc.max_score, 0) * 100), 1) AS avg_score_pct
       FROM submissions s
       JOIN scores sc ON sc.submission_id = s.id
       WHERE s.trainee_id = $1
         AND s.submitted_at > NOW() - INTERVAL '12 weeks'
       GROUP BY DATE_TRUNC('week', s.submitted_at)
       ORDER BY week ASC`,
      [userId]
    ),
  ]);

  const ov = overviewRes.rows[0];
  const criteria = criterionRes.rows as { criterion: string; avg_pct: number; submission_count: number }[];
  const workshopProgress = workshopProgressRes.rows as { workshop_title: string; completed: number; total: number; avg_score_pct: number | null }[];
  const trend = trendRes.rows as { week: string; avg_score_pct: number }[];

  const strengths = criteria.slice(0, 5);
  const weaknesses = [...criteria].sort((a, b) => a.avg_pct - b.avg_pct).slice(0, 5);

  // Build PDF
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const pageW = 595;
  const pageH = 842;
  const margin = 50;

  let page = doc.addPage([pageW, pageH]);
  let y = pageH - margin;

  const write = (
    text: string,
    x: number,
    yPos: number,
    size: number,
    bold = false,
    color: [number, number, number] = [0.1, 0.1, 0.1]
  ) => {
    page.drawText(text, { x, y: yPos, size, font: bold ? fontBold : font, color: rgb(...color) });
  };

  // Header
  page.drawRectangle({ x: 0, y: pageH - 70, width: pageW, height: 70, color: rgb(0.08, 0.67, 0.42) });
  write("Personal Progress Report", margin, pageH - 38, 18, true, [1, 1, 1]);
  write(new Date().toLocaleDateString(), pageW - margin - 80, pageH - 38, 10, false, [0.85, 1, 0.9]);

  y = pageH - 90;
  write(`Trainee: ${session.displayName ?? "You"}`, margin, y, 12, true);
  y -= 25;

  // Overview stats
  const statItems = [
    { label: "Submissions", value: String(ov?.total_submissions ?? 0) },
    { label: "Scored", value: String(ov?.scored_submissions ?? 0) },
    { label: "Overall avg", value: ov?.avg_score_pct != null ? `${ov.avg_score_pct}%` : "—" },
    { label: "Workshops", value: String(workshopProgress.length) },
  ];

  const colW = (pageW - margin * 2) / 4;
  statItems.forEach((s, i) => {
    const x = margin + i * colW;
    page.drawRectangle({ x, y: y - 40, width: colW - 8, height: 42, color: rgb(0.95, 0.98, 0.96), borderColor: rgb(0.82, 0.92, 0.86), borderWidth: 1 });
    write(s.label, x + 8, y - 10, 8, false, [0.4, 0.55, 0.45]);
    write(s.value, x + 8, y - 28, 14, true);
  });
  y -= 60;

  // Strengths
  write("Strengths (top scoring criteria)", margin, y, 12, true);
  y -= 18;
  page.drawLine({ start: { x: margin, y }, end: { x: pageW - margin, y }, thickness: 1, color: rgb(0.82, 0.92, 0.86) });
  y -= 14;

  if (strengths.length === 0) {
    write("No scored submissions yet.", margin, y, 9, false, [0.6, 0.6, 0.6]);
    y -= 14;
  } else {
    for (const s of strengths) {
      const truncCrit = s.criterion.length > 50 ? s.criterion.slice(0, 50) + "…" : s.criterion;
      write(truncCrit, margin, y, 9);
      const col = scoreColor(s.avg_pct);
      write(`${s.avg_pct}%`, margin + 320, y, 9, true, col);
      const barW = (s.avg_pct / 100) * 100;
      page.drawRectangle({ x: margin + 340, y: y - 2, width: 100, height: 8, color: rgb(0.9, 0.95, 0.91) });
      page.drawRectangle({ x: margin + 340, y: y - 2, width: barW, height: 8, color: rgb(...col) });
      y -= 16;
    }
  }
  y -= 8;

  // Areas to improve
  write("Areas to Improve (lowest scoring criteria)", margin, y, 12, true);
  y -= 18;
  page.drawLine({ start: { x: margin, y }, end: { x: pageW - margin, y }, thickness: 1, color: rgb(0.93, 0.87, 0.82) });
  y -= 14;

  if (weaknesses.length === 0) {
    write("No scored submissions yet.", margin, y, 9, false, [0.6, 0.6, 0.6]);
    y -= 14;
  } else {
    for (const w of weaknesses) {
      const truncCrit = w.criterion.length > 50 ? w.criterion.slice(0, 50) + "…" : w.criterion;
      write(truncCrit, margin, y, 9);
      const col = scoreColor(w.avg_pct);
      write(`${w.avg_pct}%`, margin + 320, y, 9, true, col);
      const barW = (w.avg_pct / 100) * 100;
      page.drawRectangle({ x: margin + 340, y: y - 2, width: 100, height: 8, color: rgb(0.95, 0.91, 0.88) });
      page.drawRectangle({ x: margin + 340, y: y - 2, width: barW, height: 8, color: rgb(...col) });
      y -= 16;
    }
  }
  y -= 10;

  // Workshop progress
  if (workshopProgress.length > 0) {
    if (y < margin + 120) {
      page = doc.addPage([pageW, pageH]);
      y = pageH - margin;
    }
    write("Workshop Progress", margin, y, 12, true);
    y -= 18;
    page.drawLine({ start: { x: margin, y }, end: { x: pageW - margin, y }, thickness: 1, color: rgb(0.87, 0.89, 0.93) });
    y -= 14;

    write("Workshop", margin, y, 9, true, [0.4, 0.4, 0.5]);
    write("Progress", margin + 280, y, 9, true, [0.4, 0.4, 0.5]);
    write("Avg Score", margin + 360, y, 9, true, [0.4, 0.4, 0.5]);
    y -= 14;

    for (const wp of workshopProgress) {
      if (y < margin + 20) {
        page = doc.addPage([pageW, pageH]);
        y = pageH - margin;
      }
      const truncTitle = wp.workshop_title.length > 38 ? wp.workshop_title.slice(0, 38) + "…" : wp.workshop_title;
      write(truncTitle, margin, y, 9);
      const pct = wp.total > 0 ? wp.completed / wp.total : 0;
      write(`${wp.completed}/${wp.total}`, margin + 280, y, 9);
      page.drawRectangle({ x: margin + 315, y: y - 2, width: 40, height: 8, color: rgb(0.9, 0.92, 0.95) });
      page.drawRectangle({ x: margin + 315, y: y - 2, width: pct * 40, height: 8, color: rgb(0.23, 0.51, 0.97) });
      if (wp.avg_score_pct != null) {
        const col = scoreColor(wp.avg_score_pct);
        write(`${wp.avg_score_pct}%`, margin + 360, y, 9, true, col);
      } else {
        write("—", margin + 360, y, 9, false, [0.6, 0.6, 0.7]);
      }
      y -= 16;
    }
  }

  // Score trend as text table
  if (trend.length > 0) {
    if (y < margin + 100) {
      page = doc.addPage([pageW, pageH]);
      y = pageH - margin;
    }
    y -= 10;
    write("Weekly Score Trend (last 12 weeks)", margin, y, 12, true);
    y -= 18;
    page.drawLine({ start: { x: margin, y }, end: { x: pageW - margin, y }, thickness: 1, color: rgb(0.87, 0.89, 0.93) });
    y -= 14;

    const colCount = Math.min(trend.length, 6);
    const trendColW = (pageW - margin * 2) / colCount;
    const chunk = trend.slice(-colCount);
    chunk.forEach((t, i) => {
      const x = margin + i * trendColW;
      const weekLabel = new Date(t.week).toLocaleDateString(undefined, { month: "short", day: "numeric" });
      write(weekLabel, x, y, 8, false, [0.55, 0.55, 0.65]);
      const col = scoreColor(t.avg_score_pct);
      write(`${t.avg_score_pct}%`, x, y - 14, 11, true, col);
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
      "Content-Disposition": `attachment; filename="progress-report.pdf"`,
    },
  });
}
