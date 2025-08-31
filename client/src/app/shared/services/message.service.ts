import { Injectable } from '@angular/core';

export interface PersonalizedMessage {
  welcomeMessage: string;
  dailyMessage: string;
}

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  
  private dailyMessages = [
    "Every day is a new beginning. You've got this! 💪",
    "Your strength inspires others. Keep shining! ✨",
    "Small steps today, big changes tomorrow. Keep going! 🌱",
    "You are capable of amazing things. Believe in yourself! 🌟",
    "Today is your day to shine. Make it count! ☀️",
    "Your journey is unique and beautiful. Embrace it! 🦋",
    "You're stronger than you think. Keep pushing forward! 💎",
    "Every challenge makes you stronger. You're doing great! 🎯",
    "Your potential is limitless. Dream big! 🚀",
    "You bring light to others' lives. Thank you for being you! 💖",
    "Today's efforts are tomorrow's achievements. Keep going! 🎉",
    "You have the power to create positive change. Use it! 🌈",
    "Your kindness makes the world better. Keep spreading love! ❤️",
    "Every moment is a chance to grow. Seize it! 🌱",
    "You're making progress every day. Celebrate that! 🎊",
    "Your courage inspires others. Keep being brave! 🦁",
    "Today is filled with possibilities. Choose joy! 🌸",
    "You're exactly where you need to be. Trust the journey! 🗺️",
    "Your smile brightens someone's day. Keep smiling! 😊",
    "You're doing better than you think. Keep believing! 🌟"
  ];

  private welcomeMessages = [
    "Welcome back! I hope today brings you peace and happiness.",
    "Great to see you again! May your day be filled with joy.",
    "Welcome back! You're looking wonderful today.",
    "Hello again! I've missed your beautiful energy.",
    "Welcome back! Ready to make today amazing?",
    "Great to have you here again! You make this app special.",
    "Welcome back! Your presence brightens our day.",
    "Hello there! I hope you're feeling wonderful today.",
    "Welcome back! Let's make today count together.",
    "Great to see you! You're always a joy to welcome back."
  ];

  constructor() {}

  /**
   * Generate a personalized welcome message
   * @param userName - The user's name (optional)
   * @returns A warm welcome message
   */
  generateWelcomeMessage(userName?: string): string {
    if (userName) {
      const personalizedMessages = [
        `Welcome back, ${userName}! I hope today brings you peace and happiness.`,
        `Great to see you again, ${userName}! May your day be filled with joy.`,
        `Welcome back, ${userName}! You're looking wonderful today.`,
        `Hello again, ${userName}! I've missed your beautiful energy.`,
        `Welcome back, ${userName}! Ready to make today amazing?`,
        `Great to have you here again, ${userName}! You make this app special.`,
        `Welcome back, ${userName}! Your presence brightens our day.`,
        `Hello there, ${userName}! I hope you're feeling wonderful today.`,
        `Welcome back, ${userName}! Let's make today count together.`,
        `Great to see you, ${userName}! You're always a joy to welcome back.`
      ];
      
      return this.getRandomMessage(personalizedMessages);
    }
    
    return this.getRandomMessage(this.welcomeMessages);
  }

  /**
   * Generate a daily inspirational message
   * @returns A short, inspiring daily message
   */
  generateDailyMessage(): string {
    return this.getRandomMessage(this.dailyMessages);
  }

  /**
   * Generate both welcome and daily messages
   * @param userName - The user's name (optional)
   * @returns Object containing both messages
   */
  generatePersonalizedMessages(userName?: string): PersonalizedMessage {
    return {
      welcomeMessage: this.generateWelcomeMessage(userName),
      dailyMessage: this.generateDailyMessage()
    };
  }

  /**
   * Get a random message from an array
   * @param messages - Array of messages to choose from
   * @returns A random message
   */
  private getRandomMessage(messages: string[]): string {
    const randomIndex = Math.floor(Math.random() * messages.length);
    return messages[randomIndex];
  }

  /**
   * Generate a pregnancy-specific daily message
   * @param weekNumber - Current pregnancy week (optional)
   * @returns A pregnancy-focused daily message
   */
  generatePregnancyDailyMessage(weekNumber?: number): string {
    const pregnancyMessages = [
      "Your body is doing something incredible. You're amazing! 🌸",
      "Every kick is a reminder of the miracle growing inside you. 💕",
      "You're creating life. How beautiful is that? ✨",
      "Your strength as a mother is inspiring. Keep going! 💪",
      "You're doing everything right for your little one. 💖",
      "Your love is already protecting your baby. Beautiful! 🦋",
      "Every day brings you closer to meeting your miracle. 🌟",
      "You're glowing with the beauty of motherhood. ✨",
      "Your baby feels your love every moment. 💕",
      "You're stronger than you know. You've got this! 🌈"
    ];

    if (weekNumber) {
      const weekSpecificMessages = [
        `Week ${weekNumber}: You're doing amazing, mama! 🌸`,
        `Week ${weekNumber}: Your baby is growing beautifully! 💕`,
        `Week ${weekNumber}: You're halfway there! Keep going! ✨`,
        `Week ${weekNumber}: Almost time to meet your little one! 🌟`
      ];
      
      // Mix week-specific and general messages
      const allMessages = [...weekSpecificMessages, ...pregnancyMessages];
      return this.getRandomMessage(allMessages);
    }

    return this.getRandomMessage(pregnancyMessages);
  }

  /**
   * Generate a mood-based message
   * @param mood - User's current mood
   * @returns A message tailored to the mood
   */
  generateMoodBasedMessage(mood: string): string {
    const moodMessages: { [key: string]: string[] } = {
      'happy': [
        "Your happiness is contagious! Keep spreading joy! 😊",
        "Your smile lights up the room. Keep shining! ✨",
        "Joy looks beautiful on you! Keep that energy! 🌟"
      ],
      'sad': [
        "It's okay to feel sad. Tomorrow will be brighter. 🌅",
        "You're not alone. Better days are coming. 💙",
        "Your feelings are valid. You're stronger than this moment. 💪"
      ],
      'anxious': [
        "Take deep breaths. You're safe and you're okay. 🫁",
        "One moment at a time. You've got this. 🌱",
        "Anxiety doesn't define you. You're in control. 🎯"
      ],
      'excited': [
        "Your excitement is infectious! Love your energy! 🎉",
        "Great things are coming your way! Keep that excitement! 🚀",
        "Your enthusiasm is beautiful! Channel it into action! ⚡"
      ],
      'tired': [
        "Rest is not a sign of weakness. Take care of yourself. 😴",
        "You deserve to rest. Tomorrow will be better. 🌙",
        "Listen to your body. Rest is productive too. 💤"
      ]
    };

    const messages = moodMessages[mood.toLowerCase()] || this.dailyMessages;
    return this.getRandomMessage(messages);
  }
}
