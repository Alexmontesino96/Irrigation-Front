"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "ui-scale";
const STEPS = [0.85, 0.9, 0.95, 1, 1.05, 1.1, 1.2, 1.3];
const DEFAULT_INDEX = 3; // 1 = 100%

interface ScaleContextValue {
  scale: number;
  scaleUp: () => void;
  scaleDown: () => void;
  resetScale: () => void;
  canScaleUp: boolean;
  canScaleDown: boolean;
}

const ScaleContext = createContext<ScaleContextValue>({
  scale: 1,
  scaleUp: () => {},
  scaleDown: () => {},
  resetScale: () => {},
  canScaleUp: true,
  canScaleDown: true,
});

export function ScaleProvider({ children }: { children: ReactNode }) {
  const [index, setIndex] = useState(DEFAULT_INDEX);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) {
      const parsed = parseInt(saved, 10);
      if (parsed >= 0 && parsed < STEPS.length) {
        setIndex(parsed);
      }
    }
  }, []);

  const persist = useCallback((i: number) => {
    setIndex(i);
    localStorage.setItem(STORAGE_KEY, String(i));
  }, []);

  const scaleUp = useCallback(() => {
    setIndex((prev) => {
      const next = Math.min(prev + 1, STEPS.length - 1);
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  const scaleDown = useCallback(() => {
    setIndex((prev) => {
      const next = Math.max(prev - 1, 0);
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  const resetScale = useCallback(() => {
    persist(DEFAULT_INDEX);
  }, [persist]);

  return (
    <ScaleContext.Provider
      value={{
        scale: STEPS[index],
        scaleUp,
        scaleDown,
        resetScale,
        canScaleUp: index < STEPS.length - 1,
        canScaleDown: index > 0,
      }}
    >
      {children}
    </ScaleContext.Provider>
  );
}

export function useScale() {
  return useContext(ScaleContext);
}
