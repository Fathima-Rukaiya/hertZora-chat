"use client";
import React, { useState, useRef, useEffect } from "react";
import { Wanchain1 } from "iconsax-react";
import { StandardUI } from "./StandardUI";
import { Bot } from "lucide-react";
import { ThemeProvider, useTheme } from "next-themes";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

export function ChatUI({ apiKey,
    shadowContainer,
}: {
    apiKey: string;
    shadowContainer?: React.RefObject<HTMLDivElement | null>;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const popoverRef = useRef<HTMLDivElement>(null);
    const [isAllowed, setIsAllowed] = useState<boolean | null>(null);

    const [botName, setBotName] = useState("ChatBot");
    const [botIcon, setBotIcon] = useState<string | null>(null);
    const [botColors, setBotColors] = useState<string[] | null>(null);


    // const API_BASE_URL = "https://app.hostingate.com/api/clientCustomerChatBox";
    // const API_BASE_URL = "https://app.hertzora.ai/api/clientCustomerChatBox";
    //https://app.hertzora.ai/hostie/overview
    const API_BASE_URL = "http://localhost:3000/api/clientCustomerChatBox";
    useEffect(() => {
        const verifyDomain = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/verifyDomain`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "x-api-key": apiKey,
                    },
                    body: JSON.stringify({ api_key: apiKey }),
                });

                if (!res.ok) return setIsAllowed(false);

                const data = await res.json();
                setIsAllowed(data.allowed ?? false);

                if (data.allowed) {

                    const name = data.bot_name || "ChatBot";
                    const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);
                    setBotName(capitalizedName);
                    setBotName(capitalizedName || "ChatBot");
                    setBotIcon(data.bot_icon || null);
                    console.log(data.bot_name)
                    setBotColors(data.colors || null);

                }
            } catch {
                setIsAllowed(false);
            }
        };

        verifyDomain();
    }, [apiKey]);



    function darkenColor(hex: string, amount = 20) {
        hex = hex.replace("#", "");
        const num = parseInt(hex, 16);

        let r = (num >> 16) - amount;
        let g = ((num >> 8) & 0x00ff) - amount;
        let b = (num & 0x0000ff) - amount;

        r = Math.max(0, r);
        g = Math.max(0, g);
        b = Math.max(0, b);

        return `#${(b | (g << 8) | (r << 16)).toString(16).padStart(6, "0")}`;
    }


    if (isAllowed === null) return null;

    if (isAllowed === false)

        return (
            <div className="fixed bottom-6 right-6 z-[9999] text-sm text-red-600 bg-white p-3 rounded-xl shadow">
                <p className="text-gray-600 text-sm">This chat widget is not authorized for this domain.</p>
                <p className="text-gray-400 text-xs mt-2">Please contact the admin.</p>
            </div>
        );

    const gradient = botColors
        ? `linear-gradient(to right, ${botColors[0]}, ${botColors[1]}, ${botColors[2]})`
        : `linear-gradient(to right, #db2777, #A724A8, #7e22ce)`;

    const hoverGradient = botColors
        ? `linear-gradient(to right, 
       ${darkenColor(botColors[0], 90)}, 
       ${darkenColor(botColors[1], 90)}, 
       ${darkenColor(botColors[2], 90)}
     )`
        : `linear-gradient(to right, #be1f66, #8b1d8b, #6b1cae)`;

    // slight darker tone for dark mode
    const darkModeGradient = botColors
        ? `linear-gradient(to right, 
       ${darkenColor(botColors[0], 20)}, 
       ${darkenColor(botColors[1], 20)}, 
       ${darkenColor(botColors[2], 20)}
     )`
        : gradient;


    return (
        // <ThemeProvider
        //     attribute="class"
        //     defaultTheme="system"
        //     enableSystem
        // >
        <div className="fixed bottom-6 right-6 z-[9999]">
            {/* <div ref={popoverRef}> */}
            {/* , */}
            <div ref={popoverRef} className="relative">
                <style>{`
 
 
     .hertzora-color {
   color: "#fff" !important;
 
}

`}</style>
                <style>{`
  .dark #hertzora-btn {
     background: ${darkModeGradient} !important;
  }
`}</style>
                {/*     .hertzora-color {
   color: "#fff" !important;
   background: linear-gradient(to right, #db2777, #A724A8, #7e22ce) !important;
} */}
                <button
                    id="hertzora-btn"
                    onClick={() => setIsOpen(!isOpen)}
                    style={{ background: gradient }}
                    className="hertzora-color rounded-full shadow-xl flex items-center gap-2 px-4 py-2 text-white "
                    onMouseEnter={(e) => (e.currentTarget.style.background = hoverGradient)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = gradient)}
                >
                    {/* <Bot strokeWidth={1.75} size={22} /> */}

                    {botIcon ? (
                        <img src={botIcon} alt={botName} className="w-6 h-6 rounded-full" />
                    ) : (
                        <Bot strokeWidth={1.75} size={22} />
                    )}
                    <span className="font-semibold text-sm">{botName}17</span>
                </button>

                {isOpen && (
                    // {botName}
                    <div
                        className="absolute bottom-full mb-3 right-0 w-80 p-0 shadow-2xl rounded-xl transition-all duration-200">
                        <StandardUI apiKey={apiKey} shadowContainer={shadowContainer} botIcon={botIcon || ""} botName={botName} gradient={gradient}  darkGradient={darkModeGradient} />
                    </div>
                )}
            </div>


            {/* </ThemeProvider> */}
        </div>

    );
}
