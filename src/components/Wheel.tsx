import { useEffect, useRef, useState } from "react";
import { Participant } from "../types";
import { playTickSound, playWinnerSound, playBtnClick } from "../utils/audio";
import { Volume2, VolumeX, RefreshCw, Gauge } from "lucide-react";

interface WheelProps {
  participants: Participant[]; // we will draw active ones
  onSpinComplete: (winner: Participant) => void;
  isSpinning: boolean;
  setIsSpinning: (val: boolean) => void;
  soundEnabled: boolean;
  setSoundEnabled: (val: boolean) => void;
  isCheatActive: boolean;
  setIsCheatActive: (val: boolean) => void;
}

export default function Wheel({
  participants,
  onSpinComplete,
  isSpinning,
  setIsSpinning,
  soundEnabled,
  setSoundEnabled,
  isCheatActive,
  setIsCheatActive,
}: WheelProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);

  // Filter list to render only active options on the wheel
  const activeParticipants = participants.filter((p) => p.active);

  // Physical motion states
  const [currentAngle, setCurrentAngle] = useState(0);
  const stateRef = useRef({
    angle: 0,
    omega: 0,
    isSpinning: false,
    lastTickIndex: -1,
  });

  // Spin intensity (combines power and duration) persisted in localStorage
  const [spinIntensity, setSpinIntensity] = useState<number>(() => {
    const saved = localStorage.getItem("wheel_spin_intensity");
    if (saved) {
      const parsed = Number(saved);
      if (!isNaN(parsed) && parsed >= 3 && parsed <= 10) {
        return parsed;
      }
    }
    return 6; // Beautiful, safe default intensity
  });

  const getFriction = (durationValue: number) => {
    if (durationValue <= 5) {
      return 0.95 + (durationValue - 1) * 0.0085; // at 1: 0.95, at 5: 0.984
    } else {
      return 0.984 + (durationValue - 5) * 0.002; // at 10: 0.994
    }
  };

  // Sync stateRef with props
  useEffect(() => {
    stateRef.current.isSpinning = isSpinning;
  }, [isSpinning]);

  // Redraw whenever active items, colors array, angle, or cheat mode status changes
  useEffect(() => {
    drawWheel();
  }, [participants, currentAngle, isCheatActive]);

  const drawWheel = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    // Minimize margins to make the wheel physically larger inside the canvas bounding box
    const radius = Math.min(centerX, centerY) - 8;

    // Clear background
    ctx.clearRect(0, 0, width, height);

    // Draw outer dark neon ring structure
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 4, 0, Math.PI * 2);
    ctx.fillStyle = "#18181b"; // zinc-900 background
    ctx.shadowColor = "#f97316"; // orange-500 glow
    ctx.shadowBlur = 14;
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();

    if (activeParticipants.length === 0) {
      // Empty state circular preview guide
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fillStyle = "#27272a"; // zinc-800
      ctx.fill();

      ctx.fillStyle = "#a1a1aa"; // zinc-404
      ctx.font = "bold 16px Vazirmatn, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("گزینه‌ای فعال نیست", centerX, centerY);
      ctx.restore();
      return;
    }

    // Sum weights of active slices
    const totalWeight = activeParticipants.reduce((sum, p) => sum + (p.weight || 1), 0);
    let currentAccumAngle = stateRef.current.angle;

    activeParticipants.forEach((person, idx) => {
      const arcSize = ((person.weight || 1) / totalWeight) * 2 * Math.PI;
      const startAngle = currentAccumAngle;
      const endAngle = startAngle + arcSize;

      // Draw Slice
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = person.color;
      ctx.fill();

      // Premium subtle borders
      ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();

      // Slice label Text rendering
      ctx.save();
      ctx.translate(centerX, centerY);
      const textAngle = startAngle + arcSize / 2;
      ctx.rotate(textAngle);

      // Label styling based on contrasting segment background
      ctx.fillStyle = getContrastColor(person.color);
      
      // Font size increased and made larger as requested ("اسم های درون آن را کمی بزرگتر کن")
      const fontS = activeParticipants.length > 15 ? 13 : activeParticipants.length > 10 ? 15 : 17;
      ctx.font = `bold ${fontS}px Vazirmatn, sans-serif`;
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";

      // Label truncation
      const displayText = truncateText(person.name, 12);
      ctx.fillText(displayText, radius - 16, 0);
      ctx.restore();

      // Advance start position for next slice
      currentAccumAngle = endAngle;
    });

    // Draw central circular metal hub
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, Math.max(radius * 0.18, 30), 0, Math.PI * 2);
    ctx.fillStyle = "#09090b"; // zinc-950
    ctx.shadowColor = "rgba(0, 0, 0, 0.65)";
    ctx.shadowBlur = 10;
    ctx.fill();

    // Inner glowing ring chrome edge
    ctx.strokeStyle = "#f4f4f5";
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.restore();
  };

  const getContrastColor = (hex: string): string => {
    const cleanHex = hex.replace("#", "");
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 140 ? "#09090b" : "#FFFFFF";
  };

  const truncateText = (text: string, maxLen: number) => {
    return text.length > maxLen ? text.substring(0, maxLen - 1) + "…" : text;
  };

  // Determines current active indices under top center pointer [1.5 * Math.PI]
  const getIndexAtPointer = (angle: number) => {
    const N = activeParticipants.length;
    if (N === 0) return -1;

    const totalWeight = activeParticipants.reduce((sum, p) => sum + (p.weight || 1), 0);
    
    // Pointer stays stationary at top center (1.5 * PI)
    const pointerAngle = (1.5 * Math.PI - angle) % (2 * Math.PI);
    const targetAngle = pointerAngle < 0 ? pointerAngle + 2 * Math.PI : pointerAngle;

    let accumulatedAngle = 0;
    for (let i = 0; i < N; i++) {
      const arcSize = ((activeParticipants[i].weight || 1) / totalWeight) * 2 * Math.PI;
      const nextAngle = accumulatedAngle + arcSize;
      if (targetAngle >= accumulatedAngle && targetAngle < nextAngle) {
        return i;
      }
      accumulatedAngle = nextAngle;
    }
    return 0; // fallback
  };

  const startSpin = () => {
    if (isSpinning || activeParticipants.length === 0) return;

    if (soundEnabled) playBtnClick();
    setIsSpinning(true);

    const currentFriction = getFriction(spinIntensity);
    const powerMultiplier = 0.4 + (spinIntensity - 1) * 0.15; // default 6 -> 1.15

    // Initial random physical angular velocity boost
    let initialOmega = (0.45 + Math.random() * 0.28) * powerMultiplier;

    // Decide who the target winner index is in activeParticipants!
    let targetWinnerIndex = -1;
    const cheatIndex = activeParticipants.findIndex((p) => p.isCheat);

    if (isCheatActive) {
      if (cheatIndex !== -1) {
        // Cheat mode is active: target the cheat option!
        targetWinnerIndex = cheatIndex;
      } else {
        // Cheat mode is active but NO cheat option was selected / configured!
        // Disable cheat mode status visually
        setIsCheatActive(false);
        // Reset to normal completely random choice between ALL options
        targetWinnerIndex = Math.floor(Math.random() * activeParticipants.length);
      }
    } else {
      // Cheat mode is deactivated: target one of the other options!
      const nonCheatIndices = activeParticipants
        .map((p, idx) => ({ p, idx }))
        .filter((item) => !item.p.isCheat)
        .map((item) => item.idx);

      if (nonCheatIndices.length > 0) {
        const randIdx = Math.floor(Math.random() * nonCheatIndices.length);
        targetWinnerIndex = nonCheatIndices[randIdx];
      } else {
        targetWinnerIndex = 0;
      }
    }

    if (targetWinnerIndex !== -1) {
      const totalWeight = activeParticipants.reduce((sum, p) => sum + (p.weight || 1), 0);
      let accum = 0;
      for (let i = 0; i < targetWinnerIndex; i++) {
        accum += ((activeParticipants[i].weight || 1) / totalWeight) * 2 * Math.PI;
      }
      const sliceSize = ((activeParticipants[targetWinnerIndex].weight || 1) / totalWeight) * 2 * Math.PI;
      
      // Target a random spot across almost the entire slice (leaving only a tiny 1% boundary buffer) for a fully natural landing
      const randomOffset = sliceSize * (0.01 + Math.random() * 0.98);
      const centerSlice = accum + randomOffset;

      let targetStopAngle = (1.5 * Math.PI - centerSlice) % (2 * Math.PI);
      if (targetStopAngle < 0) targetStopAngle += 2 * Math.PI;

      const startAngle = stateRef.current.angle;
      let deltaAngle = targetStopAngle - startAngle;
      while (deltaAngle < 0) deltaAngle += 2 * Math.PI;

      // Choose a random number of full spins based on intensity duration component
      const spins = Math.max(1, Math.floor(spinIntensity * 1.2)) + Math.floor(Math.random() * 2);
      const targetTravel = deltaAngle + 2 * Math.PI * spins;

      // High-precision binary search simulation to find the exact initial velocity
      let low = 0.01;
      let high = 8.0;
      let bestOmega = initialOmega;
      let bestDiff = Infinity;

      for (let iter = 0; iter < 50; iter++) {
        const midOmega = (low + high) / 2;
        
        let simOmega = midOmega;
        let simAngle = startAngle;
        while (simOmega >= 0.0018) {
          simOmega *= currentFriction;
          simAngle += simOmega;
        }
        
        const simTravel = simAngle - startAngle;
        const diff = simTravel - targetTravel;

        if (Math.abs(diff) < bestDiff) {
          bestDiff = Math.abs(diff);
          bestOmega = midOmega;
        }

        if (simTravel < targetTravel) {
          low = midOmega;
        } else {
          high = midOmega;
        }
      }
      initialOmega = bestOmega;
    }

    stateRef.current.omega = initialOmega;

    const animate = () => {
      const state = stateRef.current;

      // Realist physics rotary friction damping
      state.omega *= currentFriction; 
      state.angle += state.omega;

      // Wrap angle safely
      state.angle = state.angle % (2 * Math.PI);
      if (state.angle < 0) state.angle += 2 * Math.PI;
      setCurrentAngle(state.angle);

      // Wheel clicking tic sounds simulation
      if (activeParticipants.length > 0) {
        const currentTickIndex = getIndexAtPointer(state.angle);
        if (currentTickIndex !== state.lastTickIndex) {
          state.lastTickIndex = currentTickIndex;
          if (soundEnabled && state.omega > 0.005) {
            const mult = Math.min(1.4, Math.max(0.65, state.omega * 3));
            playTickSound(mult);
          }
        }
      }

      // Check if speed slowed down enough to conclude
      if (state.omega < 0.0018) {
        state.omega = 0;
        setIsSpinning(false);
        if (soundEnabled) playWinnerSound();

        const winnerIndex = getIndexAtPointer(state.angle);
        const winner = activeParticipants[winnerIndex];

        setTimeout(() => {
          onSpinComplete(winner);
        }, 350);

        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
          animationRef.current = null;
        }
      } else {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  };

  return (
    <div className="flex flex-col items-center select-none w-full" id="wheel-container">
      {/* Sound toggle controls header */}
      <div className="w-full max-w-[310px] sm:max-w-xs flex justify-between items-center mb-3.5">
        <button
          onClick={() => {
            playBtnClick();
            setSoundEnabled(!soundEnabled);
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
            soundEnabled
              ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
              : "bg-zinc-800/80 text-zinc-400 border border-zinc-700/80"
          }`}
          title={soundEnabled ? "غیرفعال کردن صدا" : "فعال کردن صدا"}
          dir="rtl"
        >
          {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
          <span>{soundEnabled ? "صدا روشن" : "بـی‌صدا"}</span>
        </button>

        {activeParticipants.length > 0 && !isSpinning && (
          <div className="flex items-center gap-1 text-zinc-400 text-xs font-sans font-bold" dir="rtl">
            <span>{activeParticipants.length} مورد فعال</span>
          </div>
        )}
      </div>

      {/* Wheel Core Canvas container - increased dimension limits specifically on small/mobile screens */}
      <div className="relative w-full max-w-[318px] sm:max-w-[340px] md:max-w-[380px] aspect-square flex items-center justify-center">
        
        {/* Needle Top element */}
        <div 
          className={`absolute top-1 z-30 transform -translate-x-1/2 left-1/2 w-6 h-8 text-amber-500 origin-top pointer-events-none transition-transform duration-75 ${
            isSpinning ? "rotate-3" : "rotate-0"
          }`}
        >
          <svg viewBox="0 0 24 32" className="w-6 h-8 drop-shadow-[0_2px_4px_rgba(249,115,22,0.6)]">
            <path
              d="M12 32L2 4C2 1.79086 3.79086 0 6 0H18C20.2091 0 22 1.79086 22 4L12 32Z"
              fill="currentColor"
            />
            <path
              d="M12 24L5 5C5 3.89543 5.89543 3 7 3H17C18.1046 3 19 3.89543 19 5L12 24Z"
              fill="#FFF"
              opacity="0.32"
            />
          </svg>
        </div>

        {/* Real-time Canvas component - adjusted Tailwind CSS sizing classes */}
        <canvas
          id="wheel-canvas"
          ref={canvasRef}
          width={400}
          height={400}
          className="w-full h-full max-w-[310px] max-h-[310px] sm:max-w-[340px] sm:max-h-[340px] md:max-w-[400px] md:max-h-[400px] rounded-full drop-shadow-[0_12px_24px_rgba(0,0,0,0.65)]"
        />

        {/* Center SPIN Trigger circle button */}
        <button
          onClick={startSpin}
          disabled={isSpinning || activeParticipants.length === 0}
          className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 w-[72px] h-[72px] md:w-[84px] md:h-[84px] rounded-full border-4 border-[#09090b] bg-gradient-to-tr from-amber-600 via-orange-500 to-amber-500 text-white font-extrabold text-xs sm:text-sm md:text-base flex flex-col items-center justify-center cursor-pointer shadow-[0_5px_12px_rgba(249,115,22,0.4)] transition-all duration-300 hover:scale-105 active:scale-95 disabled:from-zinc-800 disabled:to-zinc-900 disabled:shadow-none disabled:cursor-not-allowed`}
          style={{ fontFamily: "'Vazirmatn', 'Tahoma', sans-serif" }}
        >
          {isSpinning ? (
            <RefreshCw className="animate-spin text-white" size={24} />
          ) : (
            <div className="flex flex-col items-center">
              <span className="text-xs sm:text-sm md:text-base font-extrabold select-none">بچرخون!</span>
            </div>
          )}
        </button>
      </div>

      {/* Dynamic Physics Sliders Control Panel */}
      <div className="w-full max-w-[310px] sm:max-w-xs bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-4 mt-6 space-y-4" dir="rtl" id="spin-physics-controls">
        {/* Combined Spin Intensity Roller */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-zinc-300 font-semibold">
              <Gauge size={14} className="text-amber-500" />
              <span>شدت چرخش (قدرت و زمان)</span>
            </div>
            <span className="font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md font-bold">
              {spinIntensity}
            </span>
          </div>
          <input
            type="range"
            min="3" // Safe minimum value to prevent instant stopping or glitching
            max="10"
            step="1"
            value={spinIntensity}
            disabled={isSpinning}
            onChange={(e) => {
              const val = Number(e.target.value);
              if (soundEnabled) playBtnClick();
              setSpinIntensity(val);
              localStorage.setItem("wheel_spin_intensity", String(val));
            }}
            className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-orange-500 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
          />
          <div className="flex justify-between text-[10px] text-zinc-500 text-right">
            <span>کم‌قدرت و کوتاه (حداقل ۳)</span>
            <span>متوسط</span>
            <span>حداکثر سرعت و زمان (۱۰)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
