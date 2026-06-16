import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { STORED_KEYS } from '../../constants/Stored_keys';

export interface CreateAiConversationResponse {
  conversation_id: string;
}

export interface ChatRequest {
  text: string;
  limit: number;
  conversation_id: string;
}

export interface ChatSource {
  document_name?: string;
  file_name?: string;
  page?: number;
  text?: string;
  score?: number;
}

export interface ChatResponse {
  signal: string;
  message: string;
  answer: string;
  sources?: ChatSource[];
}

export interface RetrievedHistoryItem {
  role: 'user' | 'assistant';
  content: string;
}

export interface RetrievedConversationResponse {
  conversation_id: string;
  history: RetrievedHistoryItem[];
  created_at?: string;
  updated_at?: string;
}

export interface SavedConversationResponse {
  conversationId?: string;
  conversation_id?: string;
  id?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ChatbotService {
  private readonly http = inject(HttpClient);

  private readonly aiBaseUrl = 'http://32.195.230.191:5000/api/v1/nlp';
  private readonly backendChatUrl = `${STORED_KEYS.baseUrl}/chat/conversations`;

  createAiConversation(): Observable<CreateAiConversationResponse> {
    return this.http.post<CreateAiConversationResponse>(
      `${this.aiBaseUrl}/conversation`,
      {}
    );
  }

  sendMessage(text: string, conversationId: string): Observable<ChatResponse> {
    const payload: ChatRequest = {
      text,
      limit: 5,
      conversation_id: conversationId,
    };

    return this.http.post<ChatResponse>(`${this.aiBaseUrl}/chat`, payload);
  }

  retrieveConversation(
    conversationId: string
  ): Observable<RetrievedConversationResponse> {
    return this.http.get<RetrievedConversationResponse>(
      `${this.aiBaseUrl}/conversation/${conversationId}`
    );
  }

  saveConversationForUser(conversationId: string): Observable<void> {
    return this.http.post<void>(this.backendChatUrl, {
      conversationId,
    });
  }

  getSavedConversations(): Observable<string[]> {
    return this.http.get<unknown>(this.backendChatUrl).pipe(
      map((response) => this.normalizeConversationIds(response))
    );
  }

  deleteConversation(conversationId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.backendChatUrl}/${encodeURIComponent(conversationId)}`
    );
  }

  private normalizeConversationIds(response: unknown): string[] {
    if (Array.isArray(response)) {
      return response
        .map((item) => this.extractConversationId(item))
        .filter((id): id is string => !!id);
    }

    const anyResponse = response as any;

    const list =
      anyResponse?.items ??
      anyResponse?.data ??
      anyResponse?.conversations ??
      anyResponse?.conversationIds ??
      [];

    if (!Array.isArray(list)) {
      return [];
    }

    return list
      .map((item) => this.extractConversationId(item))
      .filter((id): id is string => !!id);
  }

  private extractConversationId(item: unknown): string | null {
    if (typeof item === 'string') {
      return item;
    }

    const value = item as SavedConversationResponse;

    return (
      value?.conversationId ||
      value?.conversation_id ||
      value?.id ||
      null
    );
  }
}