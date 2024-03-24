import { Component, ViewChild, ElementRef } from '@angular/core';
import { ChatbotService } from '../chatbot.service';
import { Trace } from '@aws-sdk/client-bedrock-agent-runtime';

interface Message {
  content: string;
  sender: 'user' | 'bot';
}

interface Response {
    trace?: Trace;
    completion: string;

}

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  title = 'AI Assistant';
  isLoading = false;
  sessionId = this.generateSessionId();
  messages: Message[] = [];

  @ViewChild('chatBox') private chatBox!: ElementRef;

  constructor(private chatbotService: ChatbotService) {}

  async sendMessage(userInput: HTMLTextAreaElement): Promise<void> {
    const userMessage = userInput.value.trim();
    if (userMessage) {
      this.appendMessage(userMessage, 'user');
      userInput.value = '';
  
      try {
        this.isLoading = true;
        const response = await this.chatbotService.invokeAgent(userMessage, this.sessionId);
        this.appendMessage(response, 'bot');
      } catch (error) {
        this.appendMessage('Error: Could not send the message.', 'bot');
      } finally {
        this.isLoading = false;
      }
    }
  }

  private appendMessage(message: string, sender: 'user' | 'bot'): void {
    this.messages.push({ content: message, sender });
    
    setTimeout(() => {
      this.chatBox.nativeElement.scrollTop = this.chatBox.nativeElement.scrollHeight;
    });
    
    setTimeout(() => {
      const chatBox = document.getElementById('chat-box');
      if (chatBox) {
        chatBox.scrollTop = chatBox.scrollHeight;
      }
    });
  }

  private generateSessionId(): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = Array.from({ length: 8 }, () => characters.charAt(Math.floor(Math.random() * characters.length))).join('');
    return result;
  }

  resetTheSession(): void {
    this.sessionId = this.generateSessionId();
    this.messages = [];
  }

}
