import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";

type Params = { params: Promise<{ id: string }> };

// PATCH /api/paths/[id]/workshops/reorder
// Body: { order: [{ workshop_id: string, sort_order: number }] }
export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const session = await getSession();

  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pathResult = await pool.query(
    "SELECT instructor_id FROM learning_paths WHERE id = $1",
    [id]
  );

  if (pathResult.rows.length === 0) {
    return NextResponse.json({ error: "Path not found" }, { status: 404 });
  }

  if (pathResult.rows[0].instructor_id !== session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { order } = body as { order: { workshop_id: string; sort_order: number }[] };

  if (!Array.isArray(order) || order.length === 0) {
    return NextResponse.json({ error: "order array is required" }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const item of order) {
      await client.query(
        "UPDATE learning_path_workshops SET sort_order = $1 WHERE path_id = $2 AND workshop_id = $3",
        [item.sort_order, id, item.workshop_id]
      );
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  return NextResponse.json({ reordered: true });
}
