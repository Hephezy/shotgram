import { useParams, Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { multiFormatDateString } from "@/lib/utils";
import { useUserContext } from "@/context/AuthContext";
import {
  useDeletePost,
  useGetPostById,
  useGetUserPosts,
  useGetComments,
  useCreateComment
} from "@/lib/react-query/queriesAndMutations";
import { Button } from "@/components/ui/button";
import Loader from "@/components/shared/Loader";
import PostStats from "@/components/shared/PostStats";
import GridPostList from "@/components/shared/GridPostList";
import { Input } from "@/components/ui/input";

type Comment = {
  id: string;
  content: string;
  creator: {
    id: string;
    username: string;
    imageUrl: string;
  };
};

const PostDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useUserContext();
  const [commentText, setCommentText] = useState("");

  const { data: post, isLoading } = useGetPostById(id || '');
  const { data: userPosts, isLoading: isUserPostLoading } = useGetUserPosts(post?.creator.$id);
  const { mutate: deletePost } = useDeletePost();

  const { data: comments, isLoading: isCommentsLoading } = useGetComments(id || '');
  const { mutate: addComment, isPending: isCreatingComment } = useCreateComment();

  const relatedPosts = userPosts?.documents.filter(
    (userPost) => userPost.id !== id
  );

  const handleDeletePost = () => {
    deletePost({ postId: id || '', imageId: post?.imageId || '' });
    navigate(-1);
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (commentText.trim() && id) {
      addComment({ postId: id, userId: user.id, content: commentText });
      setCommentText("");
    }
  }

  return (
    <div className="post_details-container">
      <div className="hidden md:flex max-w-5xl w-full">
        <Button
          onClick={() => navigate(-1)}
          variant="ghost"
          className="shad-button_ghost">
          <img src={"/assets/icons/back.svg"} alt="back" width={24} height={24} />
          <p className="small-medium lg:base-medium">Back</p>
        </Button>
      </div>

      {isLoading || !post ? (
        <Loader />
      ) : (
        <div className="post_details-card">
          {post?.imageUrl?.match(/\.(mp4|webm|ogg)(\?.*)?$/i) ? (
            <video src={post.imageUrl} controls className="post_details-img" />
          ) : (
            <img src={post?.imageUrl} alt="post" className="post_details-img" />
          )}

          <div className="post_details-info">
            <div className="flex-between w-full">
              <Link to={`/profile/${post?.creator.$id}`} className="flex items-center gap-3">
                <img
                  src={post?.creator.imageUrl || "/assets/icons/profile-placeholder.svg"}
                  alt="creator"
                  className="w-8 h-8 lg:w-12 lg:h-12 rounded-full"
                />
                <div className="flex gap-1 flex-col">
                  <p className="base-medium lg:body-bold text-light-1">{post?.creator.name}</p>
                  <div className="flex-center gap-2 text-light-3">
                    <p className="subtle-semibold lg:small-regular ">{multiFormatDateString(post?.$createdAt)}</p>
                    •
                    <p className="subtle-semibold lg:small-regular">{post?.location}</p>
                  </div>
                </div>
              </Link>

              <div className="flex-center gap-4">
                <Link to={`/update-post/${post?.$id}`} className={`${user.id !== post?.creator.$id && "hidden"}`}>
                  <img src={"/assets/icons/edit.svg"} alt="edit" width={24} height={24} />
                </Link>

                <Button
                  onClick={handleDeletePost}
                  variant="ghost"
                  className={`post_details-delete_btn ${user.id !== post?.creator.$id && "hidden"}`}>
                  <img src={"/assets/icons/delete.svg"} alt="delete" width={24} height={24} />
                </Button>
              </div>
            </div>

            <hr className="border w-full border-dark-4/80" />

            <div className="flex flex-col flex-1 w-full small-medium lg:base-regular">
              <p>{post?.caption}</p>
              <ul className="flex gap-1 mt-2">
                {post?.tags.map((tag: string, index: number) => (
                  <li key={`${tag}${index}`} className="text-light-3 small-regular">#{tag}</li>
                ))}
              </ul>
            </div>

            <div className="w-full flex flex-col gap-4 max-h-64 overflow-y-scroll custom-scrollbar py-4 border-t border-dark-4/50">
              <h3 className="body-bold text-light-1">Comments</h3>
              {isCommentsLoading ? <Loader /> : comments?.map((comment: Comment) => (
                <div key={comment.id} className="flex gap-3 items-start">
                  <Link to={`/profile/${comment.creator.id}`}>
                    <img src={comment.creator.imageUrl || '/assets/icons/profile-placeholder.svg'}
                      className="w-8 h-8 rounded-full" alt="user" />
                  </Link>
                  <div className="flex flex-col">
                    <p className="text-light-1 small-semibold">{comment.creator.username}</p>
                    <p className="text-light-3 small-regular">{comment.content}</p>
                  </div>
                </div>
              ))}
              {comments?.length === 0 && <p className="text-light-4 small-regular">No comments yet.</p>}
            </div>

            <form onSubmit={handleCommentSubmit} className="w-full flex gap-3 items-center">
              <Input
                type="text"
                placeholder="Write a comment..."
                className="shad-input flex-1"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />
              <Button type="submit" className="shad-button_primary" disabled={isCreatingComment}>
                {isCreatingComment ? 'Sending...' : 'Post'}
              </Button>
            </form>

            <div className="w-full">
              <PostStats post={post} userId={user.id} />
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-5xl">
        <hr className="border w-full border-dark-4/80" />
        <h3 className="body-bold md:h3-bold w-full my-10">More Related Posts</h3>
        {isUserPostLoading || !relatedPosts ? (
          <Loader />
        ) : (
          <GridPostList posts={relatedPosts} />
        )}
      </div>
    </div>
  );
};

export default PostDetails;