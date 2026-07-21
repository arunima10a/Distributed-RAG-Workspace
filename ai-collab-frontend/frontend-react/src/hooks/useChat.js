import { useState, useEffect, useRef } from 'react';

export function useChat(token, room, userId, username) {
    const [messages, setMessages] = useState([]);
    const [privateHistory, setPrivateHistory] = useState([]);
    const [streamingContent, setStreamingContent] = useState("");
    const [privateStreaming, setPrivateStreaming] = useState("");
    const [roomSummary, setRoomSummary] = useState("");
    const [typingUser, setTypingUser] = useState(null);
    const socket = useRef(null);
    const typingTimeoutRef = useRef(null);
    const pendingMessages = useRef(new Set()); // track optimistic messages
    const shouldReconnect = useRef(true);  // ← add this
    const reconnectTimeout = useRef(null);

    

    useEffect(() => {
        if (!token || !room) return;

        if (socket.current) {
            socket.current.close();
            socket.current = null;
        }

        setMessages([]);
        setPrivateHistory([]);
        setStreamingContent("");
        setPrivateStreaming("");
        setRoomSummary("");
        pendingMessages.current.clear();

        let pingInterval = null;

        

        const connectTimeout = setTimeout(() => {
            const ws = new WebSocket(
                 `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}/ws?token=${token}&room=${room.toLowerCase().trim()}`
            );
        socket.current = ws;
           
        pingInterval = setInterval(() => {
            if (socket.current?.readyState === WebSocket.OPEN) {
                socket.current.send(JSON.stringify({ type: "ping" }));
            }
        }, 30000);

        ws.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);

                // --- System messages ---
                if (msg.username === "SYSTEM_TYPING") {
                    if (msg.content?.toLowerCase() !== username?.toLowerCase()) {
                        setTypingUser(msg.content);
                        clearTimeout(typingTimeoutRef.current);
                        typingTimeoutRef.current = setTimeout(() => setTypingUser(null), 2000);
                    }
                    return;
                }

                if (msg.username === "SYSTEM_UPDATE") {
                    setRoomSummary(msg.content);
                    return;
                }

                // --- Private AI streaming ---
                if (msg.is_private || msg.username === "AI_PRIVATE_STREAM") {
                    if (msg.username === "AI_PRIVATE_STREAM") {
                        setPrivateStreaming(prev => prev + msg.content);
                    } else {
                        // Final private AI response
                        setPrivateStreaming("");
                        setPrivateHistory(prev => [...prev, {
                            username: "AI Assistant",
                            content: msg.content
                        }]);
                    }
                    return;
                }

                // --- Public AI streaming ---
                if (msg.username === "AI_STREAM") {
                    setStreamingContent(prev => prev + msg.content);
                    return;
                }

                // --- Final public AI response ---
                if (msg.username === "AI Assistant") {
                    setStreamingContent("");
                    setMessages(prev => [...prev, msg]);
                    return;
                }

                // --- Normal human messages ---
                // Deduplicate against optimistic messages we already added
                const key = `${msg.username}:${msg.content}`;
                if (pendingMessages.current.has(key)) {
                    // Server echo of our own optimistic message — skip it
                    pendingMessages.current.delete(key);
                    return;
                }

                setMessages(prev => [...prev, msg]);

            } catch (e) { console.error("WS parse error", e); }
        };

        ws.onerror = (e) => console.error("WebSocket error:", e);

        ws.onclose = () => console.log(`WS closed for room: ${room}`);
        }, 300);

        return () => {
            clearTimeout(connectTimeout);
            if (pingInterval) clearInterval(pingInterval);
            if (socket.current) {
                socket.current.close();
                socket.current = null;
            }
        };
    }, [token, room]); 

    const sendTyping = () => {
        if (socket.current?.readyState === WebSocket.OPEN) {
            socket.current.send(JSON.stringify({ type: "typing" }));
        }
    };

    const sendMessage = (content, isPrivate = false) => {
        if (!content?.trim()) return;
        if (socket.current?.readyState !== WebSocket.OPEN) return;

        if (isPrivate) {
            // Optimistically add user's message to private history
            setPrivateHistory(prev => [...prev, { username: "Me", content }]);
        } else {
            // Optimistically add to messages and track it so we ignore the echo
            const key = `${username}:${content}`;
            pendingMessages.current.add(key);
            setMessages(prev => [...prev, { username, content, user_id: userId }]);
        }

        socket.current.send(JSON.stringify({
            content,
            is_private: isPrivate,
            room: room.toLowerCase().trim()
        }));
    };

    return {
        messages, privateHistory, streamingContent,
        privateStreaming, roomSummary, typingUser,
        sendMessage, sendTyping
    };
}
