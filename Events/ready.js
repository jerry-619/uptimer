// Events/ready.js
const { EmbedBuilder } = require("discord.js");
const os = require("os");
const { config } = require("../config.json");

module.exports = async (client) => {
    try {
        const statsChannel = await client.channels.fetch("927189202033070080");
        if (!statsChannel || !statsChannel.isTextBased()) return console.warn("Stats channel not found or invalid.");

        await statsChannel.bulkDelete(10).catch(console.warn);

        const initEmbed = new EmbedBuilder()
            .setColor("#2F3136")
            .setDescription("Please wait a moment...\nStatus is being initialized.");

        const statusMsg = await statsChannel.send({ embeds: [initEmbed] });

        setInterval(() => {
            let nodeStats = client.manager.nodes.map((node) => {
                const { connected, options, stats } = node;

                return [
                    `Status: ${connected ? "💚 Connected" : "🔴 Disconnected"}`,
                    `Node: ${options.identifier}`,
                    `Players: ${stats.players}`,
                    `Playing: ${stats.playingPlayers}`,
                    `Uptime: ${new Date(stats.uptime).toISOString().slice(11, 19)}`,
                    `\nCPU Stats:`,
                    `• Cores: ${stats.cpu.cores}`,
                    `• System Load: ${(stats.cpu.systemLoad * 100).toFixed(2)}%`,
                    `• Lavalink Load: ${(stats.cpu.lavalinkLoad * 100).toFixed(2)}%`
                ].join('\n');
            }).join('\n\n──────────────\n');

            const memoryUsage = process.memoryUsage();
            const cpuInfo = os.cpus()[0];

            const sysStats = [
                `Total Memory  : ${Math.round(os.totalmem() / 1024 / 1024)} MB`,
                `Free Memory   : ${Math.round(os.freemem() / 1024 / 1024)} MB`,
                `RSS           : ${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
                `Heap Total    : ${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
                `Heap Used     : ${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
                `External      : ${Math.round(memoryUsage.external / 1024 / 1024)} MB`,
                `CPU Model     : ${cpuInfo.model}`,
                `Cores         : ${os.cpus().length}`,
                `Speed         : ${cpuInfo.speed} MHz`,
                `Platform      : ${process.platform}`,
                `PID           : ${process.pid}`
            ];

            const statsEmbed = new EmbedBuilder()
                .setAuthor({ name: 'Lavalink Node Stats', iconURL: client.user.displayAvatarURL() })
                .setDescription(`\`\`\`prolog\n${nodeStats}\n\n${sysStats.join('\n')}\`\`\``)
                .setColor("#2F3136")
                .setTimestamp();

            statusMsg.edit({ embeds: [statsEmbed] }).catch(console.warn);
        }, 10000);

        client.manager.init(client.user.id);
        console.log(`${client.user.username} is online and ready!`);
    } catch (error) {
        console.error("Error during bot ready/setup:", error);
    }
};
