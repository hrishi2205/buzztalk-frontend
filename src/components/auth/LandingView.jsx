import React from "react";
import { Hexagon, Sparkles, ShieldCheck } from "lucide-react";

const LandingView = ({ setView }) => {
  return (
    <div className="relative h-screen w-screen flex flex-col overflow-hidden text-slate-900">
      {/* Background gradient + subtle dot grid */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-amber-100 via-yellow-50 to-amber-200" />
      <div className="absolute inset-0 -z-10 opacity-50 bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.06)_1px,transparent_1px)] bg-[length:16px_16px]" />

      {/* Floating hexagon accents */}
      <div className="pointer-events-none absolute -top-10 -left-10 w-64 h-64 bg-amber-300/30 [clip-path:polygon(25%_6.7%,75%_6.7%,100%_50%,75%_93.3%,25%_93.3%,0_50%)] blur-2xl" />
      <div className="pointer-events-none absolute bottom-10 -right-10 w-72 h-72 bg-amber-400/30 [clip-path:polygon(25%_6.7%,75%_6.7%,100%_50%,75%_93.3%,25%_93.3%,0_50%)] blur-2xl" />

      {/* Navbar */}
      <header className="flex justify-between items-center px-4 py-4 md:px-8 md:py-5">
        <h1 className="text-2xl font-extrabold text-amber-700 flex items-center gap-2 drop-shadow-sm">
          <Hexagon className="w-7 h-7 text-amber-600" /> BuzzTalk
        </h1>
        <div className="flex gap-2 md:gap-3">
          <button
            onClick={() => setView("login")}
            className="px-4 py-1.5 md:px-5 md:py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-semibold transition shadow-sm active:scale-95 text-sm md:text-base"
          >
            Login
          </button>
          <button
            onClick={() => setView("register")}
            className="px-4 py-1.5 md:px-5 md:py-2 rounded-xl bg-gradient-to-b from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-white font-semibold transition shadow-sm active:scale-95 text-sm md:text-base"
          >
            Join the Hive
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex flex-1 items-center justify-center px-6 md:px-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 w-full max-w-6xl">
          {/* Text Column */}
          <div className="flex flex-col justify-center gap-6">
            <div>
              <p className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                <Sparkles className="w-3.5 h-3.5" /> End-to-end encrypted •
                Real-time
              </p>
            </div>
            <h2 className="text-4xl md:text-6xl font-black leading-tight">
              Chat like a <span className="text-amber-600">Bee</span> — fast,
              secure, and beautifully{" "}
              <span className="text-amber-600">buzzing</span>.
            </h2>
            <p className="text-lg md:text-xl text-slate-700">
              A modern, secure chat app inspired by the hive. Simple, sleek, and
              private—so your conversations stay yours.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => setView("register")}
                className="px-7 py-3 rounded-xl bg-gradient-to-b from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-white font-semibold shadow-md active:scale-95"
              >
                Start buzzing
              </button>
              <button
                onClick={() => setView("login")}
                className="px-7 py-3 rounded-xl bg-white/70 backdrop-blur-md border border-amber-200 hover:bg-white text-slate-900 font-semibold shadow-md active:scale-95"
              >
                I already have a hive
              </button>
            </div>
            <div className="flex items-center gap-3 text-slate-600">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span className="text-sm">
                No trackers. No ads. Just encrypted chat.
              </span>
            </div>
          </div>

          {/* Visual Column */}
          <div className="relative hidden md:block">
            <div className="absolute -top-6 -left-6 w-40 h-40 bg-amber-300/60 [clip-path:polygon(25%_6.7%,75%_6.7%,100%_50%,75%_93.3%,25%_93.3%,0_50%)]" />
            <div className="absolute top-10 right-6 w-24 h-24 bg-amber-400/60 [clip-path:polygon(25%_6.7%,75%_6.7%,100%_50%,75%_93.3%,25%_93.3%,0_50%)]" />
            <div className="absolute bottom-4 left-10 w-28 h-28 bg-yellow-400/60 [clip-path:polygon(25%_6.7%,75%_6.7%,100%_50%,75%_93.3%,25%_93.3%,0_50%)]" />
            <div className="relative mx-auto w-[420px] h-[420px] rounded-3xl border border-amber-200 bg-white/70 backdrop-blur-md shadow-[0_8px_30px_rgba(0,0,0,0.06)] flex items-center justify-center">
              <img
                src="/images/smiling.png"
                alt="Bee / Honeycomb illustration"
                className="w-72 h-72 object-contain drop-shadow-xl"
              />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-slate-600 text-sm">
        © {new Date().getFullYear()} BuzzTalk — The Hive for Private Messaging
      </footer>
    </div>
  );
};

export default LandingView;
