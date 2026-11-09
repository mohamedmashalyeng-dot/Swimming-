"use client";
/** Tiny event bus so "Book" buttons anywhere on the page can prefill the registration form. */
export interface Prefill { courseId?: string; locationId?: string; scheduleId?: string; day?: number }
const EVENT = "cas:prefill";

export function selectCourse(p: Prefill) {
  window.dispatchEvent(new CustomEvent<Prefill>(EVENT, { detail: p }));
}

export function onPrefill(cb: (p: Prefill) => void) {
  const h = (e: Event) => cb((e as CustomEvent<Prefill>).detail);
  window.addEventListener(EVENT, h);
  return () => window.removeEventListener(EVENT, h);
}
