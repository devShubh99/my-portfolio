"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A reusable hook to trigger animations when an element scrolls into view.
 * Powered by the native IntersectionObserver API.
 */
export function useInView(options?: IntersectionObserverInit) {
    const ref = useRef<HTMLDivElement>(null);
    const [isInView, setIsInView] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setIsInView(true);
                // Disconnect once it becomes visible so the animation only runs once per load
                observer.disconnect();
            }
        }, {
            threshold: 0.1, // Trigger when 10% of the element is visible
            ...options
        });

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => observer.disconnect();
    }, [options]);

    return { ref, isInView };
}
