const fs = require("fs");
const path = require("path");
const filepath = path.resolve(__dirname, './');
let config = JSON.parse(fs.readFileSync(`${filepath}/config.json`));
let country;
if (config.lang === undefined || !(config.lang in { "ja": null, "en": null })) {
    country = "ja";
} else {
    country = config.lang;
}
let lang = JSON.parse(fs.readFileSync(`${filepath}/lang.json`))[country];
let info = { "version": JSON.parse(fs.readFileSync(`${filepath}/lang.json`)).version, "author": JSON.parse(fs.readFileSync(`${filepath}/lang.json`)).author }


//reload function
function reload() {
    config = JSON.parse(fs.readFileSync(`${filepath}/config.json`));
    if (config.lang === undefined || !(config.lang in { "ja": null, "en": null })) {
        country = "ja";
    } else {
        country = config.lang;
    }
    lang = JSON.parse(fs.readFileSync(`${filepath}/lang.json`))[country];
}

const { Client, GatewayIntentBits, EmbedBuilder, underscore } = require('discord.js');
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessages]
});
client.on('ready', () => {
    process.send(["log", 'Discord bot Login!']);
    const embed = new EmbedBuilder()
        .setAuthor({ "name": "Server" })
        .setColor(0x00ff00)
        .setDescription(lang.open)
    client.channels.cache.get(config.send_channelID).send({ embeds: [embed] });
});
client.on('messageCreate', message => {
    if (message.author.bot) return;//Bot無視
    if (message.channel.id === config.send_channelID) {
        //.evalコマンド
        if (message.content.substr(0, `${config.discord_command.prefix}eval`.length + 1) === `${config.discord_command.prefix}eval `) {
            if (!(message.member.roles.cache.has(config.OP_command.roleId) && config.OP_command.bool)) {
                const embed = new EmbedBuilder()
                    .setAuthor({ "name": "Server" })
                    .setColor(0xff0000)
                    .setDescription(lang.eval_err)
                message.channel.send({ embeds: [embed] })
                return;
            }
            if (message.content.length > `${config.discord_command.prefix}eval`.length + 1) {
                process.send(["command", message.content.substr(`${config.discord_command.prefix}eval`.length + 1), "data"]);
                process.send(["log", `[Discord-BDSX]${message.author.username} executed: ${message.content.substr(`${config.discord_command.prefix}eval`.length + 1)}`]);
            } else {
                const embed = new EmbedBuilder()
                    .setAuthor({ "name": "Server" })
                    .setColor(0xff0000)
                    .setDescription(lang.arg_err)
                message.channel.send({ embeds: [embed] });
            }
            return;
        }else if (message.content.substr(0, `${config.discord_command.prefix}userinfo`.length + 1) === `${config.discord_command.prefix}userinfo `){
            //.userinfoコマンド
            const userinfo = JSON.parse(fs.readFileSync(`${filepath}/database/userinfo.json`));
            if (!(message.member.roles.cache.has(config.OP_command.roleId) && config.OP_command.bool)) {
                const embed = new EmbedBuilder()
                    .setAuthor({ "name": "Server" })
                    .setColor(0xff0000)
                    .setDescription(lang.userinfo_per_err)
                message.channel.send({ embeds: [embed] })
                return;
            }
            if (message.content.length <= `${config.discord_command.prefix}userinfo`.length + 1) {
                const embed = new EmbedBuilder()
                    .setAuthor({ "name": "Server" })
                    .setColor(0xff0000)
                    .setDescription(lang.userinfo_arg_err)
                message.channel.send({ embeds: [embed] });
                return;
            }
            if (message.content.substr(`${config.discord_command.prefix}userinfo`.length + 1) in userinfo){
                const username = message.content.substr(`${config.discord_command.prefix}userinfo`.length + 1);
                const embed = new EmbedBuilder()
                    .setAuthor({ "name": "User Info" })
                    .setColor(0x0000ff)
                    .setDescription(`**NameTag**:\n${username}\n**XUID**:\n${userinfo[username]["xuid"]}\n**DeviceID**:\n${userinfo[username]["device"]}`)
                message.channel.send({ embeds: [embed] });
            } else {
                const embed = new EmbedBuilder()
                    .setAuthor({ "name": "Server" })
                    .setColor(0xff0000)
                    .setDescription(lang.userinfo_not_found)
                message.channel.send({ embeds: [embed] });
            }
            return;
        }
        //.listコマンド
        if (config.discord_command.bool && message.content == config.discord_command.prefix + "list") {
            process.send(["list"])
            return;
            //.pingコマンド
        } else if (config.discord_command.bool && message.content == config.discord_command.prefix + "ping") {
            const embed = new EmbedBuilder()
                .setAuthor({ "name": "Server" })
                .setColor(0x00ff00)
                .setDescription("**Pong!**")
            message.channel.send({ embeds: [embed] });
            return;
            //.infoコマンド
        } else if (config.discord_command.bool && message.content == config.discord_command.prefix + "info") {
            const embed = new EmbedBuilder()
                .setAuthor({ "name": "Plugin Info" })
                .setColor(0x00ff00)
                .setDescription(`${lang.info[0]}${info.author}\n${lang.info[1]}${info.version}`)
            message.channel.send({ embeds: [embed] });
            return;
        }
        //コマンドじゃない場合、チャット送信
        process.send(["command", `tellraw @a {"rawtext":[{"text":"[Discord][${message.author.username.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}] ${message.content.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"}]}`, "mute"]);
    } else {
    }
});
;
process.on('unhandledRejection', error => {
    console.log('[Discord-BDSX]:ERROR!\nError Log:\n', error);
});
process.on('uncaughtException', (err) => {
    console.log('[Discord-BDSX]:ERROR!\nError Log:\n', err);
});
process.on('message', (message) => {
    if (message[0] === "message") {
        let embed;
        if (message[1].embed.author.name === undefined) {
            embed = new EmbedBuilder()
                .setAuthor({ "name": "undefined" })
                .setColor(message[1].embed.color)
                .setDescription(message[1].embed.description)
        } else {
            embed = new EmbedBuilder()
                .setAuthor({ "name": message[1].embed.author.name })
                .setColor(message[1].embed.color)
                .setDescription(message[1].embed.description)
        }
        client.channels.cache.get(config.send_channelID).send({ embeds: [embed] });
    } else if (message[0] === "res") {
        let res = message[1];
        if (res.statusMessage === null || res.statusMessage === undefined || !typeof res.statusMessage === "string") {
            const embed = new EmbedBuilder()
                .setAuthor({ "name": "Server" })
                .setColor(0x00ff00)
                .setDescription("(null)")
            client.channels.cache.get(config.send_channelID).send({ embeds: [embed] });
            return;
        }
        if (res.statusMessage.length > 4000) {
            const embed = new EmbedBuilder()
                .setAuthor({ "name": "Server" })
                .setColor(0x00ff00)
                .setDescription(`${res.statusMessage.substr(0, 4000)}...`)
            client.channels.cache.get(config.send_channelID).send({ embeds: [embed] });
            return;
        }
        const embed = new EmbedBuilder()
            .setAuthor({ "name": "Server" })
            .setColor(0x00ff00)
            .setDescription(res.statusMessage)
        client.channels.cache.get(config.send_channelID).send({ embeds: [embed] });
    } else if (message[0] === "list") {
        let nowlist = message[1];
        let c = "";
        for (const player of nowlist) {
            c += `${player}\n`;
        }
        if (c.length == 0) {
            const embed = new EmbedBuilder()
                .setAuthor({ "name": "Server" })
                .setColor(0x0000ff)
                .setDescription(lang.no_player)
            client.channels.cache.get(config.send_channelID).send({ embeds: [embed] });
            return;
        }
        const embed = new EmbedBuilder()
            .setAuthor({ "name": "Server" })
            .setColor(0x0000ff)
            .setDescription(c)
        client.channels.cache.get(config.send_channelID).send({ embeds: [embed] });
    } else if (message[0] === "reload") {
        reload()

    }
});
client.login(config.token);
