import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";

export async function POST(request: Request) {
  const body = await request.json();
  const { email, password, displayName, role } = body;

  if (!email || !password || !displayName || !role) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }

  if (!["instructor", "trainee"].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 }
    );
  }

  const client = await pool.connect();
  try {
    const existing = await client.query(
      "SELECT id FROM users WHERE email = $1",
      [email.toLowerCase()]
    );
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const result = await client.query(
      `INSERT INTO users (email, password_hash, display_name, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, display_name, role`,
      [email.toLowerCase(), passwordHash, displayName, role]
    );
    const user = result.rows[0];

    const session = await getSession();
    session.userId = user.id;
    session.email = user.email;
    session.role = user.role;
    session.displayName = user.display_name;
    await session.save();

    return NextResponse.json({ ok: true }, { status: 201 });
  } finally {
    client.release();
  }
}
