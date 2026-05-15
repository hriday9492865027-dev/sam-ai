import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, X, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";

export interface FlashcardsData {
  flashcards: {
    front: string;
    back: string;
  }[];
}

type CardStatus = "unreviewed" | "got-it" | "needs-review";

export const FlashcardView = ({ data }: { data: FlashcardsData }) => {
  const [statuses, setStatuses] = useState<Record<number, CardStatus>>({});
  const [flippedState, setFlippedState] = useState<Record<number, boolean>>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  const handleFlip = (i: number) => {
    setFlippedState((prev) => ({ ...prev, [i]: !prev[i] }));
  };

  const handleStatus = (i: number, status: CardStatus, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent flipping when clicking buttons
    setStatuses((prev) => ({ ...prev, [i]: status }));
  };

  const total = data.flashcards.length;
  const mastered = Object.values(statuses).filter(s => s === "got-it").length;
  const reviewing = Object.values(statuses).filter(s => s === "needs-review").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h3 className="font-display text-lg font-semibold text-gradient">Interactive Flashcards</h3>
        
        {/* Progress Tracker */}
        <div className="flex items-center gap-4 text-sm font-medium bg-background/50 backdrop-blur-md px-4 py-2 rounded-full border border-border/50">
          <span className="text-foreground/80">Total: <span className="text-primary">{total}</span></span>
          <span className="text-success/90">Mastered: {mastered}</span>
          <span className="text-destructive/90">Review: {reviewing}</span>
        </div>
      </div>

      <div className="relative group/container">
        {/* Navigation Buttons */}
        <button 
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-20 h-12 w-12 flex items-center justify-center rounded-full glass-strong border border-white/20 shadow-xl opacity-0 group-hover/container:opacity-100 transition-opacity hover:bg-white/10 hidden sm:flex -left-6"
        >
          <ChevronLeft className="h-6 w-6 text-foreground" />
        </button>
        <button 
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-20 h-12 w-12 flex items-center justify-center rounded-full glass-strong border border-white/20 shadow-xl opacity-0 group-hover/container:opacity-100 transition-opacity hover:bg-white/10 hidden sm:flex -right-6"
        >
          <ChevronRight className="h-6 w-6 text-foreground" />
        </button>

        <div 
          ref={scrollRef}
          className="flex overflow-x-auto gap-8 pb-8 px-10 -mx-4 snap-x snap-mandatory hide-scrollbar scroll-smooth relative" 
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
        {data.flashcards.map((card, i) => {
          const isFlipped = flippedState[i];
          const status = statuses[i] || "unreviewed";

          return (
            <div 
              key={i} 
              className="group relative h-[320px] w-[280px] sm:w-[350px] flex-shrink-0 snap-center cursor-pointer perspective-1000"
              onClick={() => handleFlip(i)}
            >
              {/* 3D Card Container */}
              <div 
                className={`w-full h-full duration-500 [transform-style:preserve-3d] transition-transform ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}
              >
                {/* Front of Card */}
                <div className={`absolute inset-0 w-full h-full p-6 glass-strong rounded-2xl border-2 flex flex-col items-center justify-center text-center [backface-visibility:hidden]
                  ${status === 'got-it' ? 'border-success/50 bg-success/5 shadow-[0_0_20px_rgba(34,197,94,0.15)]' : status === 'needs-review' ? 'border-destructive/50 bg-destructive/5 shadow-[0_0_20px_rgba(239,68,68,0.15)]' : 'border-primary/20 hover:border-primary/50'}`}>
                  <span className="absolute top-4 left-5 text-xs font-mono text-muted-foreground bg-background/30 px-2 py-0.5 rounded-full border border-border/50">{i + 1} / {total}</span>
                  <h4 className="text-xl font-medium text-foreground/90 px-2 leading-tight">{card.front}</h4>
                  <div className="absolute bottom-6 flex flex-col items-center gap-1 opacity-40 group-hover:opacity-80 transition-opacity">
                    <RefreshCw className="w-4 h-4 animate-spin-slow" />
                    <p className="text-[10px] uppercase tracking-widest font-bold">Tap to flip</p>
                  </div>
                </div>

                {/* Back of Card */}
                <div className="absolute inset-0 w-full h-full p-6 glass-strong rounded-2xl border-2 border-primary/40 flex flex-col [transform:rotateY(180deg)] [backface-visibility:hidden] bg-background/95 overflow-hidden">
                  <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar flex items-center justify-center py-4">
                    <p className="text-base leading-relaxed text-foreground/90 text-center font-light">{card.back}</p>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex justify-center gap-3 mt-4 pt-4 border-t border-border/50">
                    <Button 
                      size="sm" 
                      variant={status === 'needs-review' ? 'destructive' : 'outline'}
                      className="flex-1 h-10 text-xs font-bold uppercase tracking-wider"
                      onClick={(e) => handleStatus(i, 'needs-review', e)}
                    >
                      <X className="w-3 h-3 mr-1.5" /> Review
                    </Button>
                    <Button 
                      size="sm" 
                      variant={status === 'got-it' ? 'default' : 'outline'}
                      className={`flex-1 h-10 text-xs font-bold uppercase tracking-wider ${status === 'got-it' ? 'bg-success hover:bg-success/90 text-background border-success' : 'hover:text-success hover:border-success'}`}
                      onClick={(e) => handleStatus(i, 'got-it', e)}
                    >
                      <Check className="w-3 h-3 mr-1.5" /> Got it
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        </div>
      </div>
    </div>
  );
};
