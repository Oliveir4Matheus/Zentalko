import { router, protectedProcedure } from '../trpc';

export const exportRouter = router({
  userData: protectedProcedure.query(async ({ ctx }) => {
    const [user, flashcards, reviewLogs, books, readingSessions, readingWords, gamification] =
      await Promise.all([
        ctx.prisma.user.findUnique({ where: { id: ctx.userId } }),
        ctx.prisma.flashcard.findMany({ where: { userId: ctx.userId } }),
        ctx.prisma.reviewLog.findMany({ where: { userId: ctx.userId } }),
        ctx.prisma.book.findMany({
          where: { userId: ctx.userId },
          include: { chapters: true },
        }),
        ctx.prisma.readingSession.findMany({ where: { userId: ctx.userId } }),
        ctx.prisma.readingWord.findMany({ where: { userId: ctx.userId } }),
        ctx.prisma.gamificationState.findUnique({ where: { userId: ctx.userId } }),
      ]);

    if (!user) {
      return {
        user: null,
        flashcards,
        reviewLogs,
        books,
        readingSessions,
        readingWords,
        gamification,
        settings: {},
      };
    }

    const { passwordHash: _ph, ...safeUser } = user;

    return {
      user: safeUser,
      flashcards,
      reviewLogs,
      books,
      readingSessions,
      readingWords,
      gamification,
      settings: {
        dailyNewCardLimit: user.dailyNewCardLimit,
        dailyStudyMinutesGoal: user.dailyStudyMinutesGoal,
        cefrLevel: user.cefrLevel,
        nativeLanguage: user.nativeLanguage,
        targetLanguage: user.targetLanguage,
        uiLocale: user.uiLocale,
      },
    };
  }),
});
