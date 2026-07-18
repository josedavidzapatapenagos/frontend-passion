import { useState } from "react";
import { Feed } from "../components/Feed";
import { readSelectedCountry } from "../services/navigationFlow";

export const FeedPage = () => {
  const catalogId = readSelectedCountry();
  const [viewingPostId, setViewingPostId] =
    useState<string | null>(null);

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