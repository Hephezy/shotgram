import { useUserContext } from "@/context/AuthContext";
import { useGetUserNotifications } from "@/lib/react-query/queriesAndMutations";
import Loader from "@/components/shared/Loader";
import { multiFormatDateString } from "@/lib/utils";
import { Link } from "react-router-dom";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/config";
import { INotification } from "@/types";

const Notifications = () => {
  const { user } = useUserContext();
  const { data: notifications, isLoading } = useGetUserNotifications(user.id);
  const queryClient = useQueryClient();

  // Realtime listener for new notifications
  useEffect(() => {
    const channel = supabase
      .channel('realtime-notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `recipient_id=eq.${user.id}`
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['getNotifications', user.id] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); }
  }, [user.id, queryClient]);

  return (
    <div className="common-container">
      <div className="user-container">
        <h2 className="h3-bold md:h2-bold text-left w-full">Notifications</h2>

        {isLoading ? (
          <Loader />
        ) : (
          <ul className="flex flex-col gap-4 w-full max-w-5xl">
            {notifications?.map((item: INotification) => (
              <li key={item.id} className="flex items-center gap-4 bg-dark-2 p-4 rounded-xl border border-dark-4">
                <Link to={`/profile/${item.sender.id}`}>
                  <img
                    src={item.sender.imageUrl || "/assets/icons/profile-placeholder.svg"}
                    alt="user"
                    className="w-10 h-10 rounded-full"
                  />
                </Link>

                <div className="flex-1">
                  <span className="base-medium text-light-1">{item.sender.username}</span>
                  <span className="text-light-3 ml-1">
                    {item.type === 'like' && 'liked your post'}
                    {item.type === 'comment' && 'commented on your post'}
                    {item.type === 'follow' && 'started following you'}
                  </span>
                  <p className="text-tiny-medium text-light-4 mt-1">{multiFormatDateString(item.created_at)}</p>
                </div>

                {item.post && (
                  <Link to={`/posts/${item.post_id}`}>
                    <img src={item.post.imageUrl} alt="post" className="w-10 h-10 rounded object-cover" />
                  </Link>
                )}
              </li>
            ))}
            {notifications?.length === 0 && <p className="text-light-4">No notifications yet</p>}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Notifications;