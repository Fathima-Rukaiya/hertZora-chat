"use client";
import { useState, useEffect, useRef } from "react";
import { Bot, BotMessageSquare, FileText, Frown, Laugh, LockIcon, Meh, Plus, SendHorizontal, Sparkles, UserRound } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

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
}: {
  apiKey: string;
  shadowContainer?: React.RefObject<HTMLDivElement | null>;
  botIcon: string,
  botName: string
  gradient?: string;
  darkGradient?: string;
   borderColor?: string;
   darkBorderColor?: string;
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

  // const resetInactivityTimer = () => {
  //   clearTimeout(inactivityTimer.current);
  //   inactivityTimer.current = null;
  //   inactivityTimer.current = setTimeout(() => {
  //     setShowEndPopup(true);

  //     // Auto-end after 30s
  //     popupTimer.current = setTimeout(() => {
  //       setShowReviewPopup(false);
  //       endChatSession();
  //     }, 10 * 1000);

  //   }, 30 * 1000); // 4 minutes
  // };
  const endChatSession = async () => {
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


    // create new room id
    const newRoom = crypto.randomUUID();
    setRoomName(newRoom);

    sessionStorage.setItem("room", newRoom);

    setIsGuest(true);

    addBotMessage("Your previous chat has ended due to inactivity. How can I assist you now?");
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

  // const getUserCountry = async () => {
  //   try {
  //     const res = await fetch("https://ipapi.co/json/");
  //     const data = await res.json();
  //     return data.country_name || data.country || "Unknown";
  //   } catch (err) {
  //     console.error("Failed to get country:", err);
  //     return "Unknown";
  //   }
  // };

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


  //   const getUserCountry = async () => {
  //   try {
  //     const controller = new AbortController();

  //     // Timeout (optional but safe)
  //     const timeout = setTimeout(() => controller.abort(), 3000);

  //     const res = await fetch("https://ipapi.co/json/", {
  //       signal: controller.signal,
  //     });

  //     clearTimeout(timeout);

  //     if (!res.ok) return "Unknown";

  //     const data = await res.json();

  //     return data?.country_name || data?.country || "Unknown";
  //   } catch (err) {
  //     console.warn("Country fetch failed (safe):", err.message);
  //     return "Unknown"; // <--- Fallback always
  //   }
  // };



  const [country, setCountry] = useState("Unknown");

  useEffect(() => {
    getUserCountry().then((c) => setCountry(c));
  }, []);

  //
  //https://hostingate-client.vercel.app/sign-in https://app.hostingate.com/dashboard/profile
  const API_BASE_URL = "https://app.hostingate.com/api/clientCustomerChatBox";
  //const API_BASE_URL = "https://app.hertzora.ai/api/clientCustomerChatBox";

  // const API_BASE_URL = "http://localhost:3000/api/clientCustomerChatBox";
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
          const data = await res.json();
          setRoomName(data.room_id); // set room from DB
        } else {
          // New guest → create temporary room until they provide info
          const newRoomId = crypto.randomUUID();
          setRoomName(newRoomId);
          setIsGuest(true);
          setSenderId(null); // unknown guest until info provided
        }
        console.log("roomName", roomName, "senderid", senderId)
      } catch (err) {
        console.error("Error setting up room:", err);
      }
    };


    setupRoom();

    //  setupRoom();
  }, []);

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


    // eventSource.onerror = (err) => {
    //   console.error("SSE connection error:", err);
    //   eventSource.close();
    // };
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
        sender_id: senderId,
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
  //C:\Users\User\Desktop\amez\hostie-dashboard\src\app\api\clientCustomerChatBox\aiResponceGenerate
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

  const sendMessage = async () => {
    if (!message.trim()) return;
    resetInactivityTimer();
    const messageText = message.trim();
    setMessage("");

    // Add user's message immediately to UI
    //addUserMessage(messageText);

    //  Guest without info → ask info only

    if (isGuest && !userInfo && !askedForInfo) {
      setLastActivity(Date.now());
      resetInactivityTimer();

      addUserMessage(messageText);
      setAskedForInfo(true);
      // const askMsg = "Before we continue, could you please share your name or email?";
      const askMsg = `👋 Hi! ${botName} here. Before we continue, could you share your name or email? I'd love to personalise the conversation for you.`;
      //addBotMessage(askMsg);
      await saveBotMessage(askMsg, senderId, apiKey,);
      return; // Don't save user message yet
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
          await saveUserMessageWithSender(message, true, savedGuest.id);


          const thankMsg = `Thanks ${savedGuest.name || savedGuest.email}! You can continue chatting now..!`;
          // addBotMessage(thankMsg);
          await saveBotMessage(thankMsg, savedGuest.id, apiKey);


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
    window.addEventListener("hostie-file-selected", handleFile);
    return () => window.removeEventListener("hostie-file-selected", handleFile);
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

  const shadowRoot = document.querySelector("#hostie-chat-root")?.shadowRoot;

  const handleReviewSubmit = async () => {

    // if (!guestId) {
    //   endChatSession();
    //   return;
    // }
    // const contactId = sessionStorage.getItem("guestContactId");
    // const room = sessionStorage.getItem("room");

    // if (!contactId || !room) {
    //   // fallback, end chat if missing
    //   endChatSession();
    //   return;
    // }

    const contactId = sessionStorage.getItem("guestContactId");
    const room = sessionStorage.getItem("room");

    if (!contactId || !room) {
      setShowReviewPopup(false);
      endChatSession();
      return;
    }
    console.log("savedRoom:", room);
    console.log("guestId:", contactId);
    console.log("click 12333");
    if (!contactId) {
      endChatSession();
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
    endChatSession();
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
                // onClick={() => {
                //   clearTimeout(popupTimer.current);
                //   setShowEndPopup(false);
                //   resetInactivityTimer();
                // }}
                onClick={() => {
                  clearTimeout(popupTimer.current);
                  setShowEndPopup(false);
                  resetInactivityTimer();
                }}
              >
                No
              </button>
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
                className="flex-1 bg-pink-600 text-white px-2 py-1 rounded-lg text-sm"
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
   #hostie-chat-box {
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
    background: ${borderColor};
    transition: border-color 0.3s;
  }
  .dark .hertzora-hello-text {
    color: ${darkBorderColor};
    
  }
`}</style>

      {/* 
.hertzora-color {
   color: "#fff" !important;
   background: linear-gradient(to right, #db2777, #db2777, #7e22ce) !important;
}

 .hertzora-color {
   color: "#fff" !important;
  // backgroundImage: "linear-gradient(to right, #db2777, #6b21a8, #6b21a8)" !important;
  
}*/}
      <div className="fixed bottom-6 right-6 z-50" >
        {/* <div className="fixed bottom-6 right-6 z-50 " > */}
        <div
          id="hostie-chat-box"
          className="flex flex-col w-[340px] h-[85vh] rounded-2xl shadow-xl border border-zinc-100 dark:border-neutral-800  overflow-hidden  transition-colors duration-300 bg-white dark:bg-neutral-900"
        >
          {/* Header */}


          <div className="flex items-center justify-between p-3 text-sm font-semibold">
            <div className="flex items-center gap-1">
              {/* <BotMessageSquare className="mr-1.5" />*/}


              {assignedAgent ? (
                <div className="h-6 w-6 rounded-full hertzora-background hertzora-color text-white flex items-center justify-center text-xs font-semibold">
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
                title="Online"
              />
              <span className="mr-2 text-xs text-green-500">Online</span>

            </div>
            <div className="flex gap-1 z-[99999]">
              {/* <Popover >
                <PopoverTrigger>
                  <div  className="flex items-center px-2 py-0.5 rounded-md gap-1 bg-pink-50 dark:bg-pink-800">
                    <LockIcon
                      size="12"
                      className="text-zinc-600 dark:text-zinc-200"
                    />{" "}
                    Premium
                  </div>
                </PopoverTrigger>
                <PopoverContent className="text-xs z-[999999]">
                  Upgrade to premium to customize your chat page logo and colors.
                </PopoverContent>
              </Popover> */}
              {botName !== "HertZora" && (
                <div className="relative">
                  <button
                    onClick={() => setShowPremiumPopup((prev) => !prev)}
                    className="flex items-center px-2 py-0.5 rounded-md gap-1 bg-purple-50 dark:bg-purple-800">
                    <LockIcon
                      size="12"
                      className="text-zinc-600 dark:text-zinc-200"
                    />{" "}
                    Premium
                  </button>

                  {showPremiumPopup && (
                    // <div className="absolute top-full mt-2 left-0 bg-white dark:bg-neutral-800 text-xs p-2 rounded shadow-lg w-64 z-50">

                    //   Upgrade to premium to customize your chat page logo and colors.
                    // </div>
                    <div
                      className="absolute top-full mt-2 left-0 bg-white dark:bg-neutral-800 text-xs p-2 rounded shadow-lg w-64 z-50 whitespace-normal break-words"
                    >
                      Upgrade to premium <br />to customize your <br />chat page logo and colors.
                    </div>

                  )}</div>
              )}
              <div className="hertzora-background hertzora-color flex items-center px-2 py-0.5 rounded-md gap-1 ">
                <Sparkles size="12" className="text-zinc-600 dark:text-zinc-200" />
                {/* <img
                  src={botIcon}
                  alt="Bot"
                  className="w-4 h-4 rounded-full object-cover text-zinc-600 dark:text-zinc-200"
                />  {" "} */}
                AI
              </div>
              <div className="flex items-center px-2 py-0.5 rounded-md">

                <span className=" text-xs font-medium"><button
                  onClick={() => setShowChat(false)}
                  className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-300 dark:hover:text-white"
                >
                  ✕
                </button>
                </span>
              </div>
            </div>
          </div>

          {/* Chat area */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 ">
            {chatHistory.length === 0 && (
              // <div className="mt-10 flex flex-col items-center justify-center text-center">
              //   <Bot strokeWidth={1.75}
              //     size={60}
              //     className="text-pink-600 dark:text-pink-600 mb-2"

              //   />
              //   <div className="text-lg font-bold text-pink-600">
              //     Hello, there...! 👋
              //   </div>
              //   <div className="mt-1 font-semibold text-gray-500 dark:text-gray-400 text-sm">
              //     How can I help you today?
              //   </div>
              // </div>
              <div className="mt-6 flex flex-col items-center justify-center">

                {/* <Bot strokeWidth={1.75}
                size={60}
                className="text-pink-600 dark:text-pink-600 mb-2"

              /> */}
                <img
                  src={botIcon}
                  alt="Bot Icon"

                  className="hertzora-color hertzora-background w-14 h-14 rounded-full object-cover mb-2 p-3 text-white"
                />
                <div  className="flex items-center text-lg justify-center font-bold hertzora-hello-text">
                  Hello,&nbsp;<div>there..!</div>
                  <div className="ml-1 text-[22px]">👋</div>
                </div>
                <div className="mt-2 font-semibold text-gray-500 dark:text-gray-400 text-lg">
                  How can I help you today?
                </div>
                <div className="text-center text-gray-400 text-sm mt-10">
                  Start a conversation...
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
                  // <div className="flex items-end relative">
                  //   <Bot strokeWidth={1.75}
                  //     className="h-[31px] w-[31px] text-pink-600 dark:text-pink-600 border border-pink-600 rounded-full p-1"

                  //   />
                  // </div>
                  <div className="flex items-end relative" >
                    {/* <Bot className="h-[31px] w-[31px] rounded-full text-pink-600 dark:text-pink-600 p-1 border border-pink-600 dark:border-neutral-500" /> */}
                    <img
                      src={botIcon}
                      alt="Bot"

                      className="hertzora-color hertzora-background h-[31px] w-[31px] rounded-full object-cover p-1 border border-pink-600 dark:border-neutral-500 text-white"
                    />
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
                    <div>
                      {msg.text && <span>{msg.text}</span>}

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
                        <span className="ml-1 text-[10px] opacity-70 bottom-1 right-2 whitespace-nowrap">
                          {msg.timestamps?.sent || msg.timestamps?.received || "Just now"}
                        </span>
                      )}
                      {msg.sender === "bot" && msg.timestamps?.received && (
                        <span className="ml-1 text-[10px] opacity-70 bottom-1 right-2 whitespace-nowrap">
                          {msg.timestamps.received}
                        </span>
                      )}

                    </div>






                  )}



                </div>

                {msg.sender === "user" && (
                  // <div className="flex-shrink-0 relative">
                  //   <img
                  //     src="../chat.jpg"
                  //     alt="user"
                  //     className="h-[30px] w-[30px] rounded-full object-cover"
                  //   />
                  // </div>

                  // <div className="flex-shrink-0 relative flex items-center justify-center bg-pink-600  rounded-full h-[30px] w-[30px]">
                  //   <UserRound size="18" className="text-gray-200" />
                  // </div>
                  <div className="flex-shrink-0 relative">
                    {/* <img
                        src="/chat.png"
                        alt="user"
                        height={30}
                        width={30}
                        className="rounded-full object-cover h-[30px] w-[30px]"
                      /> */}
                    <div className="hertzora-color hertzora-background  relative flex items-center justify-center rounded-full h-[30px] w-[30px]">
                      <UserRound size="18" className="uIcon text-gray-200" />
                    </div>
                    <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-green-500 border border-white dark:border-neutral-800" />
                  </div>
                )}
              </div>
            ))}

            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="flex items-center border-t border-zinc-200 dark:border-neutral-700 p-3 gap-1" >

            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center h-9 w-9 rounded-full border border-zinc-200 dark:border-neutral-700 text-zinc-500 dark:text-zinc-400 "
            >
              {/* mr-2 */}
              <Plus className="w-4 h-4" />
            </button>

            <input
              type="text"
              value={message}
              // onChange={(e) => setMessage(e.target.value)}
              onChange={(e) => {
                setMessage(e.target.value);
                setLastActivity(Date.now());
                resetInactivityTimer();
              }}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Ask your question"
              className="flex-1 outline-none border border-zinc-200 dark:border-neutral-700 rounded-full px-3 py-2 text-sm focus:ring-1 focus:ring-pink-600 text-zinc-500 dark:text-zinc-400 dark:bg-neutral-900"
            />
            {/* <button
              onClick={sendMessage}
              className="flex items-center justify-center h-9 w-9 rounded-full bg-gradient-to-r from-pink-600 to-pink-700 text-white ml-2"
            >
              <SendHorizonal className="w-4 h-4" />
            </button> 
             background: "linear-gradient(to right, #7c3aed, #ec4899, #3b82f6)",*/}

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
            {/* #db2777 */}
            <button onClick={sendMessage} style={{ background: gradient }} className="send-button hertzora-background">
              <SendHorizontal />
            </button>

          </div>

          <div className="font-medium text-center border-b border-zinc-200 dark:border-neutral-700 pb-3 text-xs text-zinc-400 dark:text-zinc-400">
            {botName} may produce inaccurate information
          </div>
          <div className="flex items-center pt-2 justify-center font-medium text-center pb-3 text-sm text-zinc-400 dark:text-zinc-400">
            Powered by{" "}

            {/* <BecomepartnerCard/ > */}

            <div className="relative group inline-block">

              {/* Trigger */}
              <div className="flex items-center gap-1 hover:text-black dark:hover:text-white cursor-pointer">
                {/* <div className="text-sm font-bold bg-gradient-to-r from-pink-600 via-pink-400 to-blue-600 bg-clip-text text-transparent">
                  &nbsp;Hostie
                </div> */}

                {/* Inline CSS for this page only */}
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
                <a href="https://app.hertzora.ai/">
                  <div className="gradient-text font-bold text-sm">
                    &nbsp;HertZora
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

              {/* Popover Above */}
              <div
                className="
      absolute left-0 bottom-full mb-2   /* makes it go UP */
      hidden group-hover:block 
      text-xs 
      bg-white dark:bg-neutral-900 
      border border-gray-200 dark:border-neutral-700 
      p-2 rounded-md shadow-md
      z-50
      
    "
              >
                .....
              </div>
            </div>



          </div>
        </div>
      </div>
    </>
  );
}
