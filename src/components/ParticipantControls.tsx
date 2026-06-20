import React, { useState } from "react";
import { Participant, WHEEL_COLORS } from "../types";
import { Plus, X, Shuffle, CheckCircle2 } from "lucide-react";
import { playBtnClick } from "../utils/audio";

interface ParticipantControlsProps {
  participants: Participant[];
  onAddParticipant: (name: string) => void;
  onUpdateParticipant: (id: string, updates: Partial<Participant>) => void;
  onRemoveParticipant: (id: string) => void;
  onClearAll: () => void;
  onShuffleColorsAndOrder: () => void;
  onLoadPreset?: (items: string[]) => void;
  disabled: boolean;
  onClose?: () => void;
}

export default function ParticipantControls({
  participants,
  onAddParticipant,
  onUpdateParticipant,
  onRemoveParticipant,
  onClearAll,
  onShuffleColorsAndOrder,
  disabled,
  onClose,
}: ParticipantControlsProps) {
  const [newText, setNewText] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim() || disabled) return;

    playBtnClick();
    onAddParticipant(newText.trim());
    setNewText("");
  };

  return (
    <div 
      className="bg-[#18181b] border border-zinc-800 rounded-3xl p-5 md:p-6 shadow-2xl space-y-5 text-zinc-100 w-full mx-auto" 
      dir="rtl"
      id="edit-wheel-panel"
    >
      {/* Header aligned, deleted activeCount span and deleted toggle all/trash buttons from top bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-white tracking-tight matches-tahoma">لیست گزینه‌های گردونه</h2>
        </div>

        {/* Action icons on the top-left */}
        <div className="flex items-center gap-3">
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
              title="بازگشت"
            >
              <X size={16} />
            </button>
          )}
          <button
            onClick={() => {
              playBtnClick();
              onShuffleColorsAndOrder();
            }}
            disabled={disabled || participants.length === 0}
            className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer disabled:opacity-40"
            title="Shuffle / تصادفی‌سازی رنگ‌ها"
          >
            <Shuffle size={18} />
          </button>
        </div>
      </div>

      {/* Grid Headers - Deleted Size column */}
      <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-zinc-400 px-1">
        <span className="col-span-10 text-right">عنوان گزینه (نام فرد)</span>
        <span className="col-span-2 text-center">عملیات</span>
      </div>

      {/* Entry Row form */}
      <form onSubmit={handleSubmit} className="grid grid-cols-12 gap-2 items-center">
        <div className="col-span-10">
          <input
            type="text"
            placeholder="نام گزینه جدید را بنویسید..."
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            disabled={disabled}
            className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-zinc-700 focus:outline-none text-zinc-100 placeholder:text-zinc-500 text-sm text-right"
          />
        </div>
        <div className="col-span-2 flex justify-center">
          <button
            type="submit"
            disabled={disabled || !newText.trim()}
            className="w-full aspect-square max-w-[42px] bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all duration-150 transform active:scale-95 flex items-center justify-center cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed"
          >
            <Plus size={18} />
          </button>
        </div>
      </form>

      {/* Item List Rows */}
      <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
        {participants.length === 0 ? (
          <div className="text-center py-10 text-xs text-zinc-500 border border-dashed border-zinc-800 bg-zinc-900/20 rounded-2xl leading-relaxed matches-tahoma">
            لیست خالی است.
            <br />
            از قسمت بالا گزینه‌های دلخواه خود را بنویسید و دکمه + را بزنید.
          </div>
        ) : (
          participants.map((person) => (
            <div key={person.id} className="grid grid-cols-12 gap-2 items-center">
              {/* Text Name Input field (In-place editing) */}
              <div className="col-span-10 relative">
                <input
                  type="text"
                  value={person.name}
                  onChange={(e) => onUpdateParticipant(person.id, { name: e.target.value })}
                  onClick={() => {
                    if (!disabled && person.active) {
                      onUpdateParticipant(person.id, { isCheat: !person.isCheat });
                    }
                  }}
                  disabled={disabled}
                  className={`w-full px-4 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 focus:border-zinc-800/80 focus:outline-none text-zinc-100 text-sm text-right transition-all cursor-pointer ${
                    !person.active ? "opacity-35 line-through" : ""
                  }`}
                  style={{
                    borderRight: `4px solid ${person.color}`,
                    borderLeft: `1px solid ${person.isCheat ? "rgba(255, 255, 255, 0.22)" : "rgba(255, 255, 255, 0.05)"}`
                  }}
                />
              </div>

              {/* Action columns: Check status & Remove cross */}
              <div className="col-span-2 flex items-center justify-around gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    playBtnClick();
                    onUpdateParticipant(person.id, { active: !person.active });
                  }}
                  disabled={disabled}
                  className={`p-1.5 rounded-xl transition-all border ${
                    person.active
                      ? "bg-white text-zinc-950 border-white"
                      : "bg-transparent text-zinc-500 border-zinc-800 hover:border-zinc-700"
                  } cursor-pointer`}
                  title={person.active ? "فعال" : "غیرفعال"}
                >
                  <CheckCircle2 size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playBtnClick();
                    onRemoveParticipant(person.id);
                  }}
                  disabled={disabled}
                  className="p-1 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                  title="حذف"
                >
                  <X size={15} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Clear all config panel */}
      {participants.length > 0 && (
        <div className="pt-3 border-t border-zinc-800 flex justify-end">
          <button
            onClick={() => {
              playBtnClick();
              onClearAll();
            }}
            className="text-[10px] bg-red-950/40 hover:bg-red-950 border border-red-900/35 text-red-400 font-semibold px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer matches-tahoma"
          >
            پاک کردن همه اسامی
          </button>
        </div>
      )}
    </div>
  );
}
