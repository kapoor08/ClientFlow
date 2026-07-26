// Lazy feature bundle for framer-motion's `LazyMotion` provider.
//
// The `m` component ships only the minimal renderer; the animation + gesture
// features (animate/initial/exit/variants/whileHover/whileTap/whileInView) live
// here and are loaded as a single shared, cached async chunk on first mount
// instead of being bundled (~34kb) into every route that animates.
//
// `domAnimation` covers every motion prop used in this app. `domMax` (which
// only adds drag + layout animations) is intentionally not imported so the
// bundler can tree-shake it out of this chunk.
import { domAnimation } from "framer-motion";

export default domAnimation;
