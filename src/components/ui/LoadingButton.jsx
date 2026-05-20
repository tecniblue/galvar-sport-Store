import React from "react";
import { Loader2 } from "lucide-react";

export default function LoadingButton({
  loading = false,
  loadingText = "Cargando...",
  disabled = false,
  children,
  className = "",
  icon = null,
  type = "button",
  ...props
}) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      className={`${className} disabled:opacity-60 disabled:cursor-not-allowed`}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 size={16} className="animate-spin" />
          <span>{loadingText}</span>
        </>
      ) : (
        <>
          {children}
          {icon}
        </>
      )}
    </button>
  );
}
