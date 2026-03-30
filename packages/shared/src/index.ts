// Tipos compartidos entre apps

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

export interface WhatsAppIncomingMessage {
  phoneNumber: string;
  messageText: string;
  whatsappMessageId: string;
  timestamp: number;
}

export interface BriefData {
  userId: string;
  date: Date;
  topPriorities: string[];
  topTask?: string;
  content: string;
}
