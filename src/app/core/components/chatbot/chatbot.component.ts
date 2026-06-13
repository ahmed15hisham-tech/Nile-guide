import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

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
  isOpen = false;
  messageText = '';

  quickQuestions = [
    'Tell me about the Pyramids',
    'Best diving spots in Egypt?',
    'Plan a 7-day Nile cruise',
    'What to do in Luxor?',
    'Family-friendly activities',
  ];

  messages: ChatMessage[] = [
    {
      sender: 'bot',
      text: "👋 Hello! I'm your NileGuide AI assistant. How can I help you explore Egypt today?",
    },
  ];

  toggleChat(): void {
    this.isOpen = !this.isOpen;
  }

  closeChat(): void {
    this.isOpen = false;
  }

  sendMessage(): void {
    const text = this.messageText.trim();

    if (!text) return;

    this.messages.push({
      sender: 'user',
      text,
    });

    this.messageText = '';

    this.messages.push({
      sender: 'bot',
      text: 'Thanks! NileGuide AI will help with this soon.',
    });
  }

  sendQuickQuestion(question: string): void {
    this.messageText = question;
    this.sendMessage();
  }
}