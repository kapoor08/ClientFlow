"use client";

const ease = [0.2, 0.8, 0.2, 1] as const;

const hero = {
  container: {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  },
  badge: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    transition: { delay: 0.1, duration: 0.4 },
  },
  lead: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { delay: 0.2 },
  },
  actions: {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: 0.3 },
  },
  meta: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { delay: 0.5 },
  },
  mockup: {
    initial: { opacity: 0, y: 40 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: 0.4, duration: 0.7 },
  },
} as const;

const inView = {
  fadeUp: {
    initial: { opacity: 0, y: 16 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
  },
  fade: {
    initial: { opacity: 0 },
    whileInView: { opacity: 1 },
    viewport: { once: true },
  },
} as const;

const stagger = {
  variants: {
    container: { hidden: {}, show: { transition: { staggerChildren: 0.08 } } },
    item: {
      hidden: { opacity: 0, y: 20 },
      show: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease },
      },
    },
  },
  inView: {
    initial: "hidden" as const,
    whileInView: "show" as const,
    viewport: { once: true },
  },
  inViewWithMargin: {
    initial: "hidden" as const,
    whileInView: "show" as const,
    viewport: { once: true, margin: "-60px" },
  },
} as const;

type StaggerOptions = {
  step?: number;
  initialY?: number;
  duration?: number;
  ease?: typeof ease;
};

const buildStagger = ({
  step = 0.08,
  initialY = 20,
  duration = 0.5,
  ease: customEase,
}: StaggerOptions = {}) => ({
  container: { hidden: {}, show: { transition: { staggerChildren: step } } },
  item: {
    hidden: { opacity: 0, y: initialY },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration, ease: customEase ?? ease },
    },
  },
});

export function useMotionStagger(options?: StaggerOptions) {
  return buildStagger(options);
}

export function useHomeMotion() {
  const fadeUpByIndex = (index: number, step = 0.08, y = 12) => ({
    initial: { opacity: 0, y },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { delay: index * step },
  });

  return {
    hero,
    inView,
    stagger,
    fadeUpByIndex,
  };
}
