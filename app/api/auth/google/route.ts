import { NextResponse } from "next/server";

function base64url(buffer: ArrayBuffer): string {
  return Buffer.from(buffer)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const next = searchParams.get("next") ?? "/dashboard";

  // Generate PKCE code_verifier (32 random bytes → base64url)
  const randomBytes = crypto.getRandomValues(new Uint8Array(32));
  const codeVerifier = base64url(randomBytes.buffer as ArrayBuffer);

  // Compute code_challenge = base64url(SHA-256(codeVerifier))
  const encoded = new TextEncoder().encode(codeVerifier);
  const hash = await crypto.subtle.digest("SHA-256", encoded);
  const codeChallenge = base64url(hash);

  const state = Buffer.from(JSON.stringify({ next })).toString("base64url");

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`,
    response_type: "code",
    scope: "openid email profile",
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    state,
  });

  const response = NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params}`
  );

  // Store code_verifier in a short-lived httpOnly cookie for the callback
  response.cookies.set("oauth_pkce", codeVerifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 10, // 10 minutes
    path: "/",
  });

  return response;
}
