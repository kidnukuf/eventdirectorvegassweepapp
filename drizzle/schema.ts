import {
  boolean,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  date,
} from "drizzle-orm/mysql-core";

// ─── Users (Manus Auth) ────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Events ───────────────────────────────────────────────────────────────
export const events = mysqlTable("events", {
  id: int("id").autoincrement().primaryKey(),
  eventName: varchar("eventName", { length: 200 }).notNull(),
  eventYear: int("eventYear").notNull(),
  startDate: date("startDate"),
  endDate: date("endDate"),
  status: varchar("status", { length: 50 }).default("planning"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Event = typeof events.$inferSelect;

// ─── Bowling Centers ──────────────────────────────────────────────────────
export const centers = mysqlTable("centers", {
  id: int("id").autoincrement().primaryKey(),
  centerCode: varchar("centerCode", { length: 2 }).notNull().unique(), // CC: 01-99
  centerName: varchar("centerName", { length: 200 }).notNull(),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 50 }),
});

export type Center = typeof centers.$inferSelect;

// ─── Leagues ──────────────────────────────────────────────────────────────
export const leagues = mysqlTable("leagues", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("eventId").notNull(),
  centerId: int("centerId").notNull(),
  leagueCode: varchar("leagueCode", { length: 1 }).notNull(), // L: 1-9
  leagueName: varchar("leagueName", { length: 200 }).notNull(),
  programDirectorName: varchar("programDirectorName", { length: 200 }),
  dayOfWeek: varchar("dayOfWeek", { length: 50 }),
  eventCode: varchar("eventCode", { length: 2 }).default("01"), // EE: 01-52
});

export type League = typeof leagues.$inferSelect;

// ─── Teams ────────────────────────────────────────────────────────────────
export const teams = mysqlTable("teams", {
  id: int("id").autoincrement().primaryKey(),
  leagueId: int("leagueId").notNull(),
  teamCode: varchar("teamCode", { length: 2 }).notNull(), // TT: 01-99
  teamName: varchar("teamName", { length: 200 }).notNull(),
  captainName: varchar("captainName", { length: 200 }),
  laneNumber: int("laneNumber"),
  timeSlot: varchar("timeSlot", { length: 50 }),
});

export type Team = typeof teams.$inferSelect;

// ─── Bowlers ──────────────────────────────────────────────────────────────
export const bowlers = mysqlTable("bowlers", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("eventId").notNull(),
  leagueId: int("leagueId"),
  teamId: int("teamId"),
  scantronId: varchar("scantronId", { length: 10 }).unique(), // CC-L-EE-TT-BB (10 digits)
  legalName: varchar("legalName", { length: 200 }).notNull(),
  preferredName: varchar("preferredName", { length: 200 }),
  phone: varchar("phone", { length: 20 }).notNull(),
  email: varchar("email", { length: 320 }),
  bowlerPosition: varchar("bowlerPosition", { length: 2 }).default("01"), // BB: 01-99
  govIdNote: text("govIdNote"),
  photoUrl: text("photoUrl"),
  pinHash: text("pinHash"),
  status: varchar("status", { length: 50 }).default("registered"),
  contactLocked: boolean("contactLocked").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Bowler = typeof bowlers.$inferSelect;
export type InsertBowler = typeof bowlers.$inferInsert;

// ─── Check-Ins ────────────────────────────────────────────────────────────
export const checkIns = mysqlTable("checkIns", {
  id: int("id").autoincrement().primaryKey(),
  bowlerId: int("bowlerId").notNull(),
  eventId: int("eventId").notNull(),
  checkinTime: timestamp("checkinTime").defaultNow().notNull(),
  method: varchar("method", { length: 50 }), // 'qr', 'pin', 'id', 'name'
  doormanId: varchar("doormanId", { length: 100 }),
});

export type CheckIn = typeof checkIns.$inferSelect;

// ─── Hotel Records ────────────────────────────────────────────────────────
export const hotelRecords = mysqlTable("hotelRecords", {
  id: int("id").autoincrement().primaryKey(),
  bowlerId: int("bowlerId").notNull(),
  hotelName: varchar("hotelName", { length: 200 }),
  reservationId: varchar("reservationId", { length: 100 }),
  checkinDate: date("checkinDate"),
  roomNote: text("roomNote"),
  verified: boolean("verified").default(false),
});

export type HotelRecord = typeof hotelRecords.$inferSelect;

// ─── Lane Assignments ─────────────────────────────────────────────────────
export const laneAssignments = mysqlTable("laneAssignments", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("eventId").notNull(),
  teamId: int("teamId"),
  bowlerId: int("bowlerId"),
  bowlingDate: date("bowlingDate"),
  laneNumber: int("laneNumber"),
  timeSlot: varchar("timeSlot", { length: 50 }),
});

export type LaneAssignment = typeof laneAssignments.$inferSelect;

// ─── Audit Log ────────────────────────────────────────────────────────────
export const auditLog = mysqlTable("auditLog", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("eventId"),
  actorRole: varchar("actorRole", { length: 100 }).notNull(),
  actorId: varchar("actorId", { length: 100 }),
  action: varchar("action", { length: 200 }).notNull(),
  targetId: int("targetId"),
  details: text("details"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type AuditLogEntry = typeof auditLog.$inferSelect;
