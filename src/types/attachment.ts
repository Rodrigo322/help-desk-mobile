export type Attachment = {
  id: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  ticketId: string;
  createdAt: string;
  updatedAt: string;
};

export type ListTicketAttachmentsResponse = {
  attachments: Attachment[];
};

export type UploadAttachmentResponse = {
  attachment: Attachment;
};

export type UploadableFile = {
  uri: string;
  name: string;
  mimeType: string;
};
