"use client";
import { useState, useEffect, useRef } from "react";
import { Bot, BotMessageSquare, FileText, Frown, Laugh, LockIcon, Meh, Plus, SendHorizontal, Sparkles, UserRound } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
// import ReactMarkdown from "react-markdown";
// import remarkGfm from "remark-gfm";
import Markdown from "markdown-to-jsx";
// import { jsPDF } from "jspdf";
// import autoTable from "jspdf-autotable";


type ChatMessage = {
  sender: "user" | "bot";
  text: string;
  status?: "sent" | "delivered" | "read";
  timestamps?: {
    sent?: string;
    delivered?: string;
    read?: string;
    received?: string;
  };
  isTyping?: boolean;
  uploaded_documents?: any;

};



export function StandardUI({
  apiKey,
  shadowContainer,
  botIcon,
  botName,
  gradient,
  darkGradient,
  borderColor,
  darkBorderColor,
  greeting,
  introduction,
  startButtonText,
  backgroundColor,
  allowFileUpload,
  linkBehavior,
  position,
  welcomeMsg,
  suggestedQuestionList,
}: {
  apiKey: string;
  shadowContainer?: React.RefObject<HTMLDivElement | null>;
  botIcon: string,
  botName: string
  gradient?: string;
  darkGradient?: string;
  borderColor?: string;
  darkBorderColor?: string;
  greeting: string;
  introduction: string;
  startButtonText: string;
  backgroundColor: string;
  allowFileUpload?: boolean;
  linkBehavior?: "newTab" | "sameTab";
  position?: "left" | "right";
  welcomeMsg?: string;
  suggestedQuestionList?: string[];
}) {

  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const [guestId, setGuestId] = useState("");
  const [senderId, setSenderId] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [roomName, setRoomName] = useState<string | null>(null);
  //const [aiPaused, setAiPaused] = useState(false)
  const [aiTyping, setAiTyping] = useState(false);

  const [aiPaused, setAiPaused] = useState(() => {
    const saved = sessionStorage.getItem("aiPaused");
    return saved === "true"; // restore previous state
  });


  const [userInfo, setUserInfo] = useState<{ name?: string; email?: string } | null>(null);
  const [askedForInfo, setAskedForInfo] = useState(false);
  const [showChat, setShowChat] = useState(true);


  const [lastActivity, setLastActivity] = useState(Date.now());
  const [showEndPopup, setShowEndPopup] = useState(false);

  const inactivityTimer = useRef<any>(null);
  const popupTimer = useRef<any>(null);


  // for review
  const [selectedSentiment, setSelectedSentiment] = useState<"positive" | "neutral" | "negative" | null>(null);
  const [reviewText, setReviewText] = useState("");
  const [showReviewPopup, setShowReviewPopup] = useState(false);

  //to get assgnee data 
  const [assignedAgent, setAssignedAgent] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showSuggestedOnce, setShowSuggestedOnce] = useState(false);


  const [showQuickReview, setShowQuickReview] = useState(false);
  const [showQuickAssigneeReview, setShowQuickAssigneeReview] = useState(false);
  const [showDownloadPDF, setShowDownloadPDF] = useState(false);

  const defaultSuggestions = suggestedQuestionList


  useEffect(() => {
    if (chatHistory.length > 0) { // Start AFTER first message
      resetInactivityTimer();
    }
    return () => clearTimeout(popupTimer.current);
  }, [lastActivity]);


  const resetInactivityTimer = () => {
    clearTimeout(inactivityTimer.current);
    inactivityTimer.current = null;
    inactivityTimer.current = setTimeout(() => {
      setShowEndPopup(true);

      // Auto-end after 30s
      popupTimer.current = setTimeout(() => {
        setShowReviewPopup(false);
        endChatSession();
      }, 30 * 1000);

    }, 4 * 60 * 1000); // 4 minutes
  };


  const downloadChatPDF = async () => {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const now = new Date();
    const printedDate = now.toLocaleDateString();
    const printedTime = now.toLocaleTimeString();

    // Header start
    doc.setFont("Inter", "bold");
    doc.setFontSize(24); // bigger and bolder
    doc.setTextColor(50, 50, 50); // dark gray for professionalism

    function markdownToPlainText(md: string) {
      return md
        .replace(/!\[.*?\]\(.*?\)/g, '') // remove images
        .replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '$1 ($2)') // show links as text (URL in parentheses)
        .replace(/(\*\*|__)(.*?)\1/g, '$2') // bold
        .replace(/(\*|_)(.*?)\1/g, '$2')   // italic
        .replace(/^\s*\d+\.\s+/gm, '• ')     // numbered list → bullets
        .replace(/^\s*[-*]\s+/gm, '• ')      // bullet list
        .trim();
    }

    function drawGradientText(
      doc: any,
      text: string,
      x: number,
      y: number,
      fontSize = 10
    ) {
      const gradientColors = [
        [124, 58, 237], // #7c3aed
        [236, 72, 153], // #ec4899
        [59, 130, 246], // #3b82f6
      ];

      doc.setFont("Inter", "bolditalic");
      doc.setFontSize(fontSize);

      let currentX = x;

      for (let i = 0; i < text.length; i++) {
        const ratio = i / Math.max(text.length - 1, 1);
        const colorIndex = Math.floor(ratio * (gradientColors.length - 1));
        const nextIndex = Math.min(colorIndex + 1, gradientColors.length - 1);
        const localRatio = ratio * (gradientColors.length - 1) - colorIndex;

        const r = Math.round(
          gradientColors[colorIndex][0] * (1 - localRatio) +
          gradientColors[nextIndex][0] * localRatio
        );
        const g = Math.round(
          gradientColors[colorIndex][1] * (1 - localRatio) +
          gradientColors[nextIndex][1] * localRatio
        );
        const b = Math.round(
          gradientColors[colorIndex][2] * (1 - localRatio) +
          gradientColors[nextIndex][2] * localRatio
        );

        doc.setTextColor(r, g, b);
        doc.text(text[i], currentX, y);
        currentX += doc.getTextWidth(text[i]);
      }
    }

    function drawPoweredByhertzora(doc: any, startY: number) {
      const pageWidth = doc.internal.pageSize.getWidth();
      const y = startY + 10;

      const poweredBy = "Powered by";
      const hertzora = "hertzora";
      const gap = 1;

      doc.setFont("Inter", "bold");
      doc.setFontSize(12);

      const poweredByWidth = doc.getTextWidth(poweredBy);
      const hertzoraWidth = doc.getTextWidth(hertzora);
      const totalWidth = poweredByWidth + gap + hertzoraWidth;

      const startX = (pageWidth - totalWidth) / 2;

      // Powered by (normal text)
      doc.setTextColor(140, 140, 140);
      doc.text(poweredBy, startX, y);

      // hertzora (gradient text ONLY)
      drawGradientText(
        doc,
        hertzora,
        startX + poweredByWidth + gap,
        y,
        12
      );
      doc.setFont("Inter", "bolditalic");
      doc.setTextColor(140, 140, 140);
      doc.setFontSize(12);
      doc.text("AI", startX + poweredByWidth + gap + 12, y);
    }

    // --- 1️⃣ Fetch bot icon as base64 ---
    async function getImageBase64(url: string): Promise<string> {
      const res = await fetch(url);
      const blob = await res.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }

    const pageCenter = pageWidth / 2;
    const botIconUrl = botIcon; // your URL
    const botNamex = botName; // your bot name
    const imgData = await getImageBase64(botIconUrl);

    // --- 2️⃣ Draw bot icon with optional background ---
    const circleX = 20;
    const circleY = 14;
    const radius = 8;

    // Optional colored background
    doc.setFillColor(58, 43, 155); // purple
    doc.circle(pageCenter, circleY, radius, "F"); // centered circle

    // Add the image
    const size = 12; //12
    doc.addImage(
      imgData,
      "PNG",
      pageCenter - size / 2,
      circleY - size / 2,
      size,
      size
    );

    // Bot name smaller
    doc.setFont("Inter", "bold");
    doc.setFontSize(12); // smaller than before
    doc.setTextColor(30, 30, 30);
    doc.text(botNamex, pageCenter, circleY + radius + 4, { align: "center" });

    // Main heading bigger
    doc.setFont("Inter", "bold");
    doc.setFontSize(26); // bigger
    doc.setTextColor(50, 50, 50);
    doc.text("Conversation Summary", pageWidth / 2, circleY + radius + 15, { align: "center" });


    // Optional underline for style
    doc.setDrawColor(180, 180, 180); // light gray
    doc.setLineWidth(0.5);
    doc.line(15, 42, pageWidth - 15, 42);

    // Printed date below heading
    doc.setFont("Inter", "normal");
    doc.setFontSize(10);
    doc.setTextColor(120); // subtle gray
    doc.text(`Generated on ${printedDate} at ${printedTime}`, pageWidth / 2, 48, { align: "center" });

    const headingBottomY = 54;
    autoTable(doc, {
      startY: headingBottomY,
      head: [["#", "Sender", "Message", "Time"]],
      body: chatHistory.map((msg, index) => [
        index + 1,
        msg.sender === "user" ? "User" : "Assistant",
        markdownToPlainText(msg.text || ""),
        msg.timestamps?.sent || msg.timestamps?.received || "-",
      ]),
      styles: {
        fontSize: 10,
        cellPadding: 3,
        valign: "top",
        font: "Inter",
        overflow: "ellipsize", // optional, trims long text with "…"
      },
      columnStyles: {
        2: { cellWidth: 120, overflow: 'linebreak' },
        3: { cellWidth: 30 } // column 3 = "Time" → set fixed width
      }
    });

    const tableXStart = 14; // usually autoTable default margin left
    const tableXEnd = pageWidth - 14; // or calculate actual table width if smaller

    const tableEndY = (doc as any).lastAutoTable.finalY; // bottom of table
    const lineY = tableEndY + 4; // some padding below table

    doc.setDrawColor(200);   // light gray
    doc.setLineWidth(0.4);
    doc.line(tableXStart, lineY, tableXEnd, lineY); // horizontal line matching table width

    drawPoweredByhertzora(doc, tableEndY);

    doc.save("chat-transcript.pdf");
  };

  const endChatSession = async (endReason?: string) => {
    clearTimeout(inactivityTimer.current);
    clearTimeout(popupTimer.current);

    inactivityTimer.current = null;
    popupTimer.current = null;
    // setShowReviewPopup(true);
    const payload = {
      contact_id: guestId,
      sentiment: null,  // <-- only one column
      review: reviewText || "null"     // optional
    };
    console.log(payload);

    try {
      await fetch(`${API_BASE_URL}/saveReview`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey
        },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.error("Review save failed:", err);
    }

    // remove session
    sessionStorage.removeItem("guestContactId");
    sessionStorage.removeItem("room");
    setShowDownloadPDF(false);
    setShowEndPopup(false);
    setChatHistory([]);
    setGuestId("");
    setSenderId(null);
    setRoomName(null);
    setIsGuest(true);
    setUserInfo(null);
    setAskedForInfo(false);
    // reset AI pause state
    setAiPaused(false);
    sessionStorage.removeItem("aiPaused");
    setShowSuggestedOnce(false);
    setShowQuickAssigneeReview(false);
    setShowQuickReview(false)
    setShowDownloadPDF(false)
    // create new room id
    const newRoom = crypto.randomUUID();
    setRoomName(newRoom);

    sessionStorage.setItem("room", newRoom);

    setIsGuest(true);


    let endStatement = endReason || "Your previous chat has ended due to inactivity. How can I assist you now?";
    addBotMessage(endStatement);
    console.log("roomName", roomName, "senderid", senderId)

  };



  const endChatSessionByQuickReview = async (endReason?: string) => {
    clearTimeout(inactivityTimer.current);
    clearTimeout(popupTimer.current);

    inactivityTimer.current = null;
    popupTimer.current = null;



    // remove session
    sessionStorage.removeItem("guestContactId");
    sessionStorage.removeItem("room");

    setShowEndPopup(false);
    setChatHistory([]);
    setGuestId("");
    setSenderId(null);
    setRoomName(null);
    setIsGuest(true);
    setUserInfo(null);
    setAskedForInfo(false);
    // reset AI pause state
    setAiPaused(false);
    sessionStorage.removeItem("aiPaused");
    setShowSuggestedOnce(false);
    setShowQuickAssigneeReview(false);
    setShowDownloadPDF(false);
    // create new room id
    const newRoom = crypto.randomUUID();
    setRoomName(newRoom);

    sessionStorage.setItem("room", newRoom);

    setIsGuest(true);
    setShowQuickReview(false)

    let endStatement = endReason || "";
    if (endStatement)
      addBotMessage(endStatement);

    console.log("roomName", roomName, "senderid", senderId)

  };


  useEffect(() => {
    sessionStorage.setItem("aiPaused", aiPaused.toString());
  }, [aiPaused]);

  const [shadowReady, setShadowReady] = useState(false);

  useEffect(() => {
    if (shadowContainer?.current) {
      setShadowReady(true);
    }
  }, [shadowContainer?.current]);


  const getUserCountry = async () => {
    try {
      const res = await fetch("https://ipapi.co/json/");
      const data = await res.json();

      // ipapi.co returns the short country code in 'country' (ISO 2-letter)
      const countryCode = data.country?.toLowerCase() || "un"; // "un" for unknown

      return countryCode; // save this in DB
    } catch (err) {

      return "un"; // unknown
    }
  };


  const [country, setCountry] = useState("Unknown");

  useEffect(() => {
    getUserCountry().then((c) => setCountry(c));
  }, []);

  //
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  useEffect(() => {
    const setupRoom = async () => {
      try {
        const guestContactId = sessionStorage.getItem("guestContactId");
        // resetInactivityTimer();

        const savedRoom = sessionStorage.getItem("room");
        const savedGuestId = sessionStorage.getItem("guestContactId");

        //  console.log("storage data room :", savedRoom, " guestID ", savedGuestId)
        if (guestContactId) {
          // Existing guest → fetch their permanent room from DB
          setGuestId(guestContactId);
          setSenderId(guestContactId);

          const res = await fetch(`${API_BASE_URL}/getGuestRoom?guest_id=${guestContactId}`, {
            headers: { "x-api-key": apiKey },
          })
          if (!res.ok) {
            // If fetch fails (404, 410, etc.), treat as ended/deleted
            console.warn("Guest room not found, ending session");
            endChatSessionByQuickReview("");
            return;
          }

          const data = await res.json();
          setRoomName(data.room_id); // set room from DB

        } else {
          // New guest → create temporary room until they provide info
          const newRoomId = crypto.randomUUID();
          setRoomName(newRoomId);
          setIsGuest(true);
          setSenderId(null); // unknown guest until info provided


          setChatHistory([]);

          setSenderId(null);


          setUserInfo(null);
          setAskedForInfo(false);
          // reset AI pause state
          setAiPaused(false);
          sessionStorage.removeItem("aiPaused");



        }
        console.log("roomName", roomName, "senderid", senderId)
      } catch (err) {
        console.error("Error setting up room:", err);
      }
    };


    setupRoom();

    //  setupRoom();
  }, []);
  const API_BASE_URL = "https://app.hertzora.ai/api/clientCustomerChatBox";
  //https://hostingate-client.vercel.app/sign-in https://app.hostingate.com/dashboard/profile
  // const API_BASE_URL = "https://app.hostingate.com/api/clientCustomerChatBox";
  //const API_BASE_URL = "https://app.hostie.ai/api/clientCustomerChatBox";

  // const API_BASE_URL = "http://localhost:3000/api/clientCustomerChatBox";
  useEffect(() => {
    const fetchChatHistory = async () => {
      if (!roomName) return;
      if (!guestId) return;

      try {
        const res = await fetch(`${API_BASE_URL}/getChatHistory?room_id=${roomName}`, {
          headers: { "x-api-key": apiKey },
        });
        const result = await res.json();


        if (!res.ok) {
          console.error("Failed to fetch chat history:", result.error);
          return;
        }
        //sender: (msg.sender_id || msg.guest_sender_id) ? "user" : "bot"
        const data = result.data || [];
        const formattedHistory: ChatMessage[] = data
          .filter((msg: any) => !msg.resolved && !msg.deleted)
          .map((msg: any) => ({
            sender: (msg.sender_id || msg.guest_sender_id) ? "user" : "bot",
            text: msg.message,

            uploaded_documents: msg.uploaded_documents || null,
            timestamps: {
              sent: msg.sender_id || msg.guest_sender_id
                ? new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : undefined,
              received: !msg.sender_id && !msg.guest_sender_id
                ? new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : undefined,
            },
          }));

        setChatHistory(formattedHistory);
      } catch (err) {
        console.error("Unexpected error fetching chat history:", err);
      }
    };

    fetchChatHistory();
  }, [roomName]);

  useEffect(() => {
    if (!roomName) return;

    const eventSource = new EventSource(`${API_BASE_URL}/stream?room=${roomName}&api_key=${apiKey}`);

    eventSource.onmessage = (event) => {
      //  Ignore keep-alive or connection messages
      if (event.data === "ping" || event.data === "connected") return;

      try {
        const newMsg = JSON.parse(event.data);

        // Ignore invalid payloads
        if (!newMsg || !newMsg.message) return;

        if (newMsg.deleted) return;
        const msgText = newMsg.message.trim();

        //1 System: Pause AI
        if (msgText === "You are now connected to a live agent. AI responses are paused.") {
          setAiPaused(true);
          addBotMessage(msgText);
          setShowQuickReview(false);

          getAssignee()
            .then((agent) => {
              if (agent?.id && agent?.name) {
                setAssignedAgent({
                  id: agent.id,
                  name: agent.name,
                });
              }
            })
            .catch(() => { });
          return; // admin message already sent, don’t add again
        }

        // 2 System: Resume AI
        if (msgText === "AI responses resumed.") {
          setAiPaused(false);
          addBotMessage(msgText);
          setAssignedAgent(null);
          setShowQuickReview(false);
          setShowQuickAssigneeReview(true);
          setShowSuggestedOnce(false);


          return;
        }

        // 3 Normal message
        setChatHistory((prev) => [
          ...prev,
          {
            sender:
              (newMsg.sender_id || newMsg.guest_sender_id)
                ? "user"
                : "bot",
            //sender: newMsg.sender as "user" | "bot",
            text: newMsg.message,
            uploaded_documents: newMsg.uploaded_documents || null,

            timestamps: {
              received: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              //new Date().toISOString() 
            },
          },
        ]);

      } catch (err) {
        // console.error("SSE parse error:", err);
      }
    };

    eventSource.onerror = (err) => {

      // optionally reconnect after delay
      setTimeout(() => {
        if (roomName) {
          const newEventSource = new EventSource(`${API_BASE_URL}/stream?room=${roomName}&api_key=${apiKey}`);
          // reassign handlers
        }
      }, 3000);
    };

    return () => eventSource.close();
  }, [roomName]);


  //save normal msg 
  const getAssignee = async () => {
    const res = await fetch(`${API_BASE_URL}/getAssignee`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        room_id: roomName,

      }),
    });
    return res.json(); // { reply: "AI response" }
  };


  const saveGuestContact = async (guestData: { name?: string; email?: string, room_id: string, country: string, }) => {
    const res = await fetch(`${API_BASE_URL}/saveContact`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey
      },
      body: JSON.stringify(guestData),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to save contact: ${res.status} ${text}`);
    }

    const data = await res.json();
    //  console.log("Contact saved:", data);
    return data;
  };

  //save normal msg 
  const saveUserMessage = async (messageText: string, skipAI: boolean) => {
    const res = await fetch(`${API_BASE_URL}/saveMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        prompt: messageText,
        room_id: roomName,
        sender_id: senderId,
        receiver_id: aiPaused ? "live_agent" : "ai",
        skipAI: skipAI,
      }),
    });
    return res.json(); // { reply: "AI response" }
  };

  //to save contactinfo as a message done
  const saveUserMessageWithSender = async (messageText: string, skipAI: boolean, sender: string) => {
    const res = await fetch(`${API_BASE_URL}/saveMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        prompt: messageText,
        room_id: roomName,
        sender_id: sender,
        receiver_id: aiPaused ? "live_agent" : "ai",
        skipAI,
      }),
    });

    return res.json();
  };

  const saveBotMessage = async (text: string, receiverId: string | null, api_key: string) => {
    await fetch(`${API_BASE_URL}/saveAiMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": api_key,
      },
      body: JSON.stringify({ room_id: roomName, message: text, receiver_id: receiverId }),
    });
  };
  //C:\Users\User\Desktop\amez\hertzora-dashboard\src\app\api\clientCustomerChatBox\aiResponceGenerate
  const generateAIResponse = async (room_id: string, message: string, sender_id: string) => {
    const typingMessage: ChatMessage = { sender: "bot", text: "", isTyping: true };
    setChatHistory(prev => [...prev, typingMessage]);

    const res = await fetch(`${API_BASE_URL}/aiResponceGenerate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({ room_id, prompt: message, sender_id }),
    });
    setChatHistory(prev => {
      const newHistory = prev.filter(msg => !msg.isTyping); // remove typing

      return newHistory;
    });

    return res.json();
  };


  const addBotMessage = (text: string) => {
    setChatHistory((prev) => [
      ...prev,
      {
        sender: "bot",
        text,
        timestamps: {
          received: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          //new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          ,
        },
      },
    ]);
  };

  const addUserMessage = (text: string) => {
    setChatHistory((prev) => [
      ...prev,
      {
        sender: "user",
        text,
        timestamps: { sent: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
        //new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
      },
    ]);
  };

  // const QuickReview = ({ onPositive, onNegative }: {
  //   onPositive: () => void;
  //   onNegative: () => void;
  // }) => {
  //   const isDark = document
  //     .querySelector("#hertzora-chat-root")
  //     ?.classList.contains("dark");

  //   const baseBg = isDark ? suggestQuestionsDark : backgroundColor;
  //   const hoverBg = darkenColor(baseBg, 12);

  //   const baseStyle = {
  //     backgroundColor: baseBg,
  //     borderColor: suggestQuestionsBorder,
  //     color: "#333",
  //   };

  //   const hoverStyle = {
  //     backgroundColor: hoverBg,
  //   };

  //   return (
  //     <div className="flex flex-col items-end gap-2 mt-3">
  //       <style>{`
  //             button {
  //               -webkit-tap-highlight-color: transparent;
  //             }

  //             button:focus,
  //             button:focus-visible {
  //               outline: none !important;
  //               box-shadow: none !important;
  //             }

  //             /* remove blue focus / border */
  //             .quick-review-btn {
  //               outline: none;
  //               box-shadow: none;
  //               border-color: var(--qr-border, #747071);
  //               transition: background-color 0.2s ease, border-color 0.2s ease;
  //             }

  //             .quick-review-btn:focus,
  //             .quick-review-btn:focus-visible {
  //               outline: none;
  //               box-shadow: none;
  //               border-color: var(--qr-border, #747071);
  //             }

  //             /* light mode hover */
  //             .quick-review-btn:hover {
  //               background-color: #d4d4d4 !important; /* ash */
  //             }

  //             /* dark mode hover */
  //             .dark .quick-review-btn:hover {
  //               background-color: #3f3f46 !important; /* dark ash */
  //             }
  //       `}</style>
  //       {/* <button
  //         onClick={onPositive}
  //         className="quick-review-btn p-2 rounded-3xl text-sm border transition-colors max-w-[80%]"
  //         style={baseStyle}
  //         onMouseEnter={(e) =>
  //           (e.currentTarget.style.backgroundColor = hoverBg)
  //         }
  //         onMouseLeave={(e) =>
  //           (e.currentTarget.style.backgroundColor = baseBg)
  //         }
  //       >
  //         😊 Thank you, that helped
  //       </button>

  //       <button
  //         onClick={onNegative}
  //         className="quick-review-btn p-2 rounded-3xl text-sm border transition-colors max-w-[80%]"
  //         style={baseStyle}
  //         onMouseEnter={(e) =>
  //           (e.currentTarget.style.backgroundColor = hoverBg)
  //         }
  //         onMouseLeave={(e) =>
  //           (e.currentTarget.style.backgroundColor = baseBg)
  //         }
  //       >
  //         ❓No I have more question
  //       </button> */}


  //       <button
  //         onClick={onPositive}
  //         className="quick-review-btn p-2 rounded-3xl text-sm border max-w-[80%]"
  //         style={{
  //           backgroundColor: isDark ? suggestQuestionsDark : backgroundColor,
  //           borderColor: suggestQuestionsBorder,
  //           color: "#22c55e", // green
  //           ["--qr-border" as any]: suggestQuestionsBorder,
  //         }}
  //       >
  //         😊 Thank you, that helped
  //       </button>

  //       <button
  //         onClick={onNegative}
  //         className="quick-review-btn p-2 rounded-3xl text-sm border max-w-[80%]"
  //         style={{
  //           backgroundColor: isDark ? suggestQuestionsDark : backgroundColor,
  //           borderColor: suggestQuestionsBorder,
  //           color: "#6b7280", // ash/gray
  //           ["--qr-border" as any]: suggestQuestionsBorder,
  //         }}
  //       >
  //         ❓ No I have more questions
  //       </button>

  //     </div>
  //   );
  // };


  const QuickReview = ({ onPositive, onNegative }: {
    onPositive: () => void;
    onNegative: () => void;
  }) => {
    const isDark = document
      .querySelector("#hertzora-chat-root")
      ?.classList.contains("dark");
    const reviewDark = "#404040"
    const baseBg = isDark ? reviewDark : backgroundColor;
    const hoverBg = darkenColor(baseBg, 12);
    const darkBg = "#3f3f46";
    const baseStyle = {
      // backgroundColor: !isDark ? baseBg : darkBg,
      borderColor: "1px solid ", suggestQuestionsBorder,
      // color: isDark ? "#ffffff" : "#333",
      // transition: "background-color 0.3s ease",
    };

    //     const baseStyle: React.CSSProperties = {
    //   backgroundColor: isDark ? darkBg : baseBg,
    //   border: `1px solid ${suggestQuestionsBorder}`,
    //   color: isDark ? "#ffffff" : "#333333",
    //   transition: "background-color 0.2s ease",
    // };

    //  const baseStyleDark = {
    //       backgroundColor: "#3f3f46 !important",
    //       borderColor: "1px solid  #2a2a33",
    //       color: isDark ? "#ffffff" : "#333",
    //       transition: "background-color 0.3s",


    //     };

    const hoverStyle = {
      backgroundColor: hoverBg,
    };

    return (
      <div className="flex flex-col items-end gap-2 mt-3">
        <style>{`
        button {
          -webkit-tap-highlight-color: transparent;
        }

      
        .quick-review-btn {
          box-shadow: none ;
          transition: background-color 0.2s ease;
        }
        .quick-review-btn:focus,
        .quick-review-btn:focus-visible {
          box-shadow: none !important;
        }

        /* light hover */
        .quick-review-btn:hover {
          background-color: #adacac !important;
        }
 .dark.quick-review-btn:hover {
          background-color: #585858 !important;
        }

        
        
       
      `}</style>

        <button
          onClick={onPositive}
          className="quick-review-btn p-2 border rounded-3xl text-sm max-w-[80%] "
          style={baseStyle}
        >
          😊 Thank you, that helped
        </button>

        <button
          onClick={onNegative}
          className="quick-review-btn border p-2 rounded-3xl text-sm max-w-[80%]"
          style={baseStyle}
        >
          ❓ No I have more questions
        </button>
      </div>
    );
  };


  const sendMessage = async () => {
    if (showSuggestedOnce) {
      setShowSuggestedOnce(false);
    }
    setShowQuickReview(false);
    // const messageText = message.trim();
    const messageText = message.replace(/\n/g, "  \n").trim();
    if (!messageText.trim()) return;

    resetInactivityTimer();

    setMessage("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.overflowY = "hidden";
    }

    // Add user's message immediately to UI
    //addUserMessage(messageText);

    //  Guest without info → ask info only

    if (isGuest && !userInfo && !askedForInfo) {
      setLastActivity(Date.now());
      resetInactivityTimer();

      addUserMessage(messageText);
      setAskedForInfo(true);
      // const askMsg = "Before we continue, could you please share your name or email?";
      // const askMsg = `👋 Hi! ${botName} here.`;
      const askMsg = welcomeMsg || `👋 Hi! ${botName} here.`;
      const askMsg2 = "Before we continue, could you share your name or email?"

      //addBotMessage(askMsg);
      await saveBotMessage(askMsg, senderId, apiKey,);
      await saveBotMessage(askMsg2, senderId, apiKey,);
      return;
    }

    // Guest just gave info → save contact & thank
    if (askedForInfo && !userInfo) {
      if (roomName) {
        const guestData = message.includes("@")
          ? { email: message, room_id: roomName, country: country, }
          : { name: message, room_id: roomName, country: country, };
        try {
          const savedGuest = await saveGuestContact(guestData);
          sessionStorage.setItem("guestContactId", savedGuest.id);
          setGuestId(savedGuest.id);
          setSenderId(savedGuest.id);
          setUserInfo({ name: savedGuest.name, email: savedGuest.email });

          sessionStorage.setItem("room", savedGuest.room_id);
          setRoomName(savedGuest.room_id);
          sessionStorage.setItem("guestContactId", savedGuest.id)

          //  await saveUserMessage(message, true);
          await saveUserMessageWithSender(messageText, true, savedGuest.id);

          const thankMsg = `Thanks ${savedGuest.name || savedGuest.email}! You can continue chatting now..!`;
          // addBotMessage(thankMsg);
          await saveBotMessage(thankMsg, savedGuest.id, apiKey);
          if (!showSuggestedOnce && defaultSuggestions?.length) {
            setSuggestedQuestions(defaultSuggestions);
            setShowSuggestedOnce(true);
          }

        } catch (err) {
          console.error("Error saving guest info:", err);
        }
        return;
      } else {
        console.log("no room name there....")
      }


    }

    //  Guest/user already has info → save user message & get AI reply
    if (!aiPaused) {
      if (!roomName || !senderId) return;

      try {
        const aiResp = await saveUserMessage(messageText, false);
        //setAiTyping(true);
        // const reply = aiResp.reply || "Sorry, I couldn't generate a reply.";

        const generated = await generateAIResponse(
          roomName,
          messageText,
          senderId,
        );

        setTimeout(() => {
          setShowQuickReview(true);
        }, 3000);


      } catch (err) {
        console.error("AI call failed:", err);
        setChatHistory(prev => prev.filter(msg => !msg.isTyping));
      }
    } else {
      console.log("AI response paused due to live agent assignment.");
      const aiResp = await saveUserMessage(messageText, true);
    }

  };

  useEffect(() => {
    const handleFile = (e: any) => {
      const file = e.detail as File;
      handleFileUpload(file);
    };
    window.addEventListener("hertzora-file-selected", handleFile);
    return () => window.removeEventListener("hertzora-file-selected", handleFile);
  }, [roomName, senderId]);


  const handleFileUpload = async (file: File) => {
    if (!roomName || !senderId) {
      alert("provide your details First..!")
      return;

    }
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "application/pdf",
      "audio/mpeg",
      "audio/wav",
      "audio/ogg",
      // "video/mp4",
    ];

    if (!allowedTypes.includes(file.type)) {
      const detectedType = file.type || file.name.split(".").pop();
      alert(`❌ Unsupported file type: ${detectedType}`);
      return;
    }

    // Step 2: Validate file size
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      alert(`❌ File too large! (${(file.size / 1024 / 1024).toFixed(1)} MB > 50 MB limit)`);
      return;
    }


    const formData = new FormData();
    formData.append("file", file);
    formData.append("room_id", roomName);
    formData.append("sender_id", senderId);

    try {
      const res = await fetch(`${API_BASE_URL}/uploadFile`, {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        //  Show backend error message to user
        alert("File upload failed. Please try again.");
        console.error("Upload error:", data.error);
        return;
      }
      //if (!data.fileUrl) throw new Error("Upload failed");
      if (!data.fileUrl) {
        alert("Unexpected error: no file URL returned.");
        return;
      }
      // Add file message to chat UI immediately
      setChatHistory((prev) => [
        ...prev,
        {
          sender: "user",
          text: "",
          uploaded_documents: data.fileUrl,
          timestamps: { sent: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
        },
      ]);
    } catch (err) {
      console.error("File upload failed:", err);

      alert("Something went wrong while uploading. Please try again.");
    }
  };
  const fileInputRef = useRef<HTMLInputElement>(null);

  const shadowRoot = document.querySelector("#hertzora-chat-root")?.shadowRoot;

  const handleReviewSubmit = async () => {
    const contactId = sessionStorage.getItem("guestContactId");
    const room = sessionStorage.getItem("room");

    if (!contactId || !room) {
      setShowReviewPopup(false);
      //endChatSession();
      endChatSessionByQuickReview("Thanks for chatting!! 😊") //now ok
      return;
    }
    console.log("savedRoom:", room);
    console.log("guestId:", contactId);
    console.log("click 12333");
    if (!contactId) {
      //  endChatSession();
      endChatSession("Thanks for chatting!! 😊") //now ok  endChatSessionByQuickReview("Thanks for chatting!! 😊")
      return;
    }
    console.log("click clichh")
    const payload = {
      contact_id: guestId,
      sentiment: selectedSentiment,  // <-- only one column
      review: reviewText || "null"     // optional
    };
    console.log(payload);

    try {
      await fetch(`${API_BASE_URL}/saveReview`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey
        },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.error("Review save failed:", err);
    }

    setShowReviewPopup(false);
    setShowDownloadPDF(true);
    setShowSuggestedOnce(false);
    // endChatSessionByQuickReview("Thanks for chatting!! 😊")
  };

  const [showPremiumPopup, setShowPremiumPopup] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setShowPremiumPopup(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getInitials = (name: string) => {
    if (!name) return "";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  function darkenColor(hex: string, amount = 20) {
    if (!hex) return hex;

    hex = hex.replace("#", "");
    const num = parseInt(hex, 16);

    let r = (num >> 16) - amount;
    let g = ((num >> 8) & 0x00ff) - amount;
    let b = (num & 0x0000ff) - amount;

    r = Math.max(0, r);
    g = Math.max(0, g);
    b = Math.max(0, b);

    return `#${(b | (g << 8) | (r << 16))
      .toString(16)
      .padStart(6, "0")}`;
  }

  const focusBorderColor = borderColor
    ? darkenColor(borderColor, 20)
    : "#d1cbd0";

  const darkFocusBorderColor = darkBorderColor
    ? darkenColor(darkBorderColor, 20)
    : "#3a3538";


  const SuggestedQuestions = ({
    questions,
    onSelect,
  }: {
    questions: string[];
    onSelect: (q: string) => void;
  }) => {
    // const isDark = document
    //   .querySelector("#hertzora-chat-root")
    //   ?.classList.contains("dark");
    const isDark = document
      .querySelector("#hertzora-chat-root")
      ?.classList.contains("dark");

    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    return (
      <div>
        <div className="flex flex-col-reverse gap-2 mt-4 items-end">
          {questions.map((q, i) => {
            const isHovered = hoveredIndex === i;
            const baseStyle = {
              borderColor: "1px solid ", suggestQuestionsBorder,
            };
            return (
              <>
                <style>{`
                    button {
                      -webkit-tap-highlight-color: transparent;
                    }

      
                    .quick-review-btn {
                      box-shadow: none ;
                      transition: background-color 0.2s ease;
                    }
                    .quick-review-btn:focus,
                  .quick-review-btn:focus-visible {
                    box-shadow: none !important;
                  }

                  /* light hover */
                  .quick-review-btn:hover {
                    background-color: #adacac !important;
                  }
          .dark.quick-review-btn:hover {
                    background-color: #585858 !important;
                  }   
      `}</style>
                <button
                  key={i}
                  onClick={() => onSelect(q)}
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className="quick-review-btn p-2 rounded-3xl text-sm max-w-[99%] break-words transition-all duration-200 border"
                  // style={{
                  //   backgroundColor: isHovered
                  //     ? isDark
                  //       ? suggestQuestionsDark
                  //       : suggestQuestionsBg
                  //     : "transparent",

                  //   borderColor: suggestQuestionsBorder || "#50484cff",
                  //   color: isDark ? "#ffffff" : "#1F2937",
                  // }}
                  style={baseStyle}
                >
                  {q}
                </button>
              </>

            );
          })}
        </div>
      </div>
    );
  };


  const handleSuggestionClick = async (question: string) => {
    setShowSuggestions(false);
    setShowSuggestedOnce(false);
    // setMessage(question);

    // trigger normal send logic
    if (!aiPaused) {
      if (!roomName || !senderId) return;

      try {
        const aiResp = await saveUserMessage(question, false);
        const generated = await generateAIResponse(
          roomName,
          question,
          senderId,
        );

        setTimeout(() => {
          setShowQuickReview(true);
        }, 3000);

      } catch (err) {
        console.error("AI call failed:", err);
        setChatHistory(prev => prev.filter(msg => !msg.isTyping));
      }
    } else {
      console.log("AI response paused due to live agent assignment.");

      const aiResp = await saveUserMessage(question, true);
    }
  };

  const suggestQuestionsBg = backgroundColor ? darkenColor(backgroundColor, 40) : "#c7bec2ff";
  const suggestQuestionsBorder = backgroundColor ? darkenColor(backgroundColor, 45) : "#747071ff";
  const suggestQuestionsDark = backgroundColor ? darkenColor(backgroundColor, 50) : "#7c797aff";

  const DEFAULT_REVIEWS: Record<
    "positive" | "neutral" | "negative",
    string
  > = {
    positive: "That was helpful, thank you!",
    neutral: "Somewhat helpful.",
    negative: "Not what I was looking for.",
  };

  //   const QuickEmojiReview = ({
  //     onSelect,
  //   }: {
  //     onSelect: (sentiment: "positive" | "neutral" | "negative") => void;
  //   }) => {
  //     if (!guestId) return null;
  //     setShowDownloadPDF(true);
  //     setShowSuggestedOnce(false);

  //     const isDark = document
  //       .querySelector("#hertzora-chat-root")
  //       ?.classList.contains("dark");

  //     const [hovered, setHovered] = useState<string | null>(null);

  //     const emojiData = {
  //       positive: { icon: <Laugh size={24} />, text: "That was helpful, thank you!", color: "#22c55e" },
  //       neutral: { icon: <Meh size={24} />, text: "Somewhat helpful.", color: "#6b7280" },
  //       negative: { icon: <Frown size={24} />, text: "Not what I was looking for.", color: "#ef4444" },
  //     };
  //     const baseBg = isDark ? suggestQuestionsDark : backgroundColor;
  //     const hoverBg = darkenColor(baseBg, 12);
  //     return (
  //       <div className="flex flex-col  mt-4 text-center">
  //            <style>{`
  //         button {
  //           -webkit-tap-highlight-color: transparent;
  //         }


  //         .quick-review-btn {
  //           box-shadow: none ;
  //           transition: background-color 0.2s ease;
  //         }
  //         .quick-review-btn:focus,
  //         .quick-review-btn:focus-visible {
  //           box-shadow: none !important;
  //         }

  //         /* light hover */
  //         .quick-review-btn:hover {
  //           background-color: #adacac !important;
  //         }
  //  .dark.quick-review-btn:hover {
  //           background-color: #585858 !important;
  //         }




  //       `}</style>

  //         {/* Professional Heading */}
  //         <p className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-3">
  //           How was your experience?
  //         </p>
  //         {/* Emoji Buttons */}

  //         {(Object.keys(emojiData) as ("positive" | "neutral" | "negative")[]).map((sentiment) => {
  //           const isHovered = hovered === sentiment;

  //           return (
  //             <button
  //               key={sentiment}
  //               onClick={() => onSelect(sentiment)}
  //               onMouseEnter={() => setHovered(sentiment)}
  //               onMouseLeave={() => setHovered(null)}
  //               className="quick-review-btn flex items-center gap-2 px-4 py-2 rounded-3xl text-sm border transition-colors duration-200  max-w-[95%] mb-1"
  //               style={{
  //                 backgroundColor: isHovered ? hoverBg : baseBg,
  //                 borderColor: suggestQuestionsBorder,
  //                 color: emojiData[sentiment].color,
  //               }} >
  //               <span className="flex-shrink-0">{emojiData[sentiment].icon}</span>
  //               <span className="whitespace-nowrap font-medium">{emojiData[sentiment].text}</span>
  //             </button>
  //           );
  //         })}
  //       </div>
  //     );
  //   };

  const QuickEmojiReview = ({
    onSelect,
  }: {
    onSelect: (sentiment: "positive" | "neutral" | "negative") => void;
  }) => {
    if (!guestId) return null;
    setShowDownloadPDF(true);
    setShowSuggestedOnce(false);
    const isDark = document
      .querySelector("#hertzora-chat-root")
      ?.classList.contains("dark");
    const reviewDark = "#404040"
    const baseBg = isDark ? reviewDark : backgroundColor;
    const hoverBg = darkenColor(baseBg, 12);
    const darkBg = "#3f3f46";

    const [hovered, setHovered] = useState<string | null>(null);

    const emojiData = {
      positive: { icon: <Laugh size={24} />, text: "That was helpful, thank you!", color: "#22c55e" },
      neutral: { icon: <Meh size={24} />, text: "Somewhat helpful.", color: "#6b7280" },
      negative: { icon: <Frown size={24} />, text: "Not what I was looking for.", color: "#ef4444" },
    };
    return (
      <div className="flex flex-col  mt-4 text-center">
        <style>{`
        button {
          -webkit-tap-highlight-color: transparent;
        }

      
        .quick-review-btn {
          box-shadow: none ;
          transition: background-color 0.2s ease;
        }
        .quick-review-btn:focus,
        .quick-review-btn:focus-visible {
          box-shadow: none !important;
        }

        /* light hover */
        .quick-review-btn:hover {
          background-color: #adacac !important;
        }
 .dark.quick-review-btn:hover {
          background-color: #585858 !important;
        }   
      `}</style>

        {/* Professional Heading */}
        <p className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-3">
          How was your experience?
        </p>
        {/* Emoji Buttons */}

        {(Object.keys(emojiData) as ("positive" | "neutral" | "negative")[]).map((sentiment) => {
          const isHovered = hovered === sentiment;
          const baseStyle = {
            borderColor: "1px solid ", suggestQuestionsBorder,
            color: emojiData[sentiment].color,

          };
          return (
            <button
              key={sentiment}
              onClick={() => onSelect(sentiment)}
              onMouseEnter={() => setHovered(sentiment)}
              onMouseLeave={() => setHovered(null)}
              className="quick-review-btn flex items-center gap-2 px-4 py-2 rounded-3xl text-sm border transition-colors duration-200  max-w-[95%] mb-1"

              style={baseStyle} >
              <span className="flex-shrink-0">{emojiData[sentiment].icon}</span>
              <span className="whitespace-nowrap font-medium">{emojiData[sentiment].text}</span>
            </button>
          );
        })}
      </div>
    );
  };


  const saveQuickAssigneeReview = async (
    sentiment: "positive" | "neutral" | "negative"
  ) => {
    if (!guestId) return;

    const payload = {
      contact_id: guestId,
      sentiment,
      review: DEFAULT_REVIEWS[sentiment],
    };

    try {
      await fetch(`${API_BASE_URL}/saveReview`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error("Quick assignee review failed:", err);
    }
  };


  if (!showChat) return null;

  return (
    <>
      {showEndPopup && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999]">
          <div className="bg-white dark:bg-neutral-800 p-5 rounded-xl text-center shadow-xl w-72">
            <h3 className="font-semibold text-lg mb-3">End chat?</h3>
            <p className="text-sm mb-4">
              You’ve been inactive for a while. Do you want to end this chat?
            </p>

            <div className="flex gap-2 justify-center">
              <button
                className="bg-red-500 text-white px-4 py-2 rounded-lg"
                // onClick={() => endChatSession()}
                onClick={() => {
                  setShowEndPopup(false);
                  setShowReviewPopup(true); // only now ask for review
                }}
              >
                Yes, end
              </button>

              <button
                className="bg-gray-300 dark:bg-gray-600 text-black dark:text-white px-4 py-2 rounded-lg"
                onClick={() => {
                  clearTimeout(popupTimer.current);
                  setShowEndPopup(false);
                  resetInactivityTimer();
                }} > No </button>
            </div>
          </div>
        </div>
      )}

      {showReviewPopup && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999]">
          <div className="bg-white dark:bg-neutral-800 p-5 rounded-xl text-center shadow-xl w-80">
            <h3 className="font-semibold text-lg mb-2">Share your experience</h3>
            <p className="text-sm mb-4">How was your chat today?</p>

            <div className="flex justify-center gap-4 mb-4">
              <button
                onClick={() => setSelectedSentiment("positive")}
                className={selectedSentiment === "positive" ? "scale-125" : ""}
              ><Laugh size={30} color="#22c55e" /></button>

              <button
                onClick={() => setSelectedSentiment("neutral")}
                className={selectedSentiment === "neutral" ? "scale-125" : ""}
              ><Meh size={30} color="#6b7280" /></button>

              <button
                onClick={() => setSelectedSentiment("negative")}
                className={selectedSentiment === "negative" ? "scale-125" : ""}
              ><Frown size={30} color="#de3f3f" /></button>
            </div>

            <textarea
              className="w-full p-2 rounded-lg border dark:bg-neutral-700"
              placeholder="Write a review (optional)"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
            ></textarea>

            <div className="flex justify-center gap-2 mt-4">
              <button
                className="flex-1 bg-gray-400 text-white px-2 py-2 rounded-lg text-sm"
                onClick={() => {
                  setShowReviewPopup(false);
                  endChatSession();
                  // Skip review
                }}
              >
                Skip
              </button>

              <button
                className="flex-1 bg-purple-600 text-white px-2 py-1 rounded-lg text-sm"
                // onClick={handleReviewSubmit}
                onClick={handleReviewSubmit}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
  @media (max-width: 480px) {
   #hertzora-chat-box {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100% !important;
    height: 100% !important;
    margin: 0 !important;
    border-radius: 0 !important;
    max-width: none !important;
    max-height: none !important;
  }
}
     .hertzora-color {
   color: "#fff" !important;


   

      `}</style>
      <style>{`
  .hertzora-background {
    background: ${gradient};
    border: 1px solid ${borderColor || "#e9e4e6ff"};
    transition: border-color 0.3s;
  }
  .dark .hertzora-background {
    background: ${darkGradient};
    border-color: ${darkBorderColor || "#50484cff"};
  }

   .hertzora-hello-text {
    color: ${borderColor};
    opacity: 0.85;
    transition: border-color 0.3s;

  }
      .dark .hertzora-hello-text {
        color: ${borderColor};
        opacity: 1;
        
      }
        #hertzora-chat-box{
        background: ${backgroundColor};
        }
          .dark #hertzora-chat-box{
        background: #171717;
        }
     
  

    
      
     /*
     #hertzora-chat-box textarea{
     background: ${backgroundColor};
      border: 1px solid ${borderColor || "#e9e4e6ff"};
    transition: border-color 0.3s;
    }
      .dark #hertzora-chat-box textarea{
     background: #171717;
      border-color: ${darkBorderColor || "#50484cff"};
    }
        #hertzora-chat-box .btnBorder{
     background: ${backgroundColor};
      border: 1px solid ${borderColor || "#e9e4e6ff"};
    transition: border-color 0.3s;
    }
      .dark #hertzora-chat-box .btnBorder{
     background: #171717;
      border-color: ${darkBorderColor || "#50484cff"};
    }*/
      
`}</style>
      <style>{`
  #hertzora-chat-box textarea {
    background: ${backgroundColor};
    border: 1px solid ${borderColor || "#e9e4e6ff"};
    transition: border-color 0.25s ease, box-shadow 0.25s ease;
  }

  #hertzora-chat-box textarea:focus,
  #hertzora-chat-box textarea:focus-visible {
    border-color: ${focusBorderColor};
    box-shadow: 0 0 0 0.5px ${focusBorderColor};
    outline: none;
  }

  .dark #hertzora-chat-box textarea {
    background: #171717;
    border-color: ${darkBorderColor || "#50484cff"};
  }

  .dark #hertzora-chat-box textarea:focus,
  .dark #hertzora-chat-box textarea:focus-visible {
    border-color: ${darkFocusBorderColor};
    box-shadow: 0 0 0 0.5px ${darkFocusBorderColor};
    outline: none;
  }

  #hertzora-chat-box .btnBorder {
    background: ${backgroundColor};
    border: 1px solid ${borderColor || "#e9e4e6ff"};
    transition: border-color 0.25s ease;
  }

  .dark #hertzora-chat-box .btnBorder {
    background: #171717;
    border-color: ${darkBorderColor || "#50484cff"};
  }
`}</style>

      <div className={`fixed bottom-6 z-50 ${position === "left" ? "left-6" : "right-6"
        }`}>
        {/* <div className="fixed bottom-6 right-6 z-50 " > */}
        <div
          id="hertzora-chat-box"
          className="flex flex-col w-[340px] h-[85vh] rounded-2xl shadow-xl border border-zinc-100 dark:border-neutral-800  overflow-hidden  transition-colors duration-300 "
        >

          <div className="flex items-center justify-between p-3 text-sm font-semibold">
            <div className="flex items-center gap-1">
              {/* <BotMessageSquare className="mr-1.5" />*/}

              {assignedAgent ? (
                <div className="h-6 w-6 rounded-full hertzora-background hertzora-color text-white flex items-center justify-center text-xs font-semibold p-3">
                  {getInitials(assignedAgent.name)}
                </div>
              ) :
                botIcon ? (
                  <div
                    className="hertzora-background hertzora-color text-white p-[3px] w-6 h-6 rounded-full flex items-center justify-center">
                    <img
                      src={botIcon}
                      alt="Bot"
                      className="rounded-full object-cover"
                    /></div>
                ) : (
                  <div className="bg-pink-600 p-[6px] w-5 h-5 rounded-full flex items-center justify-center">
                    <BotMessageSquare size={20} />
                  </div>
                )}
              {assignedAgent ? assignedAgent.name : botName}

              <span
                className="ml-2 h-2 w-2 rounded-full bg-green-500"
                title="Online" />
              <span className="mr-2 text-xs text-green-500">Online</span>

            </div>
            <div className="flex gap-1 z-[99999]">
              {botName !== "hertzora" && (
                <div className="relative">
                  <button
                    onClick={() => setShowPremiumPopup((prev) => !prev)}
                    className="flex items-center px-2 py-0.5 rounded-md gap-1 bg-purple-50   dark:bg-neutral-700">
                    <LockIcon
                      size="12"
                      className="text-zinc-600 dark:text-zinc-200"
                    />{" "}
                    Premium
                  </button>

                  {showPremiumPopup && (

                    <div
                      className="absolute top-full mt-2 left-0 bg-white dark:bg-neutral-800 text-xs p-2 rounded shadow-lg w-64 z-50 whitespace-normal break-words">
                      Upgrade to premium <br />to customize your <br />chat page logo and colors.
                    </div>
                  )}</div>
              )}
              <div className="hertzora-background hertzora-color flex items-center px-2 py-0.5 rounded-md gap-1 ">
                <Sparkles size="12" className="text-zinc-600 dark:text-zinc-200" /> AI
              </div>
              <div className="flex items-center px-2 py-0.5 rounded-md">

                <span className=" text-xs font-medium">
                  <button onClick={() => setShowChat(false)} className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-300 dark:hover:text-white"> ✕ </button>
                </span>
              </div>
            </div>
          </div>

          {/* Chat area */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 ">

            {chatHistory.length === 0 && (
              <div className="mt-6 flex flex-col items-center justify-center">
                <img
                  src={botIcon}
                  alt="Bot Icon"
                  className="hertzora-color hertzora-background w-14 h-14 rounded-full object-cover mb-2 p-3 text-white"
                />
                <div className="flex items-center text-lg justify-center font-bold hertzora-hello-text">
                  {greeting}
                </div>
                <div className="mt-2 font-semibold text-gray-500 dark:text-gray-400 text-lg">
                  {introduction}
                </div>
                <div className="text-center text-gray-400 text-sm mt-10">
                  {/* Start a conversation... */}
                  {startButtonText}
                </div>
              </div>
            )}

            {chatHistory.map((msg, i) => (
              <div
                key={i}
                className={`flex items-end gap-2 ${msg.sender === "user" ? "justify-end" : "justify-start"
                  }`}
              >
                {msg.sender === "bot" && (
                  <div className="flex items-end relative" >

                    <img
                      src={botIcon}
                      alt="Bot"
                      className="hertzora-color hertzora-background h-[31px] w-[31px] rounded-full object-cover p-1 text-white" />
                    <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-green-500 border border-white dark:border-neutral-800" />
                  </div>
                )}
                <style>
                  {`
                   /* global.css or module.css */
                      .chat-bubble p {
                        margin: 0.25rem 0;
                        line-height: 1.4;
                      }

                      .chat-bubble a {
                        color: #ed3ab7ff; /* pink link */
                        text-decoration: underline;
                      }

                      .chat-bubble ul {
                        padding-left: 1rem;
                        list-style-type: disc;
                      }

                      .chat-bubble strong {
                        font-weight: 600;
                      }

                      .chat-bubble em {
                        font-style: italic;
                      }

                 `}
                </style>
                <div
                  className={` chat-bubble px-2 py-1.5 rounded-xl max-w-[75%] text-sm shadow-sm break-words  ${msg.sender === "user"
                    ? "hertzora-color hertzora-background text-white text-white rounded-br-none relative"
                    : "bg-gray-200 dark:bg-neutral-600 text-gray-800 dark:text-white rounded-bl-none relative"
                    }`}

                >
                  {msg.isTyping ? (
                    <div className="flex gap-1 px-1.5">
                      <span className="w-1.5 h-1.5 bg-gray-600 dark:text-white rounded-full animate-bounce" />
                      <span className="w-1.5 h-1.5 bg-gray-600 dark:text-white rounded-full animate-bounce delay-200" />
                      <span className="w-1.5 h-1.5 bg-gray-600 dark:text-white rounded-full animate-bounce delay-400" />
                    </div>
                  ) : (
                    // <div className="relative">
                    <div className="markdown-body flex items-end gap-1">
                      {msg.text &&
                        <div className="flex-1">
                          <Markdown
                            options={{
                              overrides: {
                                h1: {
                                  component: "div",
                                  props: {
                                    className: "font-bold mb-1",
                                  },
                                },
                                p: {
                                  component: "p",
                                  props: {
                                    className: "inline", // 👈 important
                                  },
                                },
                                ol: {
                                  component: "ol",
                                  props: {
                                    className: "list-decimal pl-5 mb-1",
                                  },
                                },
                                ul: {
                                  component: "ul",
                                  props: {
                                    className: "list-disc pl-5 mb-1",
                                  },
                                },
                                li: {
                                  component: "li",
                                  props: {
                                    className: "mb-0",
                                  },
                                },
                                // a: {
                                //   component: "a",
                                //   props: {
                                //     className: "text-blue-600 underline",
                                //     target: "_blank",
                                //     rel: "noopener noreferrer",
                                //   },
                                // },
                                a: {
                                  component: ({ children, ...props }: any) => (
                                    <a
                                      {...props}
                                      target={linkBehavior === "sameTab" ? "_self" : "_blank"}
                                      rel={linkBehavior === "sameTab" ? undefined : "noopener noreferrer"}
                                      className="text-blue-600 underline break-words"
                                    >
                                      {children}
                                    </a>
                                  ),
                                },

                              },
                            }}
                          >
                            {msg.text}
                          </Markdown>
                        </div>
                      }
                      {/* {msg.text && <span>{msg.text}</span>} */}
                      {msg.uploaded_documents && (
                        <div className="mt-2">
                          {/\.(jpg|jpeg|png|gif)$/i.test(msg.uploaded_documents) ? (
                            <a
                              href={msg.uploaded_documents}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-200 text-xs"
                            >
                              <img
                                src={msg.uploaded_documents}
                                alt="Uploaded"
                                width={180}
                                height={120}
                                className="rounded-lg border border-zinc-200 dark:border-neutral-700"
                              />
                            </a>
                          ) :
                            /\.(mp3|wav|ogg)$/i.test(msg.uploaded_documents) || msg.uploaded_documents.includes("audio") ? (

                              <audio controls className="mt-1 w-full">
                                <source src={msg.uploaded_documents} />

                              </audio>
                            ) : (
                              <a
                                href={msg.uploaded_documents}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-200"
                              >
                                <div className={`flex gap-2 
                                ${msg.sender === "user"
                                    ? "text-white rounded-br-none relative"
                                    : "bg-gray-200 dark:bg-neutral-600 text-gray-800 dark:text-white rounded-bl-none relative"
                                  }`}> <FileText size={20} />View Document</div>

                              </a>
                            )}
                        </div>
                      )}
                      {/* time stamp */}
                      {msg.sender === "user" && (

                        <span className="text-[10px] opacity-70 whitespace-nowrap self-end">
                          {msg.timestamps?.sent || msg.timestamps?.received || "Just now"}
                        </span>
                      )}
                      {msg.sender === "bot" && msg.timestamps?.received && (
                        <span className="text-[10px] opacity-70 whitespace-nowrap self-end">
                          {msg.timestamps?.sent || msg.timestamps?.received || "Just now"}
                        </span>
                      )}

                    </div>

                  )}
                </div>
                {msg.sender === "user" && (
                  <div className="flex-shrink-0 relative">
                    <div className="hertzora-color hertzora-background  relative flex items-center justify-center rounded-full h-[30px] w-[30px]">
                      <UserRound size="18" className="uIcon text-gray-200" />
                    </div>
                    <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-green-500 border border-white dark:border-neutral-800" />
                  </div>
                )}
              </div>
            ))}

            {showQuickReview && (
              <QuickReview
                onPositive={async () => {
                  setShowQuickReview(false);
                  setShowDownloadPDF(true);
                  setShowSuggestedOnce(false);

                  // save positive review
                  await fetch(`${API_BASE_URL}/saveReview`, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      "x-api-key": apiKey,
                    },
                    body: JSON.stringify({
                      contact_id: guestId,
                      sentiment: "positive",
                      review: "😊 Thank you, that helped",
                    }),
                  });


                  //  endChatSessionByQuickReview("Thankyou for your review... Do you like to start a new chat?");
                }}
                onNegative={() => {
                  setShowQuickReview(false); // continue chat normally
                }}
              />
            )}

            {showQuickAssigneeReview && (
              <QuickEmojiReview
                onSelect={async (sentiment) => {
                  setShowQuickAssigneeReview(false);

                  await saveQuickAssigneeReview(sentiment);
                  setShowDownloadPDF(true);
                  setShowSuggestedOnce(false);

                  // endChatSessionByQuickReview("Thanks for chatting! 😊");
                }}
              />
            )}
            {showDownloadPDF && (
              <>
                <div className="flex justify-end mt-3">
                  <button
                    onClick={() => {
                      downloadChatPDF();
                      setTimeout(() => {
                        endChatSessionByQuickReview("Thanks for chatting!! 😊");
                      }, 500);
                    }}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm w-full"
                  >
                    📄 Download Chat PDF
                  </button>
                </div>
                <div className="flex justify-end mt-3">
                  <button
                    onClick={() => {
                      endChatSessionByQuickReview("You can start your new chat!")
                    }}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm w-full"
                  >
                    💬 Start a new conversation
                  </button>
                </div></>
            )}


            {showSuggestedOnce &&
              suggestedQuestionList &&
              suggestedQuestionList.length > 0 && (
                <SuggestedQuestions
                  questions={suggestedQuestionList}
                  onSelect={handleSuggestionClick}
                />
              )}
          </div>

          <div ref={chatEndRef} />


          {!showDownloadPDF && (
            <div className="flex items-center border-t border-zinc-200 dark:border-neutral-700 p-3 gap-1" >

              <input
                type="file" ref={fileInputRef} className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
              />
              {allowFileUpload && (
                <button
                  onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center h-9 w-9 rounded-full  text-zinc-500 dark:text-zinc-400 btnBorder">
                  <Plus className="w-4 h-4" />
                </button>

              )}
              { /* <input
                type="text"
                value={message}
                // onChange={(e) => setMessage(e.target.value)}
                onChange={(e) => {
                  setMessage(e.target.value);
                  if (showQuickReview) {
                    setShowQuickReview(false);
                  }
                  setLastActivity(Date.now());
                  resetInactivityTimer();
                }}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Ask your question"
                className="flex-1 outline-none rounded-full px-3 py-2 text-sm text-zinc-500 dark:text-zinc-400 btnBorder"

                onFocus={(e) => {
                  e.currentTarget.style.borderColor = borderColor || "#e9e4e6"; // normal mode
                  if (document.body.classList.contains("dark")) {
                    e.currentTarget.style.borderColor = darkBorderColor || "#50484c"; // dark mode
                  }
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "";
                }}
              />*/}
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  if (showQuickReview) {
                    setShowQuickReview(false);
                  }
                  setLastActivity(Date.now());
                  resetInactivityTimer();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                rows={1}
                onInput={(e) => {
                  const el = e.currentTarget;

                  el.style.height = "auto";

                  const maxHeight = 72; // 3 rows
                  const newHeight = Math.min(el.scrollHeight, maxHeight);

                  el.style.height = newHeight + "px";
                  el.style.overflowY = el.scrollHeight > maxHeight ? "auto" : "hidden";
                }}
                placeholder="Type a message..."
                className="flex-1 outline-none rounded-2xl px-3 py-2 text-sm text-zinc-800 dark:text-zinc-400 btnBorder resize-none"
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = borderColor || "#e9e4e6"; // normal mode
                  if (document.body.classList.contains("dark")) {
                    e.currentTarget.style.borderColor = darkBorderColor || "#50484c"; // dark mode
                  }
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "";
                }}
              />


              <style>{`
                .send-button {
                
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  border-radius: 9999px; /* fully rounded */
                  width: 36px;
                  height: 36px;
                  color: white;
                  cursor: pointer;
                }

                .send-button svg {
                  width: 16px;
                  height: 16px;
                }
              `}</style>
              {/* #7e23a8ff */}
              <button onClick={sendMessage} className="send-button hertzora-background">
                <SendHorizontal />
              </button>

            </div>)}

          <div className="font-medium text-center border-b border-zinc-200 dark:border-neutral-700 pb-3 text-xs text-zinc-400 dark:text-zinc-400">
            {botName} may produce inaccurate information
          </div>
          <div className="flex items-center pt-2 justify-center font-medium text-center pb-3 text-sm text-zinc-400 dark:text-zinc-400">
            Powered by{" "}

            <div className="relative group inline-block">

              {/* Trigger */}
              <div className="flex items-center gap-1 hover:text-black dark:hover:text-white cursor-pointer">
                <style>
                  {`
          .gradient-text {
            background: linear-gradient(to right, #7c3aed, #ec4899, #3b82f6);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
        `}
                </style>

                {/* Use the class */}
                <a href="https://app.hostingate.com/">
                  <div className="gradient-text font-bold text-sm">
                    &nbsp;hertzora
                  </div>
                </a>

                <div className="relative w-6 h-6 flex items-center justify-center">
                  {/* Outer curved border */}
                  <div className="absolute inset-0 border border-gray-400 rounded-md opacity-60"></div>

                  <div className="absolute inset-0 border border-gray-400 rounded-md opacity-60"></div>
                  <div className="absolute w-2 h-2 bg-purple-600 rounded-full top-1 left-1 opacity-60"></div>
                  <div className="absolute w-1 h-1 bg-gray-400 rounded-full top-1 right-1 opacity-60"></div>
                  <div className="absolute w-1 h-1 bg-gray-400 rounded-full bottom-1 left-1 opacity-50"></div>
                  <div className="absolute w-2 h-0.5 bg-gray-400 bottom-1.5 right-1 opacity-30"></div>
                  <span className="absolute text-xs text-gray-600 font-bold">
                    AI
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}