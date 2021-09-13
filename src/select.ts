import {Telegraf, Markup} from "telegraf";

export class SelectManager {
    static subscribers: Array<{chatId: number, callBack: (selected: string) => void, messageId: number}> = []
    static bot: Telegraf

    static async select (chatId: number, question: string, variants: string[], onSelect: (selected: string) => void ) {
        if(variants.length === 0){
            return
        }

        const keyboardData = variants
            .map( (variant, i, variants) => {
                if(i % 2 === 0){
                    return [variants[i], variants[i+1]]
                        .filter(variant => !!variant)
                        .map(variant => ({
                            text: variant,
                            callback_data: variant,
                            hide: false
                        }))
                }
            } )
            .filter(variant => variant !== undefined) as Array<{text: string, callback_data: string, hide: boolean}[] >

        const keyboard = Markup.inlineKeyboard(keyboardData)
        const message = await this.bot.telegram.sendMessage(chatId, question, keyboard)
        this.subscribers.push({
            chatId,
            callBack: onSelect,
            messageId: message.message_id
        })
    }

    static async dispatch(chatId: number, answer: string){
        const handler = this.subscribers.find(handler => handler.chatId === chatId);
        if(handler){
            await this.bot.telegram.deleteMessage(handler.chatId, handler.messageId);
            handler.callBack(answer)
            this.subscribers = this.subscribers.filter(handler => handler.chatId !== chatId)
        }
    }
}

export const registerSelectHandler = ( bot: Telegraf ) => {
    bot.on('callback_query', async (ctx) => {
        // @ts-ignore
        const command: string = ctx.update?.callback_query?.data; const id: number = ctx.update?.callback_query?.message?.chat?.id;
        if(!command || !id){
            return
        }
        await SelectManager.dispatch(id, command);
    })
    SelectManager.bot = bot;
}