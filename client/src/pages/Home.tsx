import { useLocation } from "wouter";

const roles = [
  {
    key: "admin",
    label: "Event Director",
    icon: "⚡",
    desc: "Full admin access — roster, stats, audit log",
    path: "/admin",
    color: "#ffd700",
  },
  {
    key: "program",
    label: "Program Director",
    icon: "📋",
    desc: "League-scoped management and reporting",
    path: "/admin?role=program",
    color: "#ffd700",
  },
  {
    key: "captain",
    label: "Team Captain",
    icon: "🎳",
    desc: "Manage your team roster and registration links",
    path: "/captain",
    color: "#00ffff",
  },
  {
    key: "doorman",
    label: "Doorman Check-In",
    icon: "🚪",
    desc: "Look up bowlers and confirm event entry",
    path: "/doorman",
    color: "#00ffff",
  },
  {
    key: "bowler",
    label: "Bowler Registration",
    icon: "📝",
    desc: "Register for the event and get your scantron ID",
    path: "/register",
    color: "#00ff88",
  },
];

export default function Home() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#1a1a1a" }}>
      {/* Header */}
      <header className="text-center py-10 px-4">
        <div className="text-5xl mb-3">🎳</div>
        <h1
          style={{
            fontFamily: "'Orbitron', sans-serif",
            color: "#ffd700",
            textShadow: "0 0 12px #ffd700, 0 0 30px #ffd70066",
            fontSize: "clamp(1.6rem, 5vw, 2.8rem)",
            fontWeight: 900,
            letterSpacing: "0.05em",
            margin: 0,
          }}
        >
          VEGAS SWEEPS NAVIGATOR
        </h1>
        <p
          style={{
            color: "#00ffff",
            textShadow: "0 0 8px #00ffff88",
            marginTop: 8,
            fontSize: "1rem",
            letterSpacing: "0.15em",
          }}
        >
          FUNTIME TEAM CHALLENGE 2026
        </p>
        <div
          style={{
            width: 120,
            height: 2,
            background: "linear-gradient(90deg, transparent, #00ffff, transparent)",
            margin: "16px auto 0",
          }}
        />
      </header>

      {/* Role Cards */}
      <main className="flex-1 container py-6">
        <p
          style={{ color: "#888", textAlign: "center", marginBottom: 32, fontSize: "0.95rem" }}
        >
          Select your role to continue
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 20,
            maxWidth: 900,
            margin: "0 auto",
          }}
        >
          {roles.map((role) => (
            <button
              key={role.key}
              onClick={() => navigate(role.path)}
              className="strike-in"
              style={{
                background: "rgba(0,0,0,0.75)",
                border: `1px solid ${role.color}44`,
                borderRadius: 14,
                padding: "28px 24px",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.18s cubic-bezier(0.23,1,0.32,1)",
                boxShadow: `0 0 12px ${role.color}22`,
                backdropFilter: "blur(8px)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = `${role.color}cc`;
                (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 24px ${role.color}55, 0 8px 32px rgba(0,0,0,0.5)`;
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-3px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = `${role.color}44`;
                (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 12px ${role.color}22`;
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
              }}
            >
              <div style={{ fontSize: 36, marginBottom: 10 }}>{role.icon}</div>
              <div
                style={{
                  color: role.color,
                  fontFamily: "'Orbitron', sans-serif",
                  fontWeight: 700,
                  fontSize: "1rem",
                  textShadow: `0 0 8px ${role.color}88`,
                  marginBottom: 6,
                }}
              >
                {role.label}
              </div>
              <div style={{ color: "#aaa", fontSize: "0.85rem", lineHeight: 1.5 }}>
                {role.desc}
              </div>
            </button>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer style={{ textAlign: "center", padding: "24px 16px", color: "#444", fontSize: "0.8rem" }}>
        Vegas Sweeps Navigator &copy; 2026 &nbsp;|&nbsp; 13 Bowling Centers &nbsp;|&nbsp; Multi-League Event Management
      </footer>
    </div>
  );
}
