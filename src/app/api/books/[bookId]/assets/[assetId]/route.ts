import { NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { getCurrentUser } from '@/server/session';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ bookId: string; assetId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse('Unauthorized', { status: 401 });
  const { bookId, assetId } = await params;

  const asset = await prisma.bookAsset.findFirst({
    where: { id: assetId, bookId, book: { userId: user.id } },
    select: { mime: true, data: true },
  });
  if (!asset) return new NextResponse('Not found', { status: 404 });

  const body = new Uint8Array(asset.data);
  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': asset.mime || 'application/octet-stream',
      'Cache-Control': 'private, max-age=31536000, immutable',
    },
  });
}
