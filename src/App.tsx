import React, { useState, useEffect } from "react";
import { Participant, WHEEL_COLORS } from "./types";
import { playBtnClick } from "./utils/audio";
import Wheel from "./components/Wheel";
import ParticipantControls from "./components/ParticipantControls";
import ScoreBoard from "./components/ScoreBoard";
import ConfettiCanvas from "./components/ConfettiCanvas";
import { Sparkles, Edit, RotateCcw, Award, ArrowLeft, Trophy, UserMinus, Crown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  // Option lists start completely empty to clear defaults ("گزینه های پیش فرض را پاک کن")
  const [participants, setParticipants] = useState<Participant[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("lucky_wheel_participants_v3");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            return parsed.map((p: any) => ({
              ...p,
              weight: 1, // force equal weight size 1
              active: p.active !== undefined ? Boolean(p.active) : true,
              score: p.score !== undefined ? Number(p.score) : 0,
            }));
          }
        } catch (e) {
          // fallback
        }
      }
    }
    return []; // Empty initial state as requested
  });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("lucky_wheel_sound");
      return saved !== "false";
    }
    return true;
  });

  // Pages view router: "wheel" tab vs "edit" tab. Fully separate pages, no modals!
  const [currentView, setCurrentView] = useState<"wheel" | "edit">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("lucky_wheel_current_view");
      if (saved === "wheel" || saved === "edit") return saved;
    }
    return "wheel";
  });

  const [isSpinning, setIsSpinning] = useState(false);
  const [currentWinner, setCurrentWinner] = useState<Participant | null>(null);
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [isCheatActive, setIsCheatActive] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("lucky_wheel_is_cheat");
      return saved === "true";
    }
    return false;
  });

  // PWA (Progressive Web App) Install Prompts
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Check if user is on iOS and hasn't installed PWA yet
    if (typeof window !== "undefined" && typeof navigator !== "undefined") {
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
      const isStandalone = (window.navigator as any).standalone || window.matchMedia("(display-mode: standalone)").matches;
      
      if (isIosDevice && !isStandalone) {
        setIsIOS(true);
      }
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowInstallBanner(false);
    }
    setDeferredPrompt(null);
  };

  const triggerInstallFlow = async () => {
    if (soundEnabled) playBtnClick();
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") {
          setShowInstallBanner(false);
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.warn("PWA install prompt failed", err);
        setShowInstallBanner(true);
      }
    } else {
      const userAgent = (typeof navigator !== "undefined" ? navigator.userAgent : "").toLowerCase();
      const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
      if (isIosDevice) {
        setIsIOS(true);
        setShowInstallBanner(false);
      } else {
        setShowInstallBanner(true);
      }
    }
  };

  const handleBackgroundClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest("button, input, select, textarea, canvas, a, [role='button']")) {
      setIsCheatActive((prev) => {
        const next = !prev;
        if (next) {
          // If trying to activate cheat, only let it activate if at least one participant has isCheat enabled
          const hasCheat = participants.some((p) => p.active && p.isCheat);
          if (!hasCheat) {
            return false;
          }
        }
        return next;
      });
    }
  };

  // Synchronize and persist state instantly in browser localStorage
  useEffect(() => {
    localStorage.setItem("lucky_wheel_participants_v3", JSON.stringify(participants));
  }, [participants]);

  useEffect(() => {
    localStorage.setItem("lucky_wheel_sound", String(soundEnabled));
  }, [soundEnabled]);

  useEffect(() => {
    localStorage.setItem("lucky_wheel_current_view", currentView);
  }, [currentView]);

  useEffect(() => {
    localStorage.setItem("lucky_wheel_is_cheat", String(isCheatActive));
  }, [isCheatActive]);

  const handleAddParticipant = (name: string) => {
    const newParticipant: Participant = {
      id: Math.random().toString(36).substring(2, 9),
      name,
      color: WHEEL_COLORS[participants.length % WHEEL_COLORS.length],
      weight: 1,
      active: true,
      score: 0,
    };
    setParticipants((prev) => [...prev, newParticipant]);
  };

  const handleUpdateParticipant = (id: string, updates: Partial<Participant>) => {
    setParticipants((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          return { ...p, ...updates };
        }
        // If updating isCheat to true on one participant, clear it on all others
        if (updates.isCheat !== undefined && updates.isCheat) {
          return { ...p, isCheat: false };
        }
        return p;
      })
    );
  };

  const handleRemoveParticipant = (id: string) => {
    setParticipants((prev) => prev.filter((p) => p.id !== id));
  };

  const handleClearAll = () => {
    setParticipants([]);
  };

  const handleLoadPreset = (items: string[]) => {
    const newList: Participant[] = items.map((name, idx) => ({
      id: Math.random().toString(36).substring(2, 9) + idx,
      name,
      color: WHEEL_COLORS[idx % WHEEL_COLORS.length],
      weight: 1,
      active: true,
      score: 0,
    }));
    setParticipants(newList);
  };

  const handleUpdateScore = (id: string, newScore: number) => {
    setParticipants((prev) =>
      prev.map((p) => (p.id === id ? { ...p, score: newScore } : p))
    );
  };

  const handleResetScores = () => {
    setParticipants((prev) =>
      prev.map((p) => ({ ...p, score: 0 }))
    );
  };

  const handleSpinComplete = (winner: Participant) => {
    setCurrentWinner(winner);
    setShowWinnerModal(true);
  };

  const handleDismissWinner = () => {
    if (soundEnabled) playBtnClick();
    if (currentWinner) {
      handleUpdateScore(currentWinner.id, (currentWinner.score || 0) + 1);
    }
    setShowWinnerModal(false);
    setCurrentWinner(null);
  };

  const handleDismissAndRemoveWinner = () => {
    if (soundEnabled) playBtnClick();
    if (currentWinner) {
      handleUpdateParticipant(currentWinner.id, { active: false });
    }
    setShowWinnerModal(false);
    setCurrentWinner(null);
  };

  const handleShuffleColorsAndOrder = () => {
    setParticipants((prev) => {
      const shuffled = [...prev];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled.map((p, idx) => ({
        ...p,
        color: WHEEL_COLORS[idx % WHEEL_COLORS.length],
      }));
    });
  };

  return (
    <div 
      onClick={handleBackgroundClick}
      className="min-h-screen bg-[#030712] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-[#09090b] to-black text-zinc-100 flex flex-col justify-between py-6 px-4 md:px-8 relative overflow-x-hidden select-none"
    >
      
      {/* Celebration Confetti Engine */}
      <ConfettiCanvas active={showWinnerModal} />

      {/* PWA Standard Install Banner */}
      <AnimatePresence>
        {showInstallBanner && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="w-full max-w-xl mx-auto mb-4 bg-zinc-900/90 border border-orange-500/20 backdrop-blur-md p-4 rounded-2xl flex items-center justify-between shadow-[0_8px_30px_rgb(0,0,0,0.4)] relative z-40"
            dir="rtl"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 shadow-inner">
                <Sparkles size={18} className="text-orange-400 animate-pulse" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white matches-tahoma">نصب اپلیکیشن گردونه شانس</h4>
                <p className="text-[10px] text-zinc-400 matches-tahoma mt-1 leading-relaxed">برنامه را روی گوشی یا کامپیوتر نصب کنید تا بدون نیاز به اینترنت و با سرعت بالا اجرا شود.</p>
              </div>
            </div>
            <div className="flex items-center gap-2 mr-3">
              <button
                onClick={handleInstallClick}
                className="bg-gradient-to-tr from-orange-500 to-amber-400 hover:from-orange-400 hover:to-amber-300 text-neutral-950 text-[11px] font-black px-4 py-2 rounded-lg cursor-pointer transition-all shadow-md active:scale-95 matches-tahoma whitespace-nowrap"
              >
                نصب برنامه
              </button>
              <button
                onClick={() => setShowInstallBanner(false)}
                className="text-zinc-400 hover:text-zinc-200 text-xs px-2 py-2 transition-all cursor-pointer matches-tahoma"
              >
                بعداً
              </button>
            </div>
          </motion.div>
        )}

        {/* PWA iOS installation guide banner */}
        {isIOS && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="w-full max-w-xl mx-auto mb-4 bg-zinc-900/90 border border-indigo-500/20 backdrop-blur-md p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[0_8px_30px_rgb(0,0,0,0.4)] relative z-40"
            dir="rtl"
          >
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shadow-inner shrink-0">
                <Crown size={18} className="text-indigo-400 animate-pulse" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white matches-tahoma">نصب گردونه شانس روی آیفون (iOS)</h4>
                <p className="text-[10px] text-zinc-400 matches-tahoma mt-1 leading-relaxed">
                  در پایین صفحه مرورگر دکمه <strong className="text-indigo-300 font-bold">اشتراک‌گذاری (Share)</strong> را زده و در منوی باز شده گزینه <strong className="text-indigo-300 font-bold">Add to Home Screen</strong> را انتخاب کنید.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end">
              <button
                onClick={() => setIsIOS(false)}
                className="text-zinc-400 hover:text-zinc-200 text-xs px-3 py-1.5 transition-all cursor-pointer border border-zinc-800 rounded-lg matches-tahoma"
              >
                متوجه شدم
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Main Navigation Header */}
      <header className="w-full max-w-xl mx-auto flex items-center justify-between border-b border-zinc-800/50 pb-4 mb-6" dir="rtl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300 bg-gradient-to-tr from-orange-500 via-amber-500 to-yellow-400 shadow-[0_4px_12px_rgba(249,115,22,0.25)]">
            <AnimatePresence mode="wait">
              {isCheatActive ? (
                <motion.div
                  key="cheat-icon"
                  initial={{ opacity: 0, rotate: -180, scale: 0.6 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={{ opacity: 0, rotate: 180, scale: 0.6 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                  className="flex items-center justify-center"
                >
                  <Crown size={16} className="text-zinc-950 animate-pulse" />
                </motion.div>
              ) : (
                <motion.div
                  key="normal-icon"
                  initial={{ opacity: 0, rotate: 180, scale: 0.6 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={{ opacity: 0, rotate: -180, scale: 0.6 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                  className="flex items-center justify-center"
                >
                  <Sparkles size={16} className="text-zinc-950 animate-pulse" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="flex flex-col items-start">
            <button
              onClick={triggerInstallFlow}
              className="text-right block select-none cursor-pointer focus:outline-none transition-all active:scale-95 group"
              title="نصب اپلیکیشن گردونه شانس"
            >
              <h1 className="text-xl md:text-2xl font-black bg-gradient-to-l from-orange-400 to-amber-200 bg-clip-text text-transparent leading-none matches-tahoma hover:opacity-80 flex items-center gap-1.5">
                گردونه شانس
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse inline-block" />
              </h1>
            </button>
            <p className="text-[10px] text-zinc-400 font-semibold mt-1 font-sans">
              سیستم هوشمند قرعه‌کشی و انتخاب تصادفی اسامی
            </p>
          </div>
        </div>

        {/* View Page Toggle Navigation Links */}
        <div className="flex items-center gap-2">
          {currentView === "wheel" ? (
            <button
              onClick={() => {
                playBtnClick();
                setCurrentView("edit");
              }}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 hover:scale-[1.02] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md cursor-pointer transition-all matches-tahoma"
            >
              <Edit size={14} />
              <span>لیست گزینه‌ها ({participants.length})</span>
            </button>
          ) : (
            <button
              onClick={() => {
                playBtnClick();
                setCurrentView("wheel");
              }}
              className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 hover:scale-[1.02] text-zinc-200 text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm cursor-pointer transition-all matches-tahoma"
            >
              <ArrowLeft size={14} />
              <span>بازگشت به گردونه بازی</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Single-Viewport Presentation stage (No modals, separate layouts!) */}
      <main className="w-full max-w-xl mx-auto flex-1 flex flex-col justify-center py-2">
        {currentView === "wheel" ? (
          /* PAGE 1: THE WHEEL SCREEN */
          <div className="flex flex-col items-center justify-center py-6 space-y-6">
            <Wheel
              participants={participants}
              isSpinning={isSpinning}
              setIsSpinning={setIsSpinning}
              onSpinComplete={handleSpinComplete}
              soundEnabled={soundEnabled}
              setSoundEnabled={setSoundEnabled}
              isCheatActive={isCheatActive}
              setIsCheatActive={setIsCheatActive}
            />

            {/* ScoreBoard section beneath the wheel */}
            {participants.length > 0 && (
              <ScoreBoard
                participants={participants}
                onUpdateScore={handleUpdateScore}
                onResetScores={handleResetScores}
                disabled={isSpinning}
              />
            )}

            {/* Empty list screen prompting helper */}
            {participants.length === 0 && (
              <div className="text-center space-y-3 bg-zinc-900/40 border border-zinc-800 rounded-3xl p-6 max-w-xs animate-fade-in" dir="rtl">
                <p className="text-xs text-zinc-400 leading-relaxed matches-tahoma">
                  هنوز هیچ گزینه‌ای درون گردونه وارد نشده است. لطفاً ابتدا اسامی یا گزینه‌ها را بنویسید:
                </p>
                <button
                  onClick={() => {
                    playBtnClick();
                    setCurrentView("edit");
                  }}
                  className="w-full bg-gradient-to-tr from-orange-500 to-amber-500 text-neutral-950 font-black text-xs py-2.5 rounded-xl cursor-pointer hover:opacity-90 matches-tahoma"
                >
                  افزودن سریع اسم‌ها به گردونه
                </button>
              </div>
            )}

            {participants.length > 0 && !isSpinning && (
              <button
                onClick={() => {
                  playBtnClick();
                  setCurrentView("edit");
                }}
                className="text-zinc-500 hover:text-zinc-300 transition-colors text-xs font-semibold underline underline-offset-4 cursor-pointer matches-tahoma"
              >
                می‌خواهید لیست اسامی رقیب را تغییر دهید؟ کلیک کنید
              </button>
            )}
          </div>
        ) : (
          /* PAGE 2: THE EDIT SCREEN (Entirely separate layout, spacious list, no modals!) */
          <div className="max-w-md mx-auto w-full animate-fade-in">
            <ParticipantControls
              participants={participants}
              onAddParticipant={handleAddParticipant}
              onUpdateParticipant={handleUpdateParticipant}
              onRemoveParticipant={handleRemoveParticipant}
              onClearAll={handleClearAll}
              onShuffleColorsAndOrder={handleShuffleColorsAndOrder}
              onLoadPreset={handleLoadPreset}
              disabled={isSpinning}
              onClose={() => setCurrentView("wheel")}
            />
          </div>
        )}
      </main>

      {/* INDIVIDUAL LUCKY WINNER SPECIFIC CELEBRATION DISMISSIBLE PANEL */}
      {showWinnerModal && currentWinner && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in"
          dir="rtl"
          id="winner-modal"
        >
          <div 
            className="w-full max-w-sm bg-gradient-to-b from-zinc-900 to-zinc-950 border border-orange-500/50 rounded-3xl p-6 md:p-8 shadow-[0_15px_35px_rgba(249,115,22,0.35)] animate-slide-up text-center relative overflow-hidden"
          >
            {/* Ambient background accent blur blobs */}
            <div className="absolute -top-12 -left-12 w-24 h-24 rounded-full bg-orange-500/10 blur-xl pointer-events-none" />
            <div className="absolute -bottom-12 -right-12 w-24 h-24 rounded-full bg-indigo-500/15 blur-xl pointer-events-none" />

            <div className="flex flex-col items-center space-y-4">
              
              {/* Spinning trophy */}
              <div className="relative">
                <div className="absolute inset-0 bg-orange-500/30 rounded-full blur-md animate-pulse" />
                <div className="relative w-16 h-16 bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 rounded-full flex items-center justify-center shadow-lg border border-white/20">
                  <Trophy className="text-white animate-bounce" size={28} />
                </div>
              </div>

              {/* Title & Winner showcase */}
              <div className="space-y-1">
                <span className="text-xs text-orange-400 font-bold bg-orange-500/10 px-2.5 py-0.5 rounded-full matches-tahoma">برنده نهایی قرعه‌کشی</span>
                <h3 
                  className="text-2xl md:text-3xl font-black text-white matches-tahoma pt-2 tracking-tight overflow-hidden break-words line-clamp-2 leading-tight"
                >
                  {currentWinner.name}
                </h3>
              </div>

              <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-400">
                <div 
                  className="w-2.5 h-2.5 rounded-full" 
                  style={{ backgroundColor: currentWinner.color }} 
                />
                <span className="matches-tahoma">بخش گردونه با موفقیت انتخاب شد</span>
              </div>

              {/* Actions */}
              <div className="w-full pt-4 space-y-2.5">
                <button
                  type="button"
                  onClick={handleDismissWinner}
                  className="w-full flex items-center justify-center gap-1.5 bg-gradient-to-tr from-orange-500 via-amber-500 to-yellow-500 hover:from-orange-400 hover:to-yellow-400 text-neutral-950 font-black py-3 px-4 rounded-xl transition-all duration-150 cursor-pointer shadow-md transform active:scale-95 text-xs font-bold matches-tahoma"
                >
                  <span>ثبت و تلاش مجدد</span>
                </button>

                <button
                  type="button"
                  onClick={handleDismissAndRemoveWinner}
                  className="w-full flex items-center justify-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-red-400 hover:text-red-300 py-3 px-4 rounded-xl transition-all duration-150 cursor-pointer text-xs font-bold matches-tahoma"
                >
                  <UserMinus size={14} />
                  <span>غیرفعال کردن این برنده روی گردونه</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
