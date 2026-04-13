import { router } from './trpc';
import { buildContext } from './context';
import { settingsRouter } from './routers/settings';
import { flashcardsRouter } from './routers/flashcards';
import { readingRouter } from './routers/reading';
import { statsRouter } from './routers/stats';
import { exportRouter } from './routers/export';

export const appRouter = router({
  settings: settingsRouter,
  flashcards: flashcardsRouter,
  reading: readingRouter,
  stats: statsRouter,
  export: exportRouter,
});

export type AppRouter = typeof appRouter;

export function createCaller(input: { userId: string; locale: string }) {
  return appRouter.createCaller(buildContext(input));
}
