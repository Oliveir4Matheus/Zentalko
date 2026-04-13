import Link from 'next/link';

export default function PreviewIndex() {
  return (
    <main className="mx-auto max-w-xl p-10">
      <h1 className="mb-4 text-2xl font-semibold">UI Preview</h1>
      <p className="mb-6 text-neutral-600">Escolha um estilo para visualizar:</p>
      <div className="grid gap-3">
        <Link
          href="/preview/readwise"
          className="rounded-lg border border-neutral-200 p-4 hover:bg-neutral-50"
        >
          <div className="font-medium">Readwise</div>
          <div className="text-sm text-neutral-500">Editorial, calmo, serifado. Foco em leitura e estudo.</div>
        </Link>
        <Link
          href="/preview/duolingo"
          className="rounded-lg border border-neutral-200 p-4 hover:bg-neutral-50"
        >
          <div className="font-medium">Duolingo</div>
          <div className="text-sm text-neutral-500">Lúdico, arredondado, gamificado. Foco em progresso e streak.</div>
        </Link>
      </div>
    </main>
  );
}
