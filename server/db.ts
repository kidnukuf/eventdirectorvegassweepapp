import { eq, like, or, sql, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, bowlers, teams, leagues, centers, events, checkIns, auditLog, laneAssignments, hotelRecords } from "../drizzle/schema";
import type { InsertBowler } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) { console.error("[Database] Failed to upsert user:", error); throw error; }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── 10-Digit Scantron ID Generation ─────────────────────────────────────
// Format: CC (2) + L (1) + EE (2) + TT (2) + BB (2) = 10 digits
export function generateScantronId(
  centerCode: string,
  leagueCode: string,
  eventCode: string,
  teamCode: string,
  bowlerPosition: string
): string {
  const cc = centerCode.padStart(2, '0').slice(0, 2);
  const l  = leagueCode.slice(0, 1);
  const ee = eventCode.padStart(2, '0').slice(0, 2);
  const tt = teamCode.padStart(2, '0').slice(0, 2);
  const bb = bowlerPosition.padStart(2, '0').slice(0, 2);
  return `${cc}${l}${ee}${tt}${bb}`;
}

// ─── Bowlers ──────────────────────────────────────────────────────────────
export async function getAllBowlers(eventId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: bowlers.id,
      scantronId: bowlers.scantronId,
      legalName: bowlers.legalName,
      preferredName: bowlers.preferredName,
      phone: bowlers.phone,
      email: bowlers.email,
      status: bowlers.status,
      bowlerPosition: bowlers.bowlerPosition,
      contactLocked: bowlers.contactLocked,
      createdAt: bowlers.createdAt,
      teamId: bowlers.teamId,
      leagueId: bowlers.leagueId,
      teamName: teams.teamName,
      teamCode: teams.teamCode,
      leagueName: leagues.leagueName,
      centerName: centers.centerName,
    })
    .from(bowlers)
    .leftJoin(teams, eq(bowlers.teamId, teams.id))
    .leftJoin(leagues, eq(bowlers.leagueId, leagues.id))
    .leftJoin(centers, eq(leagues.centerId, centers.id))
    .where(eq(bowlers.eventId, eventId));
}

export async function searchBowlers(eventId: number, query: string) {
  const db = await getDb();
  if (!db) return [];
  const q = `%${query}%`;
  return db
    .select({
      id: bowlers.id,
      scantronId: bowlers.scantronId,
      legalName: bowlers.legalName,
      preferredName: bowlers.preferredName,
      phone: bowlers.phone,
      email: bowlers.email,
      status: bowlers.status,
      bowlerPosition: bowlers.bowlerPosition,
      contactLocked: bowlers.contactLocked,
      teamId: bowlers.teamId,
      leagueId: bowlers.leagueId,
      teamName: teams.teamName,
      teamCode: teams.teamCode,
      leagueName: leagues.leagueName,
      centerName: centers.centerName,
    })
    .from(bowlers)
    .leftJoin(teams, eq(bowlers.teamId, teams.id))
    .leftJoin(leagues, eq(bowlers.leagueId, leagues.id))
    .leftJoin(centers, eq(leagues.centerId, centers.id))
    .where(
      and(
        eq(bowlers.eventId, eventId),
        or(
          like(bowlers.legalName, q),
          like(bowlers.phone, q),
          like(bowlers.scantronId, q),
          like(teams.teamName, q),
          like(teams.teamCode, q)
        )
      )
    );
}

export async function getBowlerById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select({
      id: bowlers.id,
      scantronId: bowlers.scantronId,
      legalName: bowlers.legalName,
      preferredName: bowlers.preferredName,
      phone: bowlers.phone,
      email: bowlers.email,
      status: bowlers.status,
      bowlerPosition: bowlers.bowlerPosition,
      contactLocked: bowlers.contactLocked,
      teamId: bowlers.teamId,
      leagueId: bowlers.leagueId,
      eventId: bowlers.eventId,
      teamName: teams.teamName,
      teamCode: teams.teamCode,
      leagueName: leagues.leagueName,
      centerName: centers.centerName,
      laneNumber: teams.laneNumber,
      timeSlot: teams.timeSlot,
    })
    .from(bowlers)
    .leftJoin(teams, eq(bowlers.teamId, teams.id))
    .leftJoin(leagues, eq(bowlers.leagueId, leagues.id))
    .leftJoin(centers, eq(leagues.centerId, centers.id))
    .where(eq(bowlers.id, id))
    .limit(1);
  return result[0] ?? null;
}

export async function getNextBowlerPosition(teamId: number): Promise<string> {
  const db = await getDb();
  if (!db) return '01';
  const existing = await db.select({ bowlerPosition: bowlers.bowlerPosition })
    .from(bowlers)
    .where(eq(bowlers.teamId, teamId));
  const positions = existing.map(b => parseInt(b.bowlerPosition ?? '0', 10));
  const next = positions.length > 0 ? Math.max(...positions) + 1 : 1;
  return next.toString().padStart(2, '0');
}

export async function createBowler(data: InsertBowler) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(bowlers).values(data);
  return result;
}

export async function updateBowlerStatus(id: number, status: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(bowlers).set({ status }).where(eq(bowlers.id, id));
}

// ─── Check-Ins ────────────────────────────────────────────────────────────
export async function getCheckedInBowlerIds(eventId: number): Promise<Set<number>> {
  const db = await getDb();
  if (!db) return new Set();
  const rows = await db.select({ bowlerId: checkIns.bowlerId })
    .from(checkIns)
    .where(eq(checkIns.eventId, eventId));
  return new Set(rows.map(r => r.bowlerId));
}

export async function checkInBowler(bowlerId: number, eventId: number, method: string, doormanId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Insert check-in record
  await db.insert(checkIns).values({ bowlerId, eventId, method, doormanId });
  // Update bowler status
  await db.update(bowlers).set({ status: 'checked_in' }).where(eq(bowlers.id, bowlerId));
  // Write audit log entry (ALWAYS, without exception)
  const bowler = await getBowlerById(bowlerId);
  await db.insert(auditLog).values({
    eventId,
    actorRole: 'Doorman',
    actorId: doormanId,
    action: 'check_in',
    targetId: bowlerId,
    details: `Checked in ${bowler?.legalName ?? `Bowler #${bowlerId}`} via ${method} lookup`,
  });
}

// ─── Teams ────────────────────────────────────────────────────────────────
export async function getTeamWithBowlers(teamId: number, eventId: number) {
  const db = await getDb();
  if (!db) return null;
  const teamRows = await db.select().from(teams).where(eq(teams.id, teamId)).limit(1);
  if (!teamRows[0]) return null;
  const team = teamRows[0];
  const members = await db
    .select({
      id: bowlers.id,
      scantronId: bowlers.scantronId,
      legalName: bowlers.legalName,
      preferredName: bowlers.preferredName,
      phone: bowlers.phone,
      status: bowlers.status,
      bowlerPosition: bowlers.bowlerPosition,
    })
    .from(bowlers)
    .where(and(eq(bowlers.teamId, teamId), eq(bowlers.eventId, eventId)));
  return { ...team, members };
}

export async function getAllTeams(eventId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: teams.id,
      teamCode: teams.teamCode,
      teamName: teams.teamName,
      captainName: teams.captainName,
      laneNumber: teams.laneNumber,
      timeSlot: teams.timeSlot,
      leagueId: teams.leagueId,
      leagueName: leagues.leagueName,
      centerName: centers.centerName,
    })
    .from(teams)
    .leftJoin(leagues, eq(teams.leagueId, leagues.id))
    .leftJoin(centers, eq(leagues.centerId, centers.id))
    .where(eq(leagues.eventId, eventId));
}

// ─── Leagues & Centers ────────────────────────────────────────────────────
export async function getAllLeagues(eventId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: leagues.id,
      leagueCode: leagues.leagueCode,
      leagueName: leagues.leagueName,
      eventCode: leagues.eventCode,
      programDirectorName: leagues.programDirectorName,
      dayOfWeek: leagues.dayOfWeek,
      centerId: leagues.centerId,
      centerCode: centers.centerCode,
      centerName: centers.centerName,
    })
    .from(leagues)
    .leftJoin(centers, eq(leagues.centerId, centers.id))
    .where(eq(leagues.eventId, eventId));
}

export async function getAllCenters() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(centers);
}

// ─── Stats ────────────────────────────────────────────────────────────────
export async function getEventStats(eventId: number) {
  const db = await getDb();
  if (!db) return { total: 0, registered: 0, checkedIn: 0, pending: 0 };
  const [totalRows, checkedInRows] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(bowlers).where(eq(bowlers.eventId, eventId)),
    db.select({ count: sql<number>`count(distinct bowlerId)` }).from(checkIns).where(eq(checkIns.eventId, eventId)),
  ]);
  const total = Number(totalRows[0]?.count ?? 0);
  const checkedIn = Number(checkedInRows[0]?.count ?? 0);
  const registeredRows = await db.select({ count: sql<number>`count(*)` })
    .from(bowlers)
    .where(and(eq(bowlers.eventId, eventId), eq(bowlers.status, 'registered')));
  const registered = Number(registeredRows[0]?.count ?? 0);
  return { total, registered, checkedIn, pending: total - registered - checkedIn };
}

// ─── Audit Log ────────────────────────────────────────────────────────────
export async function getAuditLog(eventId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(auditLog)
    .where(eq(auditLog.eventId, eventId))
    .orderBy(sql`timestamp DESC`)
    .limit(limit);
}

export async function writeAuditLog(entry: {
  eventId?: number;
  actorRole: string;
  actorId?: string;
  action: string;
  targetId?: number;
  details?: string;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(auditLog).values(entry);
}
