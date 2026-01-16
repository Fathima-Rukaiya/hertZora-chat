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

    const [greeting, setGreeting] = useState<string>("");
    const [introduction, setIntroduction] = useState<string>("");
    const [startButtonText, setStartButtonText] = useState<string>("Start Chat");
    const [backgroundColor, setBackgroundColor] = useState<string>("#ffffffff");


    const [buttonPosition, setButtonPosition] = useState<"left" | "right">("right");
    const [allowFileUpload, setAllowFileUpload] = useState(true);
    const [linkBehavior, setLinkBehavior] = useState<"newTab" | "sameTab">("newTab");

    const [welcomeMsg, SetWelcomeMsg] = useState<string>("");

    const [suggestedQuestions, setSuggestedQuestions] = useState<string[] | null>(null);
    const [errorMessage, setErrorMessage] = useState("");
    const [customWidgetIcon, setCustomWidgetIcon] = useState<string | null>(null);
    const [buttonSize, setButtonSize] = useState<string | null>(null);

    // const API_BASE_URL = "https://app.hostingate.com/api/clientCustomerChatBox";
    const API_BASE_URL = "https://app.hertzora.ai/api/clientCustomerChatBox";
    //https://app.hertzora.ai/hostie/overview
    // const API_BASE_URL = "http://localhost:3000/api/clientCustomerChatBox";
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

                // if (!res.ok) return setIsAllowed(false);


                const data = await res.json();

                if (!res.ok || !data.allowed) {
                    setIsAllowed(false);
                    setErrorMessage(data.reason || "This chat widget is not authorized.");
                    return;
                }
                setIsAllowed(data.allowed ?? false);

                if (data.allowed) {
                    setIsAllowed(true);
                    const name = data.bot_name || "ChatBot";
                    const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);
                    setBotName(capitalizedName);
                    setBotName(capitalizedName || "ChatBot");
                    setBotIcon(data.bot_icon || null);
                    console.log(data.bot_name)
                    setBotColors(data.colors || null);

                    setGreeting(data.greeting || "Hello 👋");
                    setIntroduction(data.introduction || "How can I help you today?");
                    setStartButtonText(data.start_button_text || "Start Chat");
                    setBackgroundColor(data.backgroundColor || "#ffffff")
                    //  setChatTriggerType(data.chat_trigger || "bubble");

                    setButtonPosition(data.buttonPosition || "rigth");
                    setAllowFileUpload(data.allowFileUpload ?? true);
                    setLinkBehavior(data.linkBehavior || "newTab");
                    SetWelcomeMsg(data.welcomeMessage);
                    setSuggestedQuestions(data.suggestedQuestions || null);
                    setCustomWidgetIcon(data.customWidgetIcon || null);
                    setButtonSize(data.buttonSize || null);

                } else {

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
            <div className={`fixed bottom-6 z-[9999] text-sm text-red-600 bg-white p-3 rounded-xl shadow ${buttonPosition === "left" ? "left-6" : "right-6"
                }`}
            >
                <p className="text-gray-600 text-sm">{errorMessage}</p>
                <p className="text-gray-400 text-xs mt-2">Please contact the admin.</p>
            </div>
        );

    const gradient = botColors
        ? `linear-gradient(to right, ${botColors[0]}, ${botColors[1]}, ${botColors[2]})`
        : `linear-gradient(to right, #db2777, #A724A8, #7e22ce)`;

    const hoverGradient = botColors
        ? `linear-gradient(to right, 
       ${darkenColor(botColors[0], 30)}, 
       ${darkenColor(botColors[1], 30)}, 
       ${darkenColor(botColors[2], 30)}
     )`
        : `linear-gradient(to right, #be1f66, #8b1d8b, #6b1cae)`;

    // slight darker tone for dark mode
    const darkModeGradient = botColors
        ? `linear-gradient(to right, 
       ${darkenColor(botColors[0], 40)}, 
       ${darkenColor(botColors[1], 40)}, 
       ${darkenColor(botColors[2], 40)}
     )`
        : gradient;

    const borderColor = botColors ? darkenColor(botColors[0], 20) : "#e9e4e6ff";
    const darkBorderColor = botColors ? darkenColor(botColors[2], 20) : "#50484cff";

    return (

        <div
            className={`fixed bottom-6 z-[9999] ${buttonPosition === "left" ? "left-6" : "right-6"}`}>
            <div ref={popoverRef} className="relative">
                <style>{`
                    .hertzora-color {
                        color: #fff !important;
                    }
                `}</style>

                <style>{`
                    .dark #hertzora-btn {
                        background: ${darkModeGradient} !important;
                    }
                `}</style>

                {customWidgetIcon ? (
                    // Custom Widget Button
                    <button
                        id="custom-widget-btn"
                        onClick={() => setIsOpen(!isOpen)}
                        style={{
                            backgroundColor: backgroundColor || "#ffffff",
                            width: buttonSize || "60px",
                            height: buttonSize || "60px",
                            boxShadow: "0 4px 15px rgba(0,0,0,0.25)",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "all 0.3s ease",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "scale(1.05)";
                            e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.35)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "scale(1)";
                            e.currentTarget.style.boxShadow = "0 4px 15px rgba(0,0,0,0.25)";
                        }}
                    >
                        <img
                            src={customWidgetIcon}
                            alt="Chat Widget"
                            style={{
                                width: "80%", // adjust size inside button
                                height: "80%",
                                objectFit: "cover",
                                borderRadius: "50%", // THIS makes the image circular
                            }}

                        />
                    </button>
                ) : (
                    <button
                        id="hertzora-btn"
                        onClick={() => setIsOpen(!isOpen)}
                        style={{ background: gradient }}
                        className="hertzora-color rounded-full shadow-xl flex items-center gap-2 px-4 py-2 text-white "
                        onMouseEnter={(e) => (e.currentTarget.style.background = hoverGradient)}
                        onMouseLeave={(e) => (e.currentTarget.style.background = gradient)} >

                        {botIcon ? (
                            <img src={botIcon} alt={botName} className="w-6 h-6 rounded-full" />
                        ) : (
                            <Bot strokeWidth={1.75} size={22} />
                        )}
                        <span className="font-semibold text-sm">Ask {botName}00       </span>
                    </button>
                )}

                {isOpen && (
                    <div
                        className={`absolute bottom-full mb-3  w-80 p-0 shadow-2xl rounded-xl transition-all duration-200
                            ${buttonPosition === "left" ? "left-0" : "right-0"
                            }`}>
                        <StandardUI apiKey={apiKey} shadowContainer={shadowContainer} botIcon={botIcon || ""} botName={botName} gradient={gradient} darkGradient={darkModeGradient} borderColor={borderColor} darkBorderColor={darkBorderColor}
                            greeting={greeting}
                            introduction={introduction}
                            startButtonText={startButtonText}
                            backgroundColor={backgroundColor}
                            allowFileUpload={allowFileUpload}
                            linkBehavior={linkBehavior}
                            position={buttonPosition}
                            welcomeMsg={welcomeMsg}
                            suggestedQuestionList={suggestedQuestions || undefined}
                        />
                    </div>
                )}







                {/* Chat UI */}
                {/* <div className="fixed bottom-6 right-6 z-[9999]"> */}
                {/* Floating button */}
                {/* <button
    onClick={() => setIsOpen((v) => !v)}
    style={{ background: gradient }}
    className="rounded-full shadow-xl flex items-center gap-2 px-4 py-2 text-white"
  >
    {botIcon ? (
      <img src={botIcon} alt={botName} className="w-6 h-6 rounded-full" />
    ) : (
      <Bot size={22} />
    )}
    <span className="text-sm font-semibold">Ask {botName}</span>
  </button>
*/}
                {/* Chat window */}{/* 
  {isOpen && (
    <div className="absolute bottom-full mb-3 right-6 w-80 p-0 shadow-2xl rounded-xl transition-all duration-200">
      <StandardUI
        apiKey={apiKey}
        shadowContainer={shadowContainer}
        botIcon={botIcon || ""}
        botName={botName}
        gradient={gradient}
        darkGradient={darkModeGradient}
        borderColor={borderColor}
        darkBorderColor={darkBorderColor}
        greeting={greeting}
        introduction={introduction}
        startButtonText={startButtonText}
        backgroundColor={backgroundColor}
      />
    </div>
  )} */}
            </div>

            {/* </div> */}


            {/* </ThemeProvider> */}
        </div>

    );
}
