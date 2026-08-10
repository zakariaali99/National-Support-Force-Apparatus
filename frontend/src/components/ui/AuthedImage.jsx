import { useEffect, useState } from "react";

import { User } from "lucide-react";

import { fetchAuthedBlobUrl } from "../../features/members/api";
import { cn } from "../../lib/utils";

const cache = new Map();

/** Renders a private (authenticated-only) image URL, such as a member
 * photo. Plain <img src> can't attach the JWT header, so this fetches the
 * bytes as a blob and caches the resulting object URL by source URL.
 */
export function AuthedImage({ src, alt, className }) {
  const [objectUrl, setObjectUrl] = useState(() => (src ? cache.get(src) : undefined));

  useEffect(() => {
    if (!src) return;
    if (cache.has(src)) {
      setObjectUrl(cache.get(src));
      return;
    }
    let cancelled = false;
    fetchAuthedBlobUrl(src).then((url) => {
      cache.set(src, url);
      if (!cancelled) setObjectUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [src]);

  if (!src || !objectUrl) {
    return (
      <div className={cn("flex items-center justify-center bg-secondary text-muted-foreground", className)}>
        <User className="h-1/2 w-1/2" />
      </div>
    );
  }

  return <img src={objectUrl} alt={alt} className={cn("object-cover", className)} />;
}
