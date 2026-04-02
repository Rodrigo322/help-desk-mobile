export type TicketStatus =
  | "NEW"
  | "OPEN"
  | "IN_PROGRESS"
  | "PENDING"
  | "ON_HOLD"
  | "RESOLVED"
  | "CLOSED";

export type TicketPriority = "LOW" | "MEDIUM" | "HIGH";

export type TicketListingScope = "department" | "created" | "assigned";

export type Ticket = {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdByUserId: string;
  createdByUserName?: string;
  originDepartmentId: string;
  targetDepartmentId: string;
  assignedToUserId: string | null;
  closedByUserId: string | null;
  firstResponseAt: string | null;
  resolvedAt: string | null;
  firstResponseDeadlineAt: string | null;
  resolutionDeadlineAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TicketsListMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type ListTicketsResponse = {
  items: Ticket[];
  meta: TicketsListMeta;
};

export type GetTicketDetailsResponse = {
  ticket: Ticket;
};

export type CreateTicketPayload = {
  title: string;
  description: string;
  priority: TicketPriority;
  targetDepartmentId: string;
};

export type CreateTicketResponse = {
  ticket: Ticket;
};

export type AssignTicketToSelfResponse = {
  ticket: Ticket;
};

export type ResolveTicketResponse = {
  ticket: Ticket;
};

export type CloseTicketResponse = {
  ticket: Ticket;
};

export type UpdateTicketPriorityPayload = {
  priority: TicketPriority;
};

export type UpdateTicketPriorityResponse = {
  ticket: Ticket;
};
