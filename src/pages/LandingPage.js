// src/pages/LandingPage.js
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Footer from "../components/Footer";
import {
  Check,
  Clock,
  Users,
  ArrowRight,
  Menu,
  X,
} from "lucide-react";

function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileOpen(false);
  };

  const jobs = [
    {
      title: "AI Search Rater",
      pay: "Competitive hourly earnings",
      desc: "Evaluate search results, AI responses, and advertisements to improve model accuracy.",
    },
    {
      title: "Data Collection Tasks",
      pay: "Flexible task-based pay",
      desc: "Submit audio, images, or text prompts that help train next-generation AI systems.",
    },
    {
      title: "AI Data Annotation",
      pay: "Consistent hourly opportunities",
      desc: "Label images, text, and conversations using intuitive annotation tools.",
    },
    {
      title: "Search & Video Evaluator",
      pay: "Ongoing project availability",
      desc: "Help optimize search engines and recommendation platforms.",
    },
    {
      title: "Ad Quality Reviewer",
      pay: "Fast microtasks",
      desc: "Review and rate advertisements in minutes from anywhere.",
    },
    {
      title: "Specialized AI Projects",
      pay: "Higher-paying opportunities",
      desc: "Work on advanced AI training tasks based on your expertise.",
    },
  ];

  const steps = [
    { step: 1, title: "Create a Free Account", desc: "Sign up in minutes with no upfront costs." },
    { step: 2, title: "Complete Qualification", desc: "Take a short assessment to unlock available tasks." },
    { step: 3, title: "Start Earning", desc: "Choose flexible AI tasks that fit your schedule." },
    { step: 4, title: "Get Paid", desc: "Receive weekly payouts via PayPal, M-Pesa, or bank transfer." },
  ];

  return (
    <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white">
      {/* ===== HEADER ===== */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-slate-900/95 backdrop-blur-md shadow-lg"
            : "bg-transparent"
        }`}
      >
        <nav className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold flex items-center gap-2">
            Cirqle<span className="text-amber-400">Online</span>
            <span className="hidden sm:inline text-xs bg-amber-400/20 px-2 py-1 rounded-full">
              online
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6 text-sm">
            <button onClick={() => scrollTo("jobs")} className="hover:text-amber-400 transition">
              Tasks
            </button>
            <button onClick={() => scrollTo("how")} className="hover:text-amber-400 transition">
              How It Works
            </button>
            <span className="text-blue-200">
              Remote AI tasks • Earn up to $500/month*
            </span>
            <Link to="/signin" className="hover:text-amber-400 transition">
              Log In
            </Link>
            <Link
              to="/signup"
              className="bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 font-semibold px-4 py-2 rounded-full hover:shadow-md transition"
            >
              Join Free
            </Link>
          </div>

          {/* Mobile Toggle */}
          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden text-2xl">
            {mobileOpen ? <X /> : <Menu />}
          </button>
        </nav>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden bg-slate-900/95 backdrop-blur-md border-t border-white/10">
            <div className="px-6 py-6 space-y-4 text-center">
              <button onClick={() => scrollTo("jobs")} className="block hover:text-amber-400">
                Tasks
              </button>
              <button onClick={() => scrollTo("how")} className="block hover:text-amber-400">
                How It Works
              </button>
              <Link to="/signin" className="block hover:text-amber-400">
                Log In
              </Link>
              <Link
                to="/signup"
                className="block bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 font-semibold py-2 rounded-full"
              >
                Join Free
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ===== HERO ===== */}
      <section className="pt-28 pb-20 px-4 text-center">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
            Earn Online by Training Artificial Intelligence
          </h1>
          <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
            Cirqle Online connects people worldwide with flexible AI training tasks.
            Complete surveys, microtasks, and evaluations — no experience required.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
            <Link
              to="/signup"
              className="bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 font-semibold px-6 py-3 rounded-full hover:shadow-md transition flex items-center justify-center gap-2"
            >
              Start Earning <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              onClick={() => scrollTo("jobs")}
              className="border border-white/30 px-6 py-3 rounded-full hover:bg-white/10 transition"
            >
              View Available Tasks
            </button>
          </div>

          <div className="flex justify-center gap-6 text-sm text-blue-200 flex-wrap">
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-400" /> Flexible remote work
            </span>
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4" /> Weekly payouts
            </span>
            <span className="flex items-center gap-2">
              <Users className="w-4 h-4" /> Global contributor community
            </span>
          </div>

          <p className="text-xs text-blue-300 mt-6">
            *Earnings vary based on task availability and participation.
          </p>
        </div>
      </section>

      {/* ===== JOBS ===== */}
      <section id="jobs" className="py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-3">
            Available AI Training Tasks
          </h2>
          <p className="text-blue-100 mb-10">
            New AI projects are added regularly. Work when you want, from anywhere.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job, i) => (
              <div
                key={i}
                className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 hover:border-amber-400/50 transition"
              >
                <h3 className="text-lg font-semibold mb-2">{job.title}</h3>
                <p className="text-amber-400 font-medium mb-3">{job.pay}</p>
                <p className="text-sm text-blue-100 mb-4">{job.desc}</p>
                <Link
                  to="/signup"
                  className="text-amber-400 text-sm font-medium hover:underline inline-flex items-center gap-1"
                >
                  Get Started <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how" className="py-20 px-4 bg-white/5">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-3">How Cirqle Online Works</h2>
          <p className="text-blue-100 mb-10">
            A simple, transparent process designed for anyone.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {steps.map((s) => (
              <div key={s.step} className="relative">
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 h-full">
                  <div className="w-10 h-10 mx-auto mb-4 bg-amber-500 rounded-full flex items-center justify-center font-bold">
                    {s.step}
                  </div>
                  <h3 className="font-semibold mb-2 text-sm">{s.title}</h3>
                  <p className="text-blue-200 text-xs">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <Link
            to="/signup"
            className="mt-10 inline-block bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 font-semibold px-6 py-3 rounded-full hover:shadow-md transition"
          >
            Join Cirqle Online
          </Link>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="py-20 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">
            Start Earning While Shaping the Future of AI
          </h2>
          <p className="text-blue-100 mb-8">
            Join Cirqle Online today and contribute to real-world AI systems used globally.
          </p>
          <Link
            to="/signup"
            className="inline-block bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 font-semibold px-6 py-3 rounded-full hover:shadow-md transition"
          >
            Create Free Account
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default LandingPage;
