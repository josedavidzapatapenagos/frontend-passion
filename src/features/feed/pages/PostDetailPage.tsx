import { useParams } from "react-router-dom";
import { PostDetailView } from "@/features/feed/components/PostDetail";

export const PostDetailPage = () => {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return (
      <div className="flex items-center justify-center h-screen vp-text-primary">
        Post no encontrado
      </div>
    );
  }

  return <PostDetailView postId={id} />;
};