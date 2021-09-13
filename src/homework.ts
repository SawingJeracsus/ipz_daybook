import {Telegraf} from "telegraf";
import {PromptManager} from "./promptManager";
import {SelectManager} from "./select";
import {DataBaseBus} from "./db/DataBaseBus";
import {Discipline, Homework, Lecture, User} from "./db/models";
import {log} from "util";

const db = new DataBaseBus()

export const startHomeworkHandlers = ( bot: Telegraf ) => {
    bot.command('/add_hw', async ctx => {
        PromptManager.collectData({
            task: "Напиши суть завдання",
            description: "Можеш написати додаткові дані для ДЗ",
            deadline: "Напиши deadline для завдання"
        }, ctx.message.chat.id, async (data) => {
            const disciplines = await db.find<Discipline>("discipline", {});

            const selectedDiscipline = await new Promise<number>((resolve) => {
                SelectManager.select(
                    ctx.message.chat.id,
                    "Оберіть дисципліну",
                    disciplines.map(discipline => discipline.name),
                    (dName) => {
                        resolve(disciplines.find(discipline => discipline.name === dName)?.id || -1)
                    }
                )
            })

            const author = (await db.find<User>('user', {telegram_id: ctx.from.id.toString()}))[0]

            const homework = db.getModel<Homework>('homework') as Homework
            homework.discipline = selectedDiscipline

            Object.entries( data )
                .forEach( ([ key, value ]) => {
                    // @ts-ignore
                    homework[key] = value
                } )

            homework.author = author.id || -1

            try {
                await homework.save()
                ctx.reply('Завдання збережено!')
            }catch (e) {
                console.log(homework, e)
                ctx.reply('Окремі поля було неправильно заповнені!')
            }
        })
    })

    bot.command('/get_hw', async ctx => {
        const homeworks = await db.find<Homework>("homework", {});
        SelectManager.select(
            ctx.message.chat.id,
            "Оберіть домашнє завдання для деталей",
            homeworks.map((hw, i) => i+1+" "+hw.task),
            async (selectedHomework) => {
                const index = parseInt(selectedHomework.split(' ')[0], 10) - 1;
                const hw = homeworks[index];
                const author = await db.find<User>('user', {id: hw.author}, ['username'])
                const discipline = (await db.find<Discipline>('discipline', {id: hw.discipline}))[0]
                const lecture = (await db.find<Lecture>('lecture', {id: discipline.lecture}, ['name']) )[0]

                ctx.reply(`Завдання: ${hw.task}
Опис: ${hw.description}
Дедлайн: ${hw.deadline}
Додав: @${author[0].username}
Дисципліна: ${discipline.name}
Викладач: ${lecture.name}
`)
            }
        )
    })

    bot.command('/rm_hw', async(ctx) => {
        const homeworks = await db.find<Homework>("homework", {});
        SelectManager.select(
            ctx.message.chat.id,
            "Оберіть домашнє завдання для видалення",
            homeworks.map((hw, i) => i+1+" "+hw.task),
            async (selectedHomework) => {
                const index = parseInt(selectedHomework.split(' ')[0], 10) - 1;
                const hw = db.getModel<Homework>('homework', homeworks[index]) as Homework;
                await hw.remove()
                ctx.reply(`Завдання успішно вилучене`)
            }
        )
    })
}

/*
* export interface Homework extends Model{
    task: string,
    author: number,
    discipline: number,
    description: string,
    deadline: number
}
* */