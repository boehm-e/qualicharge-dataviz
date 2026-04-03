import { useCallback, useRef, useState } from "react";

const COPY_RESET_DELAY = 1800;

export function useCopyToClipboard() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const copy = useCallback(async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        setCopiedKey((current) => (current === key ? null : current));
        timeoutRef.current = null;
      }, COPY_RESET_DELAY);
    } catch {
      setCopiedKey(null);
    }
  }, []);

  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setCopiedKey(null);
  }, []);

  return { copiedKey, copy, reset };
}
