import { GeminiKeyManager } from './GeminiKeyManager';
import { GroqKeyManager } from './GroqKeyManager';

export class LLMManager {
  private keyManagers: (GeminiKeyManager | GroqKeyManager)[];
  private currentKeyManagerIndex: number;

  constructor() {
    this.keyManagers = [];
    this.currentKeyManagerIndex = 0;

    // Initialize GeminiKeyManager if API key is available
    if (process.env.GEMINI_API_KEY) {
      try {
        this.keyManagers.push(new GeminiKeyManager());
      } catch (error) {
        console.warn('Failed to initialize GeminiKeyManager:', error);
      }
    }

    // Initialize GroqKeyManager if API key is available
    if (process.env.GROQ_API_KEY) {
      try {
        this.keyManagers.push(new GroqKeyManager());
      } catch (error) {
        console.warn('Failed to initialize GroqKeyManager:', error);
      }
    }

    if (this.keyManagers.length === 0) {
      throw new Error('No LLM key managers could be initialized. Please check your API keys.');
    }
  }

  private getNextKeyManager(): GeminiKeyManager | GroqKeyManager {
    if (this.keyManagers.length === 0) {
      throw new Error('No active LLM key managers available.');
    }
    const manager = this.keyManagers[this.currentKeyManagerIndex];
    this.currentKeyManagerIndex = (this.currentKeyManagerIndex + 1) % this.keyManagers.length;
    return manager;
  }

  public async generateResponse(prompt: string): Promise<string> {
    const keyManager = this.getNextKeyManager();
    console.log(`Using ${keyManager.constructor.name} for prompt: ${prompt}`);
    // In a real scenario, this would interact with an LLM using the keyManager
    // For now, it's a placeholder.
    return `Response from ${keyManager.constructor.name} to: ${prompt}`;
  }
}