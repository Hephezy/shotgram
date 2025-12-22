import { Link } from "react-router-dom";
import { useUserContext } from "@/context/AuthContext";
import PostStats from "./PostStats";
import { IPost } from "@/types";

type GridPostListProps = {
    posts?: IPost[];
    showUser?: boolean;
    showStats?: boolean;
};

const GridPostList = ({
    posts,
    showUser = true,
    showStats = true,
}: GridPostListProps) => {
    const { user } = useUserContext();

    // Helper function to check if URL is a video
    const isVideo = (url: string) => {
        return url?.match(/\.(mp4|webm|ogg)(\?.*)?$/i);
    };

    return (
        <ul className="grid-container">
            {posts?.map((post) => (
                <li key={post.id} className="relative min-w-80 h-80">
                    <Link to={`/posts/${post.id}`} className="grid-post_link">
                        {isVideo(post.imageUrl) ? (
                            <video
                                src={post.imageUrl}
                                className="h-full w-full object-cover"
                                muted
                                preload="metadata"
                            />
                        ) : (
                            <img
                                src={post.imageUrl}
                                alt="post"
                                className="h-full w-full object-cover"
                            />
                        )}
                    </Link>

                    <div className="grid-post_user">
                        {showUser && (
                            <div className="flex items-center justify-start gap-2 flex-1">
                                <img
                                    src={
                                        post.creator.imageUrl ||
                                        "/assets/icons/profile-placeholder.svg"
                                    }
                                    alt="creator"
                                    className="w-8 h-8 rounded-full"
                                />
                                <p className="line-clamp-1">{post.creator.name}</p>
                            </div>
                        )}
                        {showStats && <PostStats post={post} userId={user.id} />}
                    </div>
                </li>
            ))}
        </ul>
    );
};

export default GridPostList;