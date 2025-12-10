"use client";
import { Bot, SendHorizonal } from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
//import { Bot, Plus, SendHorizonal } from "lucide-react";

interface ChatWidgetProps {
    apiKey: string;
    position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
    width?: string;
    height?: string;
}

export const ChatWidget = ({
    apiKey,
    position = "bottom-right",
    width = "340px",
    height = "80vh",
}: ChatWidgetProps) => {
    const [messages, setMessages] = useState<{ sender: string; text: string }[]>([]);
    const [input, setInput] = useState("");
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const API_BASE_URL = "http://localhost:3000/api"; 

    const sendMessage = async () => {
        if (!input.trim()) return;

        const userMessage = { sender: "user", text: input };
        setMessages((prev) => [...prev, userMessage]);

        try {
           const res = await fetch(`${API_BASE_URL}/ai-chat`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    prompt: input,
    api_key: apiKey,
    room_id: "public_widget_room",
    sender_id: "83abb87b-550f-410d-abdd-5feb96dd704a",      
  }),
});


            const data = await res.json();
            const aiReply = data.reply || "Sorry, I couldn’t generate a response.";
            setMessages((prev) => [...prev, { sender: "bot", text: aiReply }]);
        } catch (err) {
            console.error("Error:", err);
            setMessages((prev) => [
                ...prev,
                { sender: "bot", text: "Error connecting to server." },
            ]);
        }

        setInput("");
    };

    const posClass =
        position === "bottom-right"
            ? "bottom-6 right-6"
            : position === "bottom-left"
                ? "bottom-6 left-6"
                : position === "top-right"
                    ? "top-6 right-6"
                    : "top-6 left-6";

    return (
        <div className={`fixed ${posClass} z-50`} style={{ width }}>
            <div
                className="flex flex-col rounded-xl overflow-hidden shadow-xl border border-gray-200 bg-white"
                style={{ height }}
            >
                <div className="p-3 bg-purple-600 text-white font-semibold flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Bot size={18} /> Hostie
                    </div>
                    <span className="text-xs">Online</span>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-2 text-sm">
                    {messages.map((msg, i) => (
                        <div
                            key={i}
                            className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"
                                }`}
                        >
                            <div
                                className={`px-3 py-2 rounded-xl max-w-[70%] ${msg.sender === "user"
                                        ? "bg-purple-600 text-white"
                                        : "bg-gray-100 text-gray-800"
                                    }`}
                            >
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    <div ref={chatEndRef} />
                </div>

                <div className="flex items-center p-3 border-t border-gray-200">
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                        placeholder="Type your message..."
                        className="flex-1 border rounded-full px-3 py-2 text-sm outline-none"
                    />
                    <button
                        onClick={sendMessage}
                        className="ml-2 bg-purple-600 text-white p-2 rounded-full"
                    >
                        <SendHorizonal size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};
