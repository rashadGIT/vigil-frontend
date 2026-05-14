import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const accessToken: string = body.accessToken;
  const expiresIn: number = body.expiresIn ?? 3600;

  if (!accessToken) {
    return NextResponse.json({ error: 'Missing accessToken' }, { status: 400 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set('access_token', accessToken, {
    path: '/',
    maxAge: expiresIn,
    sameSite: 'lax',
    secure: true,
    httpOnly: false,
  });
  return res;
}
