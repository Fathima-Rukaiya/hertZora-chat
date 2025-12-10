


import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom/client";
import { createPortal } from "react-dom";
import chatCSS from "./assets/tailwind-embedded.css";
import { ChatUI } from "./components/chatUI";
import { ThemeProvider } from "next-themes";

import "./styles/markdown.css"
import "./styles/tailwind.css";

// Single MountWidgetOptions interface
interface MountWidgetOptions {
  apiKey: string;
  containerId?: string;
}

// Mount the chat widget into the DOM
export function mountWidget({ apiKey, containerId = "hostie-chat-root" }: MountWidgetOptions) {
  let host = document.getElementById(containerId);
  if (!host) {
    host = document.createElement("div");
    host.id = containerId;
    document.body.appendChild(host);
  }

  ReactDOM.createRoot(host).render(
    <ThemeProvider attribute="data-theme" enableSystem={true} defaultTheme="light">
      <ShadowWrapper>
        <ChatUI apiKey={apiKey} />
      </ShadowWrapper>
    </ThemeProvider>
  );
}



function ShadowWrapper({ children,
}: {
  children: React.ReactElement<{ shadowContainer?: React.RefObject<HTMLDivElement | null> }>;
}
) {
  const hostRef = useRef<HTMLDivElement>(null);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const [shadow, setShadow] = useState<ShadowRoot | null>(null);

  useEffect(() => {
    if (!hostRef.current || shadow) return;

    const sr = hostRef.current.attachShadow({ mode: "open" });

    const wrapper = document.createElement("div");
    sr.appendChild(wrapper);

    // Create wrapper div inside Shadow DOM

    wrapperRef.current = wrapper;


    // Inject Tailwind CSS
    const style = document.createElement("style");
    style.textContent = chatCSS;
    sr.appendChild(style);

   


    // ------------- FIX FOR FILE UPLOAD ------------- //
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.id = "hostie-file-input";
    fileInput.style.display = "none";
    sr.appendChild(fileInput);

    // Listen for global event from ChatUI
    const openFileHandler = () => fileInput.click();
    window.addEventListener("hostie-open-file", openFileHandler);
    // ------------------------------------------------ //

    // Save shadow root
    setShadow(sr);

    // Sync website dark mode → Shadow DOM
    const syncTheme = () => {
      const isDark = document.documentElement.classList.contains("dark");
      if (isDark) wrapper.classList.add("dark");
      else wrapper.classList.remove("dark");
    };

    syncTheme();

    const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      window.removeEventListener("hostie-open-file", openFileHandler);
      observer.disconnect();
    };
  }, []);

  //return (
  //     <div ref={hostRef}>
  //       {shadow &&
  //         createPortal(
  //           React.cloneElement(children, { shadowContainer: wrapperRef }),
  //           wrapperRef.current!
  //         )}
  //     </div>
  //   );
  return (
    <div ref={hostRef}>
      {shadow &&
        createPortal(
          React.cloneElement(children, { shadowContainer: wrapperRef }),
          wrapperRef.current!
        )}
    </div>
  );
}

// function ShadowWrapper({
//   children,
// }: {
//   children: React.ReactElement<{ shadowContainer?: React.RefObject<HTMLDivElement | null>, portalContainer?: React.RefObject<HTMLDivElement | null> }>;
// }) {
//   const hostRef = useRef<HTMLDivElement>(null);
//   const wrapperRef = useRef<HTMLDivElement>(null);
//   const portalRef = useRef<HTMLDivElement>(null); // NEW: for popovers
//   const [shadow, setShadow] = useState<ShadowRoot | null>(null);

//   useEffect(() => {
//     if (!hostRef.current || shadow) return;

//     const sr = hostRef.current.attachShadow({ mode: "open" });

//     // Main wrapper
//     const wrapper = document.createElement("div");
//     wrapperRef.current = wrapper;
//     sr.appendChild(wrapper);

//     // Portal wrapper for popovers
//     const portalWrapper = document.createElement("div");
//     portalWrapper.style.position = "absolute";
//     portalWrapper.style.top = "0";
//     portalWrapper.style.left = "0";
//     portalWrapper.style.width = "100%";
//     portalWrapper.style.height = "100%";
//     portalWrapper.style.pointerEvents = "none"; // let clicks pass through
//     portalWrapper.style.zIndex = "9999"; // always on top
//     portalRef.current = portalWrapper;
//     sr.appendChild(portalWrapper);

//     // Inject Tailwind CSS
//     const style = document.createElement("style");
//     style.textContent = chatCSS;
//     sr.appendChild(style);

//     // Dark mode sync
//     const syncTheme = () => {
//       const isDark = document.documentElement.classList.contains("dark");
//       if (isDark) wrapper.classList.add("dark");
//       else wrapper.classList.remove("dark");
//     };
//     syncTheme();
//     const observer = new MutationObserver(syncTheme);
//     observer.observe(document.documentElement, {
//       attributes: true,
//       attributeFilter: ["class"],
//     });

//     setShadow(sr);

//     return () => observer.disconnect();
//   }, []);

//   return (
//     <div ref={hostRef}>
//       {shadow &&
//         createPortal(
//           React.cloneElement(children, { shadowContainer: wrapperRef, portalContainer: portalRef }),
//           wrapperRef.current!
//         )}
//     </div>
//   );
// }
