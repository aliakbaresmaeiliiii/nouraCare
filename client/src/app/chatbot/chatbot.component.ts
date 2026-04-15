import { Component, OnInit, inject, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { Router } from '@angular/router';
import { SHARED_STANDALONE_IMPORTS } from '../shared/shared-standalone.js';

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
})
export class ChatbotComponent implements OnInit, AfterViewChecked {
  @ViewChild('messageContainer') private messageContainer!: ElementRef;
  @ViewChild('messageInput') private messageInput!: ElementRef;
  
  private router = inject(Router);

  isLoading = false;
  isTyping = false;
  newMessage = '';
  isMinimized = false;

  messages: ChatMessage[] = [];
  quickReplies: QuickReply[] = [
    { text: 'Period tracking help', action: 'period_tracking' },
    { text: 'Health tips', action: 'health_tips' },
    { text: 'Pregnancy support', action: 'pregnancy_support' },
    { text: 'Mental wellness', action: 'mental_wellness' },
    { text: 'Nutrition advice', action: 'nutrition_advice' },
    { text: 'Exercise tips', action: 'exercise_tips' }
  ];

  suggestions: string[] = [
    'How to track my menstrual cycle?',
    'What are natural remedies for period pain?',
    'How to maintain a healthy pregnancy?',
    'Tips for better sleep during pregnancy',
    'How to manage stress and anxiety?',
    'What foods are good for women\'s health?'
  ];

  constructor() { }

  ngOnInit() {
    this.initializeChat();
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  initializeChat() {
    // Add welcome message
    this.addBotMessage(
      'Hello! I\'m the NouraCare assistant. I\'m here to help with your health journey and app questions. How can I help today?',
      'text',
      undefined,
      undefined,
      {
        text: 'Learn more about NouraCare',
        url: '/about'
      }
    );
  }

  sendMessage() {
    if (this.newMessage.trim() === '') return;

    const userMessage = this.newMessage.trim();
    this.addUserMessage(userMessage);
    this.newMessage = '';

    // Simulate bot response
    this.simulateBotResponse(userMessage);
  }

  sendQuickReply(action: string) {
    this.addUserMessage(this.getQuickReplyText(action));
    this.simulateBotResponse(action);
  }

  sendSuggestion(suggestion: string) {
    this.addUserMessage(suggestion);
    this.simulateBotResponse(suggestion);
  }

  addUserMessage(text: string) {
    this.messages.push({
      id: Date.now(),
      text,
      sender: 'user',
      timestamp: new Date(),
      type: 'text'
    });
  }

  addBotMessage(
    text: string, 
    type: 'text' | 'quick-reply' | 'suggestion' | 'link' = 'text',
    quickReplies?: string[],
    suggestions?: string[],
    link?: { text: string; url: string }
  ) {
    this.messages.push({
      id: Date.now(),
      text,
      sender: 'bot',
      timestamp: new Date(),
      type,
      quickReplies,
      suggestions,
      link
    });
  }

  simulateBotResponse(userInput: string) {
    this.isTyping = true;
    
    // Simulate typing delay
    setTimeout(() => {
      this.isTyping = false;
      this.processUserInput(userInput);
    }, 1000 + Math.random() * 2000);
  }

  processUserInput(userInput: string) {
    const input = userInput.toLowerCase();
    
    // Period tracking
    if (input.includes('period') || input.includes('cycle') || input.includes('menstrual')) {
      this.addBotMessage(
        'I can help you track your menstrual cycle! Here are some tips:\n\n' +
        '• Use our period tracking feature to log your cycle\n' +
        '• Track symptoms like cramps, mood changes, and flow\n' +
        '• Set reminders for your next expected period\n' +
        '• Monitor cycle length and patterns\n\n' +
        'Would you like me to show you how to set up period tracking?',
        'quick-reply',
        ['Yes, show me', 'Not now', 'More tips']
      );
    }
    
    // Health tips
    else if (input.includes('health') || input.includes('tip') || input.includes('wellness')) {
      this.addBotMessage(
        'Here are some general health tips for women:\n\n' +
        '• Stay hydrated - aim for 8-10 glasses of water daily\n' +
        '• Get regular exercise - 150 minutes of moderate activity per week\n' +
        '• Eat a balanced diet rich in fruits, vegetables, and whole grains\n' +
        '• Get 7-9 hours of quality sleep each night\n' +
        '• Practice stress management techniques\n\n' +
        'What specific area would you like to focus on?',
        'quick-reply',
        ['Nutrition', 'Exercise', 'Mental health', 'Sleep']
      );
    }
    
    // Pregnancy support
    else if (input.includes('pregnancy') || input.includes('pregnant') || input.includes('baby')) {
      this.addBotMessage(
        'Congratulations! Pregnancy is an exciting journey. Here\'s how I can help:\n\n' +
        '• Track your pregnancy week by week\n' +
        '• Get personalized nutrition advice\n' +
        '• Learn about safe exercises during pregnancy\n' +
        '• Understand common pregnancy symptoms\n' +
        '• Prepare for labor and delivery\n\n' +
        'Would you like to start pregnancy tracking or learn about a specific topic?',
        'quick-reply',
        ['Start tracking', 'Nutrition guide', 'Exercise tips', 'Symptoms']
      );
    }
    
    // Mental wellness
    else if (input.includes('stress') || input.includes('anxiety') || input.includes('mental') || input.includes('mood')) {
      this.addBotMessage(
        'Mental wellness is crucial for overall health. Here are some strategies:\n\n' +
        '• Practice deep breathing exercises\n' +
        '• Try meditation or mindfulness\n' +
        '• Maintain a regular sleep schedule\n' +
        '• Stay connected with friends and family\n' +
        '• Consider talking to a mental health professional\n\n' +
        'Would you like to learn more about any of these techniques?',
        'quick-reply',
        ['Meditation guide', 'Breathing exercises', 'Sleep tips', 'Professional help']
      );
    }
    
    // Nutrition
    else if (input.includes('food') || input.includes('nutrition') || input.includes('diet') || input.includes('eat')) {
      this.addBotMessage(
        'Good nutrition is essential for women\'s health. Here are some key recommendations:\n\n' +
        '• Include plenty of fruits and vegetables\n' +
        '• Choose whole grains over refined grains\n' +
        '• Include lean proteins like fish, poultry, and legumes\n' +
        '• Stay hydrated with water\n' +
        '• Limit processed foods and added sugars\n\n' +
        'What specific nutrition topic interests you?',
        'quick-reply',
        ['Pregnancy nutrition', 'Period nutrition', 'General diet', 'Supplements']
      );
    }
    
    // Exercise
    else if (input.includes('exercise') || input.includes('workout') || input.includes('fitness') || input.includes('activity')) {
      this.addBotMessage(
        'Regular exercise is great for women\'s health! Here are some recommendations:\n\n' +
        '• Aim for 150 minutes of moderate activity per week\n' +
        '• Include strength training 2-3 times per week\n' +
        '• Try yoga or pilates for flexibility\n' +
        '• Walking is a great low-impact exercise\n' +
        '• Listen to your body and rest when needed\n\n' +
        'What type of exercise would you like to learn about?',
        'quick-reply',
        ['Pregnancy exercise', 'Period exercise', 'Yoga poses', 'Strength training']
      );
    }
    
    // Default response
    else {
      this.addBotMessage(
        'I\'m here to help with women\'s health and wellness! You can ask me about:\n\n' +
        '• Period tracking and menstrual health\n' +
        '• Pregnancy support and guidance\n' +
        '• Mental wellness and stress management\n' +
        '• Nutrition and healthy eating\n' +
        '• Exercise and fitness tips\n\n' +
        'What would you like to know more about?',
        'suggestion',
        undefined,
        this.suggestions.slice(0, 3)
      );
    }
  }

  getQuickReplyText(action: string): string {
    const quickReply = this.quickReplies.find(qr => qr.action === action);
    return quickReply ? quickReply.text : action;
  }

  scrollToBottom() {
    try {
      if (this.messageContainer) {
        this.messageContainer.nativeElement.scrollTop = this.messageContainer.nativeElement.scrollHeight;
      }
    } catch (err) {
      console.error('Error scrolling to bottom:', err);
    }
  }

  toggleMinimize() {
    this.isMinimized = !this.isMinimized;
  }

  openLink(url: string) {
    this.router.navigate([url]);
  }

  clearChat() {
    if (confirm('Are you sure you want to clear the chat history?')) {
      this.messages = [];
      this.initializeChat();
    }
  }

  formatMessageText(text: string): string {
    // Convert newlines to <br> tags for proper display
    return text.replace(/\n/g, '<br>');
  }

  formatTime(timestamp: Date): string {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    return timestamp.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }

  getQuickReplyIcon(action: string): string {
    const iconMap: { [key: string]: string } = {
      'period_tracking': 'calendar-outline',
      'health_tips': 'medical-outline',
      'pregnancy_support': 'heart-outline',
      'mental_wellness': 'happy-outline',
      'nutrition_advice': 'restaurant-outline',
      'exercise_tips': 'fitness-outline'
    };
    return iconMap[action] || 'help-outline';
  }

  openQuickActions() {
    // This could open a quick actions menu or navigate to other sections
    this.router.navigate(['/tabs/tools']);
  }

  goBack() {
    this.router.navigate(['/tabs']);
  }
}
