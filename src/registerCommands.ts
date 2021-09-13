import { Telegraf } from "telegraf";
import { startHandler } from './start';
import {startPromptHandler} from "./promptManager";
import {startLectureHandler} from "./lecture";
import {startDisciplineHandlers} from "./discipline";
import {registerSelectHandler} from "./select";
import {startHomeworkHandlers} from "./homework";

export const registerCommands = ( bot: Telegraf ) => {
    startHandler(bot);
    startLectureHandler(bot);
    startDisciplineHandlers(bot);
    startHomeworkHandlers(bot);

    registerSelectHandler(bot);
    startPromptHandler(bot); //have to be in the end!!!
}