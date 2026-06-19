import { useParams } from "react-router-dom";
import { PostDetailView } from "../components/PostDetail";

export const PostDetailPage = () => {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return (
      <div className="flex items-center justify-center h-screen text-white">
        Post no encontrado
      </div>
    );
  }

  return <PostDetailView postId={id} />;
};