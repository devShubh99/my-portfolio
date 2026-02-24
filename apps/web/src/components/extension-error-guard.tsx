"use client";

import { useEffect } from "react";

/**
 * Suppresses errors thrown by browser extensions (Chrome, Edge, Firefox).
 * These errors surface as unhandled promise rejections or window errors
 * and can break React error boundaries even though they're not from our app.
 */
export function ExtensionErrorGuard() {
    useEffect(() => {
        const EXTENSION_PATTERNS = [
            "message channel closed",
            "Extension context invalidated",
            "chrome-extension://",
            "moz-extension://",
            "A listener indicated an asynchronous response",
            "ResizeObserver loop",
        ];

        function isExtensionError(msg: string): boolean {
            return EXTENSION_PATTERNS.some((p) =>
                msg.toLowerCase().includes(p.toLowerCase())
            );
        }

        // Catch synchronous extension errors
        const onError = (e: ErrorEvent) => {
            if (e.message && isExtensionError(e.message)) {
                e.preventDefault();
                e.stopImmediatePropagation();
            }
        };

        // Catch unhandled promise rejections from extensions
        const onUnhandled = (e: PromiseRejectionEvent) => {
            const msg =
                e.reason?.message || e.reason?.toString?.() || String(e.reason);
            if (isExtensionError(msg)) {
                e.preventDefault();
            }
        };

        window.addEventListener("error", onError, true);
        window.addEventListener("unhandledrejection", onUnhandled, true);

        return () => {
            window.removeEventListener("error", onError, true);
            window.removeEventListener("unhandledrejection", onUnhandled, true);
        };
    }, []);

    return null;
}
