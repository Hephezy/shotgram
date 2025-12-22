import { useState } from 'react';
import { useUserContext } from '@/context/AuthContext';
import { useGetUsers } from '@/lib/react-query/queriesAndMutations';
import Loader from '@/components/shared/Loader';
import ChatBox from '@/components/shared/ChatBox';
import { IUser } from '@/types';

const Chat = () => {
  const { user: currentUser } = useUserContext();
  const { data: creators, isLoading } = useGetUsers(20);
  const [selectedUser, setSelectedUser] = useState<IUser | null>(null);

  if (isLoading) return <Loader />;

  return (
    <div className="flex w-full h-[calc(100vh-80px)] bg-dark-1">
      <div className="w-1/3 md:w-1/4 border-r border-dark-4 overflow-y-auto custom-scrollbar hidden md:block">
        <div className="p-5">
          <h2 className="h3-bold text-light-1 mb-4">Messages</h2>
          <div className="flex flex-col gap-4">
            {creators?.documents.filter((u: IUser) => u.id !== currentUser.id).map((creator: IUser) => (
              <div
                key={creator.id}
                onClick={() => setSelectedUser(creator)}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-dark-3 transition-all ${selectedUser?.id === creator.id ? 'bg-dark-3' : ''}`}
              >
                <img
                  src={creator.imageUrl || "/assets/icons/profile-placeholder.svg"}
                  alt="profile"
                  className="w-10 h-10 rounded-full"
                />
                <div className="flex flex-col">
                  <p className="base-medium text-light-1">{creator.name}</p>
                  <p className="small-regular text-light-3">@{creator.username}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side: Chat Box */}
      <div className="flex-1 flex flex-col">
        {selectedUser ? (
          <ChatBox currentUser={currentUser} otherUser={selectedUser} />
        ) : (
          <div className="flex-center flex-col w-full h-full gap-4">
            <img src="/assets/icons/chat.svg" width={100} height={100} className="invert-white opacity-50" />
            <p className="text-light-3 body-medium">Select a user to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;