import { CommonModule } from '@angular/common';
import { Component, ChangeDetectorRef, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChatbotService } from './chatbot.service';

interface ChatMessage {
  sender: 'bot' | 'user';
  text: string;
}

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot.component.html',
})
export class ChatbotComponent {
  private readonly chatbotService = inject(ChatbotService);
  private readonly cdr = inject(ChangeDetectorRef);

  isOpen = false;
  isSending = false;
  messageText = '';
  errorMessage = '';

  messages: ChatMessage[] = [];

  toggleChat(): void {
    this.isOpen = !this.isOpen;
    this.cdr.detectChanges();
  }

  closeChat(): void {
    this.isOpen = false;
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

    this.chatbotService.sendMessage(text).subscribe({
      next: (response) => {
        if (response.answer?.trim()) {
          this.messages.push({
            sender: 'bot',
            text: response.answer.trim(),
          });
        }

        this.isSending = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Chatbot API error:', error);

        this.errorMessage = 'Connection error. Please try again.';

        this.isSending = false;
        this.cdr.detectChanges();
      },
    });
  }
}