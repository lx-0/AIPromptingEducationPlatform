import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";
import { sendWelcomeEmail } from "@/lib/email";

interface GoogleTokenResponse {
  access_token: string;
  id_token: string;
}

interface GoogleUserInfo {
  sub: string;
  email: string;
  name: string;
  email_verified: boolean;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const stateParam = searchParams.get("state");
  const errorParam = searchParams.get("error");

  if (errorParam) {
    return NextResponse.redirect(
      new URL(`/auth/sign-in?error=${encodeURIComponent(errorParam)}`, request.url)
    );
  }

  if (!code || !stateParam) {
    return NextResponse.redirect(new URL("/auth/sign-in?error=invalid_callback", request.url));
  }

  // Read and clear the PKCE code_verifier cookie
  const cookieHeader = request.headers.get("cookie") ?? "";
  const codeVerifier = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("oauth_pkce="))
    ?.slice("oauth_pkce=".length);

  if (!codeVerifier) {
    return NextResponse.redirect(new URL("/auth/sign-in?error=session_expired", request.url));
  }

  let next = "/dashboard";
  try {
    const state = JSON.parse(Buffer.from(stateParam, "base64url").toString("utf8"));
    if (state.next) next = state.next;
  } catch {
    // ignore malformed state
  }

  // Exchange code for tokens
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`,
      grant_type: "authorization_code",
      code_verifier: codeVerifier,
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(new URL("/auth/sign-in?error=token_exchange_failed", request.url));
  }

  const tokens: GoogleTokenResponse = await tokenRes.json();

  // Fetch user info
  const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  if (!userInfoRes.ok) {
    return NextResponse.redirect(new URL("/auth/sign-in?error=userinfo_failed", request.url));
  }

  const googleUser: GoogleUserInfo = await userInfoRes.json();

  if (!googleUser.email_verified) {
    return NextResponse.redirect(
      new URL("/auth/sign-in?error=email_not_verified", request.url)
    );
  }

  const client = await pool.connect();
  try {
    // Check if a user with this Google ID already exists
    const byOAuth = await client.query(
      "SELECT id, email, display_name, role, is_admin, is_disabled FROM users WHERE oauth_provider = 'google' AND oauth_provider_id = $1",
      [googleUser.sub]
    );

    if (byOAuth.rows.length > 0) {
      // Returning OAuth user — log them in directly
      const user = byOAuth.rows[0];
      if (user.is_disabled) {
        return NextResponse.redirect(new URL("/auth/sign-in?error=account_disabled", request.url));
      }
      const session = await getSession();
      session.userId = user.id;
      session.email = user.email;
      session.role = user.role;
      session.displayName = user.display_name;
      session.isAdmin = user.is_admin ?? false;
      await session.save();

      const response = NextResponse.redirect(new URL(next, request.url));
      response.cookies.delete("oauth_pkce");
      return response;
    }

    // Check if an email/password account with this email already exists
    const byEmail = await client.query(
      "SELECT id, email, display_name, role, is_admin, is_disabled FROM users WHERE email = $1",
      [googleUser.email.toLowerCase()]
    );

    if (byEmail.rows.length > 0) {
      // Link Google to existing account
      const user = byEmail.rows[0];
      if (user.is_disabled) {
        return NextResponse.redirect(new URL("/auth/sign-in?error=account_disabled", request.url));
      }
      await client.query(
        "UPDATE users SET oauth_provider = 'google', oauth_provider_id = $1 WHERE id = $2",
        [googleUser.sub, user.id]
      );

      const session = await getSession();
      session.userId = user.id;
      session.email = user.email;
      session.role = user.role;
      session.displayName = user.display_name;
      session.isAdmin = user.is_admin ?? false;
      await session.save();

      const response = NextResponse.redirect(new URL(next, request.url));
      response.cookies.delete("oauth_pkce");
      return response;
    }

    // Brand-new user — store OAuth details in session and redirect to role selection
    const session = await getSession();
    session.pendingOAuth = {
      googleId: googleUser.sub,
      email: googleUser.email.toLowerCase(),
      displayName: googleUser.name,
    };
    await session.save();

    const response = NextResponse.redirect(
      new URL(`/auth/google/complete?next=${encodeURIComponent(next)}`, request.url)
    );
    response.cookies.delete("oauth_pkce");
    return response;
  } finally {
    client.release();
  }
}
