import { Telegraf } from "telegraf";
import {DataBaseBus} from "./db/DataBaseBus";
import {User} from "./db/models";
import {PromptManager} from "./promptManager";

const db = new DataBaseBus();

export const startHandler = ( bot: Telegraf ) => {
    bot.start( async ( ctx ) => {

        if((await db.find<User>('user', {telegram_id: ctx.from.id.toString()})).length === 0){
            ctx.reply(`Welcome to the club, buddy!
Я бот який допомагає не забути що там задали і звільняє від потреби спамити в чат групи з питанням: "А як звуть..."
Поки я записую тебе в свій журнал - ознайомся з командами (/help) ! 
`)

            const user = db.getModel<User>('user') as User;
            user.telegram_id = ctx.from.id.toString();
            user.username = ctx.from.username || 'Анонімус';

            await user.save()

            ctx.reply(`Все, я тебе записав! Буду тобі вдячний, якщо ти даси мені свій email і номер телефону. Це можна зробить за допомогою /contacts`)
        }


    } )
    bot.command('/help', ctx => {
        ctx.reply(`/start - Отримати привітальне повідомлення
/help - відкрити цей список
/mk_lecture - додати лектора до списку
/get_lectures - отримати список лекторів
/mk_discipline - додати дисципліну до списку
/get_disciplines - отримати список дисциплін
/add_hw - додати нове завдання
/get_hw - отримати список завдань
/rm_hw - видалити завдання`)
    })
    bot.command("contacts", async (ctx) => {
        PromptManager.collectData({
            phone_num: "Записую твої контакти для потомків... Кидай сюди свій номер телефону!",
            email: "Супер! Тепер кидай свій email!"
        }, ctx.message.chat.id, async (data) => {
            const user = (await db.find<User>('user', {telegram_id: ctx.from.id.toString()}))[0]
            const userModel =  db.getModel('user', user) as User;
            try{
                userModel.phone_number = data.phone_num;
                userModel.email = data.email
                await  userModel.save()
            }catch (e) {
                ctx.reply("Дані не валідні")
                return
            }
            ctx.reply("Все! Я запам'ятав твої контакти! Тепер не викрутишся!)");
        })
    })
}
