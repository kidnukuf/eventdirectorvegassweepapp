import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { toast } from "sonner";

type Team = Record<string, unknown>;
type Member = Record<string, unknown>;

export default function TeamCaptain() {
  const [, setLocation] = useLocation();
  const EVENT_ID = 1;
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [captainCode, setCaptainCode] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const { data: teams = [] } = trpc.teams.listByEvent.useQuery({ eventId: EVENT_ID });
  const { data: teamData } = trpc.teams.getWithMembers.useQuery({ teamId: selectedTeamId! }, { enabled: !!selectedTeamId && authenticated });

  const verifyMutation = trpc.teams.verifyCaptain.useMutation({
    onSuccess: (data) => {
      const d = data as Record<string, unknown>;
      if (d.success) { setAuthenticated(true); toast.success("Captain verified!"); }
      else toast.error("Invalid captain code");
    },
    onError: (e) => toast.error(e.message),
  });

  const verifyMember = trpc.teams.verifyMember.useMutation({
    onSuccess: () => { toast.success("Member verified!"); },
    onError: (e) => toast.error(e.message),
  });

  const copyLink = () => {
    if (!selectedTeamId) return;
    const url = `${window.location.origin}/register?team_id=${selectedTeamId}`;
    navigator.clipboard.writeText(url).then(() => { setLinkCopied(true); setTimeout(() => setLinkCopied(false), 2000); toast.success("Registration link copied!"); });
  };

  const members = (teamData as Record<string, unknown>)?.members as Member[] ?? [];
  const team = (teamData as Record<string, unknown>)?.team as Team ?? null;
  const completedCount = members.filter((m: Member) => m.registrationStatus === "verified" || m.registrationStatus === "checked_in").length;

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center p-4">
        <div className="neon-card p-8 max-w-sm w-full neon-border-gold">
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">🎳</div>
            <h1 className="text-2xl font-black neon-gold tracking-widest">TEAM CAPTAIN</h1>
            <p className="text-gray-500 text-sm mt-1">Select your team and enter your captain code</p>
          </div>
          <div className="space-y-3 mb-5">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Select Your Team</label>
              <select value={selectedTeamId ?? ""} onChange={(e) => setSelectedTeamId(Number(e.target.value))} className="neon-input">
                <option value="">— Select Team —</option>
                {(teams as Team[]).map((t) => (<option key={String(t.id)} value={String(t.id)}>{String(t.teamName ?? "")} (#{String(t.teamCode ?? "")})</option>))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Captain Code</label>
              <input type="password" value={captainCode} onChange={(e) => setCaptainCode(e.target.value)} className="neon-input" onKeyDown={(e) => e.key === "Enter" && selectedTeamId && verifyMutation.mutate({ teamId: selectedTeamId, captainCode })} />
            </div>
          </div>
          <button onClick={() => selectedTeamId && verifyMutation.mutate({ teamId: selectedTeamId, captainCode })} disabled={verifyMutation.isPending || !selectedTeamId || !captainCode} className="neon-btn-gold w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed">
            {verifyMutation.isPending ? "Verifying..." : "🔐 Access Team Dashboard"}
          </button>
          <button onClick={() => setLocation("/")} className="w-full mt-3 py-2 text-gray-500 hover:text-gray-300 text-sm transition-colors">← Back to Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white">
      <div className="bg-[#1a1a1a] border-b border-green-500/30 px-4 py-4 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setLocation("/")} className="text-gray-400 hover:text-white text-sm">← Home</button>
            <h1 className="text-xl font-black text-green-400" style={{ textShadow: "0 0 15px rgba(34,197,94,0.5)" }}>🎳 TEAM CAPTAIN</h1>
          </div>
          <button onClick={copyLink} className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${linkCopied ? "bg-green-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"}`}>
            {linkCopied ? "✅ Copied!" : "📋 Copy Reg Link"}
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {team && (
          <div className="bg-[#1a1a1a] rounded-2xl border border-white/10 p-5 mb-5">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-xl font-black text-white">{String(team.teamName ?? "")}</h2>
                <p className="text-gray-400 text-sm">{String(team.centerName ?? "")} • Team #{String(team.teamCode ?? "")}</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-black text-green-400">{completedCount}/{members.length}</div>
                <div className="text-xs text-gray-500">Verified</div>
              </div>
            </div>
            <div className="mt-4 h-2 bg-[#111] rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-500 rounded-full" style={{ width: members.length > 0 ? `${(completedCount / members.length) * 100}%` : "0%" }} />
            </div>
          </div>
        )}

        <div className="bg-[#1a1a1a] rounded-2xl border border-white/10 overflow-hidden">
          <div className="px-5 py-3 border-b border-white/10">
            <h3 className="font-semibold text-gray-300">Team Roster</h3>
          </div>
          <div className="divide-y divide-white/5">
            {members.map((m: Member, i: number) => (
              <div key={String(m.id)} className="px-5 py-4 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">{m.isCapitain ? "⭐ " : ""}{String(m.legalFirstName ?? "")} {String(m.legalLastName ?? "")}</div>
                  <div className="text-xs text-gray-400 mt-0.5">Position {i + 1} • {String(m.scantronId ?? "ID pending")}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${m.registrationStatus === "verified" || m.registrationStatus === "checked_in" ? "bg-green-900 text-green-300" : m.registrationStatus === "signed_up" ? "bg-blue-900 text-blue-300" : "bg-gray-700 text-gray-400"}`}>
                    {String(m.registrationStatus ?? "pre_registered")}
                  </span>
                  {m.registrationStatus === "signed_up" && (
                    <button onClick={() => verifyMember.mutate({ bowlerId: m.id as number, captainTeamId: selectedTeamId! })} className="px-2 py-1 bg-green-700 hover:bg-green-600 rounded text-xs transition-colors">Verify</button>
                  )}
                </div>
              </div>
            ))}
            {members.length === 0 && <div className="px-5 py-8 text-center text-gray-500 text-sm">No members found for this team.</div>}
          </div>
        </div>

        <div className="mt-5 bg-[#1a1a1a] rounded-2xl border border-yellow-500/20 p-5">
          <h3 className="text-sm font-semibold text-yellow-400 mb-2">📋 Team Captain Responsibilities</h3>
          <ul className="text-xs text-gray-400 space-y-1.5">
            <li>• Ensure all team members complete their sign-up before the event</li>
            <li>• Verify each member once they have signed up (click Verify button above)</li>
            <li>• Share the registration link with any members who have not signed up yet</li>
            <li>• Contact the Event Director if a member cannot be found in the system</li>
            <li>• All team members must be present and checked in at the door for the team to bowl</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
