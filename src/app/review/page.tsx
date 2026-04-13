import { ReviewClient } from './review-client';

export default function ReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  return <ReviewPageInner searchParams={searchParams} />;
}

async function ReviewPageInner({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const sp = await searchParams;
  return <ReviewClient mode={sp.mode === 'typing' ? 'typing' : 'default'} />;
}
