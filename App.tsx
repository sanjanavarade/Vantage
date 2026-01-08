import React, { useState, useEffect } from "react";
import { processVideoWithGemini } from "./services/geminiService";
import { RecapData, AppStatus, AppView, User, BrandTone } from "./types";
import Header from "./components/Header";
import UploadArea from "./components/UploadArea";
import ProcessingView from "./components/ProcessingView";
import ResultDashboard from "./components/ResultDashboard";
import { AlertCircle, CheckCircle2, X } from "lucide-react";

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [view, setView] = useState<AppView>("home");
  const [progressMessage, setProgressMessage] = useState<string>("");
  const [recapData, setRecapData] = useState<RecapData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [tone, setTone] = useState<BrandTone>("professional");
  const [authModal, setAuthModal] = useState<{
    isOpen: boolean;
    mode: "login" | "signup";
  }>({ isOpen: false, mode: "login" });

  useEffect(() => {
    const savedUser = localStorage.getItem("recap_user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleFileUpload = async (file: File) => {
    if (!user) {
      setAuthModal({ isOpen: true, mode: "login" });
      return;
    }

    try {
      setStatus(AppStatus.UPLOADING);
      setProgressMessage("Reading video file...");
      setError(null);

      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1];
        const mimeType = file.type;

        try {
          setStatus(AppStatus.PROCESSING);
          const data = await processVideoWithGemini(
            base64,
            mimeType,
            setProgressMessage,
            tone
          );
          setRecapData(data);
          setStatus(AppStatus.COMPLETED);
        } catch (err: any) {
          setError(err.message || "An error occurred during processing.");
          setStatus(AppStatus.ERROR);
        }
      };
      reader.onerror = () => {
        setError("Failed to read video file.");
        setStatus(AppStatus.ERROR);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
      setStatus(AppStatus.ERROR);
    }
  };

  const handleUrlRecap = async (url: string) => {
    if (!user) {
      setAuthModal({ isOpen: true, mode: "login" });
      return;
    }
    if (!url.trim()) return;

    try {
      setStatus(AppStatus.PROCESSING);
      setProgressMessage("Fetching URL metadata...");
      const data = await processVideoWithGemini(
        null,
        null,
        setProgressMessage,
        tone,
        url
      );
      setRecapData(data);
      setStatus(AppStatus.COMPLETED);
    } catch (err: any) {
      setError(err.message || "An error occurred processing the URL.");
      setStatus(AppStatus.ERROR);
    }
  };

  const loginMock = (email: string) => {
    const newUser = { email, isPro: false };
    setUser(newUser);
    localStorage.setItem("recap_user", JSON.stringify(newUser));
    setAuthModal({ isOpen: false, mode: "login" });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("recap_user");
    reset();
  };

  const upgradeToPro = () => {
    if (!user) {
      setAuthModal({ isOpen: true, mode: "signup" });
      return;
    }
    const updatedUser = { ...user, isPro: true };
    setUser(updatedUser);
    localStorage.setItem("recap_user", JSON.stringify(updatedUser));
    setView("home");
  };

  const reset = () => {
    setStatus(AppStatus.IDLE);
    setView("home");
    setRecapData(null);
    setError(null);
  };

  const renderContent = () => {
    if (view === "pricing")
      return <PricingView onUpgrade={upgradeToPro} currentPro={user?.isPro} />;
    if (view === "features") return <FeaturesView />;
    if (view === "case-studies") return <CaseStudiesView />;

    if (status === AppStatus.IDLE) {
      return (
        <div className="space-y-16 py-12">
          <section className="text-center space-y-6 max-w-4xl mx-auto">
            <h1 className="text-6xl md:text-8xl font-extrabold tracking-tight text-white leading-tight">
              Video to Viral <br />
              <span className="gradient-text">In Seconds</span>
            </h1>
            <p className="text-slate-400 text-xl md:text-2xl font-medium max-w-3xl mx-auto">
              Vantage watches your videos to generate high-engagement social
              posts, blogs, and interactive timestamps using Gemini's multimodal
              power.
            </p>
          </section>

          <UploadArea
            onUpload={handleFileUpload}
            onUrlRecap={handleUrlRecap}
            tone={tone}
            setTone={setTone}
          />

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Video Understanding",
                desc: "Gemini doesn't just read your transcript; it watches the screen to understand context.",
              },
              {
                title: "Brand Consistency",
                desc: "Choose your tone—Professional, Humorous, or Minimalist—to keep your brand on-point.",
              },
              {
                title: "One-Click Publishing",
                desc: "Instantly push content to Buffer, Notion, or Twitter with seamless integrations.",
              },
            ].map((f, i) => (
              <div
                key={i}
                className="dark-card p-8 rounded-[2rem] hover:border-indigo-500/30 transition-colors group"
              >
                <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 mb-6 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                  <CheckCircle2 size={24} />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{f.title}</h3>
                <p className="text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (status === AppStatus.UPLOADING || status === AppStatus.PROCESSING) {
      return <ProcessingView message={progressMessage} />;
    }

    if (status === AppStatus.COMPLETED && recapData) {
      return <ResultDashboard data={recapData} onReset={reset} />;
    }

    if (status === AppStatus.ERROR) {
      return (
        <div className="max-w-xl mx-auto dark-card border-red-500/20 p-12 rounded-[3rem] text-center space-y-8 mt-20">
          <div className="flex justify-center">
            <div className="bg-red-500/10 p-6 rounded-full">
              <AlertCircle size={64} className="text-red-500" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-white">
              Something went wrong
            </h2>
            <p className="text-slate-400 font-medium">{error}</p>
          </div>
          <button
            onClick={reset}
            className="gradient-bg px-10 py-4 rounded-2xl text-white font-bold hover:opacity-90 transition-opacity w-full shadow-lg"
          >
            Try Again
          </button>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen pb-20 selection:bg-indigo-500 selection:text-white">
      <Header
        onReset={() => setView("home")}
        setView={setView}
        user={user}
        onLogout={logout}
        onLogin={() => setAuthModal({ isOpen: true, mode: "login" })}
      />

      <main className="max-w-7xl mx-auto px-6">{renderContent()}</main>

      {authModal.isOpen && (
        <AuthModal
          mode={authModal.mode}
          onClose={() => setAuthModal({ ...authModal, isOpen: false })}
          onAuth={loginMock}
        />
      )}
    </div>
  );
};

const AuthModal: React.FC<{
  mode: "login" | "signup";
  onClose: () => void;
  onAuth: (e: string) => void;
}> = ({ mode, onClose, onAuth }) => {
  const [email, setEmail] = useState("");
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative glass w-full max-w-md p-10 rounded-[2.5rem] shadow-2xl animate-in zoom-in duration-300">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>
        <div className="text-center space-y-4 mb-8">
          <h2 className="text-3xl font-extrabold text-white">
            {mode === "login" ? "Welcome Back" : "Create Account"}
          </h2>
          <p className="text-slate-400">
            Join Vantage to start repurposing videos.
          </p>
        </div>
        <form
          className="space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            onAuth(email || "demo@user.com");
          }}
        >
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-400 ml-1">
              Email Address
            </label>
            <input
              type="email"
              required
              placeholder="name@company.com"
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500 transition-colors"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-400 ml-1">
              Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
          <button className="w-full gradient-bg py-4 rounded-2xl font-bold text-white shadow-xl shadow-indigo-500/20 hover:scale-[1.02] transition-transform">
            {mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
};

const PricingView: React.FC<{
  onUpgrade: () => void;
  currentPro?: boolean;
}> = ({ onUpgrade, currentPro }) => (
  <div className="py-20 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="text-center space-y-4">
      <h2 className="text-5xl font-extrabold text-white">
        Simple, transparent pricing
      </h2>
      <p className="text-slate-400 text-xl max-w-2xl mx-auto">
        Scale your content creation without scaling your workload.
      </p>
    </div>
    <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
      <div className="dark-card p-10 rounded-[3rem] space-y-8 flex flex-col border-white/5">
        <div className="space-y-2">
          <h3 className="text-2xl font-bold text-white">Starter</h3>
          <div className="flex items-baseline gap-1">
            <span className="text-5xl font-black text-white">$0</span>
            <span className="text-slate-500">/mo</span>
          </div>
        </div>
        <ul className="space-y-4 flex-1">
          {[
            "3 videos per month",
            "LinkedIn post generation",
            "Twitter thread generation",
            "Timestamp creation",
          ].map((item, i) => (
            <li
              key={i}
              className="flex items-center gap-3 text-slate-400 font-medium"
            >
              <CheckCircle2 size={18} className="text-indigo-500" /> {item}
            </li>
          ))}
        </ul>
        <button
          disabled
          className="w-full bg-slate-800 py-4 rounded-2xl font-bold text-slate-400 cursor-not-allowed"
        >
          Current Plan
        </button>
      </div>
      <div className="relative dark-card p-10 rounded-[3rem] space-y-8 flex flex-col border-indigo-500/30 ring-1 ring-indigo-500/50">
        <div className="absolute -top-4 right-10 gradient-bg px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-lg">
          Most Popular
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-bold text-white">Vantage Pro</h3>
          <div className="flex items-baseline gap-1">
            <span className="text-5xl font-black text-white">$29</span>
            <span className="text-slate-500">/mo</span>
          </div>
        </div>
        <ul className="space-y-4 flex-1">
          {[
            "Unlimited video processing",
            "Everything in Starter",
            "Blog post generation",
            "Visual nuance analysis",
            "Priority processing",
          ].map((item, i) => (
            <li
              key={i}
              className="flex items-center gap-3 text-slate-300 font-semibold"
            >
              <CheckCircle2 size={18} className="text-indigo-400" /> {item}
            </li>
          ))}
        </ul>
        <button
          onClick={onUpgrade}
          disabled={currentPro}
          className={`w-full gradient-bg py-4 rounded-2xl font-bold text-white shadow-2xl shadow-indigo-500/30 transition-transform ${
            currentPro ? "opacity-50 cursor-not-allowed" : "hover:scale-[1.02]"
          }`}
        >
          {currentPro ? "Already Pro" : "Upgrade to Pro"}
        </button>
      </div>
    </div>
  </div>
);

const FeaturesView: React.FC = () => (
  <div className="py-20 space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="text-center space-y-4">
      <h2 className="text-5xl font-extrabold text-white">
        Built for the modern creator
      </h2>
      <p className="text-slate-400 text-xl max-w-2xl mx-auto">
        Multimodal AI that understands your video context deeply.
      </p>
    </div>
    <div className="grid md:grid-cols-2 gap-8">
      {[
        {
          title: "Video Understanding",
          desc: "Gemini doesn't just read your transcript; it watches the screen to understand charts, expressions, and physical cues.",
        },
        {
          title: "Brand Consistency",
          desc: "Customize the output tone to match your unique voice across every social platform automatically.",
        },
        {
          title: "One-Click Publishing",
          desc: "Export directly to Buffer, Hootsuite, or Notion with our seamless integrations.",
        },
        {
          title: "Visual Timestamps",
          desc: "Generate a chronological breakdown of your video that specifically highlights visual aids and screen shares.",
        },
      ].map((f, i) => (
        <div key={i} className="dark-card p-10 rounded-[2.5rem] flex gap-6">
          <div className="shrink-0 w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center text-indigo-400">
            <CheckCircle2 size={24} />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-white">{f.title}</h3>
            <p className="text-slate-400 leading-relaxed font-medium">
              {f.desc}
            </p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const CaseStudiesView: React.FC = () => (
  <div className="py-20 space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="text-center space-y-4">
      <h2 className="text-5xl font-extrabold text-white">
        Trusted by top agencies
      </h2>
      <p className="text-slate-400 text-xl max-w-2xl mx-auto">
        See how teams are saving 20+ hours per week with Vantage.
      </p>
    </div>
    <div className="grid md:grid-cols-2 gap-8">
      {[
        {
          author: "Alex Rivera",
          role: "CMO at GrowthGen",
          quote:
            "We used to spend 5 hours per YouTube video for promotion. Now it takes exactly 45 seconds.",
          stats: "80% Time Saved",
        },
        {
          author: "Sarah Jenkins",
          role: "Solo YouTuber",
          quote:
            "The visual nuance Gemini captures is insane. It actually referenced the specific graph I showed at 04:20.",
          stats: "+40% Engagement",
        },
      ].map((c, i) => (
        <div
          key={i}
          className="glass p-10 rounded-[3rem] border-white/5 space-y-6 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-8 text-indigo-500/20">
            <AlertCircle size={100} />
          </div>
          <p className="text-2xl font-medium text-slate-300 italic">
            "{c.quote}"
          </p>
          <div className="flex items-center justify-between pt-6 border-t border-white/5">
            <div>
              <p className="font-bold text-white text-lg">{c.author}</p>
              <p className="text-slate-500">{c.role}</p>
            </div>
            <div className="text-indigo-400 font-black text-xl">{c.stats}</div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default App;
