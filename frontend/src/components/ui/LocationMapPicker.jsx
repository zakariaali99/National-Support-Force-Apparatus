import { useState, useEffect } from "react";
import { MapPin, ExternalLink, Globe, Copy, Check } from "lucide-react";
import { Button } from "./Button";
import { Input } from "./Input";
import { Label } from "./Label";
import { showToast } from "./Toast";

export function LocationMapPicker({
  locationUrl = "",
  onChange,
  readOnly = false,
}) {
  const [url, setUrl] = useState(locationUrl || "");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setUrl(locationUrl || "");
  }, [locationUrl]);

  function handleUrlChange(e) {
    const val = e.target.value;
    setUrl(val);
    onChange?.({ locationUrl: val });
  }

  function handleCopy() {
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopied(true);
    showToast("تم نسخ رابط الموقع الجغرافي بنجاح", "success");
    setTimeout(() => setCopied(false), 2000);
  }

  if (readOnly) {
    if (!url) return null;
    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-border/80 bg-card/70 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
            <MapPin className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-caption font-bold text-muted-foreground">رابط الموقع الجغرافي (Google Maps)</p>
            <p className="text-body-sm font-mono text-foreground truncate max-w-md dir-ltr" dir="ltr">
              {url}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="font-bold"
          >
            {copied ? <Check className="h-4 w-4 me-1 text-success" /> : <Copy className="h-4 w-4 me-1" />}
            <span>{copied ? "تم النسخ" : "نسخ الرابط"}</span>
          </Button>
          <Button asChild size="sm" className="font-bold">
            <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
              <span>فتح بالموقع</span>
              <ExternalLink className="h-4 w-4 me-1" />
            </a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-xl border border-border/80 bg-card/60 p-4 shadow-2xs">
      <div className="flex items-center gap-2 border-b border-border/60 pb-2.5">
        <MapPin className="h-5 w-5 text-primary" />
        <Label className="font-bold text-body text-foreground mb-0">رابط الموقع الجغرافي (Google Maps Link)</Label>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
        <div className="relative flex-1 w-full">
          <Input
            type="url"
            placeholder="https://maps.google.com/?q=32.8872,13.1913"
            value={url}
            onChange={handleUrlChange}
            dir="ltr"
            className="pe-9 font-mono text-body-sm"
          />
          <Globe className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>
        {url && (
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="font-bold flex-1 sm:flex-none"
            >
              {copied ? <Check className="h-4 w-4 me-1 text-success" /> : <Copy className="h-4 w-4 me-1" />}
              <span>{copied ? "تم النسخ" : "نسخ الرابط"}</span>
            </Button>
            <Button asChild size="sm" variant="secondary" className="font-bold flex-1 sm:flex-none">
              <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                <span>معاينة</span>
                <ExternalLink className="h-4 w-4 me-1" />
              </a>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
