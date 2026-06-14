import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface ChatRequest {
  text: string;
  limit: number;
  history: unknown[];
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

@Injectable({
  providedIn: 'root',
})
export class ChatbotService {
  private readonly http = inject(HttpClient);

  private readonly chatUrl = 'http://32.195.230.191:5000/api/v1/nlp/chat';

  sendMessage(text: string): Observable<ChatResponse> {
    const payload: ChatRequest = {
      text,
      limit: 5,
      history: [],
    };

    return this.http.post<ChatResponse>(this.chatUrl, payload);
  }
}