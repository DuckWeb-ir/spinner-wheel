import { Participant } from "../types";
import { Plus, Minus, RotateCcw, Award } from "lucide-react";
import { playBtnClick } from "../utils/audio";

interface ScoreBoardProps {
  participants: Participant[];
  onUpdateScore: (id: string, newScore: number) => void;
  onResetScores: () => void;
  disabled: boolean;
}

export default function ScoreBoard({
  participants,
  onUpdateScore,
  onResetScores,
  disabled,
}: ScoreBoardProps) {
  // Only show score for participants that exist
  if (participants.length === 0) return null;

  // Let's filter to active ones or show all of them. Active is usually best but showing all who have scores is also nice. Let's show all participants so they don't lose track of inactive ones.
  return (
    <div 
      className="w-full max-w-sm bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-5 md:p-6 shadow-xl space-y-4 animate-fade-in"
      dir="rtl"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-amber-400">
          <Award size={18} />
          <h3 className="text-sm font-black matches-tahoma">جدول امتیازها</h3>
        </div>
        
        <button
          onClick={() => {
            playBtnClick();
            onResetScores();
          }}
          disabled={disabled}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] sm:text-xs bg-zinc-850 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/60 rounded-xl transition-all cursor-pointer matches-tahoma disabled:opacity-40"
        >
          <RotateCcw size={12} />
          <span>ریست امتیازها</span>
        </button>
      </div>

      <div className="space-y-2">
        {participants.map((person) => {
          const score = person.score || 0;
          return (
            <div 
              key={person.id}
              className="flex items-center justify-between p-2 rounded-xl bg-zinc-950/40 border border-zinc-850 text-xs transition-all hover:bg-zinc-950/60"
            >
              {/* Participant Color and Name */}
              <div className="flex items-center gap-2">
                <div 
                  className="w-2.5 h-2.5 rounded-full shrink-0" 
                  style={{ backgroundColor: person.color }} 
                />
                <span className={`font-semibold text-zinc-200 truncate max-w-[124px] ${!person.active ? "opacity-40" : ""}`}>
                  {person.name}
                </span>
              </div>

              {/* Score Counter controls */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    playBtnClick();
                    onUpdateScore(person.id, Math.max(0, score - 1));
                  }}
                  disabled={disabled}
                  className="w-6 h-6 rounded-lg bg-zinc-850 hover:bg-zinc-800 border border-zinc-700/55 flex items-center justify-center text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                >
                  <Minus size={11} />
                </button>

                <span className="font-mono font-black text-sm text-amber-400 min-w-[20px] text-center select-none">
                  {score}
                </span>

                <button
                  onClick={() => {
                    playBtnClick();
                    onUpdateScore(person.id, score + 1);
                  }}
                  disabled={disabled}
                  className="w-6 h-6 rounded-lg bg-zinc-850 hover:bg-zinc-800 border border-zinc-700/55 flex items-center justify-center text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                >
                  <Plus size={11} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
