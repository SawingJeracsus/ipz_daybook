import {Telegraf} from "telegraf";

type PromptHandler = (answer: string) => string | void | Promise<string | void>;

export class PromptManager {
    static subscribers: Array<{
        handler: PromptHandler,
        chatId: number
    }> = []

    static bot: Telegraf;

    static subscribe(handler: PromptHandler, chatId: number){
        this.subscribers.push({handler, chatId: chatId})
    }
    static getSubscriber(chatId: number): PromptHandler | undefined{
        const handler =  this.subscribers.find(subscriber => subscriber.chatId === chatId)?.handler;
        this.subscribers = this.subscribers.filter(subscriber => subscriber.chatId !== chatId)
        return handler
    }
    static async collectData< T extends {[key: string]: string}>(questions: T, chatId: number, onDataColected: (data: T) => void ){
        const questionsEntries = Object.entries(questions);
        const collectedData: {[key: string]: string} = {}

        let i = 0;

        function nextQuestion(){
            const data = questionsEntries[i];
            if(!data){
                onDataColected(collectedData as T);
                return
            }
            const [key, question] = data;

            PromptManager.bot.telegram.sendMessage(chatId, question)

            PromptManager.subscribe((answer) => {
                collectedData[key] = answer;
                i++
                nextQuestion()
            }, chatId)
        }
        nextQuestion()
    }
}

export const startPromptHandler = ( bot: Telegraf ) => {
    bot.command('/exit', (ctx) => {
        PromptManager.subscribers = PromptManager.subscribers.filter( ({chatId}) => chatId !== ctx.from.id)
        ctx.reply(' Я забуваю про все що хотів від тебе 0.о ')
    })

    bot.on('text', async (ctx) => {
        const handler = PromptManager.getSubscriber(ctx.message.chat.id);
        if(handler){
            const response = await handler(ctx.message.text)
            if(response){
                ctx.reply(response)
            }
        }
    })

    PromptManager.bot = bot;
}