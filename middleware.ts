import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  // Refreshes the session cookie if expired. Do not remove.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Single-user app with no login screen: sign the owner in automatically using
  // server-only credentials. They never reach the browser bundle.
  if (!user) {
    const email = process.env.FITRACK_EMAIL;
    const password = process.env.FITRACK_PASSWORD;
    if (!email || !password) {
      return new NextResponse("Fitrack isn't set up: add FITRACK_EMAIL and FITRACK_PASSWORD in Vercel.", {
        status: 500,
      });
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return new NextResponse(`Fitrack couldn't sign in: ${error.message}`, { status: 500 });
    }
  }

  return response;
}

export const config = {
  // Skip static assets, PWA files and icons so they load without auth.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icons/|apple-touch-icon.png|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)",
  ],
};
