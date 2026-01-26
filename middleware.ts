import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(req: NextRequest) {
  const token = await getToken({ req })

  // not logged in
  if (!token) {
    return NextResponse.redirect(
      new URL("/api/auth/signin", req.url)
    )
  }

  // logged in but not admin
  if (token.role !== "admin") {
    return NextResponse.redirect(
      new URL("/", req.url)
    )
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*"],
}
