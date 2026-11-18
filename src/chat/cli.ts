import * as readline from 'readline';
import { DOCUMENTATION_ASSISTANT_PROMPT } from '../llm/prompts.js'
import { client } from '../llm/anthropic-client.js';
import config from '../config.js';
import { Conversation } from './conversation.js';

export async function startCli(): Promise<void> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    }

)

    const conversation = new Conversation(DOCUMENTATION_ASSISTANT_PROMPT)

    console.log("╔════════════════════════════════════════╗");
    console.log("║          DevAssistant v0.1             ║");
    console.log("║    Asistente de Documentación IA       ║");
    console.log("╚════════════════════════════════════════╝");
    console.log("");
    console.log("💬 Escribe tu pregunta y presiona Enter.");
    console.log("   Comandos: /clear, /stats, /exit");
    console.log("");

    const promptUser = ():void => {
        rl.question("TU: ", async (input) => {
            const userInput = input.trim();
            if(!userInput){
                promptUser();
                return;
            }
            
            if (userInput === "/stats") {
            const stats = conversation.getStats();
            console.log(`\n📊 Estadísticas de la conversación:`);
            console.log(`   • Turnos: ${stats.turns}`);
            console.log(`   • Tokens de entrada acumulados: ${stats.inputToken}`);
            console.log(`   • Tokens de salida acumulados: ${stats.outputToken}`);
            console.log(`   • Tokens estimados en contexto actual: ${conversation.estimateCurrengToken()}\n`);
            promptUser();
            return;
            }

            if (userInput === "/exit" || userInput === "/salida") {
              const stats = conversation.getStats();   
               console.log(`Resuemen:  ${stats.turns} turnos` +`
                ${stats.inputToken} token entrada` + `
                ${stats.outputToken} token salida ` );   
                rl.close();
                return;
            }
            if (userInput === "/clear") {
                conversation.clear();
                promptUser();
                return;
            }

            try {
                conversation.addUserMessage(userInput);
                process.stdout.write("\nClaude: ")
                const record = conversation.getHistory();
                let fullMessage = "";
                const stream = client.messages.stream({
                    model:config.anthropicModel,
                    max_tokens: 1024,
                    system: DOCUMENTATION_ASSISTANT_PROMPT,
                    messages: record,
                })    
                stream.on("text" , (chunk) => {
                    process.stdout.write(chunk);
                    fullMessage += chunk;
                })
                const finalMessage = await stream.finalMessage();
                conversation.addUsage(finalMessage.usage.input_tokens, finalMessage.usage.output_tokens)
                process.stdout.write("\n\n")
                conversation.addAssistantMessage(fullMessage)

            } catch (error) {
                const err = error as Error;
                console.error(`ERROR ${err.message} `);
            }
            promptUser();
        });
    }
    promptUser();
}