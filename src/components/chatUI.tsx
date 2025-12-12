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
{/*     .hertzora-color {
   color: "#fff" !important;
   background: linear-gradient(to right, #db2777, #A724A8, #7e22ce) !important;
} */}
                <button
                    id="hertzora-btn"
                    onClick={() => setIsOpen(!isOpen)}
                     style={{ background: gradient }}
                    className="hertzora-color rounded-full shadow-xl flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-700 dark:from-purple-800 dark:to-pink-900 text-white hover:from-pink-700 hover:to-purple-800"
                >
                    {/* <Bot strokeWidth={1.75} size={22} /> */}

                    {botIcon ? (
                        <img src={botIcon} alt={botName} className="w-6 h-6 rounded-full" />
                    ) : (
                        <Bot strokeWidth={1.75} size={22} />
                    )}
                    <span className="font-semibold text-sm">{botName}7</span>
                </button>

                {isOpen && (
                    // {botName}
                    <div
                        className="absolute bottom-full mb-3 right-0 w-80 p-0 shadow-2xl rounded-xl transition-all duration-200">
                        <StandardUI apiKey={apiKey} shadowContainer={shadowContainer} botIcon={botIcon || ""} botName={botName}  gradient={gradient}/>
                    </div>
                )}
            </div>


            {/* </ThemeProvider> */}
        </div>

    );
}
