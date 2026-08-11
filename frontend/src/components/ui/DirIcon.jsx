import { cn } from "../../lib/utils";

/* =============================================================================
   DirIcon — a lucide icon that must MIRROR under RTL. Conventions per
   Button.jsx.

   Icons split into two groups and getting the split wrong is worse than not
   mirroring at all:

   USE DirIcon — the glyph encodes a direction that is relative to reading
   order, so it has to flip when reading order flips:
     ChevronLeft/Right, ArrowLeft/Right, ChevronsLeft/Right, CornerDownLeft,
     Undo/Redo, Reply, Forward, TrendingUp/Down when used as "next/previous",
     ArrowRightFromLine, ListOrdered's siblings — anything meaning
     "forward"/"back"/"next"/"previous" in the flow of the page.

   DO NOT USE DirIcon — the glyph is absolute, mirroring it makes it wrong or
   unrecognisable:
     Play/Pause/SkipForward (media transport is LTR in every locale — a
     mirrored play button reads as rewind), ExternalLink, LogOut, Search,
     Send/PaperPlane, Check, X, Clock, LucideIcon logos and brand marks, any
     icon containing baked-in Latin text or a magnifier handle whose angle is
     conventional rather than directional.

   The mirror is `-scale-x-100` under the `rtl:` variant rather than a rotate:
   rotating 180° also flips the glyph vertically, which turns ChevronDown-ish
   shapes upside down and shifts the optical centre of asymmetric arrows.

   Nothing here is a chevron-only helper — it takes the component so the call
   site still reads `<DirIcon icon={ChevronLeft} />` and the icon import stays
   greppable.
   ========================================================================== */

/**
 * @param {object} props
 * @param {import('react').ElementType} props.icon  A lucide-react component,
 *   passed uninstantiated: `icon={ChevronLeft}`.
 *
 * Defaults to aria-hidden — these are almost always decorative next to a text
 * label. When the icon IS the control's only content, put the accessible name
 * on the button, not here; if you must name the glyph itself, pass
 * `aria-hidden={undefined}` plus `aria-label`, since props spread last and win.
 */
export function DirIcon({ icon: Icon, className, ...props }) {
  return <Icon className={cn("rtl:-scale-x-100", className)} aria-hidden="true" {...props} />;
}
