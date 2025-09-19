import React from "react";
import { Hexagon } from "lucide-react"; // bee/honeycomb inspired icon

const LandingView = ({ setView }) => {
  return (
    <div className="h-screen w-screen flex flex-col bg-gradient-to-b from-yellow-50 to-amber-100 text-slate-900">
      {/* Navbar */}
      <header className="flex justify-between items-center px-8 py-4 border-b border-amber-200">
        <h1 className="text-2xl font-bold text-amber-600 flex items-center gap-2">
          <Hexagon className="w-7 h-7 text-amber-500" /> BuzzTalk
        </h1>
        <div className="space-x-4">
          <button
            onClick={() => setView("login")}
            className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold transition"
          >
            Login
          </button>
          <button
            onClick={() => setView("register")}
            className="px-5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold transition"
          >
            Register
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex flex-1 flex-col md:flex-row items-center justify-center px-10 md:px-20">
        {/* Left Side: Text */}
        <div className="flex-1 max-w-lg text-center md:text-left space-y-6 animate-fade-in">
          <h2 className="text-4xl md:text-6xl font-extrabold leading-tight">
            Chat Smarter. Chat <span className="text-amber-600">Buzzier.</span>
          </h2>
          <p className="text-lg md:text-xl text-slate-700">
            End-to-end encrypted, real-time messaging inspired by the hive —
            secure, fast, and buzzing with possibilities.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
            <button
              onClick={() => setView("register")}
              className="px-8 py-3 bg-amber-500 hover:bg-amber-600 rounded-lg font-semibold shadow-lg text-white transition-transform transform hover:scale-105"
            >
              Get Started
            </button>
            <button
              onClick={() => setView("login")}
              className="px-8 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg font-semibold shadow-lg text-white transition-transform transform hover:scale-105"
            >
              Already a user?
            </button>
          </div>
        </div>

        {/* Right Side: Illustration Placeholder */}
        <div className="flex-1 hidden md:flex items-center justify-center">
          <img
            src="/images/smiling.png"
            alt="Bee / Honeycomb illustration"
            className="w-80 h-80 object-contain drop-shadow-xl animate-fade-in-up"
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-slate-600 text-sm border-t border-amber-200">
        © {new Date().getFullYear()} BuzzTalk — The Hive for Private Messaging
      </footer>
    </div>
  );
};

export default LandingView;
