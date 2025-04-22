// index.js
console.clear();
require('dotenv').config();
const { Client, GatewayIntentBits, Partials, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, ActivityType, Events } = require("discord.js");
const chalk = require("chalk");
const { Manager } = require("erela.js");
const moment = require("moment");
const db = require("quick.db");
const fs = require("fs");
const keepAlive = require('./server');

const { nodes, config, token, prefix } = require("./config.json");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.MessageContent
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

// === Presence Update Alert ===
client.on("presenceUpdate", async (oldPresence, newPresence) => {
    try {
        if (!config.logger.enabled) return;
        if (newPresence?.userId !== "929716436107145226") return;

        const statusChanged = oldPresence?.status !== newPresence?.status;
        if (!statusChanged) return;

        const guild = client.guilds.cache.get(config.server_id);
        const channel = guild?.channels.cache.get(config.logger.channel_id);
        if (!channel) return;

        const embed = new EmbedBuilder()
            .setThumbnail(newPresence.user.displayAvatarURL({ extension: "png", size: 1024 }))
            .setFooter({ text: `${statusChanged ? 'Presence Alert' : ''}`, iconURL: newPresence.user.displayAvatarURL({ extension: "png" }) })
            .setTimestamp();

        if (["online", "idle", "dnd"].includes(newPresence.status)) {
            embed.setColor("Green")
                .setTitle(`︱Uptime Alert`)
                .setDescription(`**${newPresence.user.tag}** is now **Online!**`);
        } else if (["offline", "invisible"].includes(newPresence.status)) {
            embed.setColor("Red")
                .setTitle(`︱Downtime Alert`)
                .setDescription(`**${newPresence.user.tag}** has gone **Offline!**`);
        } else return;

        channel.send({ embeds: [embed] });
    } catch (error) {
        console.error(`[Presence Error]`, error);
    }
});

// === Message Commands ===
client.on("messageCreate", async (message) => {
    if (message.author.bot || !message.guild) return;

    const args = message.content.trim().split(/\s+/);
    const cmd = args.shift().toLowerCase();

    if (cmd === `${prefix}ping`) {
        const embed = new EmbedBuilder()
            .setTitle('🏓 Pong!')
            .setDescription(`Latency: \`${client.ws.ping}ms\``)
            .setColor("Red")
            .setTimestamp();
        return message.reply({ embeds: [embed] });
    }

    if (cmd === `${prefix}faq`) {
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("1")
                .setEmoji("938435322990170142")
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId("2")
                .setEmoji("938435000297226291")
                .setStyle(ButtonStyle.Secondary)
        );

        const embed = new EmbedBuilder()
            .setDescription(">>> 1️⃣ How to invite Moozik?\n2️⃣ How to set DJ Role in server?")
            .setColor("Red")
            .setFooter({ text: 'React below for support' });

        return message.channel.send({ embeds: [embed], components: [row] });
    }

    if (cmd === `${prefix}staff-online`) {
        const staffEmbed = new EmbedBuilder();
        const status = db.get(`status_${message.author.id}`);
        const timestamp = Math.floor(Date.now() / 1000);

        if (status) {
            staffEmbed
                .setColor("Red")
                .setDescription(`You are already on duty. Started <t:${status}:R> \nStaff ID: \`${message.author.id}\``);
        } else {
            db.set(`status_${message.author.id}`, timestamp);
            staffEmbed
                .setColor("Green")
                .setTitle(`You're now on duty!`)
                .setDescription(`Duty started: <t:${timestamp}:R>\nStaff ID: \`${message.author.id}\``);
        }

        message.channel.send({ embeds: [staffEmbed] });
        return message.guild.channels.cache.get(config.staff_system.channel_id)?.send({ embeds: [staffEmbed] });
    }
});

// === Music Manager Setup ===
client.manager = new Manager({
    nodes,
    send: (id, payload) => {
        const guild = client.guilds.cache.get(id);
        if (guild) guild.shard.send(payload);
    },
});

// === Dynamic Event Loader ===
fs.readdirSync("./Events/").forEach(file => {
    const event = require(`./Events/${file}`);
    const eventName = file.split(".")[0];
    client.on(eventName, (...args) => event(client, ...args));
});

// === Start Server + Login ===
keepAlive();
client.login(token);
