import {
  Component,
  OnInit,
  inject,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  add,
  calendarOutline,
  chatbubbleEllipses,
  fitnessOutline,
  happyOutline,
  heartOutline,
  helpOutline,
  medicalOutline,
  openOutline,
  person,
  restaurantOutline,
  send,
  trashOutline,
} from 'ionicons/icons';
import { AlertController } from '@ionic/angular/standalone';
import { SHARED_STANDALONE_IMPORTS } from '../shared/shared-standalone';

interface ChatMessage {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  type: 'text' | 'quick-reply' | 'suggestion' | 'link';
  quickReplies?: string[];
  suggestions?: string[];
  link?: {
    text: string;
    url: string;
  };
}

interface QuickReply {
  text: string;
  action: string;
}

@Component({
  selector: 'app-chatbot',
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.scss'],
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS],
  host: { class: 'ion-page' },
})
export class ChatbotComponent implements OnInit {
  @ViewChild('messageContainer')
  private messageContainer!: ElementRef<HTMLElement>;

  private readonly router = inject(Router);
  private readonly alertController = inject(AlertController);

  isTyping = false;
  newMessage = '';

  messages: ChatMessage[] = [];
  quickReplies: QuickReply[] = [
    { text: 'Period tracking help', action: 'period_tracking' },
    { text: 'Health tips', action: 'health_tips' },
    { text: 'Pregnancy support', action: 'pregnancy_support' },
    { text: 'Mental wellness', action: 'mental_wellness' },
    { text: 'Nutrition advice', action: 'nutrition_advice' },
    { text: 'Exercise tips', action: 'exercise_tips' },
  ];

  suggestions: string[] = [
    'How to track my menstrual cycle?',
    'What are natural remedies for period pain?',
    'How to maintain a healthy pregnancy?',
    'Tips for better sleep during pregnancy',
    'How to manage stress and anxiety?',
    "What foods are good for women's health?",
  ];

  constructor() {
    addIcons({
      add,
      calendarOutline,
      chatbubbleEllipses,
      fitnessOutline,
      happyOutline,
      heartOutline,
      helpOutline,
      medicalOutline,
      openOutline,
      person,
      restaurantOutline,
      send,
      trashOutline,
    });
  }

  ngOnInit(): void {
    this.initializeChat();
  }

  initializeChat(): void {
    this.addBotMessage(
      "Hello! I'm the NouraCare assistant. I can help with menstrual health, pregnancy, wellness, and how to use the app. How can I help today?",
      'text',
      undefined,
      undefined,
      {
        text: 'Learn more about NouraCare',
        url: '/about',
      },
    );
  }

  sendMessage(): void {
    if (this.newMessage.trim() === '') {
      return;
    }

    const userMessage = this.newMessage.trim();
    this.addUserMessage(userMessage);
    this.newMessage = '';

    this.simulateBotResponse(userMessage);
  }

  sendQuickReply(action: string): void {
    this.addUserMessage(this.getQuickReplyText(action));
    this.simulateBotResponse(action);
  }

  sendSuggestion(suggestion: string): void {
    this.addUserMessage(suggestion);
    this.simulateBotResponse(suggestion);
  }

  addUserMessage(text: string): void {
    this.messages.push({
      id: Date.now(),
      text,
      sender: 'user',
      timestamp: new Date(),
      type: 'text',
    });
    this.queueScrollToBottom();
  }

  addBotMessage(
    text: string,
    type: 'text' | 'quick-reply' | 'suggestion' | 'link' = 'text',
    quickReplies?: string[],
    suggestions?: string[],
    link?: { text: string; url: string },
  ): void {
    this.messages.push({
      id: Date.now(),
      text,
      sender: 'bot',
      timestamp: new Date(),
      type,
      quickReplies,
      suggestions,
      link,
    });
    this.queueScrollToBottom();
  }

  simulateBotResponse(userInput: string): void {
    this.isTyping = true;
    this.queueScrollToBottom();

    const delay = 1000 + Math.random() * 2000;
    window.setTimeout(() => {
      this.isTyping = false;
      this.processUserInput(userInput);
      this.queueScrollToBottom();
    }, delay);
  }

  processUserInput(userInput: string): void {
    const input = userInput.toLowerCase();

    if (
      input.includes('period') ||
      input.includes('cycle') ||
      input.includes('menstrual')
    ) {
      this.addBotMessage(
        'I can help you track your menstrual cycle. Here are some tips:\n\n' +
          '• Use period tracking to log your cycle\n' +
          '• Note symptoms like cramps, mood, and flow\n' +
          '• Set reminders for your next expected period\n' +
          '• Watch for patterns in cycle length\n\n' +
          'Would you like pointers on setting up tracking in the app?',
        'quick-reply',
        ['Yes, show me', 'Not now', 'More tips'],
      );
    } else if (
      input.includes('health') ||
      input.includes('tip') ||
      input.includes('wellness')
    ) {
      this.addBotMessage(
        'Here are some general wellness ideas:\n\n' +
          '• Stay hydrated through the day\n' +
          '• Aim for regular movement you enjoy\n' +
          '• Build meals around vegetables, protein, and whole grains\n' +
          '• Prioritize sleep where you can\n' +
          '• Use small breaks to reset stress\n\n' +
          'What area would you like to go deeper on?',
        'quick-reply',
        ['Nutrition', 'Exercise', 'Mental health', 'Sleep'],
      );
    } else if (
      input.includes('pregnancy') ||
      input.includes('pregnant') ||
      input.includes('baby')
    ) {
      this.addBotMessage(
        "Pregnancy is a big chapter — here's how the app can support you:\n\n" +
          '• Follow week-by-week guidance\n' +
          '• Learn about nutrition and safe activity\n' +
          '• Understand common symptoms (when to ask your clinician)\n' +
          '• Prepare questions for prenatal visits\n\n' +
          'Would you like to focus on tracking, food, movement, or symptoms?',
        'quick-reply',
        ['Start tracking', 'Nutrition guide', 'Exercise tips', 'Symptoms'],
      );
    } else if (
      input.includes('stress') ||
      input.includes('anxiety') ||
      input.includes('mental') ||
      input.includes('mood')
    ) {
      this.addBotMessage(
        'Mental wellness matters. Some strategies many people find helpful:\n\n' +
          '• Short breathing exercises during tense moments\n' +
          '• Gentle mindfulness or grounding\n' +
          '• A steady sleep routine\n' +
          '• Staying connected with people you trust\n' +
          '• Speaking with a qualified professional when things feel heavy\n\n' +
          'Want ideas for calming techniques or sleep?',
        'quick-reply',
        ['Meditation guide', 'Breathing exercises', 'Sleep tips', 'Professional help'],
      );
    } else if (
      input.includes('food') ||
      input.includes('nutrition') ||
      input.includes('diet') ||
      input.includes('eat')
    ) {
      this.addBotMessage(
        'Balanced eating supports energy and hormones. Broad strokes:\n\n' +
          '• Plenty of colorful produce\n' +
          '• Whole grains and legumes\n' +
          '• Lean proteins\n' +
          '• Water as your default drink\n' +
          '• Limiting ultra-processed foods when practical\n\n' +
          'Which nutrition topic should we unpack?',
        'quick-reply',
        ['Pregnancy nutrition', 'Period nutrition', 'General diet', 'Supplements'],
      );
    } else if (
      input.includes('exercise') ||
      input.includes('workout') ||
      input.includes('fitness') ||
      input.includes('activity')
    ) {
      this.addBotMessage(
        'Movement can feel better at every life stage. General guidance:\n\n' +
          '• Mix easy cardio, strength, and mobility over the week\n' +
          '• Choose activities that feel sustainable\n' +
          '• During pregnancy or painful periods, favor clinician-approved options\n' +
          '• Rest is part of training too\n\n' +
          'What type of movement are you curious about?',
        'quick-reply',
        ['Pregnancy exercise', 'Period exercise', 'Yoga poses', 'Strength training'],
      );
    } else {
      this.addBotMessage(
        "I'm here for women's health and how to use NouraCare. You can ask about:\n\n" +
          '• Periods and cycle tracking\n' +
          '• Pregnancy support\n' +
          '• Stress, mood, and sleep\n' +
          '• Food and movement\n\n' +
          'What would you like to explore?',
        'suggestion',
        undefined,
        this.suggestions.slice(0, 3),
      );
    }
  }

  getQuickReplyText(action: string): string {
    const quickReply = this.quickReplies.find((qr) => qr.action === action);
    return quickReply ? quickReply.text : action;
  }

  private queueScrollToBottom(): void {
    window.setTimeout(() => this.scrollToBottom(), 0);
  }

  scrollToBottom(): void {
    try {
      const el = this.messageContainer?.nativeElement;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    } catch {
      /* best-effort scroll */
    }
  }

  openLink(url: string): void {
    void this.router.navigate([url]);
  }

  async clearChat(): Promise<void> {
    if (this.messages.length <= 1) {
      return;
    }
    const alert = await this.alertController.create({
      header: 'Clear chat?',
      message: 'Your messages on this screen will be removed and the welcome message will appear again.',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Clear',
          role: 'destructive',
          handler: () => {
            this.messages = [];
            this.initializeChat();
            this.queueScrollToBottom();
          },
        },
      ],
    });
    await alert.present();
  }

  formatMessageText(text: string): string {
    return text.replace(/\n/g, '<br>');
  }

  formatTime(timestamp: Date): string {
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - timestamp.getTime()) / (1000 * 60),
    );

    if (diffInMinutes < 1) {
      return 'Just now';
    }
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    }

    return timestamp.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  getQuickReplyIcon(action: string): string {
    const iconMap: Record<string, string> = {
      period_tracking: 'calendar-outline',
      health_tips: 'medical-outline',
      pregnancy_support: 'heart-outline',
      mental_wellness: 'happy-outline',
      nutrition_advice: 'restaurant-outline',
      exercise_tips: 'fitness-outline',
    };
    return iconMap[action] || 'help-outline';
  }

  openQuickActions(): void {
    void this.router.navigate(['/tabs/tools']);
  }
}
