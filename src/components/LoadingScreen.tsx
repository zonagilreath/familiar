"use client";

// SVG d20 wireframe used across all states
function D20Icon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer hexagon */}
      <polygon
        points="50,5 90,27.5 90,72.5 50,95 10,72.5 10,27.5"
        strokeWidth="1.5"
        stroke="currentColor"
        fill="none"
      />
      {/* Inner triangles */}
      <line x1="50" y1="5" x2="50" y2="95" stroke="currentColor" strokeWidth="1" opacity="0.6" />
      <line x1="10" y1="27.5" x2="90" y2="72.5" stroke="currentColor" strokeWidth="1" opacity="0.6" />
      <line x1="90" y1="27.5" x2="10" y2="72.5" stroke="currentColor" strokeWidth="1" opacity="0.6" />
      {/* Cross struts */}
      <line x1="50" y1="5" x2="10" y2="72.5" stroke="currentColor" strokeWidth="1" opacity="0.4" />
      <line x1="50" y1="5" x2="90" y2="72.5" stroke="currentColor" strokeWidth="1" opacity="0.4" />
      <line x1="10" y1="27.5" x2="50" y2="95" stroke="currentColor" strokeWidth="1" opacity="0.4" />
      <line x1="90" y1="27.5" x2="50" y2="95" stroke="currentColor" strokeWidth="1" opacity="0.4" />
      {/* Center diamond */}
      <polygon
        points="50,30 70,50 50,70 30,50"
        strokeWidth="1"
        stroke="currentColor"
        fill="none"
        opacity="0.5"
      />
    </svg>
  );
}

const RETRY_PHRASES = [
  "The scribes got eaten by an aboleth — sending more",
  "A gelatinous cube dissolved the first draft",
  "The courier took an arrow to the knee",
  "Turns out the map was a mimic",
  "The wizard sneezed mid-incantation — restarting the ritual",
  "A beholder blinked and disintegrated our notes",
  "The tavern bard won't stop and we can't concentrate",
  "Somebody fed the owlbear our encounter plans",
  "The ink turned out to be invisible — rewriting",
  "A rogue stole the encounter on the way here",
];

function randomRetryPhrase(): string {
  return RETRY_PHRASES[Math.floor(Math.random() * RETRY_PHRASES.length)];
}

interface LoadingScreenProps {
  state: "loading" | "success" | "error" | "retrying";
  loadingPhrase: string;
  retryPhrase?: string;
  errorMessage?: string;
  onTryAgain?: () => void;
  onBack?: () => void;
}

export { randomRetryPhrase };

export default function LoadingScreen({
  state,
  loadingPhrase,
  retryPhrase,
  errorMessage,
  onTryAgain,
  onBack,
}: LoadingScreenProps) {
  return (
    <div className="fixed inset-0 z-50 bg-bg-dark flex flex-col items-center justify-center">
      {/* Main content — vertically centered */}
      <div className="flex flex-col items-center gap-6">
        {state === "loading" && (
          <>
            <D20Icon className="w-24 h-24 text-primary animate-pulse" />
            <p className="text-slate-300 text-lg italic tracking-wide">
              {loadingPhrase}...
            </p>
            {/* Progress bar */}
            <div className="w-48 h-1 bg-primary/20 rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full animate-[loading-bar_2s_ease-in-out_infinite]" />
            </div>
          </>
        )}

        {state === "retrying" && (
          <>
            <D20Icon className="w-24 h-24 text-accent-gold animate-spin" />
            <p className="text-accent-gold text-lg font-bold italic tracking-wide text-center max-w-xs">
              {retryPhrase || "Something went wrong — trying again"}
            </p>
            {/* Progress bar */}
            <div className="w-48 h-1 bg-accent-gold/20 rounded-full overflow-hidden">
              <div className="h-full bg-accent-gold rounded-full animate-[loading-bar_2s_ease-in-out_infinite]" />
            </div>
          </>
        )}

        {state === "error" && (
          <>
            <D20Icon className="w-20 h-20 text-rose-500/70" />
            <h2 className="text-4xl font-fantasy font-bold text-rose-400 italic">
              Critical Fail!
            </h2>
            <p className="text-slate-400 text-center max-w-xs">
              {errorMessage || "The ritual was interrupted. We couldn't summon your encounter."}
            </p>
            <div className="flex gap-3 mt-2">
              {onTryAgain && (
                <button
                  onClick={onTryAgain}
                  className="px-6 py-3 border border-accent-gold/40 text-accent-gold font-bold text-sm uppercase tracking-widest hover:bg-accent-gold/10 transition-colors"
                >
                  Try Again
                </button>
              )}
              {onBack && (
                <button
                  onClick={onBack}
                  className="px-6 py-3 text-slate-500 font-bold text-sm uppercase tracking-widest hover:text-slate-300 transition-colors"
                >
                  Go Back
                </button>
              )}
            </div>
          </>
        )}

        {state === "success" && (
          <>
            <h2 className="text-4xl font-fantasy font-bold text-accent-gold italic">
              Critical Success!
            </h2>
            <p className="text-slate-400">
              The encounter is ready. Prepare your players.
            </p>
            <D20Icon className="w-24 h-24 text-accent-gold" />
            {/* Filled progress bar */}
            <div className="w-48 h-1 bg-accent-gold rounded-full" />
          </>
        )}
      </div>

      {/* Bottom flavor text */}
      <div className="absolute bottom-8 text-center">
        {(state === "loading" || state === "retrying") && (
          <p className="text-xs text-slate-600 uppercase tracking-[0.2em]">
            The dice are <span className="font-bold text-slate-500">rolling...</span>
          </p>
        )}
        {state === "error" && (
          <p className="text-xs text-slate-600 uppercase tracking-[0.2em]">
            The dice didn&apos;t land in your <span className="font-bold text-slate-500">favor this time.</span>
          </p>
        )}
        {state === "success" && (
          <p className="text-xs text-slate-600 uppercase tracking-[0.2em]">
            Fate has been <span className="font-bold text-accent-gold/60">decided</span>
          </p>
        )}
      </div>
    </div>
  );
}
