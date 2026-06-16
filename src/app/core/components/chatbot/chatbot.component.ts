import { CommonModule } from '@angular/common';
import { Component, ChangeDetectorRef, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

import {
  ChatbotService,
  RetrievedConversationResponse,
} from './chatbot.service';

interface ChatMessage {
  sender: 'bot' | 'user';
  text: string;
}

interface ConversationItem {
  conversationId: string;
  title: string;
  updatedAt?: string;
  isLoading?: boolean;
}

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot.component.html',
})
export class ChatbotComponent implements OnInit {
  private readonly chatbotService = inject(ChatbotService);
  private readonly cdr = inject(ChangeDetectorRef);

  isOpen = false;
  isSending = false;
  isHistoryOpen = false;
  isLoadingConversations = false;
  isLoadingConversation = false;

  messageText = '';
  errorMessage = '';

  currentConversationId = '';
  savedConversations: ConversationItem[] = [];
  messages: ChatMessage[] = [];

  ngOnInit(): void {
    this.loadSavedConversations();
  }

  toggleChat(): void {
    this.isOpen = !this.isOpen;

    if (this.isOpen) {
      this.loadSavedConversations();
    }

    this.cdr.detectChanges();
  }

  closeChat(): void {
    this.isOpen = false;
    this.cdr.detectChanges();
  }

  toggleHistory(): void {
    this.isHistoryOpen = !this.isHistoryOpen;

    if (this.isHistoryOpen) {
      this.loadSavedConversations();
    }

    this.cdr.detectChanges();
  }

  startNewChat(): void {
    this.currentConversationId = '';
    this.messages = [];
    this.errorMessage = '';
    this.isHistoryOpen = false;
    this.cdr.detectChanges();
  }

  sendMessage(): void {
    const text = this.messageText.trim();

    if (!text || this.isSending) return;

    this.messages.push({
      sender: 'user',
      text,
    });

    this.messageText = '';
    this.errorMessage = '';
    this.isSending = true;
    this.cdr.detectChanges();

    if (!this.currentConversationId) {
      this.createConversationThenSend(text);
      return;
    }

    this.sendMessageToConversation(text, this.currentConversationId);
  }

  openConversation(conversationId: string): void {
    if (!conversationId || this.isLoadingConversation) return;

    this.errorMessage = '';
    this.isLoadingConversation = true;
    this.currentConversationId = conversationId;
    this.isHistoryOpen = false;
    this.cdr.detectChanges();

    this.chatbotService
      .retrieveConversation(conversationId)
      .pipe(
        finalize(() => {
          this.isLoadingConversation = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (response) => {
          this.messages = this.mapRetrievedHistoryToMessages(response);
          this.updateConversationTitle(response);
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Retrieve conversation error:', error);
          this.errorMessage = 'Failed to load this conversation.';
          this.cdr.detectChanges();
        },
      });
  }

  deleteConversation(
    event: MouseEvent,
    conversationId: string
  ): void {
    event.stopPropagation();

    if (!conversationId) return;

    this.chatbotService.deleteConversation(conversationId).subscribe({
      next: () => {
        this.savedConversations = this.savedConversations.filter(
          (item) => item.conversationId !== conversationId
        );

        if (this.currentConversationId === conversationId) {
          this.startNewChat();
        }

        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Delete conversation error:', error);
        this.errorMessage = 'Failed to delete conversation.';
        this.cdr.detectChanges();
      },
    });
  }

  private createConversationThenSend(text: string): void {
    this.chatbotService.createAiConversation().subscribe({
      next: (response) => {
        const conversationId = response.conversation_id;

        if (!conversationId) {
          this.isSending = false;
          this.errorMessage = 'Failed to create conversation.';
          this.cdr.detectChanges();
          return;
        }

        this.currentConversationId = conversationId;

        this.chatbotService.saveConversationForUser(conversationId).subscribe({
          next: () => {
            this.addConversationToList(conversationId, text);
            this.sendMessageToConversation(text, conversationId);
          },
          error: (error) => {
            console.error('Save conversation error:', error);

            /*
              حتى لو حفظ الـ conversationId في الباك فشل،
              نخلي الشات يكمل عادي بدل ما نوقف تجربة المستخدم.
            */
            this.addConversationToList(conversationId, text);
            this.sendMessageToConversation(text, conversationId);
          },
        });
      },
      error: (error) => {
        console.error('Create conversation error:', error);

        this.errorMessage = 'Failed to start a new conversation.';
        this.isSending = false;
        this.cdr.detectChanges();
      },
    });
  }

  private sendMessageToConversation(
    text: string,
    conversationId: string
  ): void {
    this.chatbotService
      .sendMessage(text, conversationId)
      .pipe(
        finalize(() => {
          this.isSending = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (response) => {
          if (response.answer?.trim()) {
            this.messages.push({
              sender: 'bot',
              text: response.answer.trim(),
            });
          }

          this.updateLocalConversationTitle(conversationId, text);
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Chatbot API error:', error);
          this.errorMessage = 'Connection error. Please try again.';
          this.cdr.detectChanges();
        },
      });
  }

  private loadSavedConversations(): void {
    if (this.isLoadingConversations) return;

    this.isLoadingConversations = true;
    this.cdr.detectChanges();

    this.chatbotService
      .getSavedConversations()
      .pipe(
        finalize(() => {
          this.isLoadingConversations = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (ids) => {
          this.savedConversations = ids.map((conversationId, index) => ({
            conversationId,
            title: `Conversation ${index + 1}`,
          }));

          this.loadConversationTitles();
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Load saved conversations error:', error);
          this.savedConversations = [];
          this.cdr.detectChanges();
        },
      });
  }

  private loadConversationTitles(): void {
    if (!this.savedConversations.length) return;

    const requests = this.savedConversations.map((item) =>
      this.chatbotService.retrieveConversation(item.conversationId).pipe(
        catchError(() => of(null))
      )
    );

    forkJoin(requests).subscribe({
      next: (responses) => {
        this.savedConversations = this.savedConversations.map((item, index) => {
          const response = responses[index];

          if (!response) {
            return item;
          }

          return {
            ...item,
            title: this.getConversationTitle(response, index),
            updatedAt: response.updated_at,
          };
        });

        this.cdr.detectChanges();
      },
    });
  }

  private mapRetrievedHistoryToMessages(
    response: RetrievedConversationResponse
  ): ChatMessage[] {
    return (response.history ?? [])
      .map((item) => {
        if (item.role === 'user') {
          return {
            sender: 'user' as const,
            text: item.content,
          };
        }

        return {
          sender: 'bot' as const,
          text: item.content,
        };
      })
      .filter((message) => !!message.text?.trim());
  }

  private getConversationTitle(
    response: RetrievedConversationResponse,
    index: number
  ): string {
    const firstUserMessage = response.history?.find(
      (item) => item.role === 'user' && item.content?.trim()
    );

    if (!firstUserMessage) {
      return `Conversation ${index + 1}`;
    }

    return this.truncateTitle(firstUserMessage.content);
  }

  private updateConversationTitle(response: RetrievedConversationResponse): void {
    const index = this.savedConversations.findIndex(
      (item) => item.conversationId === response.conversation_id
    );

    if (index === -1) return;

    this.savedConversations[index] = {
      ...this.savedConversations[index],
      title: this.getConversationTitle(response, index),
      updatedAt: response.updated_at,
    };
  }

  private updateLocalConversationTitle(
    conversationId: string,
    fallbackText: string
  ): void {
    const index = this.savedConversations.findIndex(
      (item) => item.conversationId === conversationId
    );

    if (index === -1) {
      this.addConversationToList(conversationId, fallbackText);
      return;
    }

    const current = this.savedConversations[index];

    if (current.title.startsWith('Conversation ')) {
      this.savedConversations[index] = {
        ...current,
        title: this.truncateTitle(fallbackText),
      };
    }
  }

  private addConversationToList(
    conversationId: string,
    firstMessage: string
  ): void {
    const exists = this.savedConversations.some(
      (item) => item.conversationId === conversationId
    );

    if (exists) return;

    this.savedConversations = [
      {
        conversationId,
        title: this.truncateTitle(firstMessage),
      },
      ...this.savedConversations,
    ];
  }

  private truncateTitle(value: string): string {
    const clean = value.replace(/\s+/g, ' ').trim();

    if (clean.length <= 38) {
      return clean;
    }

    return `${clean.slice(0, 38)}...`;
  }
}