import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";

// Replace all tags for a workshop
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();

  if (!session.userId || session.role !== "instructor") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Verify ownership
  const ownership = await pool.query(
    "SELECT id FROM workshops WHERE id = $1 AND instructor_id = $2",
    [id, session.userId]
  );
  if (ownership.rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { tags } = await request.json(); // array of tag name strings
  if (!Array.isArray(tags)) {
    return NextResponse.json({ error: "tags must be an array" }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Delete existing tag links
    await client.query("DELETE FROM workshop_tag_links WHERE workshop_id = $1", [id]);

    if (tags.length > 0) {
      // Upsert all tags and get their IDs
      for (const tagName of tags.slice(0, 10)) {
        const trimmed = String(tagName).trim().toLowerCase();
        if (!trimmed) continue;

        const tagResult = await client.query(
          `INSERT INTO workshop_tags (name)
           VALUES ($1)
           ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
           RETURNING id`,
          [trimmed]
        );
        const tagId = tagResult.rows[0].id;

        await client.query(
          "INSERT INTO workshop_tag_links (workshop_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
          [id, tagId]
        );
      }
    }

    await client.query("COMMIT");

    // Return current tags
    const result = await pool.query(
      `SELECT wt.id, wt.name
       FROM workshop_tag_links wtl
       JOIN workshop_tags wt ON wt.id = wtl.tag_id
       WHERE wtl.workshop_id = $1
       ORDER BY wt.name`,
      [id]
    );
    return NextResponse.json(result.rows);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
