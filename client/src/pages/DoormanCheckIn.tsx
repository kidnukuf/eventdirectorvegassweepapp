import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

type SearchResult = {
  id: number;
  scantronId: string | null;
  legalName: string;
  preferredName: string | null;
  phone: string;
  status: string | null;
  teamName: string | null;
  teamCode: string | null;
  centerName: string | null;
  isCheckedIn: boolean;
};

function NeonHeader({ onBack }: { onBack: () => void }) {
  return (
    <header
      style={{
        background: "rgba(0,0,0,0.9)",
        borderBottom: "1px solid #00ffff44",
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
      <span style={{ fontSize: 22 }}>🚪</span>
      <span
        style={{
          fontFamily: "'Orbitron', sans-serif",
          color: "#00ffff",
          textShadow: "0 0 10px #00ffff",
          fontWeight: 700,
          fontSize: "clamp(0.85rem, 2.5vw, 1rem)",
          letterSpacing: "0.05em",
        }}
      >
        DOORMAN CHECK-IN
      </span>
      <div
        className="pulse-glow"
        style={{
          marginLeft: "auto",
          width: 10,
          height: 10,
          borderRadius: "50%",
          background: "#00ff88",
          boxShadow: "0 0 8px #00ff88",
        }}
      />
    </header>
  );
}

export default function DoormanCheckIn() {
  const [, navigate] = useLocation();
  const [query, setQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [confirming, setConfirming] = useState<SearchResult | null>(null);
  const [method, setMethod] = useState<"id" | "name" | "phone">("name");
  const inputRef = useRef<HTMLInputElement>(null);

  const searchQuery = trpc.doorman.search.useQuery(
    { query: searchTerm, eventId: 1 },
    { enabled: searchTerm.length >= 2 }
  );

  const checkIn = trpc.doorman.checkIn.useMutation({
    onSuccess: () => {
      toast.success(`✅ ${confirming?.legalName} checked in successfully!`);
      setConfirming(null);
      setQuery("");
      setSearchTerm("");
      searchQuery.refetch();
    },
    onError: (err) => {
      toast.error(`Check-in failed: ${err.message}`);
    },
  });

  const handleSearch = (val: string) => {
    setQuery(val);
    clearTimeout((window as any)._doormanTimer);
    (window as any)._doormanTimer = setTimeout(() => setSearchTerm(val), 300);
  };

  const handleCheckIn = (bowler: SearchResult) => {
    // Detect method from query
    const detectedMethod: "id" | "name" | "phone" =
      /^\d{10}$/.test(query) ? "id" : /^\d{7,}$/.test(query) ? "phone" : "name";
    setMethod(detectedMethod);
    setConfirming(bowler);
  };

  const confirmCheckIn = () => {
    if (!confirming) return;
    checkIn.mutate({
      bowlerId: confirming.id,
      eventId: 1,
      method,
      doormanId: "doorman-station-1",
    });
  };

  const results = searchQuery.data ?? [];

  return (
    <div style={{ minHeight: "100vh", background: "#1a1a1a" }}>
      <NeonHeader onBack={() => navigate("/")} />

      <div className="container" style={{ paddingTop: 28, paddingBottom: 48, maxWidth: 700 }}>
        {/* Search Box */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ position: "relative" }}>
            <input
              ref={inputRef}
              className="neon-input"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="🔍  Name, phone number, or 10-digit scantron ID..."
              style={{ fontSize: "1.05rem", padding: "14px 16px" }}
              autoFocus
            />
            {query && (
              <button
                onClick={() => { setQuery(""); setSearchTerm(""); inputRef.current?.focus(); }}
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "#666",
                  cursor: "pointer",
                  fontSize: 18,
                }}
              >
                ×
              </button>
            )}
          </div>
          <div style={{ color: "#555", fontSize: "0.78rem", marginTop: 6 }}>
            Search by full name, 10-digit ID, or phone number
          </div>
        </div>

        {/* Confirmation Modal */}
        {confirming && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.85)",
              zIndex: 100,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 20,
            }}
          >
            <div
              className="neon-card strike-in"
              style={{ padding: "36px 32px", maxWidth: 440, width: "100%", textAlign: "center" }}
            >
              <div style={{ fontSize: 48, marginBottom: 12 }}>🎳</div>
              <h2
                style={{
                  fontFamily: "'Orbitron', sans-serif",
                  color: "#ffd700",
                  textShadow: "0 0 10px #ffd70088",
                  fontSize: "1.1rem",
                  marginBottom: 6,
                }}
              >
                CONFIRM CHECK-IN
              </h2>
              <div
                style={{
                  background: "rgba(0,0,0,0.6)",
                  border: "1px solid #ffd70033",
                  borderRadius: 10,
                  padding: "20px 24px",
                  margin: "20px 0",
                  textAlign: "left",
                }}
              >
                <div style={{ color: "#eee", fontSize: "1.15rem", fontWeight: 700, marginBottom: 8 }}>
                  {confirming.legalName}
                  {confirming.preferredName && confirming.preferredName !== confirming.legalName && (
                    <span style={{ color: "#888", fontWeight: 400, fontSize: "0.9rem", marginLeft: 8 }}>
                      "{confirming.preferredName}"
                    </span>
                  )}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px", fontSize: "0.85rem" }}>
                  <div>
                    <span style={{ color: "#555" }}>ID: </span>
                    <span
                      style={{
                        color: "#ffd700",
                        fontFamily: "'Orbitron', monospace",
                        fontSize: "0.78rem",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {confirming.scantronId ?? "—"}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: "#555" }}>Phone: </span>
                    <span style={{ color: "#ccc" }}>{confirming.phone}</span>
                  </div>
                  <div>
                    <span style={{ color: "#555" }}>Team: </span>
                    <span style={{ color: "#ccc" }}>{confirming.teamName ?? "—"}</span>
                  </div>
                  <div>
                    <span style={{ color: "#555" }}>Center: </span>
                    <span style={{ color: "#ccc" }}>{confirming.centerName ?? "—"}</span>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <button
                  className="neon-btn-cyan"
                  onClick={() => setConfirming(null)}
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  className="neon-btn-gold"
                  onClick={confirmCheckIn}
                  disabled={checkIn.isPending}
                  style={{ flex: 2, fontSize: "1rem" }}
                >
                  {checkIn.isPending ? "Checking in..." : "✅ Confirm Check-In"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {searchTerm.length >= 2 && (
          <div>
            {searchQuery.isLoading ? (
              <div style={{ color: "#555", textAlign: "center", padding: 32 }}>Searching...</div>
            ) : results.length === 0 ? (
              <div
                style={{
                  background: "rgba(255,0,0,0.08)",
                  border: "1px solid #ff444433",
                  borderRadius: 10,
                  padding: "24px",
                  textAlign: "center",
                  color: "#ff8888",
                }}
              >
                <div style={{ fontSize: 32, marginBottom: 8 }}>❌</div>
                No bowler found for "{searchTerm}"
                <div style={{ color: "#555", fontSize: "0.8rem", marginTop: 6 }}>
                  Try a different name, phone number, or 10-digit ID
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ color: "#555", fontSize: "0.8rem", marginBottom: 4 }}>
                  {results.length} result{results.length !== 1 ? "s" : ""} found
                </div>
                {results.map((bowler) => (
                  <div
                    key={bowler.id}
                    className="neon-card"
                    style={{
                      padding: "18px 20px",
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                      flexWrap: "wrap",
                      opacity: bowler.isCheckedIn ? 0.6 : 1,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 180 }}>
                      <div style={{ color: "#eee", fontWeight: 700, fontSize: "1rem" }}>
                        {bowler.legalName}
                        {bowler.preferredName && bowler.preferredName !== bowler.legalName && (
                          <span style={{ color: "#888", fontWeight: 400, fontSize: "0.85rem", marginLeft: 8 }}>
                            "{bowler.preferredName}"
                          </span>
                        )}
                      </div>
                      <div style={{ color: "#888", fontSize: "0.82rem", marginTop: 4 }}>
                        {bowler.teamName && <span>{bowler.teamName} · </span>}
                        {bowler.centerName && <span>{bowler.centerName}</span>}
                      </div>
                      <div style={{ display: "flex", gap: 16, marginTop: 6, flexWrap: "wrap" }}>
                        {bowler.scantronId && (
                          <span
                            style={{
                              fontFamily: "'Orbitron', monospace",
                              fontSize: "0.75rem",
                              color: "#ffd700",
                              letterSpacing: "0.05em",
                            }}
                          >
                            {bowler.scantronId}
                          </span>
                        )}
                        <span style={{ color: "#666", fontSize: "0.8rem" }}>{bowler.phone}</span>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      {bowler.isCheckedIn ? (
                        <span className="badge-checked-in">✓ CHECKED IN</span>
                      ) : (
                        <button
                          className="neon-btn-gold"
                          onClick={() => handleCheckIn(bowler)}
                          style={{ padding: "10px 20px", fontSize: "0.9rem" }}
                        >
                          Check In →
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {searchTerm.length < 2 && (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#333" }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🎳</div>
            <div style={{ fontSize: "0.95rem" }}>
              Type at least 2 characters to search for a bowler
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
