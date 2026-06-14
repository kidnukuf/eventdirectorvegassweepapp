import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

type BowlerRow = Record<string, unknown>;

export default function ProgramDirector() {
  const [, setLocation] = useLocation();
  const [password, setPassword] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [search, setSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const centersQuery = trpc.centers.list.useQuery(undefined, { enabled: loggedIn });
  const searchResults = trpc.bowlers.search.useQuery(
    { query: searchQuery },
    { enabled: loggedIn && searchQuery.length >= 2 }
  );

  const PROGRAM_DIRECTOR_PASSWORD = "pd2026";

  if (!loggedIn) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center p-4">
        <div className="bg-[#1a1a1a] rounded-2xl border border-cyan-500/40 p-8 max-w-sm w-full shadow-[0_0_40px_rgba(0,255,255,0.1)]">
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">📋</div>
            <h1 className="text-2xl font-black tracking-widest" style={{ fontFamily: "'Rajdhani', sans-serif", color: "#00ffff", textShadow: "0 0 20px rgba(0,255,255,0.6)" }}>
              PROGRAM DIRECTOR
            </h1>
            <p className="text-gray-500 text-sm mt-1">Read-only league oversight</p>
          </div>
          <div className="space-y-3 mb-5">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Director Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#111] border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
                onKeyDown={(e) => e.key === "Enter" && password === PROGRAM_DIRECTOR_PASSWORD && setLoggedIn(true)}
              />
            </div>
          </div>
          <button
            onClick={() => {
              if (password === PROGRAM_DIRECTOR_PASSWORD) setLoggedIn(true);
              else alert("Incorrect password");
            }}
            className="w-full py-3 font-black rounded-xl text-lg transition-all active:scale-95"
            style={{ background: "linear-gradient(135deg, #ffd700, #ffaa00)", color: "#000", boxShadow: "0 0 20px rgba(255,215,0,0.4)" }}>
            🔐 Access Dashboard
          </button>
          <button onClick={() => setLocation("/")} className="w-full mt-3 py-2 text-gray-500 hover:text-gray-300 text-sm transition-colors">← Back to Home</button>
        </div>
      </div>
    );
  }

  const centers = (centersQuery.data ?? []) as Array<{ id: number; name: string; code: string }>;

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white">
      {/* Header */}
      <div className="bg-[#1a1a1a] border-b border-cyan-500/30 px-4 py-4 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setLocation("/")} className="text-gray-500 hover:text-gray-300 text-sm">← Home</button>
            <span className="text-gray-600">|</span>
            <h1 className="text-xl font-black" style={{ fontFamily: "'Rajdhani', sans-serif", color: "#00ffff", textShadow: "0 0 15px rgba(0,255,255,0.5)" }}>
              📋 PROGRAM DIRECTOR
            </h1>
          </div>
          <span className="text-xs text-gray-600 bg-gray-800 px-3 py-1 rounded-full">Read-Only View</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Search */}
        <div className="bg-[#1a1a1a] rounded-2xl border border-white/10 p-5">
          <h2 className="text-sm font-semibold text-gray-400 mb-3">🔍 Search Bowlers</h2>
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setSearchQuery(e.target.value); }}
            placeholder="Search by name, phone, or scantron ID..."
            className="w-full px-3 py-2.5 bg-[#111] border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
          />
          {(searchResults.data ?? []).length > 0 && (
            <div className="mt-3 space-y-2">
              {(searchResults.data as BowlerRow[]).map((b) => (
                <div key={String(b.id)} className="flex items-center justify-between p-3 bg-[#111] rounded-xl border border-white/10">
                  <div>
                    <div className="font-bold text-white">{String(b.legalFirstName ?? "")} {String(b.legalLastName ?? "")}</div>
                    <div className="text-xs text-gray-400">{String(b.centerName ?? "")} • Team {String(b.teamCode ?? "")} • Pos {String(b.positionOnTeam ?? "")}</div>
                    <div className="text-xs font-mono mt-0.5" style={{ color: "#ffd700" }}>{String(b.scantronId ?? "")}</div>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-bold ${
                    b.registrationStatus === "checked_in" ? "bg-green-700 text-green-200" :
                    b.registrationStatus === "verified" ? "bg-blue-700 text-blue-200" :
                    b.registrationStatus === "signed_up" ? "bg-yellow-700 text-yellow-200" :
                    "bg-gray-700 text-gray-300"
                  }`}>
                    {String(b.registrationStatus ?? "pre_registered").replace("_", " ").toUpperCase()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Centers Overview */}
        <div className="bg-[#1a1a1a] rounded-2xl border border-white/10 p-5">
          <h2 className="text-sm font-semibold text-gray-400 mb-4">🏆 Bowling Centers — League Overview</h2>
          {centersQuery.isLoading ? (
            <div className="text-gray-500 text-sm text-center py-8">Loading centers...</div>
          ) : centers.length === 0 ? (
            <div className="text-gray-600 text-sm text-center py-8">No data imported yet. Contact the Event Director.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {centers.map((c) => (
                <div key={c.id} className="p-4 bg-[#111] rounded-xl border border-white/10">
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-bold text-white">{c.name}</div>
                    <div className="text-xs font-mono text-cyan-400">CC:{c.code}</div>
                  </div>
                  <div className="text-xs text-gray-500">Center #{c.id}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ad Slot */}
        <div className="bg-[#1a1a1a] rounded-2xl border border-yellow-500/20 p-5 text-center">
          <div className="text-gray-600 text-xs mb-2">SPONSOR ADVERTISEMENT</div>
          <div className="h-24 bg-[#111] rounded-xl border border-dashed border-yellow-500/30 flex items-center justify-center">
            <span className="text-gray-600 text-sm">📢 Sponsor Banner — Contact Event Director to place ad</span>
          </div>
        </div>
      </div>
    </div>
  );
}
