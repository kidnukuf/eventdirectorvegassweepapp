import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";

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
        style={{ color: "#888", background: "none", border: "none", cursor: "pointer", fontSize: 20 }}
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
          fontSize: "clamp(0.85rem, 2.5vw, 1rem)",
          letterSpacing: "0.05em",
        }}
      >
        BOWLER PROFILE
      </span>
    </header>
  );
}

export default function BowlerProfile() {
  const [, navigate] = useLocation();
  const params = useParams<{ id: string }>();
  const bowlerId = parseInt(params.id ?? "0", 10);

  const bowlerQuery = trpc.bowler.getById.useQuery({ id: bowlerId }, { enabled: bowlerId > 0 });
  const bowler = bowlerQuery.data;

  if (bowlerQuery.isLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "#1a1a1a", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#555" }}>Loading...</div>
      </div>
    );
  }

  if (!bowler) {
    return (
      <div style={{ minHeight: "100vh", background: "#1a1a1a" }}>
        <NeonHeader onBack={() => navigate("/")} />
        <div style={{ textAlign: "center", padding: 60, color: "#555" }}>
          Bowler not found.
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#1a1a1a" }}>
      <NeonHeader onBack={() => navigate("/")} />

      <div className="container" style={{ paddingTop: 32, paddingBottom: 48, maxWidth: 640 }}>
        <div className="neon-card strike-in" style={{ padding: "36px 32px" }}>
          {/* ID Badge */}
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div
              style={{
                background: "rgba(0,0,0,0.7)",
                border: "2px solid #ffd700",
                borderRadius: 14,
                padding: "20px 32px",
                display: "inline-block",
              }}
            >
              <div style={{ color: "#555", fontSize: "0.75rem", letterSpacing: "0.12em", marginBottom: 6 }}>
                10-DIGIT SCANTRON ID
              </div>
              <div
                style={{
                  fontFamily: "'Orbitron', monospace",
                  fontSize: "2rem",
                  color: "#ffd700",
                  textShadow: "0 0 16px #ffd700aa",
                  letterSpacing: "0.15em",
                  fontWeight: 900,
                }}
              >
                {bowler.scantronId ?? "—"}
              </div>
              <div style={{ color: "#444", fontSize: "0.7rem", marginTop: 6, letterSpacing: "0.05em" }}>
                CC · L · EE · TT · BB
              </div>
            </div>
          </div>

          {/* Bowler Info */}
          <div style={{ display: "grid", gap: 16 }}>
            <InfoRow label="Legal Name" value={bowler.legalName} highlight />
            {bowler.preferredName && bowler.preferredName !== bowler.legalName && (
              <InfoRow label="Preferred Name" value={bowler.preferredName} />
            )}
            <InfoRow label="Phone" value={bowler.phone} />
            {bowler.email && <InfoRow label="Email" value={bowler.email} />}
            <InfoRow label="Team" value={`${bowler.teamName ?? "—"} (#${bowler.teamCode ?? "—"})`} />
            <InfoRow label="League" value={bowler.leagueName ?? "—"} />
            <InfoRow label="Center" value={bowler.centerName ?? "—"} />
            {bowler.laneNumber && <InfoRow label="Lane" value={String(bowler.laneNumber)} />}
            {bowler.timeSlot && <InfoRow label="Squad" value={bowler.timeSlot} />}
            <InfoRow
              label="Status"
              value={bowler.status ?? "—"}
              badge
            />
          </div>

          <div style={{ marginTop: 32, textAlign: "center" }}>
            <button className="neon-btn-gold" onClick={() => navigate("/")}>
              Return to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  highlight,
  badge,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  badge?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: "1px solid #ffffff0a",
        paddingBottom: 12,
        gap: 12,
        flexWrap: "wrap",
      }}
    >
      <span style={{ color: "#666", fontSize: "0.82rem", letterSpacing: "0.06em", textTransform: "uppercase" }}>
        {label}
      </span>
      {badge ? (
        <span
          className={
            value === "checked_in"
              ? "badge-checked-in"
              : value === "registered"
              ? "badge-registered"
              : "badge-pending"
          }
          style={{ textTransform: "uppercase" }}
        >
          {value.replace("_", " ")}
        </span>
      ) : (
        <span
          style={{
            color: highlight ? "#ffd700" : "#ccc",
            fontWeight: highlight ? 700 : 400,
            fontSize: "0.95rem",
            textShadow: highlight ? "0 0 8px #ffd70066" : "none",
          }}
        >
          {value}
        </span>
      )}
    </div>
  );
}
