import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";
import { scheduleReengagement } from "@/lib/queue";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { checkCsrfOrigin } from "@/lib/csrf";
import { z } from "zod";

const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(request: Request) {
  const csrfError = checkCsrfOrigin(request);
  if (csrfError) {
    return NextResponse.json({ error: csrfError }, { status: 403 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { allowed, remaining, resetAt } = await checkRateLimit(
    `sign-in:${ip}`,
    10,
    60
  );
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many sign-in attempts. Please wait before trying again." },
      { status: 429, headers: rateLimitHeaders(remaining, resetAt) }
    );
  }

  const raw = await request.json();
  const parsed = signInSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const { email, password } = parsed.data;

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
