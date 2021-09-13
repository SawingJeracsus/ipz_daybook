import {Telegraf} from "telegraf";
import {PromptManager} from "./promptManager";
import {DataBaseBus} from "./db/DataBaseBus";
import {Lecture} from "./db/models";

const db = new DataBaseBus();

export const startLectureHandler = (bot: Telegraf) => {
    bot.command('/mk_lecture', async (ctx) => {
        PromptManager.collectData({
            name: "Створюю профіль викладача... Напиши його ім'я, якщо ще пам'ятаєш)",
            email: "Тепер кинь його email, можна глянуть в тімсі!",
            phone_number: "Тепер кинь його номер телефону,його також можна глянуть в тімсі!",
        }, ctx.message.chat.id, async (data) => {
            const lecture = db.getModel<Lecture>('lecture') as Lecture;
            lecture.phone_number = data.phone_number;
            lecture.email = data.email;
            lecture.name = data.name;

            await lecture.save();

            ctx.reply(`Викладача додано до списку!`)
        });
    })
    bot.command('/get_lectures', async (ctx) => {
        const lectures = await db.find<Lecture>('lecture', {})
        console.log(lectures)
        ctx.reply(lectures.map(lecture => `${lecture.name}\n${lecture.phone_number}\n${lecture.email}`).join('\n\n') || "Поки лекторів ще немає");
    })
}
