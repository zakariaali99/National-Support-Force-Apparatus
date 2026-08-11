import { forwardRef } from "react";

import { cva } from "class-variance-authority";
import { User } from "lucide-react";

import { AuthedImage } from "./AuthedImage";
import { cn } from "../../lib/utils";

/* =============================================================================
   Avatar — a member/user portrait with an initials fallback.

   Follows the conventions in Button.jsx. Four things are specific to it:

   - Member photos are PRIVATE. The API serves them behind the JWT, so a plain
     `<img src>` gets a 401 and a broken-image glyph. Every photo goes through
     AuthedImage, which fetches the bytes and hands back an object URL. Do not
     "simplify" this into a bare <img>.

   - The initials layer is always rendered, and the photo is layered OVER it
     rather than swapped in. AuthedImage needs a round trip before it has
     anything to paint, so a swap means a grey placeholder flashes in every row
     of a member list on each load. Underlaying the initials means the cell is
     legible immediately, the photo replaces it when it arrives, and a failed
     fetch degrades to the initials instead of a permanent empty box.

   - Not a control. No focus ring, no `coarse:` tap-target bump — same argument
     as Badge: this is a <span> with no handlers. Where an avatar is clickable
     (UserMenu) the surrounding trigger owns the 44px floor and the focus
     treatment, and it should stay that way rather than each avatar growing one.

   - The size token lives on an inner <span>, not on the root. `cn` is
     tailwind-merge, which classifies `text-caption` and `text-fg-subtle` as the
     same `text-*` conflict group and drops one of them when both appear in a
     single merge. Splitting the colour (root) from the size (inner) keeps both,
     and still lets a caller override the colour through `className` the way
     UserMenu does.

   ACCESSIBILITY: the root carries `role="img"` plus an `aria-label`, and every
   child is hidden, so the avatar announces exactly once — as the person's name.
   An avatar with no label at all is announced as an unnamed graphic, which in a
   list of 40 members is 40 pieces of noise.
   ========================================================================== */

const avatarVariants = cva(
  [
    "relative inline-flex shrink-0 items-center justify-center overflow-hidden",
    // `border-border`, not `border-border-strong`: the ring around a portrait
    // separates it from the surface behind it, it is not a control affordance.
    "rounded-full border border-border select-none",
    // The quiet default, for the same reason Badge's default is quiet — a
    // column of saturated navy discs down a member table competes with the one
    // filled action on the page. Both pairings are contrast-checked: fg-subtle
    // on surface-raised is 5.6:1 light / 6.2:1 dark. Call sites that want the
    // solid look pass `bg-primary text-primary-fg` through `className`, which
    // wins the merge.
    "bg-surface-raised text-fg-subtle",
  ].join(" "),
  {
    variants: {
      size: {
        sm: "h-8 w-8",
        md: "h-10 w-10",
        lg: "h-16 w-16",
        xl: "h-20 w-20",
      },
    },
    defaultVariants: { size: "md" },
  }
);

/** Initials size per avatar size. Deliberately NOT part of `avatarVariants` —
 *  see the tailwind-merge note in the header comment. */
const INITIALS_SIZE = {
  sm: "text-caption",
  md: "text-body",
  lg: "text-section",
  xl: "text-title",
};

/** Derives up-to-two initials from an Arabic (or Latin) full name.
 *
 * Uses Array.from rather than charAt/slice so a name starting with a character
 * outside the BMP isn't split mid-surrogate-pair into a broken glyph.
 */
function initialsFrom(name) {
  if (!name) return "";
  const words = String(name).trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "";
  const first = Array.from(words[0])[0] ?? "";
  const second = words.length > 1 ? (Array.from(words[1])[0] ?? "") : "";
  return first + second;
}

/**
 * @param {object}  props
 * @param {string}  [props.src]   Authenticated photo URL — fetched by
 *                                AuthedImage, never used as a raw <img src>.
 * @param {string}  [props.name]  Full name. Supplies both the initials and the
 *                                accessible name.
 * @param {'sm'|'md'|'lg'|'xl'} [props.size]
 */
export const Avatar = forwardRef(function Avatar(
  { src, name, size = "md", className, ...props },
  ref
) {
  // An unrecognised key (a lookup map handing back undefined) lands on `md`
  // rather than rendering a zero-height circle.
  const resolved = size in INITIALS_SIZE ? size : "md";
  const initials = initialsFrom(name);

  return (
    <span
      ref={ref}
      role="img"
      aria-label={name || "صورة شخصية"}
      className={cn(avatarVariants({ size: resolved }), className)}
      {...props}
    >
      {initials ? (
        <span className={cn("font-semibold leading-none", INITIALS_SIZE[resolved])} aria-hidden="true">
          {initials}
        </span>
      ) : (
        /* No name to derive initials from — a generic person glyph, sized off
           the circle so it scales with every avatar size. */
        <User className="h-1/2 w-1/2" aria-hidden="true" />
      )}

      {src && (
        <AuthedImage
          src={src}
          /* Empty alt on purpose: the root already carries the accessible name,
             and labelling both would announce the member twice. */
          alt=""
          /* `bg-transparent text-transparent` neutralises AuthedImage's own
             pre-load placeholder (an opaque fill plus a person glyph in
             currentColor) so the initials underneath stay visible until the
             blob resolves. Delete both once AuthedImage is rebuilt on the new
             tokens and can render a transparent placeholder itself. */
          className="absolute inset-0 h-full w-full bg-transparent object-cover text-transparent"
        />
      )}
    </span>
  );
});

export { avatarVariants, initialsFrom };
