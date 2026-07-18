export const DEFAULT_PENDING_POSTS_PAGE = 0;
export const DEFAULT_PENDING_POSTS_PAGE_SIZE = 20;

export type AdminPostStatus = "PENDING" | "APPROVED" | "REJECTED" | string;

export type AdminPendingPostListItem = {
  id: string;
  createdAt: string | null;
  status: AdminPostStatus;
};

export type AdminPendingPostDetail = {
  id: string;
  title: string;
  description: string;
  coverImageUrl: string | null;
  priceAmount: number | null;
  currency: string | null;
  createdAt: string | null;
  status: AdminPostStatus;
};

export type PendingPostsPage = {
  content: AdminPendingPostListItem[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
};

export type PendingPostsQuery = {
  page: number;
  size: number;
};

export type RejectPendingPostPayload = {
  rejectionReason: string;
};

export type ApiEnvelope<T> = {
  data: T;
  message?: string;
  at?: string;
  status?: string;
};

export type ApiErrorData = {
  message?: string;
  messages?: string[];
};
