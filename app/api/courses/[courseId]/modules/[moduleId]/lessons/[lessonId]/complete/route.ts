export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const fallbackUrl = new URL("/", request.url);
  const redirectUrl = request.headers.get("referer") ?? fallbackUrl.toString();

  return Response.redirect(redirectUrl, 303);
}
