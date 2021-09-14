import { registerCommands } from './src/registerCommands';
import { config } from 'dotenv';
import { Telegraf } from 'telegraf'
config();

const TOKEN = process.env.BOT_TOKEN

console.log({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USERNAME || 'root',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    password: process.env.DB_PASSWORD
})

if(!TOKEN){
    console.error('TOKEN is required for that application in .env file!');

    process.exit()
}

const bot = new Telegraf(TOKEN);

registerCommands(bot);



bot.launch().then(() => {
    console.log('Bot started successfully!');   
})