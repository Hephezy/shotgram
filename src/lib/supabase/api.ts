import { INewPost, INewUser, IUpdatePost, IUpdateUser } from "@/types";
import { supabase } from "./config";

// Define specific type for the DB Post structure to avoid 'any'
type DBPost = {
  id: string;
  created_at: string;
  image_url: string;
  image_id: string;
  caption: string;
  location: string;
  tags: string[];
  creator: {
    id: string;
    image_url: string;
    name: string;
    username: string;
    email: string;
    bio: string;
  };
  likes: { user_id: string }[];
  saves: { id: string; post_id: string; user_id: string }[];
};

const formatPost = (post: DBPost) => ({
  ...post,
  $id: post.id,
  $createdAt: post.created_at,
  imageUrl: post.image_url,
  imageId: post.image_id,
  creator: {
    ...post.creator,
    $id: post.creator?.id,
    imageUrl: post.creator?.image_url,
  },
  likes: post.likes.map((like) => like.user_id),
  save: post.saves.map((save) => ({
    id: save.id,
    userId: save.user_id,
  })),
});

// ================== AUTHENTICATION ==================
export async function createUserAccount(user: INewUser) {
  try {
    const emailRedirectTo =
      import.meta.env.VITE_AUTH_REDIRECT_URL ||
      (typeof window !== "undefined" ? `${window.location.origin}/` : undefined);

    const { data: newAccount, error } = await supabase.auth.signUp({
      email: user.email,
      password: user.password,
      options: {
        ...(emailRedirectTo ? { emailRedirectTo } : {}),
        data: {
          name: user.name,
          username: user.username,
        },
      },
    });

    if (error) throw error;

    return newAccount.user;
  } catch (error) {
    console.log(error);
    return error;
  }
}

export async function signInAccount(user: { email: string; password: string }) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: user.password,
    });
    if (error) throw error;
    return data.session;
  } catch (error) {
    console.log(error);
  }
}

export async function signOutAccount() {
  await supabase.auth.signOut();
}

export async function getCurrentUser() {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return null;

    // FIX: Added !posts_creator_id_fkey to nested queries
    const { data, error } = await supabase
      .from("profiles")
      .select(
        `
        *,
        saves:saves(
            post:posts(
                *,
                creator:profiles!posts_creator_id_fkey(*),
                likes(user_id),
                saves(id, user_id)
            )
        ),
        liked:likes(
            post:posts(
                *,
                creator:profiles!posts_creator_id_fkey(*),
                likes(user_id),
                saves(id, user_id)
            )
        )
      `
      )
      .eq("id", session.user.id)
      .single();

    if (error) throw error;

    const formattedUser = {
      ...data,
      imageUrl: data.image_url,
      save: data.saves.map((record: { post: DBPost }) => ({
        post: formatPost(record.post),
      })),
      liked: data.liked.map((record: { post: DBPost }) =>
        formatPost(record.post)
      ),
    };

    return formattedUser;
  } catch (error) {
    console.log(error);
    return null;
  }
}

// ================== USERS ==================
export async function getUserById(userId: string) {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "*, posts:posts!posts_creator_id_fkey(*, creator:profiles!posts_creator_id_fkey(*), likes(user_id), saves(id, user_id))"
      )
      .eq("id", userId)
      .single();

    if (error) throw error;

    const posts = (data.posts as unknown as DBPost[])
      .map((post) => ({
        ...post,
        $id: post.id,
        $createdAt: post.created_at,
        imageUrl: post.image_url,
        imageId: post.image_id,
        creator: {
          ...post.creator,
          imageUrl: post.creator.image_url,
        },
        likes: post.likes.map((like) => like.user_id),
        save: post.saves.map((save) => ({ id: save.id, userId: save.user_id })),
      }))
      .sort(
        (a, b) =>
          new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime()
      );

    return { ...data, imageUrl: data.image_url, posts };
  } catch (error) {
    console.log(error);
    // FIX: Return null instead of undefined
    return null;
  }
}

export async function getUser(limit?: number) {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .limit(limit || 100)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const documents = data.map((user) => ({
      ...user,
      imageUrl: user.image_url,
      $id: user.id,
    }));

    return { documents };
  } catch (error) {
    console.log(error);
    return { documents: [] };
  }
}

export async function updateUser(user: IUpdateUser) {
  try {
    let imageUrl = user.imageUrl;

    if (user.file.length > 0) {
      const uploadPath = `profiles/${user.userId}-${Date.now()}`;
      const { error: uploadError } = await supabase.storage
        .from("media")
        .upload(uploadPath, user.file[0]);

      if (uploadError) throw uploadError;
      imageUrl = supabase.storage.from("media").getPublicUrl(uploadPath)
        .data.publicUrl;
    }

    const { data, error } = await supabase
      .from("profiles")
      .update({
        name: user.name,
        bio: user.bio,
        image_url: imageUrl,
      })
      .eq("id", user.userId)
      .select()
      .single();

    if (error) throw error;
    return { ...data, imageUrl: data.image_url };
  } catch (error) {
    console.log(error);
  }
}

// ================== POSTS ==================
export async function createPost(post: INewPost) {
  try {
    const uploadPath = `posts/${Date.now()}-${post.file[0].name}`;
    const { error: uploadError } = await supabase.storage
      .from("media")
      .upload(uploadPath, post.file[0]);
    if (uploadError) throw uploadError;

    const fileUrl = supabase.storage.from("media").getPublicUrl(uploadPath)
      .data.publicUrl;

    const tags = post.tags?.replace(/ /g, "").split(",") || [];
    const { data: newPost, error: insertError } = await supabase
      .from("posts")
      .insert([
        {
          creator_id: post.userId,
          caption: post.caption,
          image_url: fileUrl,
          image_id: uploadPath,
          location: post.location,
          tags: tags,
        },
      ])
      .select()
      .single();

    if (insertError) throw insertError;
    return newPost;
  } catch (error) {
    console.log(error);
  }
}

export async function getRecentPosts() {
  try {
    const { data: posts, error } = await supabase
      .from("posts")
      .select(
        // FIX: Added !posts_creator_id_fkey
        `*, creator:profiles!posts_creator_id_fkey(*), likes(user_id), saves(id, post_id, user_id)`
      )
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) throw error;

    const documents = (posts as unknown as DBPost[]).map(formatPost);
    return { documents };
  } catch (error) {
    console.log(error);
  }
}

export async function getPostId(postId: string) {
  try {
    const { data, error } = await supabase
      .from("posts")
      .select(
        // FIX: Added !posts_creator_id_fkey
        `*, creator:profiles!posts_creator_id_fkey(*), likes(user_id), saves(id, post_id, user_id)`
      )
      .eq("id", postId)
      .single();

    if (error) throw error;
    return formatPost(data as unknown as DBPost);
  } catch (error) {
    console.log(error);
  }
}

export async function getUserPosts(userId?: string) {
  if (!userId) return;
  try {
    const { data, error } = await supabase
      .from("posts")
      .select(
        // FIX: Added !posts_creator_id_fkey
        `*, creator:profiles!posts_creator_id_fkey(*), likes(user_id), saves(id, post_id, user_id)`
      )
      .eq("creator_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { documents: (data as unknown as DBPost[]).map(formatPost) };
  } catch (error) {
    console.log(error);
  }
}

export async function getInfinitePosts({ pageParam }: { pageParam: number }) {
  const limit = 9;
  const from = pageParam * limit;
  const to = from + limit - 1;

  try {
    const { data, error } = await supabase
      .from("posts")
      .select(
        // FIX: Added !posts_creator_id_fkey
        `*, creator:profiles!posts_creator_id_fkey(*), likes(user_id), saves(id, post_id, user_id)`
      )
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw error;
    return { documents: (data as unknown as DBPost[]).map(formatPost) };
  } catch (error) {
    console.log(error);
  }
}

export async function searchPosts(searchTerm: string) {
  try {
    const { data, error } = await supabase
      .from("posts")
      .select(
        // FIX: Added !posts_creator_id_fkey
        `*, creator:profiles!posts_creator_id_fkey(*), likes(user_id), saves(id, post_id, user_id)`
      )
      .textSearch("fts", searchTerm, {
        type: "websearch",
        config: "english",
      });

    if (error) throw error;
    return { documents: (data as unknown as DBPost[]).map(formatPost) };
  } catch (error) {
    console.log(error);
    return { documents: [] };
  }
}

export async function likePost(postId: string, likesArray: string[]) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw Error;

    // likesArray is the NEW desired state after toggle
    // If user.id is IN the array, user wants to LIKE (insert)
    // If user.id is NOT in the array, user wants to UNLIKE (delete)
    const wantsToLike = likesArray.includes(user.id);

    if (wantsToLike) {
      // User wants to like - insert
      const { error } = await supabase
        .from("likes")
        .insert([{ post_id: postId, user_id: user.id }]);

      if (error) throw error;

      const { data: post } = await supabase
        .from("posts")
        .select("creator_id")
        .eq("id", postId)
        .single();
      if (post) {
        await createNotification("like", user.id, post.creator_id, postId);
      }
    } else {
      // User wants to unlike - delete
      const { error } = await supabase
        .from("likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", user.id);

      if (error) throw error;
    }

    return { $id: postId };
  } catch (error) {
    console.log(error);
  }
}

export async function savePost(postId: string, userId: string) {
  try {
    const { data, error } = await supabase
      .from("saves")
      .insert([{ post_id: postId, user_id: userId }])
      .select()
      .single();

    if (error) throw error;
    return { ...data, $id: data.id };
  } catch (error) {
    console.log(error);
  }
}

export async function deleteSavedPost(savedRecordId: string) {
  try {
    const { error } = await supabase
      .from("saves")
      .delete()
      .eq("id", savedRecordId);
    if (error) throw error;
    return { status: "ok" };
  } catch (error) {
    console.log(error);
  }
}

export async function updatePost(post: IUpdatePost) {
  try {
    let image: { imageUrl: string | URL; imageId: string } = {
      imageUrl: post.imageUrl,
      imageId: post.imageId,
    };

    if (post.file.length > 0) {
      const uploadPath = `posts/${Date.now()}-${post.file[0].name}`;
      await supabase.storage.from("media").upload(uploadPath, post.file[0]);
      const fileUrl = supabase.storage.from("media").getPublicUrl(uploadPath)
        .data.publicUrl;

      image = { imageUrl: fileUrl, imageId: uploadPath };
    }

    const tags = post.tags?.replace(/ /g, "").split(",") || [];
    const { data, error } = await supabase
      .from("posts")
      .update({
        caption: post.caption,
        image_url: image.imageUrl,
        image_id: image.imageId,
        location: post.location,
        tags: tags,
      })
      .eq("id", post.postId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.log(error);
  }
}

export async function deletePost(postId: string, imageId: string) {
  try {
    if (imageId) {
      await supabase.storage.from("media").remove([imageId]);
    }

    await supabase.from("posts").delete().eq("id", postId);
    return { status: "ok" };
  } catch (error) {
    console.log(error);
  }
}

// ================== COMMENTS & CHAT ==================
export async function getComments(postId: string) {
  const { data, error } = await supabase
    .from("comments")
    // FIX: Added !comments_user_id_fkey just in case, usually implied but safe to specify if ambiguous
    .select("*, creator:profiles!comments_user_id_fkey(*)")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data.map((comment) => ({
    ...comment,
    creator: {
      ...comment.creator,
      imageUrl: comment.creator.image_url,
      id: comment.creator.id,
    },
  }));
}

export async function createComment(comment: {
  postId: string;
  userId: string;
  content: string;
}) {
  const { data, error } = await supabase
    .from("comments")
    .insert([
      {
        post_id: comment.postId,
        user_id: comment.userId,
        content: comment.content,
      },
    ])
    .select("*, creator:profiles!comments_user_id_fkey(*)")
    .single();

  if (error) throw error;

  const { data: post } = await supabase
    .from("posts")
    .select("creator_id")
    .eq("id", comment.postId)
    .single();
  if (post) {
    await createNotification(
      "comment",
      comment.userId,
      post.creator_id,
      comment.postId
    );
  }

  return {
    ...data,
    creator: { ...data.creator, imageUrl: data.creator.image_url },
  };
}

export async function getChatHistory(
  currentUserId: string,
  otherUserId: string
) {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .or(
      `and(sender_id.eq.${currentUserId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUserId})`
    )
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data;
}

export async function sendMessage(message: {
  senderId: string;
  receiverId: string;
  content: string;
}) {
  const { data, error } = await supabase
    .from("messages")
    .insert([
      {
        sender_id: message.senderId,
        receiver_id: message.receiverId,
        content: message.content,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getUserNotifications(userId: string) {
  const { data, error } = await supabase
    .from("notifications")
    .select(
      `
      *,
      sender:profiles!notifications_sender_id_fkey(*),
      post:posts(image_url)
    `
    )
    .eq("recipient_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data.map((n) => ({
    ...n,
    sender: { ...n.sender, imageUrl: n.sender.image_url },
    post: n.post ? { imageUrl: n.post.image_url } : null,
  }));
}

async function createNotification(
  type: "like" | "comment" | "follow",
  senderId: string,
  recipientId: string,
  postId?: string
) {
  if (senderId === recipientId) return;

  await supabase.from("notifications").insert([
    {
      type,
      sender_id: senderId,
      recipient_id: recipientId,
      post_id: postId,
      is_read: false,
    },
  ]);
}

// ================== FOLLOW SYSTEM ==================
export async function followUser(followingId: string) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Can't follow yourself
    if (user.id === followingId) throw new Error("Cannot follow yourself");

    const { error } = await supabase
      .from("follows")
      .insert([{ follower_id: user.id, following_id: followingId }]);

    if (error) throw error;

    // Create notification
    await createNotification("follow", user.id, followingId);

    return { success: true };
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function unfollowUser(followingId: string) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { error } = await supabase
      .from("follows")
      .delete()
      .eq("follower_id", user.id)
      .eq("following_id", followingId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function getFollowStatus(targetUserId: string) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { isFollowing: false };

    const { data, error } = await supabase
      .from("follows")
      .select("id")
      .eq("follower_id", user.id)
      .eq("following_id", targetUserId)
      .maybeSingle();

    if (error) throw error;
    return { isFollowing: !!data };
  } catch (error) {
    console.log(error);
    return { isFollowing: false };
  }
}

export async function getFollowCounts(userId: string) {
  try {
    // Get followers count
    const { count: followersCount, error: followersError } = await supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", userId);

    if (followersError) throw followersError;

    // Get following count
    const { count: followingCount, error: followingError } = await supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", userId);

    if (followingError) throw followingError;

    return {
      followers: followersCount || 0,
      following: followingCount || 0,
    };
  } catch (error) {
    console.log(error);
    return { followers: 0, following: 0 };
  }
}
