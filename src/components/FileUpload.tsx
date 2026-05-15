import { useCallback, useRef, useState } from "react";
import { Upload, FileText, Image as ImageIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { extractText } from "@/lib/extract";
import { toast } from "sonner";

interface Props {
  onExtracted: (text: string, file: File) => void;
}

export const FileUpload = ({ onExtracted }: Props) => {
  const [drag, setDrag] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [preview, setPreview] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ pct: number; msg: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (fileList: File[]) => {
    if (!fileList || fileList.length === 0) return;
    
    const validFiles = fileList.filter(f => {
      const isPdf = f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf");
      const isImg = f.type.startsWith("image/");
      return isPdf || isImg;
    });

    if (validFiles.length === 0) {
      toast.error("Please upload PDF or image files.");
      return;
    }

    setFiles(validFiles);
    const firstImg = validFiles.find(f => f.type.startsWith("image/"));
    setPreview(firstImg ? URL.createObjectURL(firstImg) : null);
    
    setBusy(true);
    setProgress({ pct: 0, msg: "Starting…" });
    
    try {
      let combinedText = "";
      
      for (let i = 0; i < validFiles.length; i++) {
        const f = validFiles[i];
        const text = await extractText(f, (pct, msg) => {
           const fileWeight = 100 / validFiles.length;
           const basePct = i * fileWeight;
           const filePct = pct * (fileWeight / 100);
           setProgress({ 
             pct: Math.round(basePct + filePct), 
             msg: validFiles.length > 1 ? `[${i+1}/${validFiles.length}] ${msg}` : msg 
           });
        });
        
        if (text) {
          combinedText += (i > 0 ? "\n\n---\n\n" : "") + text;
        }
      }

      if (!combinedText || combinedText.length < 20) {
        toast.warning("Extracted very little text. The files might be scanned images with poor quality.");
      } else {
        toast.success(`Extracted ${combinedText.length.toLocaleString()} characters from ${validFiles.length} file(s).`);
      }
      onExtracted(combinedText, validFiles[0]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Extraction failed.");
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }, [onExtracted]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
    const droppedFiles = e.dataTransfer.files ? Array.from(e.dataTransfer.files) : [];
    if (droppedFiles.length) handleFiles(droppedFiles);
  };

  const reset = () => {
    setFiles([]);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="glass p-6 md:p-8 animate-fade-up">
      <div className="relative z-10">
        <h2 className="font-display text-xl md:text-2xl font-semibold mb-1">
          1. Upload a lesson
        </h2>
        <p className="text-sm text-muted-foreground mb-5">Select multiple PDFs or images. Text will be recognized in the order selected.</p>

        {files.length === 0 && (
          <label
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={onDrop}
            className={`block cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-300 p-10 text-center
              ${drag ? "border-primary bg-primary/10 glow-ring" : "border-border/60 hover:border-primary/60 hover:bg-white/[0.03]"}`}
          >
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf,image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files) handleFiles(Array.from(e.target.files));
              }}
            />
            <div className="flex flex-col items-center gap-3">
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary to-primary-glow grid place-items-center shadow-lg animate-float">
                <Upload className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <div className="font-medium">Drop a file here or <span className="text-gradient">browse</span></div>
                <div className="text-xs text-muted-foreground mt-1">Supports .pdf, .png, .jpg, .jpeg</div>
              </div>
            </div>
          </label>
        )}

        {files.length > 0 && (
          <div className="space-y-4">
            <div className="flex flex-col gap-2 p-4 rounded-xl bg-white/[0.04] border border-border/60 max-h-60 overflow-y-auto">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded bg-gradient-to-br from-primary/30 to-accent/30 grid place-items-center shrink-0">
                    {f.type.startsWith("image/") ? <ImageIcon className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{f.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {(f.size / 1024).toFixed(1)} KB · {f.type || "unknown"}
                    </div>
                  </div>
                </div>
              ))}
              {!busy && (
                <Button variant="ghost" size="sm" onClick={reset} aria-label="Remove all" className="w-full mt-2">
                  <X className="h-4 w-4 mr-2" /> Clear Files
                </Button>
              )}
            </div>

            {preview && (
              <img src={preview} alt="Lesson preview" className="max-h-64 rounded-xl mx-auto border border-border/60" />
            )}

            {busy && progress && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span className="capitalize">{progress.msg}</span>
                  <span>{progress.pct}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-primary-glow transition-all duration-300"
                    style={{ width: `${progress.pct}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
