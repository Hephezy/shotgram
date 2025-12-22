import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/config";
import { getChatHistory } from "@/lib/supabase/api";
import { IMessage } from "@/types";

export const useChat = (currentUserId: string, receiverId: string) => {
  const [messages, setMessages] = useState<IMessage[]>([]);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!currentUserId || !receiverId) return;

      const history = await getChatHistory(currentUserId, receiverId);
      if (history) {
        setMessages(history as IMessage[]);
      }
    };

    fetchHistory();

    // Subscribe to new messages
    const channel = supabase
      .channel("chat_room")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${currentUserId}`, // Listen for messages sent TO me
        },
        (payload) => {
          // Check if the new message belongs to the current active conversation
          const newMessage = payload.new as IMessage;
          if (newMessage.sender_id === receiverId) {
            setMessages((prev) => [...prev, newMessage]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, receiverId]);

  return { messages, setMessages };
};
