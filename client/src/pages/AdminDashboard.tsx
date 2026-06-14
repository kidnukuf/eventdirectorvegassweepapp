import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

type AdminRole = "EventDirector" | "ProgramDirector";

function NeonHeader({ onBack }: { onBack: () => void }) {
  return (
    <header
      style={{
        background: "rgba(0,0,0,0.85)",
        borderBottom: "1px solid #ffd70033",
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
        style={{ color: "#888", background: "none", border: "none", cursor: "pointer", fontSize: 20, lineHeight: 1 }}
        title="Back to Home"
      >
        ←
      </button>
      <span style={{ fontSize: 22 }}>🎳</span>
      <span
        style={{
          fontFamily: "'Orbitron', sans-serif",
          color: "#ffd700",
          textShadow: "0 0 10px #ffd70088",
          fontWeight: 700,
          fontSize: "clamp(0.9rem, 2.5vw, 1.1rem)",
          letterSpacing: "0.05em",
        }}
      >
        VEGAS SWEEPS — ADMIN DASHBOARD
      </span>
    </header>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div
      style={{
        background: "rgba(0,0,0,0.7)",
        border: `1px solid ${color}44`,
        borderRadius: 12,
        padding: "20px 24px",
        textAlign: "center",
        boxShadow: `0 0 12px ${color}22`,
        flex: 1,
        minWidth: 120,
      }}
    >
      <div
        style={{
          fontSize: "2.2rem",
          fontWeight: 700,
          color,
          textShadow: `0 0 10px ${color}88`,
          fontFamily: "'Orbitron', sans-serif",
        }}
      >
        {value}
      </div>
      <div style={{ color: "#aaa", fontSize: "0.8rem", marginTop: 4, letterSpacing: "0.08em" }}>
        {label}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string | null }) {
  if (status === "checked_in") return <span className="badge-checked-in">CHECKED IN</span>;
  if (status === "registered") return <span className="badge-registered">REGISTERED</span>;
  return <span className="badge-pending">PENDING</span>;
}

export default function AdminDashboard() {
  const [, navigate] = useLocation();
  const [role, setRole] = useState<AdminRole>("EventDirector");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"roster" | "audit">("roster");

  // Debounce search
  const handleSearch = (val: string) => {
    setSearch(val);
    clearTimeout((window as any)._searchTimer);
    (window as any)._searchTimer = setTimeout(() => setDebouncedSearch(val), 300);
  };

  const statsQuery = trpc.admin.getStats.useQuery({ eventId: 1 });
  const bowlersQuery = trpc.admin.getBowlers.useQuery({ eventId: 1, search: debouncedSearch || undefined });
  const auditQuery = trpc.admin.getAuditLog.useQuery({ eventId: 1, limit: 50 }, { enabled: activeTab === "audit" });
  const updateStatus = trpc.admin.updateBowlerStatus.useMutation({
    onSuccess: () => {
      bowlersQuery.refetch();
      statsQuery.refetch();
    },
  });

  const stats = statsQuery.data;
  const bowlers = bowlersQuery.data ?? [];

  return (
    <div style={{ minHeight: "100vh", background: "#1a1a1a" }}>
      <NeonHeader onBack={() => navigate("/")} />

      <div className="container" style={{ paddingTop: 24, paddingBottom: 40 }}>
        {/* Role Switcher */}
        <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ color: "#666", fontSize: "0.85rem", marginRight: 4 }}>View as:</span>
          {(["EventDirector", "ProgramDirector"] as AdminRole[]).map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              style={{
                padding: "6px 18px",
                borderRadius: 20,
                border: `1px solid ${role === r ? "#ffd700" : "#333"}`,
                background: role === r ? "#ffd70022" : "transparent",
                color: role === r ? "#ffd700" : "#666",
                cursor: "pointer",
                fontSize: "0.85rem",
                fontWeight: 600,
                transition: "all 0.15s",
              }}
            >
              {r === "EventDirector" ? "⚡ Event Director" : "📋 Program Director"}
            </button>
          ))}
          <div style={{ marginLeft: "auto", color: "#444", fontSize: "0.8rem" }}>
            {role === "ProgramDirector" && "Showing league-scoped view"}
          </div>
        </div>

        {/* Stats Row */}
        <div style={{ display: "flex", gap: 16, marginBottom: 28, flexWrap: "wrap" }}>
          <StatCard label="TOTAL BOWLERS" value={stats?.total ?? 0} color="#ffd700" />
          <StatCard label="REGISTERED" value={stats?.registered ?? 0} color="#00ff88" />
          <StatCard label="CHECKED IN" value={stats?.checkedIn ?? 0} color="#00ffff" />
          <StatCard label="PENDING" value={stats?.pending ?? 0} color="#ffaa00" />
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 0, marginBottom: 20, borderBottom: "1px solid #333" }}>
          {(["roster", "audit"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "10px 24px",
                background: "none",
                border: "none",
                borderBottom: activeTab === tab ? "2px solid #ffd700" : "2px solid transparent",
                color: activeTab === tab ? "#ffd700" : "#666",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "0.9rem",
                letterSpacing: "0.05em",
                transition: "color 0.15s",
                textTransform: "uppercase",
              }}
            >
              {tab === "roster" ? "🎳 Bowler Roster" : "📋 Audit Log"}
            </button>
          ))}
        </div>

        {activeTab === "roster" && (
          <>
            {/* Search */}
            <div style={{ marginBottom: 16 }}>
              <input
                className="neon-input"
                placeholder="🔍  Search by name, ID, team, or phone..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                style={{ maxWidth: 480 }}
              />
            </div>

            {/* Table */}
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
                    {["10-Digit ID", "Name", "Team", "Center", "Phone", "Status", "Actions"].map((h) => (
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
                  {bowlersQuery.isLoading ? (
                    <tr>
                      <td colSpan={7} style={{ padding: 32, textAlign: "center", color: "#555" }}>
                        Loading roster...
                      </td>
                    </tr>
                  ) : bowlers.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: 32, textAlign: "center", color: "#555" }}>
                        No bowlers found
                      </td>
                    </tr>
                  ) : (
                    bowlers.map((b, i) => (
                      <tr
                        key={b.id}
                        style={{
                          borderBottom: "1px solid #ffffff08",
                          background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)",
                          transition: "background 0.1s",
                        }}
                        onMouseEnter={(e) =>
                          ((e.currentTarget as HTMLTableRowElement).style.background = "rgba(255,215,0,0.04)")
                        }
                        onMouseLeave={(e) =>
                          ((e.currentTarget as HTMLTableRowElement).style.background =
                            i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)")
                        }
                      >
                        <td
                          style={{
                            padding: "11px 14px",
                            fontFamily: "'Orbitron', monospace",
                            fontSize: "0.78rem",
                            color: "#ffd700",
                            letterSpacing: "0.05em",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {b.scantronId ?? "—"}
                        </td>
                        <td style={{ padding: "11px 14px", color: "#eee", fontSize: "0.9rem" }}>
                          <div style={{ fontWeight: 600 }}>{b.legalName}</div>
                          {b.preferredName && b.preferredName !== b.legalName && (
                            <div style={{ color: "#888", fontSize: "0.78rem" }}>"{b.preferredName}"</div>
                          )}
                        </td>
                        <td style={{ padding: "11px 14px", color: "#ccc", fontSize: "0.85rem", whiteSpace: "nowrap" }}>
                          {b.teamName ?? "—"}
                          {b.teamCode && (
                            <span style={{ color: "#555", marginLeft: 6, fontSize: "0.75rem" }}>
                              #{b.teamCode}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: "11px 14px", color: "#888", fontSize: "0.8rem", whiteSpace: "nowrap" }}>
                          {b.centerName ?? "—"}
                        </td>
                        <td style={{ padding: "11px 14px", color: "#aaa", fontSize: "0.85rem", whiteSpace: "nowrap" }}>
                          {b.phone}
                        </td>
                        <td style={{ padding: "11px 14px" }}>
                          <StatusBadge status={b.status} />
                        </td>
                        <td style={{ padding: "11px 14px" }}>
                          {b.status !== "checked_in" && (
                            <button
                              onClick={() =>
                                updateStatus.mutate({ bowlerId: b.id, status: "checked_in" })
                              }
                              style={{
                                padding: "4px 12px",
                                background: "#00ffff22",
                                color: "#00ffff",
                                border: "1px solid #00ffff44",
                                borderRadius: 6,
                                cursor: "pointer",
                                fontSize: "0.78rem",
                                fontWeight: 600,
                                transition: "all 0.15s",
                              }}
                            >
                              Check In
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div style={{ color: "#444", fontSize: "0.8rem", marginTop: 10 }}>
              Showing {bowlers.length} bowler{bowlers.length !== 1 ? "s" : ""}
            </div>
          </>
        )}

        {activeTab === "audit" && (
          <div>
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
                    {["Time", "Actor", "Role", "Action", "Details"].map((h) => (
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
                  {auditQuery.isLoading ? (
                    <tr>
                      <td colSpan={5} style={{ padding: 32, textAlign: "center", color: "#555" }}>
                        Loading audit log...
                      </td>
                    </tr>
                  ) : (auditQuery.data ?? []).length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: 32, textAlign: "center", color: "#555" }}>
                        No audit entries yet
                      </td>
                    </tr>
                  ) : (
                    (auditQuery.data ?? []).map((entry, i) => (
                      <tr
                        key={entry.id}
                        style={{
                          borderBottom: "1px solid #ffffff08",
                          background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)",
                        }}
                      >
                        <td style={{ padding: "10px 14px", color: "#888", fontSize: "0.8rem", whiteSpace: "nowrap" }}>
                          {new Date(entry.timestamp).toLocaleString()}
                        </td>
                        <td style={{ padding: "10px 14px", color: "#ccc", fontSize: "0.85rem" }}>
                          {entry.actorId ?? "—"}
                        </td>
                        <td style={{ padding: "10px 14px" }}>
                          <span
                            style={{
                              background: "#ffd70022",
                              color: "#ffd700",
                              border: "1px solid #ffd70033",
                              borderRadius: 12,
                              padding: "2px 10px",
                              fontSize: "0.75rem",
                              fontWeight: 600,
                            }}
                          >
                            {entry.actorRole}
                          </span>
                        </td>
                        <td style={{ padding: "10px 14px", color: "#00ffff", fontSize: "0.85rem", fontWeight: 600 }}>
                          {entry.action}
                        </td>
                        <td style={{ padding: "10px 14px", color: "#aaa", fontSize: "0.85rem" }}>
                          {entry.details ?? "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
