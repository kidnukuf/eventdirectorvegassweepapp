import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import {
  getAllBowlers,
  searchBowlers,
  getBowlerById,
  createBowler,
  updateBowlerStatus,
  checkInBowler,
  getCheckedInBowlerIds,
  getTeamWithBowlers,
  getAllTeams,
  getAllLeagues,
  getAllCenters,
  getEventStats,
  getAuditLog,
  writeAuditLog,
  generateScantronId,
  getNextBowlerPosition,
} from "./db";

const DEFAULT_EVENT_ID = 1;

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Admin / Event Director ──────────────────────────────────────────
  admin: router({
    getStats: publicProcedure
      .input(z.object({ eventId: z.number().default(DEFAULT_EVENT_ID) }))
      .query(({ input }) => getEventStats(input.eventId)),

    getBowlers: publicProcedure
      .input(z.object({
        eventId: z.number().default(DEFAULT_EVENT_ID),
        search: z.string().optional(),
      }))
      .query(async ({ input }) => {
        if (input.search && input.search.trim()) {
          return searchBowlers(input.eventId, input.search.trim());
        }
        return getAllBowlers(input.eventId);
      }),

    getAuditLog: publicProcedure
      .input(z.object({ eventId: z.number().default(DEFAULT_EVENT_ID), limit: z.number().default(50) }))
      .query(({ input }) => getAuditLog(input.eventId, input.limit)),

    getTeams: publicProcedure
      .input(z.object({ eventId: z.number().default(DEFAULT_EVENT_ID) }))
      .query(({ input }) => getAllTeams(input.eventId)),

    getLeagues: publicProcedure
      .input(z.object({ eventId: z.number().default(DEFAULT_EVENT_ID) }))
      .query(({ input }) => getAllLeagues(input.eventId)),

    getCenters: publicProcedure.query(() => getAllCenters()),

    updateBowlerStatus: publicProcedure
      .input(z.object({ bowlerId: z.number(), status: z.string() }))
      .mutation(async ({ input }) => {
        await updateBowlerStatus(input.bowlerId, input.status);
        return { success: true };
      }),
  }),

  // ─── Bowler Registration ─────────────────────────────────────────────
  bowler: router({
    register: publicProcedure
      .input(z.object({
        legalName: z.string().min(2),
        preferredName: z.string().optional(),
        phone: z.string().min(10),
        email: z.string().email().optional(),
        leagueId: z.number(),
        teamId: z.number(),
        pin: z.string().length(6).optional(),
        eventId: z.number().default(DEFAULT_EVENT_ID),
      }))
      .mutation(async ({ input }) => {
        // Get league info for ID generation
        const leagues = await getAllLeagues(input.eventId);
        const league = leagues.find(l => l.id === input.leagueId);
        if (!league) throw new Error("League not found");

        const teams = await getAllTeams(input.eventId);
        const team = teams.find(t => t.id === input.teamId);
        if (!team) throw new Error("Team not found");

        // Get next bowler position for this team
        const bowlerPosition = await getNextBowlerPosition(input.teamId);

        // Generate 10-digit scantron ID: CC + L + EE + TT + BB
        const scantronId = generateScantronId(
          league.centerCode ?? '01',
          league.leagueCode,
          league.eventCode ?? '01',
          team.teamCode,
          bowlerPosition
        );

        // Hash PIN (simple hash for demo - use bcrypt in production)
        const pinHash = input.pin ? Buffer.from(input.pin).toString('base64') : null;

        await createBowler({
          eventId: input.eventId,
          leagueId: input.leagueId,
          teamId: input.teamId,
          scantronId,
          legalName: input.legalName,
          preferredName: input.preferredName,
          phone: input.phone,
          email: input.email,
          bowlerPosition,
          pinHash: pinHash ?? undefined,
          status: 'registered',
          contactLocked: true,
        });

        await writeAuditLog({
          eventId: input.eventId,
          actorRole: 'Bowler',
          action: 'register',
          details: `New bowler registered: ${input.legalName} | ID: ${scantronId}`,
        });

        return { success: true, scantronId, bowlerPosition };
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => getBowlerById(input.id)),

    getLeagues: publicProcedure
      .input(z.object({ eventId: z.number().default(DEFAULT_EVENT_ID) }))
      .query(({ input }) => getAllLeagues(input.eventId)),

    getTeams: publicProcedure
      .input(z.object({ eventId: z.number().default(DEFAULT_EVENT_ID) }))
      .query(({ input }) => getAllTeams(input.eventId)),
  }),

  // ─── Team Captain ────────────────────────────────────────────────────
  captain: router({
    getTeam: publicProcedure
      .input(z.object({ teamId: z.number(), eventId: z.number().default(DEFAULT_EVENT_ID) }))
      .query(({ input }) => getTeamWithBowlers(input.teamId, input.eventId)),

    getAllTeams: publicProcedure
      .input(z.object({ eventId: z.number().default(DEFAULT_EVENT_ID) }))
      .query(({ input }) => getAllTeams(input.eventId)),
  }),

  // ─── Doorman Check-In ────────────────────────────────────────────────
  doorman: router({
    search: publicProcedure
      .input(z.object({
        query: z.string().min(1),
        eventId: z.number().default(DEFAULT_EVENT_ID),
      }))
      .query(async ({ input }) => {
        const results = await searchBowlers(input.eventId, input.query);
        const checkedInIds = await getCheckedInBowlerIds(input.eventId);
        return results.map(b => ({
          ...b,
          isCheckedIn: checkedInIds.has(b.id),
        }));
      }),

    checkIn: publicProcedure
      .input(z.object({
        bowlerId: z.number(),
        eventId: z.number().default(DEFAULT_EVENT_ID),
        method: z.enum(['id', 'name', 'phone']),
        doormanId: z.string().default('doorman'),
      }))
      .mutation(async ({ input }) => {
        await checkInBowler(input.bowlerId, input.eventId, input.method, input.doormanId);
        return { success: true };
      }),

    getCheckedInIds: publicProcedure
      .input(z.object({ eventId: z.number().default(DEFAULT_EVENT_ID) }))
      .query(async ({ input }) => {
        const ids = await getCheckedInBowlerIds(input.eventId);
        return Array.from(ids);
      }),
  }),
});

export type AppRouter = typeof appRouter;
