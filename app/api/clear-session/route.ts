import { NextResponse } from "next/server";





export async function GET(request: Request) {
  const res = NextResponse.redirect(new URL("/sign-in", request.url));
  
  
  
  
  res.headers.set("Location", "/sign-in");
  res.cookies.delete("auth_token");
  res.cookies.delete("selected_branch");
  return res;
}
