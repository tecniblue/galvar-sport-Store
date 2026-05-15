import { useCallback } from "react";

export function useFormatCLP() {
  return useCallback((value) => {
    const num = typeof value === "number" ? value : Number(value);
    return (Number.isFinite(num) ? num : 0).toLocaleString("es-CL");
  }, []);
}
