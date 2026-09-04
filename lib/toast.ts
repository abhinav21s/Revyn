"use client";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastPayload {
  id?: string;
  message: string;
  type?: ToastType;
  duration?: number;
}

export function emitToast(message: string, type: ToastType = "info", duration = 4000) {
  if (typeof window !== "undefined") {
    // Strip emoticons and emoji symbols from toast messages
    const cleanMessage = message
      .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E0}-\u{1F1FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{FE00}-\u{FE0F}]/gu, "")
      .trim();

    window.dispatchEvent(
      new CustomEvent("revyn:toast", {
        detail: {
          id: Math.random().toString(36).slice(2, 9),
          message: cleanMessage,
          type,
          duration,
        },
      })
    );
  }
}
