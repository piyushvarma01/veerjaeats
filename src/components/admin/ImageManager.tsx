import { useRef, useState } from "react";
import { ArrowDown, ArrowUp, GripVertical, ImagePlus, Loader2, RefreshCw, Star, Trash2, ZoomIn } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type ManagedImage = { id: string; url: string; alt: string; primary: boolean; variantId?: string | null };

type Props = {
  images: ManagedImage[];
  onUpload: (files: File[], variantId?: string | null) => Promise<void>;
  onReorder: (ids: string[]) => void;
  onPrimary: (id: string) => void;
  onDelete: (id: string) => void;
  onAlt: (id: string, alt: string) => void;
  onReplace: (id: string, file: File) => Promise<void>;
  variants?: { id: string; label: string }[] | undefined;
  onVariant?: ((id: string, variantId: string | null) => void) | undefined;
};

export function ImageManager({ images, onUpload, onReorder, onPrimary, onDelete, onAlt, onReplace, variants, onVariant }: Props) {
  const [uploading, setUploading] = useState(false);
  const [uploadVariant, setUploadVariant] = useState("");
  const [over, setOver] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [preview, setPreview] = useState<ManagedImage | null>(null);
  const [zoom, setZoom] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const upload = async (list: FileList | File[]) => {
    const files = Array.from(list).filter((file) => file.type.startsWith("image/"));
    if (!files.length) return;
    setUploading(true);
    try { await onUpload(files, uploadVariant || null); } finally { setUploading(false); }
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= images.length) return;
    const ids = images.map((image) => image.id);
    const [moved] = ids.splice(from, 1);
    if (!moved) return;
    ids.splice(to, 0, moved);
    onReorder(ids);
  };

  return (
    <div>
      {variants && onVariant && variants.length > 0 && (
        <div className="mb-4">
          <label htmlFor="upload-pack-size" className="mb-2 block text-sm font-medium">Upload photos for</label>
          <select id="upload-pack-size" value={uploadVariant} disabled={uploading} onChange={(e) => setUploadVariant(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
            <option value="">All pack sizes (shared)</option>
            {variants.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
          </select>
        </div>
      )}
      <label
        onDragOver={(e) => { e.preventDefault(); if (!dragId) setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); if (!dragId && e.dataTransfer.files.length) void upload(e.dataTransfer.files); }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition-colors",
          over ? "border-gold bg-gold/10" : "border-gold-deep/35 bg-beige/50 hover:bg-gold/5",
        )}
      >
        {uploading ? <Loader2 className="h-8 w-8 animate-spin text-gold-deep" /> : <ImagePlus className="h-8 w-8 text-gold-deep" />}
        <span className="font-medium text-brown">{uploading ? "Uploading photos…" : "Drag photos here or click to choose"}</span>
        <span className="text-xs text-muted-foreground">You can pick several at once · JPG, PNG or WebP · up to 5 MB each</span>
        <input ref={fileRef} type="file" multiple accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={uploading}
          onChange={(e) => { if (e.target.files) void upload(e.target.files); e.target.value = ""; }} />
      </label>

      {images.length > 0 && (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {images.map((image, index) => (
            <div
              key={image.id}
              draggable
              onDragStart={() => setDragId(image.id)}
              onDragEnd={() => setDragId(null)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (dragId && dragId !== image.id) move(images.findIndex((i) => i.id === dragId), index);
                setDragId(null);
              }}
              className={cn(
                "overflow-hidden rounded-xl border bg-background shadow-sm transition",
                image.primary ? "border-gold ring-2 ring-gold/40" : "border-border",
                dragId === image.id && "opacity-50",
              )}
            >
              <div className="relative bg-beige">
                <img src={image.url} alt={image.alt || "Product photo"} className="h-44 w-full object-contain p-2" />
                <span className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-background/90 px-2 py-0.5 text-xs font-medium text-brown">
                  <GripVertical className="h-3 w-3" /> {index + 1}
                </span>
                {image.primary && <span className="absolute top-2 right-2 rounded-full bg-gold px-2 py-0.5 text-xs font-semibold text-brown">Main photo</span>}
                <button type="button" onClick={() => { setPreview(image); setZoom(false); }} className="absolute right-2 bottom-2 grid h-8 w-8 place-items-center rounded-full bg-background/90 text-brown shadow" aria-label="Preview photo">
                  <ZoomIn className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-2 p-3">
                <Input defaultValue={image.alt} placeholder="Describe this photo" onBlur={(e) => { if (e.target.value !== image.alt) onAlt(image.id, e.target.value); }} />
                {variants && onVariant && variants.length > 0 && (
                  <select aria-label="Pack size for this photo" value={image.variantId ?? ""} onChange={(e) => onVariant(image.id, e.target.value || null)}
                    className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm">
                    <option value="">All pack sizes (shared)</option>
                    {variants.map((v) => <option key={v.id} value={v.id}>Only {v.label}</option>)}
                  </select>
                )}
                <div className="flex flex-wrap items-center gap-1">
                  <Button type="button" size="icon" variant="ghost" aria-label="Move earlier" disabled={index === 0} onClick={() => move(index, index - 1)}><ArrowUp /></Button>
                  <Button type="button" size="icon" variant="ghost" aria-label="Move later" disabled={index === images.length - 1} onClick={() => move(index, index + 1)}><ArrowDown /></Button>
                  {!image.primary && <Button type="button" size="sm" variant="outline" onClick={() => onPrimary(image.id)}><Star /> Main</Button>}
                  <label className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-md border border-input px-2 text-xs font-medium hover:bg-accent">
                    <RefreshCw className="h-3.5 w-3.5" /> Replace
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only"
                      onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) { setUploading(true); try { await onReplace(image.id, f); } finally { setUploading(false); } } }} />
                  </label>
                  <Button type="button" size="icon" variant="ghost" className="ml-auto text-destructive" aria-label="Delete photo"
                    onClick={() => { if (confirm("Delete this photo?")) onDelete(image.id); }}><Trash2 /></Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={Boolean(preview)} onOpenChange={(open) => !open && setPreview(null)}>
        <DialogContent className="max-w-4xl overflow-hidden p-2">
          <DialogTitle className="sr-only">Photo preview</DialogTitle>
          {preview && (
            <div className="max-h-[80vh] overflow-auto bg-beige">
              <img src={preview.url} alt={preview.alt} onClick={() => setZoom((z) => !z)}
                className={cn("mx-auto transition-transform", zoom ? "w-[200%] max-w-none cursor-zoom-out" : "max-h-[78vh] cursor-zoom-in object-contain")} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
