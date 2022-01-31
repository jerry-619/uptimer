console.clear()
require('dotenv').config();
const {nodes, config, token, prefix } = require("./config.json");
const {
    Client,
    Collection,
    Intents,
    MessageActionRow,
    MessageButton,
    MessageEmbed,
    MessageSelectMenu,  
} = require("discord.js");
const chalk = require("chalk");
const db = require("quick.db");
const keepAlive = require('./server');

const { readdirSync } = require("fs");

const { Manager } = require("erela.js");
const moment = require("moment")

const { PresenceUpdateStatus } = require("discord-api-types/v9");
const { Presence } = require("discord.js");

const client = new Client({
    disableMentions: "everyone",
    partials: ['MESSAGE', 'CHANNEL', 'REACTION'],
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES]
});

client.on("presenceUpdate", async (oldPresence, newPresence) => {
  if (!config.logger.enabled) return;
    if (!newPresence.user.bot.ID == "929716436107145226") return;
  try
    {
      if (config.logger.bots && !config.logger.humans) {
       
        if (!oldPresence || !oldPresence.user.bot) return;
        } else if (!config.logger.bots && config.logger.humans) {
          if (!oldPresence || oldPresence.user.bot) return;
        }
        if (oldPresence.status == newPresence.status || oldPresence.status == "dnd" && newPresence.status == 'idle' || oldPresence.status == "idle" && newPresence.status == 'dnd' || oldPresence.status == "online" && newPresence.status == 'dnd' || oldPresence.status == "online" && newPresence.status == 'idle') return;

        if (config.server_id)
        {
 
            if (newPresence.status == PresenceUpdateStatus.Online || newPresence.status == "dnd" || newPresence.status == "idle")
            {
                newPresence.guild.channels.cache.get(config.logger.channel_id).send({
                    embeds: [new MessageEmbed()
                    .setTitle(`︱Uptime Alert`)
                    .setDescription(`Looks like **${newPresence.user.tag}** is back **Online! **`)
                    
                    .setColor(`GREEN`)
                    .setThumbnail(newPresence.user.avatarURL({ format: "png", size: 1024 }))
                    .setFooter(`Uptime Alert`, newPresence.user.avatarURL({ format: "png", size: 1024 }))
                    .setTimestamp()]
                });
            }

            
            else if (newPresence.status == PresenceUpdateStatus.Offline || newPresence.status == PresenceUpdateStatus.Invisible)
            {
                newPresence.guild.channels.cache.get(config.logger.channel_id).send({
                    embeds: [new MessageEmbed()
                    .setTitle(` ︱Downtime Alert`)
                    .setDescription(`Looks like **${newPresence.user.tag}** went **Offline! **`)
                    .setColor(`RED`)
                    .setThumbnail(newPresence.user.avatarURL({ format: "png", size: 1024 }))
                    .setFooter(`Downtime Alert`, newPresence.user.avatarURL({ format: "png", size: 1024 }))
                    .setTimestamp()]
                });
            }
        }
        } 
    catch (err)
    {
        console.log(`[Error] - ${err.message}`)
    }
});


    

    

    



client.on("messageCreate", async (message) => {

if (message.author.bot || !message.guild) return;
  let args = message.content.toLowerCase().split(" ");
  let command = args.shift()
  let prefix = "!"
  if ( command == prefix + "ping")
 return message.channel.send('Pong! (~ ' + client.ping + 'ms)');

 const staffembed = new MessageEmbed()
  if (command == prefix + "staff-online") {
const status = db.get(`status_${message.author.id}`)
if (status || status != null || status != undefined) {
staffembed.setDescription(`** You were already on duty. Your duty time started <t:${status}:R> - Staff ID - \`${message.author.id}\` **`)
staffembed.setColor("RED")
return message.channel.send({ embeds: [staffembed] });
} else {
  db.set(`status_${message.author.id}`, Math.floor(new Date().getTime()/1000.0))
  staffembed.setTitle(`You are now on duty. Your duty time has started - Staff ID - \`${message.author.id}\``)
  staffembed.setColor("GREEN")
  message.channel.send({ embeds: [staffembed] });
  return message.guild.channels.cache.get(config.staff_system.channel_id).send({ embeds: [staffembed] });
}
  }

  if (command == prefix + "staff-offline") {
const status = db.get(`status_${message.author.id}`)
if (status || status != null || status != undefined) {
  await db.delete(`status_${message.author.id}`)
staffembed.setDescription(`** Your duty ended - Total duty time - ${(moment(Math.floor(new Date(status) * 1000.0 )).fromNow()).replace('ago', '')} - Staff ID - \`${message.author.id}\` **`)
staffembed.setColor("RED")
message.channel.send({ embeds: [staffembed] });
return message.guild.channels.cache.get(config.staff_system.channel_id).send({ embeds: [staffembed] });
} else {
 
  staffembed.setTitle(`You need to start the duty to end it!`)
  staffembed.setColor("RED")
  return message.channel.send({ embeds: [staffembed] });
}
  }
});


/*async function checktoken(token){
  if (!token) {
       console.log(chalk.redBright(`NO TOKEN PROVIDED`))
      process.exit()
    }
    
    if(token.length != "NzQ4MDg3OTA3NTE2MTUzODg5.X0YVJw.Wk6lEEwy158ZQ3wvKx3uvdnoWGA".length) {
      console.log(chalk.redBright(`INAVLID TOKEN`))
      process.exit()
    }
    
  
  try {
    await testclient.login(token)
    testclient.on("ready", () => {
      console.log(chalk.greenBright(`Token Check Passed`))
      testclient.destroy() })
  } catch {
    console.log(chalk.redBright("INVALID TOKEN"))
    process.exit()
  }
}*/
/*let testclient = new Client({

   disableMentions: "everyone",

    partials: ['MESSAGE', 'CHANNEL', 'REACTION'],

    ws: { intents: Intents.ALL }

});*/

client.manager = new Manager({

        nodes,

        send: (id, payload) => {

        const guild = client.guilds.cache.get(id);

        if (guild) guild.shard.send(payload);

    },

});

  

readdirSync("./Events/").forEach(file => {

    const event = require(`./Events/${file}`);

    let eventName = file.split(".")[0];

    console.log(`Loading Events Client ${eventName}`, "event");

    client.on(eventName, event.bind(null, client));

});


/*checktoken(config.token)
async function configcheck(config) {
  if (!config.server_id || !config.logger.channel_id || !config.staff_system.channel_id || !config.status.name || !config.status.type || !config.port || !config.prefix) {
    console.log(chalk.redBright("Fill botconfig.js"))
    return true;
    } else {
      console.log(chalk.greenBright(`Config Check Passed`))
      return false;
    }
}

let goodconfig = configcheck(config)

if(!goodconfig) {
   process.exit()
   return;
 }*/

/*client.on('ready', async () => {
    console.log(chalk.greenBright(`Logging in to bot...`))
  
  console.log(chalk.bgRed(chalk.greenBright(`Logged into ${client.user.username}`)))

  client.user.setActivity(config.status.name, { type: config.status.type.toUpperCase() })

  if (config.ExpressServer) {
const express = require('express')
const app = express()
 
app.get('/', function (req, res) {
  res.send({
  Working: "online"
  })
})
 console.log(chalk.greenBright(`Web Server Started`))
app.listen(config.port)
}
});*/
keepAlive();
client.login(token)
