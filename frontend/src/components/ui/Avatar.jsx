import { AuthedImage } from "./AuthedImage";
import { cn } from "../../lib/utils";

const sizes = {
  sm: "h-8 w-8 text-caption",
  md: "h-10 w-10 text-body",
  lg: "h-16 w-16 text-h2",
  xl: "h-20 w-20 text-h1",
};

/** Derives up-to-two initials from an Arabic (or Latin) full name.
 *
 * Uses Array.from rather than charAt/slice so a name starting with a
 * character outside the BMP isn't split mid-surrogate-pair into a broken
 * glyph.
 */
function initialsFrom(name) {
  if (!name) return "";
  const words = String(name).trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "";
  const first = Array.from(words[0])[0] ?? "";
  const second = words.length > 1 ? Array.from(words[1])[0] ?? "" : "";
  return first + second;
}

/** Member/user avatar. Wraps AuthedImage (which handles fetching private
 * photos with the JWT) and falls back to name initials rather than
 * AuthedImage's generic person glyph, so a list of photo-less members is
 * still visually distinguishable row to row.
 */
export function Avatar({ src, name, size = "md", className }) {
  const initials = initialsFrom(name);

  if (!src && initials) {
    return (
      <div
        aria-hidden="true"
        title={name}
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full border border-border bg-secondary font-bold text-secondary-foreground select-none",
          sizes[size],
          className
        )}
      >
        {initials}
      </div>
    );
  }

  return (
    <AuthedImage
      src={src}
      alt={name || ""}
      className={cn("shrink-0 rounded-full border border-border object-cover", sizes[size], className)}
    />
  );
}
