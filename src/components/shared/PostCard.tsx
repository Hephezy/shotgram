import { useUserContext } from "@/context/AuthContext";
import { formatDateString } from "@/lib/utils";
import { Link } from "react-router-dom";
import PostStats from "./PostStats";
import { IPost } from "@/types";

type PostCardProps = {
  post: IPost;
};

const PostCard = ({ post }: PostCardProps) => {
  const { user } = useUserContext();

  const getOptimizedImageUrl = (url: string, width = 500) => {
    if (url.includes('supabase.co')) {
      return `${url}?width=${width}&resize=contain&quality=80`;
    }
    return url;
  };

  if (!post.creator) return;

  return (
    <div className="post-card">
      <div className="flex-between">
        <div className="flex items-center gap-3">
          <Link to={`/profile/${post.creator.id}`}>
            <img
              src={post?.creator?.imageUrl || '/assets/icons/profile-placeholder.svg'}
              alt="creator"
              className="rounded-full w-12 lg:h-12"
            />
          </Link>
          <div className="flex flex-col">
            <p className="base-medium lg:body-bold text-light-1">
              {post.creator.name}
            </p>
            <div className="flex-center gap-2 text-light-3">
              <p className="subtle-semibold lg:small-regular">
                {formatDateString(post.created_at)}
              </p>
              - <p className="subtle-semibold lg:small-regular">{post.location}</p>
            </div>
          </div>
        </div>

        <Link
          to={`/update-post/${post.id}`}
          className={`${user.id !== post.creator.id && "hidden"} `}
        >
          <img
            src="/assets/icons/edit.svg"
            alt="edit"
            width={20}
            height={20}
          />
        </Link>
      </div>

      <Link to={`/posts/${post.id}`}>
        <div className="small-medium lg:base-medium py-5">
          <p>{post.caption}</p>
          <ul className="flex gap-1 mt-2">
            {post.tags.map((tag: string) => (
              <li key={tag} className="text-light-3">
                #{tag}
              </li>
            ))}
          </ul>
        </div>

        {post.imageUrl?.match(/\.(mp4|webm|ogg)(\?.*)?$/i) ? (
          <div className="w-full h-64 xs:h-[400px] lg:h-[450px] bg-dark-1 rounded-[24px] overflow-hidden">
            <video
              src={post.imageUrl}
              controls
              className="w-full h-full object-cover"
              preload="metadata"
            />
          </div>
        ) : (
          <img
            src={getOptimizedImageUrl(post.imageUrl)}
            className="post-card_img"
            alt="post image"
          />
        )}
      </Link>

      <PostStats post={post} userId={user.id} />
    </div>
  )
}

export default PostCard;