import { useState, useEffect } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { Button } from "../ui/button";

export const SummaryView = ({ text }: { text: string }) => {
  const [speaking, setSpeaking] = useState(false);

  const toggleSpeech = () => {
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
    } else {
      // Cancel any ongoing speech first
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Try to find a nice English voice
      const voices = window.speechSynthesis.getVoices();
      const englishVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google')) || voices.find(v => v.lang.startsWith('en'));
      if (englishVoice) utterance.voice = englishVoice;
      
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);
      
      window.speechSynthesis.speak(utterance);
      setSpeaking(true);
    }
  };

  // Stop speaking if component unmounts
  useEffect(() => {
    return () => window.speechSynthesis.cancel();
  }, []);

  return (
    <div className="glass-strong p-6 rounded-xl animate-fade-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <h3 className="font-display text-lg font-semibold text-gradient">Detailed Summary</h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={toggleSpeech}
          className={`h-9 px-4 gap-2 transition-all duration-300 ${speaking ? "bg-primary/20 border-primary shadow-[0_0_15px_rgba(168,85,247,0.3)]" : "glass-hover"}`}
        >
          {speaking ? (
            <>
              <VolumeX className="h-4 w-4 animate-pulse" />
              <span>Stop Listening</span>
            </>
          ) : (
            <>
              <Volume2 className="h-4 w-4" />
              <span>Listen to Summary</span>
            </>
          )}
        </Button>
      </div>
      <div className="prose prose-invert max-w-none text-foreground/90 leading-relaxed whitespace-pre-wrap">
        {text}
      </div>
    </div>
  );
};
