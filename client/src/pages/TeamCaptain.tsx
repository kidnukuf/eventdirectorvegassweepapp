import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

function NeonHeader({ onBack }: { onBack: () => void }) {
  return (
    <header
      style={{
        background: "rgba(0,0,0,0.85)",
        borderBottom: "1px solid #00ffff33",
        padding: "14px 24px",
        display: "flex",
        alignItems: "center",
        gap: 16,
        position: "sticky",
        top: 0,
        zIndex: 50,
        backdropFilter: "blur(8px)",
      }}
    >
      <button
        onClick={onBack}
        style={{ color: "#888", background: "none", border: "none", cursor: "pointer", fontSize: 20 }}
      >
        ←
      </button>
      <span style={{ fontSize: 22 }}>🎳</span>
      <span
        style={{
          fontFamily: "'Orbitron', sans-serif",
          color: "#00ffff",
          textShadow: "0 0 10px #00ffff88",
          fontWeight: 700,
          fontSize: "clamp(0.85rem, 2.5vw, 1rem)",
          letterSpacing: "0.05em",
        }}
      >
        TEAM CAPTAIN DASHBOARD
      </span>
    </header>
  );
}

function StatusBadge({ status }: { status: string | null }) {
  if (status === "checked_in") return <span className="badge-checked-in">CHECKED IN</span>;
  if (status === "registered") return <span className="badge-registered">REGISTERED</span>;
  return <span className="badge-pending">PENDING</span>;
}

export default function TeamCaptain() {
  const [, navigate] = useLocation();
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);

  const teamsQuery = trpc.captain.getAllTeams.useQuery({ eventId: 1 });
  const teamQuery = trpc.captain.getTeam.useQuery(
    { teamId: selectedTeamId ?? 0, eventId: 1 },
    { enabled: selectedTeamId !== null }
  );

  const teams = teamsQuery.data ?? [];
  const team = teamQuery.data;

  const members = team?.members ?? [];
  const completed = members.filter((m) => m.status === "registered" || m.status === "checked_in").length;
  const completionPct = members.length > 0 ? Math.round((completed / members.length) * 100) : 0;

  const generateLink = () => {
    if (!selectedTeamId || !team) return;
    const league = teams.find((t) => t.id === selectedTeamId);
    const url = `${window.location.origin}/register?league_id=${league?.leagueId ?? ""}&team_id=${selectedTeamId}`;
    navigator.clipboard
      .writeText(url)
      .then(() => toast.success("Registration link copied to clipboard!"))
      .catch(() => toast.info(`Share this link: ${url}`));
  };

  const sendReminders = () => {
    const pending = members.filter((m) => m.status === "pending");
    if (pending.length === 0) {
      toast.success("All team members are registered!");
    } else {
      toast.info(`Reminder sent to ${pending.length} incomplete member${pending.length !== 1 ? "s" : ""}.`);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#1a1a1a" }}>
      <NeonHeader onBack={() => navigate("/")} />

      <div className="container" style={{ paddingTop: 28, paddingBottom: 48 }}>
        {/* Team Selector */}
        <div style={{ marginBottom: 28 }}>
          <label style={{ color: "#aaa", fontSize: "0.85rem", display: "block", marginBottom: 8 }}>
            Select Your Team
          </label>
          <select
            className="neon-input"
            value={selectedTeamId ?? ""}
            onChange={(e) => setSelectedTeamId(Number(e.target.value) || null)}
            style={{ maxWidth: 480, cursor: "pointer" }}
          >
            <option value="">— Choose a team —</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id} style={{ background: "#222" }}>
                {t.teamName} (#{t.teamCode}) — {t.centerName}
              </option>
            ))}
          </select>
        </div>

        {selectedTeamId && team && (
          <div className="strike-in">
            {/* Team Header Card */}
            <div
              className="neon-card"
              style={{ padding: "24px 28px", marginBottom: 20 }}
            >
              <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-start" }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <h2
                    style={{
                      fontFamily: "'Orbitron', sans-serif",
                      color: "#ffd700",
                      textShadow: "0 0 10px #ffd70088",
                      fontSize: "1.2rem",
                      margin: 0,
                      marginBottom: 6,
                    }}
                  >
                    {team.teamName}
                  </h2>
                  <div style={{ color: "#888", fontSize: "0.85rem" }}>
                    Team #{team.teamCode}
                    {team.captainName && (
                      <span style={{ marginLeft: 12 }}>Captain: {team.captainName}</span>
                    )}
                  </div>
                  {(team.laneNumber || team.timeSlot) && (
                    <div style={{ color: "#00ffff", fontSize: "0.85rem", marginTop: 4 }}>
                      {team.laneNumber && `Lane ${team.laneNumber}`}
                      {team.laneNumber && team.timeSlot && " · "}
                      {team.timeSlot && `Squad ${team.timeSlot}`}
                    </div>
                  )}
                </div>

                {/* Completion Ring */}
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: "50%",
                      background: `conic-gradient(#00ff88 ${completionPct * 3.6}deg, #333 0deg)`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      position: "relative",
                    }}
                  >
                    <div
                      style={{
                        width: 60,
                        height: 60,
                        borderRadius: "50%",
                        background: "#111",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexDirection: "column",
                      }}
                    >
                      <div
                        style={{
                          color: "#00ff88",
                          fontFamily: "'Orbitron', sans-serif",
                          fontWeight: 700,
                          fontSize: "1rem",
                        }}
                      >
                        {completionPct}%
                      </div>
                    </div>
                  </div>
                  <div style={{ color: "#888", fontSize: "0.75rem", marginTop: 6 }}>
                    {completed}/{members.length} Complete
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: 12, marginTop: 20, flexWrap: "wrap" }}>
                <button className="neon-btn-cyan" onClick={sendReminders}>
                  📲 Send Reminders
                </button>
                <button className="neon-btn-gold" onClick={generateLink}>
                  🔗 Copy Registration Link
                </button>
              </div>
            </div>

            {/* Ad Banner */}
            <div
              style={{
                background: "rgba(255,215,0,0.06)",
                border: "1px dashed #ffd70033",
                borderRadius: 8,
                padding: "10px 16px",
                textAlign: "center",
                color: "#ffd700",
                fontSize: "0.8rem",
                marginBottom: 20,
              }}
            >
              🎳 Bowl Like a Pro in Vegas — Local Alley Deals <span style={{ color: "#555" }}>(Sponsor Slot)</span>
            </div>

            {/* Roster Table */}
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  background: "rgba(0,0,0,0.5)",
                  borderRadius: 10,
                  overflow: "hidden",
                }}
              >
                <thead>
                  <tr style={{ background: "rgba(0,0,0,0.8)", borderBottom: "1px solid #ffd70033" }}>
                    {["Pos", "Name", "Phone", "Status", "Scantron ID"].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: "12px 14px",
                          textAlign: "left",
                          color: "#00ffff",
                          fontWeight: 600,
                          fontSize: "0.8rem",
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {teamQuery.isLoading ? (
                    <tr>
                      <td colSpan={5} style={{ padding: 32, textAlign: "center", color: "#555" }}>
                        Loading roster...
                      </td>
                    </tr>
                  ) : members.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: 32, textAlign: "center", color: "#555" }}>
                        No members registered yet.{" "}
                        <button
                          onClick={generateLink}
                          style={{ color: "#00ffff", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
                        >
                          Copy registration link
                        </button>
                      </td>
                    </tr>
                  ) : (
                    members.map((m, i) => (
                      <tr
                        key={m.id}
                        style={{
                          borderBottom: "1px solid #ffffff08",
                          background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)",
                        }}
                      >
                        <td
                          style={{
                            padding: "11px 14px",
                            color: "#ffd700",
                            fontFamily: "'Orbitron', monospace",
                            fontSize: "0.85rem",
                            fontWeight: 700,
                          }}
                        >
                          {m.bowlerPosition}
                        </td>
                        <td style={{ padding: "11px 14px", color: "#eee" }}>
                          <div style={{ fontWeight: 600 }}>{m.legalName}</div>
                          {m.preferredName && m.preferredName !== m.legalName && (
                            <div style={{ color: "#888", fontSize: "0.78rem" }}>"{m.preferredName}"</div>
                          )}
                        </td>
                        <td style={{ padding: "11px 14px", color: "#aaa", fontSize: "0.85rem" }}>
                          {m.phone}
                        </td>
                        <td style={{ padding: "11px 14px" }}>
                          <StatusBadge status={m.status} />
                        </td>
                        <td
                          style={{
                            padding: "11px 14px",
                            fontFamily: "'Orbitron', monospace",
                            fontSize: "0.78rem",
                            color: m.scantronId ? "#ffd700" : "#555",
                            letterSpacing: "0.05em",
                          }}
                        >
                          {m.scantronId ?? "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!selectedTeamId && !teamsQuery.isLoading && (
          <div
            style={{
              textAlign: "center",
              color: "#555",
              padding: "60px 20px",
              fontSize: "0.95rem",
            }}
          >
            Select a team above to view the roster and manage registration.
          </div>
        )}
      </div>
    </div>
  );
}
