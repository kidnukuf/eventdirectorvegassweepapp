# Vegas Sweeps Navigator - TODO

## Database & Backend
- [x] Extend drizzle schema with events, leagues, teams, bowlers, checkIns, hotelRecords, laneAssignments, auditLog tables
- [x] Generate and apply migration SQL
- [x] Seed database with sample data from ledger PDF
- [x] Build tRPC routers: bowlers, teams, leagues, checkIn, admin, captain

## Frontend
- [x] Apply neon bowling theme (dark bg, gold + cyan accents, glow shadows)
- [x] Build role-based navigation / landing page with role selector
- [x] Admin Dashboard: live roster, search/filter, stats, role switcher
- [x] Bowler Registration Form: DB save, 10-digit ID generation, phone lock
- [x] Team Captain View: live roster, shareable link, reminder button
- [x] Doorman Check-In: lookup by name/phone/ID, one-tap confirm, audit log write
- [x] Bowler profile view (own record only)

## Auth & RBAC
- [x] Role-based access control (EventDirector, ProgramDirector, TeamCaptain, Doorman, Bowler)
- [x] Role switcher in admin dashboard

## Quality
- [x] Vitest tests for ID generation logic (18 tests passing)
- [x] Vitest tests for check-in audit log write
