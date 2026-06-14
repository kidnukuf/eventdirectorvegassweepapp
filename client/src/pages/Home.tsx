import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

export default function Home() {
  const [, setLocation] = useLocation();
  const { data: event } = trpc.event.active.useQuery();

  const roles = [
    {
      icon: "🎯",
      title: "Event Director",
      desc: "Full admin access — manage all bowlers, centers, and events",
      path: "/admin",
      color: "from-yellow-500 to-orange-500",
      glow: "shadow-yellow-500/40",
    },
    {
      icon: "📋",
      title: "Program Director",
      desc: "League-scoped oversight and reporting",
      path: "/program-director",
      color: "from-cyan-500 to-blue-500",
      glow: "shadow-cyan-500/40",
    },
    {
      icon: "🎳",
      title: "Team Captain",
      desc: "Manage your team roster and verify members",
      path: "/captain",
      color: "from-green-500 to-emerald-500",
      glow: "shadow-green-500/40",
    },
    {
      icon: "🚪",
      title: "Doorman",
      desc: "Check-in guests and manage wristbands at the door",
      path: "/doorman",
      color: "from-purple-500 to-pink-500",
      glow: "shadow-purple-500/40",
    },
    {
      icon: "👤",
      title: "Bowler Sign-Up",
      desc: "Register and claim your bowler profile",
      path: "/register",
      color: "from-red-500 to-rose-500",
      glow: "shadow-red-500/40",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white overflow-hidden relative">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="text-6xl mb-4 animate-bounce">🎳</div>
          <h1
            className="text-5xl md:text-7xl font-black mb-3 tracking-tight"
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              background: "linear-gradient(135deg, #ffd700, #ff8c00, #00ffff)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              textShadow: "none",
              filter: "drop-shadow(0 0 30px rgba(255,215,0,0.5))",
            }}
          >
            VEGAS SWEEPS
          </h1>
          <h2
            className="text-2xl md:text-3xl font-bold text-cyan-400 mb-2"
            style={{ textShadow: "0 0 20px rgba(0,255,255,0.6)" }}
          >
            FUNTIME
          </h2>
          {event && (
            <p className="text-gray-400 text-lg mt-2">
              {(event as Record<string, unknown>).eventName as string} •{" "}
              {(event as Record<string, unknown>).bowlingDate as string}
            </p>
          )}
          <div className="mt-4 h-px w-64 mx-auto bg-gradient-to-r from-transparent via-yellow-500 to-transparent" />
        </div>

        {/* Role Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 w-full max-w-4xl">
          {roles.map((role) => (
            <button
              key={role.path}
              onClick={() => setLocation(role.path)}
              className={`group relative p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm
                hover:border-white/30 hover:bg-white/10 transition-all duration-200
                hover:shadow-2xl ${role.glow} hover:scale-[1.02] active:scale-[0.98]
                text-left cursor-pointer`}
            >
              <div
                className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-200 bg-gradient-to-br ${role.color}`}
              />
              <div className="text-4xl mb-3">{role.icon}</div>
              <h3 className="text-xl font-bold text-white mb-1">{role.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{role.desc}</p>
              <div
                className={`mt-4 h-0.5 w-0 group-hover:w-full transition-all duration-300 bg-gradient-to-r ${role.color}`}
              />
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-gray-600 text-sm">
          <p>Vegas Sweeps Funtime Event Management System</p>
          <p className="mt-1 text-xs">
            Powered by local-first technology • Works offline
          </p>
        </div>
      </div>
    </div>
  );
}
