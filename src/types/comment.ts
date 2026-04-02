export type TicketComment = {
  id: string;
  content: string;
  isInternal: boolean;
  ticketId: string;
  userId: string;
  author: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
};

export type ListTicketCommentsResponse = {
  comments: TicketComment[];
};

export type CreateTicketCommentPayload = {
  content: string;
  isInternal?: boolean;
};

export type CreateTicketCommentResponse = {
  comment: TicketComment;
};
