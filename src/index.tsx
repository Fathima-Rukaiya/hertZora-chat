// import React from "react";
// import ReactDOM from "react-dom/client";
// import chatCSS from "./assets/tailwind-embedded.css"; // normal import handled by TSUP
// import { ChatUI } from "./components/chatUI";

// // Inject CSS globally (or into shadow root later)
// if (typeof document !== "undefined") {
//   const style = document.createElement("style");
//   style.textContent = chatCSS;
//   document.head.appendChild(style);
// }

// interface HostieChatOptions {
//   apiKey: string;
//   containerId?: string;
// }

// export function init({ apiKey, containerId = "hostie-chat-root" }: HostieChatOptions) {
//   let container = document.getElementById(containerId);
//   if (!container) {
//     container = document.createElement("div");
//     container.id = containerId;
//     document.body.appendChild(container);
//   }

//   ReactDOM.createRoot(container).render(<ChatUI apiKey={apiKey} />);
// }

// // Auto-init if script tag is present
// if (typeof document !== "undefined") {
//   const script = document.currentScript as HTMLScriptElement | null;
//   if (script) {
//     const apiKey = script.getAttribute("data-api-key");
//     const containerId = script.getAttribute("data-id") || "hostie-chat-root";
//     if (apiKey) init({ apiKey, containerId });
//   }

//   (window as any).HostieChat = { init };
// }

// index.ts
// import { mountWidget } from "./widget";

// // Read API key from <script> tag or fallback
// function autoInit() {
//   let apiKey = "test_12345_user_key"; // fallback default
//   let openAi = undefined;

//   // Try to read from any script tag that loaded this bundle
//   const scripts = document.getElementsByTagName("script");
//   for (let i = 0; i < scripts.length; i++) {
//     const script = scripts[i];
//     if (script.src.includes("index.global.js")) {
//       const key = script.getAttribute("data-api-key");
//       const oa = script.getAttribute("data-openai");
//       if (key) apiKey = key;
//       if (oa) openAi = oa;
//       break;
//     }
//   }

//   mountWidget({ apiKey, openAi });
// }

// // Only run in browser
// if (typeof window !== "undefined") {
//   autoInit();
// }

// // Optional API exposure
// (window as any).HostieChat = { mountWidget };


import { mountWidget } from "./widget";

interface HostieChatInit {
  apiKey: string;
  containerId?: string;
}

export function init(opts: HostieChatInit) {
  mountWidget(opts);
}

if (typeof window !== "undefined") {
  const script = document.currentScript as HTMLScriptElement | null;

  if (script) {
    const apiKey = script.getAttribute("data-api-key");
    const containerId = script.getAttribute("data-id") || "hostie-chat-root";

    if (apiKey) {
      mountWidget({ apiKey, containerId });
    }
  }

  (window as any).HostieChat = { init };
}
