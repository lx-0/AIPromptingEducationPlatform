import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";
import { scheduleReengagement } from "@/lib/queue";

export async function POST(request: Request) {
  const body = await request.json();
  const { email, password } = body;

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 }
    );
  }

  const result = await pool.query(
    "SELECT id, email, password_hash, display_name, role, is_admin FROM users WHERE email = $1",
    [email.toLowerCase()]
  );
  const user = result.rows[0];

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  if (user.is_disabled) {
    return NextResponse.json({ error: "Account disabled" }, { status: 403 });
  }

  const session = await getSession();
  session.userId = user.id;
  session.email = user.email;
  session.role = user.role;
  session.displayName = user.display_name;
  session.isAdmin = user.is_admin ?? false;
  await session.save();

  // Reschedule re-engagement — if user becomes inactive again, they'll get a nudge
  scheduleReengagement(user.id).catch(() => {});

  return NextResponse.json({ ok: true });
}
