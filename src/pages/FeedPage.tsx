import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Feed } from "../components/Feed";

export const FeedPage = () => {
  const navigate = useNavigate();

  const [catalogId, setCatalogId] = useState<string | null>(null);
  const [viewingPostId, setViewingPostId] =
    useState<string | null>(null);

  useEffect(() => {
    const savedCatalog =
      localStorage.getItem("catalogId");

    const isAdult =
      localStorage.getItem("isAdult");

    if (!savedCatalog) {
      navigate("/");
      return;
    }

    if (isAdult !== "true") {
      navigate("/age-verification");
      return;
    }

    setCatalogId(savedCatalog);
  }, [navigate]);

  const handlePostClick = (id: string) => {
    setViewingPostId((prev) =>
      prev === id ? null : id
    );
  };

  if (!catalogId) {
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Feed
        catalogId={catalogId}
        viewingPostId={viewingPostId}
        onPostClick={handlePostClick}
      />
    </div>
  );
};