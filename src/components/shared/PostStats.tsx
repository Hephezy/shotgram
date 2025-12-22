import { useDeleteSavedPosts, useLikePosts, useSavePosts } from "@/lib/react-query/queriesAndMutations";
import { checkIsLiked } from "@/lib/utils";
import Loader from "@/components/shared/Loader";
import React, { useState, useEffect } from "react";
import { IPost } from "@/types";

type PostStatsProps = {
    post: IPost;
    userId: string;
}

const PostStats = ({ post, userId }: PostStatsProps) => {
    const likesList = post.likes;

    const [likes, setLikes] = useState<string[]>(likesList);
    const [isSaved, setIsSaved] = useState(false);

    const { mutate: likePost } = useLikePosts();
    const { mutate: savePost, isPending: isSavingPost } = useSavePosts();
    const { mutate: deleteSavedPost, isPending: isDeletingSaved } = useDeleteSavedPosts();

    const savedPostRecord = post.save.find((record) => record.userId === userId);

    useEffect(() => {
        setIsSaved(!!savedPostRecord);
    }, [userId, savedPostRecord]);

    const handleLikePost = (e: React.MouseEvent) => {
        e.stopPropagation();

        let newLikes = [...likes];
        const hasLiked = newLikes.includes(userId);

        if (hasLiked) {
            newLikes = newLikes.filter((id) => id !== userId);
        } else {
            newLikes.push(userId);
        }

        setLikes(newLikes);
        likePost({ postId: post.id, likesArray: newLikes });
    };

    const handleSavePost = (e: React.MouseEvent) => {
        e.stopPropagation();

        if (savedPostRecord) {
            setIsSaved(false);
            deleteSavedPost(savedPostRecord.id);
        } else {
            savePost({ postId: post.id, userId });
            setIsSaved(true);
        }
    };

    return (
        <div className="flex justify-between items-center z-20">
            <div className="flex gap-2 mr-5">
                <img
                    src={checkIsLiked(likes, userId) ? "/assets/icons/liked.svg" : "/assets/icons/like.svg"}
                    alt="like"
                    width={20}
                    height={20}
                    onClick={handleLikePost}
                    className="cursor-pointer"
                />
                <p className="small-medium lg:base-medium">{likes.length}</p>
            </div>

            <div className="flex gap-2">
                {isSavingPost || isDeletingSaved
                    ? <Loader />
                    : <img
                        src={isSaved ? "/assets/icons/saved.svg" : "/assets/icons/save.svg"}
                        alt="save"
                        width={20}
                        height={20}
                        onClick={handleSavePost}
                        className="cursor-pointer"
                    />}
            </div>
        </div>
    )
}

export default PostStats;