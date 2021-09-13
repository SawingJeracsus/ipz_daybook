import { registerCommands } from './src/registerCommands';
import { config } from 'dotenv';
import { Telegraf } from 'telegraf'
config();

const TOKEN = process.env.BOT_TOKEN

if(!TOKEN){
    console.error('TOKEN is required for that application in .env file!');

    process.exit()
}

const bot = new Telegraf(TOKEN);

registerCommands(bot);



bot.launch().then(() => {
    console.log('Bot started successfully!');   
})