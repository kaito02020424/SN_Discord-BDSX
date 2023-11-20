//configなど読み込み
const launcher_1 = require("bdsx/launcher");
const discord = require("bdsx-discord-module")
let config = require("./config.json")

//lang読み込み
let country;
if (config.lang === undefined || !(config.lang in { "ja": null, "en": null })) {
    country = "ja";
} else {
    country = config.lang;
}
let lang = (require("./lang.json")[country]);
//Discordクライアント作成
const client = new discord.Client(config.token, [new discord.Intents().AllIntents])

//APIロード
const api = require("./api")

//Readyイベント
let status = false;
discord.discordEventsList.Ready.on(() => {
    if (status) return
    status = true;
    const embed = new discord.EmbedBuilder()
        .setAuthor({ "name": "Server" })
        .setColor(0x00ff00)
        .setDescription(lang.open)
    client.getChannel(config.send_channelID).sendMessage({
        embeds: [embed]
    })
})
//起動を待つ
launcher_1.bedrockServer.afterOpen().then(() => {
    //BDSX系のimport
    const packetids_1 = require("bdsx/bds/packetids");
    const event_1 = require("bdsx/event");
    const bdsx_1 = require("bdsx");
    const server_1 = require("bdsx/bds/server");
    const command_1 = require("bdsx/bds/command");
    const command_2 = require("bdsx/command");
    const common_1 = require("bdsx/common");
    const nativeType = require("bdsx/nativetype")
    const cr = require("bdsx/commandresult");

    //ファイル群読み込み
    const fs = require("fs");
    const path = require("path");
    const filepath = path.resolve(__dirname, './');
    const resolved = path.resolve(__dirname, "./bin/node.exe");
    let blacklist = JSON.parse(fs.readFileSync(`${filepath}/database/blacklist.json`));
    let userinfo = JSON.parse(fs.readFileSync(`${filepath}/database/userinfo.json`));
    const node_dl = require(`${filepath}/modules/node-dl.js`);
    const did = require(`${filepath}/modules/deviceID.js`);

    discord.discordEventsList.MessageCreate.on((payload) => {
        if (payload.author.bot) return
        if (![config.send_channelID, config.OP_command.use_channelID].includes(payload.channel_id)) return;
        let message = payload.content
        //コマンドを実行する
        if (message.split(" ")[0] === `${config.discord_command.prefix}eval`) { /*.evalコマンド*/
            if (payload.channel_id != config.OP_command.use_channelID) {
                const embed = new discord.EmbedBuilder()
                    .setAuthor({ "name": "Server" })
                    .setColor(0xff0000)
                    .setDescription(lang.eval_invalidChannel)
                let sendPayload = { embeds: [embed] }
                let cancel = { cancel: false }
                api.runDiscordCommand.emit("eval", sendPayload, cancel)
                if (cancel.cancel) return;
                client.getChannel(payload.channel_id).sendMessage(sendPayload)
                return;
            }
            if (!payload.member.roles.includes(config.OP_command.roleId) || !config.OP_command.bool) {
                const embed = new discord.EmbedBuilder()
                    .setAuthor({ "name": "Server" })
                    .setColor(0xff0000)
                    .setDescription(lang.eval_err)
                let sendPayload = { embeds: [embed] }
                let cancel = { cancel: false }
                api.runDiscordCommand.emit("eval", sendPayload, cancel)
                if (cancel.cancel) return;
                client.getChannel(payload.channel_id).sendMessage(sendPayload)
                return;
            }
            if (message.split(" ").length < 2) {
                const embed = new discord.EmbedBuilder()
                    .setAuthor({ "name": "Server" })
                    .setColor(0xff0000)
                    .setDescription(lang.arg_err)
                let sendPayload = { embeds: [embed] }
                let cancel = { cancel: false }
                api.runDiscordCommand.emit("eval", sendPayload, cancel)
                if (cancel.cancel) return;
                client.getChannel(payload.channel_id).sendMessage(sendPayload)
                return;
            }
            if (launcher_1.bedrockServer.isClosed()) return;
            const res = launcher_1.bedrockServer.executeCommand(message.split(" ").slice(1).join(" "), cr.CommandResultType.OutputAndData);
            const embed = new discord.EmbedBuilder()
                .setAuthor({ "name": res.data.statusCode === 0 ? "Success" : "Error" })
                .setColor(res.data.statusCode === 0 ? 0x00ff00 : 0xff0000)
                .setDescription(res.data.statusMessage === null || res.data.statusMessage === undefined || !typeof res.data.statusMessage === "string" ? "(null)" : res.data.statusMessage.length > 4000 ? `${res.data.statusMessage.substr(0, 4000)}...` : res.data.statusMessage)
            let sendPayload = { embeds: [embed] }
            let cancel = { cancel: false }
            api.runDiscordCommand.emit("eval", sendPayload, cancel)
            if (cancel.cancel) return;
            client.getChannel(payload.channel_id).sendMessage(sendPayload)
            console.log(`[Discord-BDSX]${payload.author.username} executed: ${message.split(" ").slice(1).join(" ")}`)
            return
        } else if (message.split(" ")[0] === `${config.discord_command.prefix}list`) { /*.listコマンド*/
            //listを送る
            if (launcher_1.bedrockServer.isClosed()) return;
            let m = [];
            for (const player of server_1.serverInstance.getPlayers()) {
                m.push(api.dbchatFormatter.username(player.getName()));
            }
            let c = "";
            for (const player of m) {
                c += `${player}\n`;
            }
            const embed = new discord.EmbedBuilder()
                .setAuthor({ "name": "Server" })
                .setColor(0x0000ff)
                .setDescription(c.length == 0 ? lang.no_player : c.length > 4000 ? `${c.substr(0, 4000)}...` : c)
                .setFooter({ text: `${server_1.serverInstance.getPlayers().length}/${server_1.serverInstance.getMaxPlayers()}` })
            let sendPayload = { embeds: [embed] }
            let cancel = { cancel: false }
            api.runDiscordCommand.emit("list", sendPayload, cancel)
            if (cancel.cancel) return;
            client.getChannel(payload.channel_id).sendMessage(sendPayload)
            return
        } else if (message.split(" ")[0] === `${config.discord_command.prefix}userinfo`) { /*.userinfoコマンド*/
            if (!payload.member.roles.includes(config.OP_command.roleId) || !config.OP_command.bool) {
                const embed = new discord.EmbedBuilder()
                    .setAuthor({ "name": "Server" })
                    .setColor(0xff0000)
                    .setDescription(lang.userinfo_per_err)
                let sendPayload = { embeds: [embed] }
                let cancel = { cancel: false }
                api.runDiscordCommand.emit("userinfo", sendPayload, cancel)
                if (cancel.cancel) return;
                client.getChannel(payload.channel_id).sendMessage(sendPayload)
                return;
            }
            if (message.split(" ").length < 2) {
                const embed = new discord.EmbedBuilder()
                    .setAuthor({ "name": "Server" })
                    .setColor(0xff0000)
                    .setDescription(lang.userinfo_arg_err)
                let sendPayload = { embeds: [embed] }
                let cancel = { cancel: false }
                api.runDiscordCommand.emit("userinfo", sendPayload, cancel)
                if (cancel.cancel) return;
                client.getChannel(payload.channel_id).sendMessage(sendPayload)
                return;
            }
            const userinfo = require("./database/userinfo.json")
            if (message.split(" ")[1] in userinfo) {
                const username = message.split(" ")[1]
                const embed = new discord.EmbedBuilder()
                    .setAuthor({ "name": "User Info" })
                    .setColor(0x0000ff)
                    .setDescription(`**NameTag**:\n${username}\n**XUID**:\n${userinfo[username]["xuid"]}\n**DeviceID**:\n${userinfo[username]["deviceId"]}\n**DeviceType**:\n${userinfo[username]["deviceType"]}`)
                let sendPayload = { embeds: [embed] }
                let cancel = { cancel: false }
                api.runDiscordCommand.emit("userinfo", sendPayload, cancel)
                if (cancel.cancel) return;
                client.getChannel(payload.channel_id).sendMessage(sendPayload)
            } else {
                const embed = new discord.EmbedBuilder()
                    .setAuthor({ "name": "Server" })
                    .setColor(0xff0000)
                    .setDescription(lang.userinfo_not_found)
                let sendPayload = { embeds: [embed] }
                let cancel = { cancel: false }
                api.runDiscordCommand.emit("userinfo", sendPayload, cancel)
                if (cancel.cancel) return;
                client.getChannel(payload.channel_id).sendMessage(sendPayload)
            }
            return
        } else if (message.split(" ")[0] === `${config.discord_command.prefix}ping`) { /*.pingコマンド*/
            if (!(config.discord_command.bool)) {
                const embed = new discord.EmbedBuilder()
                    .setAuthor({ "name": "Server" })
                    .setColor(0xff0000)
                    .setDescription(lang.disabled)
                let sendPayload = { embeds: [embed] }
                let cancel = { cancel: false }
                api.runDiscordCommand.emit("ping", sendPayload, cancel)
                if (cancel.cancel) return;
                client.getChannel(payload.channel_id).sendMessage(sendPayload);
                return;
            }
            const embed = new discord.EmbedBuilder()
                .setAuthor({ "name": "Server" })
                .setColor(0x00ff00)
                .setDescription("**Pong!**")
            let sendPayload = { embeds: [embed] }
            let cancel = { cancel: false }
            api.runDiscordCommand.emit("ping", sendPayload, cancel)
            if (cancel.cancel) return;
            client.getChannel(payload.channel_id).sendMessage(sendPayload);
            return;
        } else if (message.split(" ")[0] === `${config.discord_command.prefix}info`) {　/*.infoコマンド*/
            if (!(config.discord_command.bool)) {
                const embed = new discord.EmbedBuilder()
                    .setAuthor({ "name": "Server" })
                    .setColor(0xff0000)
                    .setDescription(lang.disabled)
                let sendPayload = { embeds: [embed] }
                let cancel = { cancel: false }
                api.runDiscordCommand.emit("info", sendPayload, cancel)
                if (cancel.cancel) return;
                client.getChannel(payload.channel_id).sendMessage(sendPayload);
                return;
            }
            const embed = new discord.EmbedBuilder()
                .setAuthor({ "name": "Plugin Info" })
                .setColor(0x00ff00)
                .setDescription(`${lang.info[0]}${require("./lang.json").author}\n${lang.info[1]}${require("./lang.json").version}`)
            let sendPayload = { embeds: [embed] }
            let cancel = { cancel: false }
            api.runDiscordCommand.emit("info", sendPayload, cancel)
            if (cancel.cancel) return;
            client.getChannel(payload.channel_id).sendMessage(sendPayload);
            return;
        } else {
            //チャットコンソールで.から始まる通常チャットを遮断
            if (payload.content.startsWith(".")) return;
            let cancel = { cancel: false }
            api.postMessageToMinecraft.emit(payload, cancel)
            message = payload.content
            if (cancel.cancel) return
            //コマンドじゃない場合、チャット送信
            launcher_1.bedrockServer.executeCommand(`tellraw @a {"rawtext":[{"text":"[Discord][${payload.author.username.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}§r] ${message.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}§r"}]}`, cr.CommandResultType.Mute);
        }
    });
    let lastTime = 0
    event_1.events.levelTick.on(() => {
        if (Date.now() - lastTime > 15 * 1000) {
            client.getChannel(config.topicChannelId).changeTopic(`${lang.status[0]}${launcher_1.bedrockServer.serverInstance.getPlayers().length}/${launcher_1.bedrockServer.serverInstance.getMaxPlayers()}\n${lang.status[1]}${launcher_1.bedrockServer.serverInstance.getMotd()}\n${lang.status[2]}${launcher_1.bedrockServer.serverInstance.getGameVersion().fullVersionString}\n`)
            lastTime = Date.now()
        }
    })

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
    //未処理のエラーのキャッチ
    process.on('unhandledRejection', error => {
        console.log('[Discord-BDSX]:ERROR!\nError Log:\n', error);
    });
    process.on('uncaughtException', error => {
        console.log('[Discord-BDSX]:ERROR!\nError Log:\n', error);
    });
    //チャット受信
    event_1.events.packetBefore(packetids_1.MinecraftPacketIds.Text).on(ev => {
        let sendChannelId = config.send_channelID
        if (!status) return;
        if (api.dbchatFormatter.username(ev.name) in blacklist) {
            return;
        }
        if (ev.message.startsWith(config.tnacPrefix)) return;
        if ((ev.message.startsWith("!") && (!launcher_1.bedrockServer.level.getPlayerByXuid(ev.xboxUserId).hasTag(config.teamChatSettings.tagName) ^ config.teamChatSettings.allowReverseMode)) || (!ev.message.startsWith("!") && (launcher_1.bedrockServer.level.getPlayerByXuid(ev.xboxUserId).hasTag(config.teamChatSettings.tagName) ^ config.teamChatSettings.allowReverseMode))) {
            if (launcher_1.bedrockServer.level.getPlayerByXuid(ev.xboxUserId).hasTag("red") || launcher_1.bedrockServer.level.getPlayerByXuid(ev.xboxUserId).hasTag("blue") || launcher_1.bedrockServer.level.getPlayerByXuid(ev.xboxUserId).hasTag("yellow") || launcher_1.bedrockServer.level.getPlayerByXuid(ev.xboxUserId).hasTag("lime"))
                sendChannelId = config.OP_command.use_channelID
        }
        if (ev.message.length > 4000) {
            let payload = {
                embeds: [
                    {
                        author: {
                            name: api.dbchatFormatter.username(ev.name)
                        },
                        description: `${ev.message.substr(0, 4000)}...`,
                        color: 0x0000ff
                    }
                ]
            }
            let cancel = { cancel: false }
            api.postMessageToDiscord.emit(ev, payload, sendChannelId, cancel)
            if (cancel.cancel) return
            client.getChannel(sendChannelId).sendMessage(payload)
            return;
        }
        let payload = {
            embeds: [
                {
                    author: {
                        name: api.dbchatFormatter.username(ev.name)
                    },
                    description: ev.message,
                    color: 0x0000ff
                }
            ]
        }
        let cancel = { cancel: false }
        api.postMessageToDiscord.emit(ev, payload, sendChannelId, cancel)
        if (cancel.cancel) return
        client.getChannel(sendChannelId).sendMessage(payload)
    });
    //JOINイベント
    event_1.events.playerJoin.on((ev) => {
        if (!status) return;
        const player = ev.player;
        const username = api.dbchatFormatter.username(player.getName());
        //変なログインを検知する。
        if (!(username === undefined || username === "undefined")) {
            let payload = {
                embeds: [
                    {
                        author: {
                            name: `${username}${lang.join}`
                        },
                        color: 0x00ff00
                    }
                ]
            }
            let cancel = { cancel: false }
            api.playerJoin.emit(ev.player, payload, cancel)
            if (cancel.cancel) return
            client.getChannel(config.send_channelID).sendMessage(payload)
            userinfo[username] = { "ip": player.getNetworkIdentifier().getAddress(), "xuid": player.getXuid(), "deviceId": did.parse(player.deviceId), "deviceType": common_1.BuildPlatform[player.getPlatform()] || "Unknown" }
            fs.writeFileSync(`${filepath}/database/userinfo.json`, JSON.stringify(userinfo, null, 4));
        }
    })
    //LEFTイベント
    event_1.events.playerLeft.on((ev) => {
        if (!status) return;
        const id = api.dbchatFormatter.username(ev.player.getName());
        let payload = {
            embeds: [
                {
                    author: {
                        name: `${id}${lang.leave}`
                    },
                    color: 0xff0000
                }
            ]
        }
        let cancel = { cancel: false }
        api.playerLeft.emit(ev.player, payload, cancel)
        if (cancel.cancel) return
        client.getChannel(config.send_channelID).sendMessage(payload)
        
    });
    //server leaveイベント
    event_1.events.serverLeave.on(() => {
        const embed = new discord.EmbedBuilder()
            .setAuthor({ name: "Server" })
            .setDescription(lang.close)
            .setColor(0xff0000)
        client.getChannel(config.send_channelID).sendMessage({ embeds: [embed] }).finally(() => {
            client.disconnect()
            console.log("[Discord-BDSX] Disconnect")
        })
    })
    //backup イベント
    //kaito02020424/BDSX-Backup想定
    if (config.allowBackupLog) {
        const { backupApi } = require("@bdsx/BDSX-Backup/api");
        backupApi.on("startBackup", () => {
            client.getChannel(config.send_channelID).sendMessage({
                embeds: [
                    {
                        author: {
                            name: "Server"
                        },
                        description: lang.startBackup,
                        color: 0x0000ff
                    }
                ]
            })
        });
        backupApi.on("finishBackup", () => {
            client.getChannel(config.send_channelID).sendMessage({
                embeds: [
                    {
                        author: {
                            name: "Server"
                        },
                        description: lang.finishBackup,
                        color: 0x0000ff
                    }
                ]
            })
        })
    }
    //コマンド登録(overloadで複数の引数を指定)
    const dbchat = command_2.command.register("dbchat", "Discord-BDSX configs setting.", command_1.CommandPermissionLevel.Operator);
    dbchat.overload(
        (param, origin, output) => {
            if (param.mode === "reload") {
                reload();
                if (!status) return;
                output.success("success!");
                return;
            } else {
                output.error("Bad argument.");
            }
        },
        {
            mode: command_2.command.enum("reload", { reload: "reload" })
        },
    );
    dbchat.overload(
        (param, origin, output) => {
            if (param.mode === "blacklist") {
                for (const player of server_1.serverInstance.getPlayers()) {
                    if (api.dbchatFormatter.username(player.getName()) === param.username.getName()) {
                        if (api.dbchatFormatter.username(player.getName()) in blacklist) {
                            output.error("It has already been registered.");
                        } else {
                            blacklist[api.dbchatFormatter.username(player.getName())] = true;
                            fs.writeFileSync(`${filepath}/database/blacklist.json`, JSON.stringify(blacklist, null, 4));
                            output.success("success!");
                        }
                        return;
                    }
                }
                output.error("User not found.");
            } else {
                output.error("Bad argument.");
            }
        }, {
        mode: command_2.command.enum("blacklist", { blacklist: "blacklist" }),
        motion: command_2.command.enum("add-list", { add: "add" }),
        username: command_1.ActorCommandSelector
    }
    );
    dbchat.overload(
        (param, origin, output) => {
            if (param.mode === "blacklist") {
                if (param.username.getName() in blacklist) {
                    delete blacklist[param.username.getName()];
                    fs.writeFileSync(`${filepath}/database/blacklist.json`, JSON.stringify(blacklist, null, 4));
                    output.success("success!");
                } else {
                    output.error("User is not blacklisted.");
                }
                return;
            } else {
                output.error("Bad argument.");
            }
        }, {
        mode: command_2.command.enum("blacklist", { blacklist: "blacklist" }),
        motion: command_2.command.enum("remove", { remove: "remove" }),
        username: command_1.ActorCommandSelector
    }
    );
    dbchat.overload(
        (param, origin, output) => {
            if (param.mode === "blacklist") {
                let m = "Blacklisted users:\n";
                let c = 0;
                for (const t in blacklist) {
                    c++;
                    m += `${c}. ${t}\n`;
                }
                output.success(m);
            } else {
                output.error("Bad argument.");
            }
        }, {
        mode: command_2.command.enum("blacklist", { blacklist: "blacklist" }),
        motion: command_2.command.enum("list", { list: "list" })
    });
    dbchat.overload((param, origin, output) => {
        if (param.mode === "sendchat") {
            const message = param.message.length > 4000 ? param.message.substr(0, 4000) : param.message
            const sendChannelId = param.sendChannel == "main" ? config.send_channelID : config.OP_command.use_channelID
            const color = param.R * (256 ** 2) + param.G * (256 ** 1) + param.B * (256 ** 0)
            if (color > 0xffffff || color < 0) return output.error("カラーコードの値の範囲を超えています。")
            let payload = {
                embeds: [
                    {
                        author: {
                            name: param.embedName
                        },
                        description: message,
                        color: color,
                    }
                ]
            }
            if (param.addTimeStamp) {
                payload.embeds[0].timestamp = new Date().toISOString()
            }
            client.getChannel(sendChannelId).sendMessage(payload)
            return output.success("正常に送信されました。");
        }
    }, {
        mode: command_2.command.enum("sendchat", { sendchat: "sendchat" }),
        sendChannel: command_2.command.enum("channels", "main", "sub"),
        R: nativeType.int32_t,
        G: nativeType.int32_t,
        B: nativeType.int32_t,
        embedName: nativeType.CxxString,
        message: nativeType.CxxString,
        addTimeStamp: nativeType.bool_t
    }
    )
});

//wsに接続
client.connect()
