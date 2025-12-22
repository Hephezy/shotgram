import Loader from "@/components/shared/Loader";
import PostCard from "@/components/shared/PostCard";
import RightSidebar from "@/components/shared/RightSidebar";
import { useToast } from "@/components/ui/use-toast";
import { useGetRecentPosts } from "@/lib/react-query/queriesAndMutations";
import { IPost } from "@/types";
import { useEffect } from "react";

const Home = () => {
  const { data: posts, isPending: isPostLoading, isError: isPostsError } = useGetRecentPosts();
  const { toast } = useToast();

  useEffect(() => {
    if (isPostsError) {
      toast({ title: "Something went wrong." });
    }
  }, [isPostsError, toast]);

  return (
    <div className="flex flex-1">
      <div className="home-container">
        <div className="home-posts">
          <h2 className="h3-bold md:h2-bold text-left w-full">Home Feed</h2>
          {isPostLoading && !posts ? (
            <Loader />
          ) : (
            <ul className="flex flex-col flex-1 gap-9 w-full ">
              {posts?.documents.map((post: IPost) => (
                <li key={post.id} className="flex justify-center w-full">
                  <PostCard post={post} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <RightSidebar />
    </div>
  );
};

export default Home;