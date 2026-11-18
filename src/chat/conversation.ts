import config from "../config.js";
import { client } from "../llm/anthropic-client.js";
import { Message } from "../types.js";

const CHARS_POR_TOKEN = 4;

export class Conversation {
  private message: Message[] = [];
  private systemPrompt: string;
  private totalInputToken: number = 0;
  private totalOutputsToken: number = 0;

  constructor(systemPrompt: string = "") {
    this.systemPrompt = systemPrompt;
  }

  addUserMessage(text: string): void {
    this.message.push({ role: "user", content: text });
  }
  addAssistantMessage(text: string): void {
    this.message.push({ role: "assistant", content: text });
  }
  async send(): Promise<string> {
    const response = await client.messages.create({
      model: config.anthropicModel,
      max_tokens: 1024,
      ...(this.systemPrompt && { system: this.systemPrompt }),
      messages: this.message,
    });
    this.addUsage(response.usage.input_tokens, response.usage.output_tokens)


    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error(`Claude no retorna un bloque de texto en la respuesta`);
    }
    const responseText = textBlock.text;
    this.addAssistantMessage(responseText);
    return responseText;
  }
  addUsage(input_tokens: number, output_tokens: number) {
    this.totalInputToken += input_tokens;
    this.totalOutputsToken += output_tokens;
  }

  clear(): void {
    this.message = [];
    this.totalInputToken = 0;
    this.totalOutputsToken = 0;
    console.log("convesazione reiniziata");
  }
  getTurnCount(): number {
    return Math.floor(this.message.length / 2);
  }
  estimateCurrengToken(): number {
    const totalChars = this.message.reduce(
      (sum, msg) => sum + msg.content.length,
      0,
    );
    return Math.floor(totalChars / CHARS_POR_TOKEN);
  }
  getStats(): { inputToken: number; outputToken: number; turns: number } {
    return {
      inputToken: this.totalInputToken,
      outputToken: this.totalOutputsToken,
      turns: this.getTurnCount(),
    };
  }
  getHistory(): Message[] {
    return [...this.message];
  }
}
