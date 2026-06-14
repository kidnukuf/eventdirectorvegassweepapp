import { useState, useEffect } from "react";
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
      <span style={{ fontSize: 22 }}>📝</span>
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
        BOWLER REGISTRATION
      </span>
    </header>
  );
}

export default function BowlerRegistration() {
  const [, navigate] = useLocation();

  // Form state
  const [legalName, setLegalName] = useState("");
  const [preferredName, setPreferredName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [leagueId, setLeagueId] = useState<number | "">("");
  const [teamId, setTeamId] = useState<number | "">("");
  const [pin, setPin] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [scantronId, setScantronId] = useState<string | null>(null);

  // Pre-fill from URL params (captain deep-link)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const lc = params.get("league_id");
    const tc = params.get("team_id");
    if (lc) setLeagueId(Number(lc));
    if (tc) setTeamId(Number(tc));
  }, []);

  const leaguesQuery = trpc.bowler.getLeagues.useQuery({ eventId: 1 });
  const teamsQuery = trpc.bowler.getTeams.useQuery({ eventId: 1 });

  const leagues = leaguesQuery.data ?? [];
  const teams = teamsQuery.data ?? [];

  // Filter teams by selected league
  const filteredTeams = leagueId
    ? teams.filter((t) => t.leagueId === Number(leagueId))
    : teams;

  const register = trpc.bowler.register.useMutation({
    onSuccess: (data) => {
      setScantronId(data.scantronId);
      setSubmitted(true);
      toast.success(`Registration complete! Your ID: ${data.scantronId}`);
    },
    onError: (err) => {
      toast.error(`Registration failed: ${err.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leagueId || !teamId) {
      toast.error("Please select a league and team.");
      return;
    }
    if (pin.length !== 6 || !/^\d{6}$/.test(pin)) {
      toast.error("PIN must be exactly 6 digits.");
      return;
    }
    register.mutate({
      legalName,
      preferredName: preferredName || undefined,
      phone,
      email: email || undefined,
      leagueId: Number(leagueId),
      teamId: Number(teamId),
      pin,
      eventId: 1,
    });
  };

  return (
    <div style={{ minHeight: "100vh", background: "#1a1a1a" }}>
      <NeonHeader onBack={() => navigate("/")} />

      <div
        className="container"
        style={{ paddingTop: 32, paddingBottom: 48, maxWidth: 640 }}
      >
        {/* Ad Banner */}
        <div
          style={{
            background: "rgba(255,215,0,0.08)",
            border: "1px dashed #ffd70044",
            borderRadius: 8,
            padding: "12px 20px",
            textAlign: "center",
            color: "#ffd700",
            fontSize: "0.85rem",
            marginBottom: 28,
          }}
        >
          🎳 Strike Zone Pro Shop — Vegas Gear Up! <span style={{ color: "#555" }}>(Sponsor Slot)</span>
        </div>

        {submitted && scantronId ? (
          /* Success Screen */
          <div
            className="neon-card strike-in"
            style={{ padding: 40, textAlign: "center" }}
          >
            <div style={{ fontSize: 56, marginBottom: 16 }}>🎳</div>
            <h2
              style={{
                fontFamily: "'Orbitron', sans-serif",
                color: "#00ff88",
                textShadow: "0 0 12px #00ff8888",
                fontSize: "1.4rem",
                marginBottom: 8,
              }}
            >
              REGISTRATION COMPLETE!
            </h2>
            <p style={{ color: "#aaa", marginBottom: 24 }}>
              Your Vegas Sweeps spot is locked in.
            </p>
            <div
              style={{
                background: "rgba(0,0,0,0.6)",
                border: "2px solid #ffd700",
                borderRadius: 12,
                padding: "20px 32px",
                display: "inline-block",
                marginBottom: 24,
              }}
            >
              <div style={{ color: "#888", fontSize: "0.8rem", marginBottom: 6, letterSpacing: "0.1em" }}>
                YOUR 10-DIGIT SCANTRON ID
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
                {scantronId}
              </div>
              <div style={{ color: "#555", fontSize: "0.72rem", marginTop: 8, letterSpacing: "0.05em" }}>
                CC · L · EE · TT · BB FORMAT
              </div>
            </div>
            <div
              style={{
                background: "#ff000022",
                border: "1px solid #ff444444",
                borderRadius: 8,
                padding: "10px 16px",
                color: "#ff8888",
                fontSize: "0.85rem",
                marginBottom: 28,
              }}
            >
              ⚠️ Memorize your PIN. Forgetting it risks event entry denial.
            </div>
            <button className="neon-btn-gold" onClick={() => navigate("/")}>
              Return to Home
            </button>
          </div>
        ) : (
          /* Registration Form */
          <div className="neon-card" style={{ padding: "32px 28px" }}>
            <h2
              style={{
                fontFamily: "'Orbitron', sans-serif",
                color: "#ffd700",
                textShadow: "0 0 10px #ffd70088",
                fontSize: "1.1rem",
                marginBottom: 6,
                textAlign: "center",
              }}
            >
              🎳 BOWLER REGISTRATION
            </h2>
            <p style={{ color: "#888", textAlign: "center", fontSize: "0.85rem", marginBottom: 28 }}>
              Team Captains: ensure full team completion for Vegas!
            </p>

            <form onSubmit={handleSubmit}>
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <div>
                  <label style={{ color: "#aaa", fontSize: "0.82rem", display: "block", marginBottom: 6 }}>
                    Legal Name <span style={{ color: "#ff5555" }}>*</span>
                    <span style={{ color: "#555", fontSize: "0.75rem", marginLeft: 6 }}>(must match government ID)</span>
                  </label>
                  <input
                    className="neon-input"
                    value={legalName}
                    onChange={(e) => setLegalName(e.target.value)}
                    required
                    minLength={2}
                    placeholder="Full legal name"
                  />
                </div>

                <div>
                  <label style={{ color: "#aaa", fontSize: "0.82rem", display: "block", marginBottom: 6 }}>
                    Preferred Name
                  </label>
                  <input
                    className="neon-input"
                    value={preferredName}
                    onChange={(e) => setPreferredName(e.target.value)}
                    placeholder="Nickname (optional)"
                  />
                </div>

                <div>
                  <label style={{ color: "#aaa", fontSize: "0.82rem", display: "block", marginBottom: 6 }}>
                    Phone Number <span style={{ color: "#ff5555" }}>*</span>
                    <span style={{ color: "#555", fontSize: "0.75rem", marginLeft: 6 }}>
                      {submitted ? "🔒 Locked after registration" : "(locked after submission)"}
                    </span>
                  </label>
                  <input
                    className="neon-input"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    pattern="[0-9]{10}"
                    placeholder="10-digit phone number"
                    readOnly={submitted}
                    disabled={submitted}
                  />
                </div>

                <div>
                  <label style={{ color: "#aaa", fontSize: "0.82rem", display: "block", marginBottom: 6 }}>
                    Email Address
                  </label>
                  <input
                    className="neon-input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com (optional)"
                  />
                </div>

                <div>
                  <label style={{ color: "#aaa", fontSize: "0.82rem", display: "block", marginBottom: 6 }}>
                    League <span style={{ color: "#ff5555" }}>*</span>
                  </label>
                  <select
                    className="neon-input"
                    value={leagueId}
                    onChange={(e) => { setLeagueId(Number(e.target.value)); setTeamId(""); }}
                    required
                    style={{ cursor: "pointer" }}
                  >
                    <option value="">— Select League —</option>
                    {leagues.map((l) => (
                      <option key={l.id} value={l.id} style={{ background: "#222" }}>
                        {l.centerName} — {l.leagueName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ color: "#aaa", fontSize: "0.82rem", display: "block", marginBottom: 6 }}>
                    Team <span style={{ color: "#ff5555" }}>*</span>
                  </label>
                  <select
                    className="neon-input"
                    value={teamId}
                    onChange={(e) => setTeamId(Number(e.target.value))}
                    required
                    disabled={!leagueId}
                    style={{ cursor: leagueId ? "pointer" : "not-allowed" }}
                  >
                    <option value="">— Select Team —</option>
                    {filteredTeams.map((t) => (
                      <option key={t.id} value={t.id} style={{ background: "#222" }}>
                        {t.teamName} (#{t.teamCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ color: "#aaa", fontSize: "0.82rem", display: "block", marginBottom: 6 }}>
                    6-Digit PIN <span style={{ color: "#ff5555" }}>*</span>
                  </label>
                  <input
                    className="neon-input"
                    type="password"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    required
                    maxLength={6}
                    pattern="[0-9]{6}"
                    placeholder="6-digit numeric PIN"
                  />
                  <div style={{ color: "#ff8888", fontSize: "0.78rem", marginTop: 4 }}>
                    ⚠️ Memorize this PIN — it is your safety net for event entry.
                  </div>
                </div>

                <button
                  type="submit"
                  className="neon-btn-gold"
                  disabled={register.isPending}
                  style={{ width: "100%", padding: "14px", fontSize: "1rem", marginTop: 8 }}
                >
                  {register.isPending ? "Registering..." : "🎳 Submit & Lock Vegas Spot"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Bottom Ad Banner */}
        <div
          style={{
            background: "rgba(0,255,255,0.05)",
            border: "1px dashed #00ffff33",
            borderRadius: 8,
            padding: "12px 20px",
            textAlign: "center",
            color: "#00ffff",
            fontSize: "0.85rem",
            marginTop: 24,
          }}
        >
          🎯 Bowl Like a Pro in Vegas — Local Alley Deals <span style={{ color: "#555" }}>(Sponsor Slot)</span>
        </div>
      </div>
    </div>
  );
}
