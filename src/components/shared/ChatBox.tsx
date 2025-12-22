import { useState, useEffect, useRef } from 'react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { supabase } from '@/lib/supabase/config';
import { useGetChatHistory, useSendMessage } from '@/lib/react-query/queriesAndMutations';
import Loader from './Loader';
import { multiFormatDateString } from '@/lib/utils';
import { IMessage, IUser } from '@/types';

type ChatBoxProps = {
  currentUser: IUser;
  otherUser: IUser;
}

const ChatBox = ({ currentUser, otherUser }: ChatBoxProps) => {
  const [newMessage, setNewMessage] = useState("");
  const [realtimeMessages, setRealtimeMessages] = useState<IMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: history, isLoading } = useGetChatHistory(currentUser.id, otherUser.id);
  const { mutate: sendMessage } = useSendMessage();

  // Scroll to bottom on new message
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [realtimeMessages, history]);

  // Realtime Subscription
  useEffect(() => {
    // Reset realtime buffer when user changes
    setRealtimeMessages([]);

    const channel = supabase
      .channel('room1')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const msg = payload.new as IMessage;

          // Only add if it belongs to this conversation
          if (
            (msg.sender_id === currentUser.id && msg.receiver_id === otherUser.id) ||
            (msg.sender_id === otherUser.id && msg.receiver_id === currentUser.id)
          ) {
            setRealtimeMessages((prev) => [...prev, msg]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser.id, otherUser.id]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    sendMessage({
      senderId: currentUser.id,
      receiverId: otherUser.id,
      content: newMessage
    });
    setNewMessage("");
  };

  // Merge history and realtime messages
  const allMessages = [...((history as IMessage[]) || []), ...realtimeMessages];

  // De-duplicate just in case history re-fetch catches realtime ones
  const uniqueMessages = allMessages.filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i);

  return (
    <div className="flex flex-col h-full w-full relative">
      {/* Header */}
      <div className="p-4 bg-dark-2 border-b border-dark-4 flex items-center gap-3">
        <img
          src={otherUser.imageUrl || "/assets/icons/profile-placeholder.svg"}
          alt="user"
          className="w-10 h-10 rounded-full"
        />
        <p className="h3-bold text-light-1">{otherUser.name}</p>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-3">
        {isLoading ? <Loader /> : uniqueMessages.map((msg) => {
          const isMyMessage = msg.sender_id === currentUser.id;
          return (
            <div key={msg.id} className={`flex w-full ${isMyMessage ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] p-3 rounded-lg ${isMyMessage ? 'bg-primary-500 text-white rounded-br-none' : 'bg-dark-3 text-light-1 rounded-bl-none'}`}>
                <p className="base-medium">{msg.content}</p>
                <p className="text-[10px] opacity-50 mt-1 text-right">{multiFormatDateString(msg.created_at)}</p>
              </div>
            </div>
          )
        })}
        <div ref={scrollRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} className="p-4 bg-dark-2 border-t border-dark-4 flex gap-3">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="shad-input flex-1"
        />
        <Button type="submit" className="shad-button_primary">
          Send
        </Button>
      </form>
    </div>
  )
}

export default ChatBox;