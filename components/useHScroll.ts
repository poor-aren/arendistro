"use client";
import { useEffect, type RefObject } from "react";

/** Scroll roda vertikal -> geser horizontal, dan drag mouse untuk geser. Klik setelah drag dibatalkan. */
export function useHScroll(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let rest = 0, raf = 0;
    const step = () => {
      const d = rest * 0.2;
      el.scrollLeft += d;
      rest -= d;
      raf = Math.abs(rest) > 0.5 ? requestAnimationFrame(step) : 0;
      if (!raf) rest = 0;
    };
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      e.preventDefault();
      rest += e.deltaMode === 1 ? e.deltaY * 40 : e.deltaY; // deltaMode 1 = baris (Firefox)
      if (!raf) raf = requestAnimationFrame(step);
    };
    let down = false, startX = 0, lastX = 0, moved = 0;
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      down = true; moved = 0; startX = lastX = e.clientX;
    };
    const onMove = (e: PointerEvent) => {
      if (!down) return;
      // geser per selisih gerak, aman walau scrollLeft dilompatkan (rak loop)
      moved = Math.max(moved, Math.abs(e.clientX - startX));
      if (moved > 6) { el.classList.add("dragging"); el.scrollLeft -= e.clientX - lastX; }
      lastX = e.clientX;
    };
    const onUp = () => { down = false; el.classList.remove("dragging"); };
    const onClick = (e: MouseEvent) => { if (moved > 6) { e.stopPropagation(); e.preventDefault(); } moved = 0; };
    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("pointerdown", onDown);
    addEventListener("pointermove", onMove);
    addEventListener("pointerup", onUp);
    el.addEventListener("click", onClick, true);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("pointerdown", onDown);
      removeEventListener("pointermove", onMove);
      removeEventListener("pointerup", onUp);
      el.removeEventListener("click", onClick, true);
    };
  }, [ref]);
}
