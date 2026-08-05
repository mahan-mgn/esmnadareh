"use client";

import {
  useEffect,
  useRef,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from "react";

/**
 * Releases its children when they scroll into view. The hidden state lives in
 * CSS (`[data-reveal]` in globals.css), so content is still present for
 * crawlers and for anyone with JavaScript disabled — this only flips a flag.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: ElementType;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (typeof IntersectionObserver === "undefined") {
      node.dataset.reveal = "in";
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).dataset.reveal = "in";
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.05 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      data-reveal=""
      style={
        delay
          ? ({ "--reveal-delay": `${delay}ms` } as CSSProperties)
          : undefined
      }
      className={className}
    >
      {children}
    </Tag>
  );
}
