import {Telegraf} from "telegraf";
import {PromptManager} from "./promptManager";
import {DataBaseBus} from "./db/DataBaseBus";
import {Discipline, Lecture} from "./db/models";
import {SelectManager} from "./select";
import internal from "stream";

const db = new DataBaseBus()

export const startDisciplineHandlers = (bot: Telegraf) => {
    bot.command('/mk_discipline',async (ctx) => {
        ctx.reply('Додаю нову дисципліну в список - напишіть назву:')
        const lectures = await db.find<Lecture>('lecture', {})
        if(lectures.length === 0){
            ctx.reply('Немає жодного викладача у списку, що ви від мене хочете?')
            return
        }
        PromptManager.subscribe(async ( name ) => {
            const discipline = db.getModel<Discipline>('discipline') as Discipline;
            discipline.name = name;

            await SelectManager.select(
                ctx.message.chat.id,
                "Оберіть викладача: ",
                lectures.map(lecture => lecture.name),
                async (lectureName) => {
                    ctx.reply(`Обраний лектор - ${lectureName}`)
                    discipline.lecture = lectures.find(lecture => lecture.name === lectureName)?.id || 1
                    await discipline.save();
                    ctx.reply('Дисципліна додана до списку успішно!')
                }
            )

        }, ctx.message.chat.id)
    })

    bot.command('/get_disciplines', async ctx => {
        const disciplines = await db.find<Discipline>('discipline', {})
        const lectures = await db.find<Lecture>('lecture', {})


        ctx.reply(
            disciplines.map(discipline => {
                return {
                    ...discipline,
                    lecture: lectures.find(lecture => lecture.id === discipline.lecture)
                }
            }).map(discipline => `Назва: ${discipline.name}\nВикладач: ${discipline?.lecture?.name || "Невідомий"}`)
                .join('\n\n')
        )
    })
}