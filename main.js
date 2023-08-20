import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import ms from 'ms';

if(process.env.NODE_ENV !== 'production') {
    dotenv.config();
}

import { Client, EmbedBuilder, GatewayIntentBits, PermissionFlagsBits, REST, Routes, SlashCommandBuilder } from 'discord.js';
import Configuration from './config.js';
import Punish from './punish.js';

const config = new Configuration(path.join("data", "data.json"));

const commands = [];

async function createCommands() {

    let pingBuilder = new SlashCommandBuilder()
                        .setName("ping")
                        .setDescription("The ping command");

    commands.push(pingBuilder);

    let punishBuidler = new SlashCommandBuilder()
                        .setName("punish")
                        .setDescription("Castiga a un miembro.")
                        .addUserOption(
                            builder => builder.setName("target").setDescription("Objetivo del castigo").setRequired(true)
                        )
                        .addStringOption(builder => builder.setName("timer").setDescription("Intervalo del castigo").setRequired(true))
                            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

    commands.push(punishBuidler);

    let unPunishBuidler = new SlashCommandBuilder()
                        .setName("unpunish")
                        .setDescription("Des-Castiga a un miembro.")
                        .addUserOption(
                            builder => builder.setName("target").setDescription("Objetivo del castigo").setRequired(true)
                        )
                        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

    commands.push(unPunishBuidler);

    commands.map(command => command.toJSON());

                          
    try {
      console.log('Started refreshing application (/) commands.');

    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });

      console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
      console.error(error);
    }

}

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

createCommands();


const client = new Client({ intents: [GatewayIntentBits.Guilds] });

async function cock() {

  for(const punishI in config.data.punishments) {

    let punish = config.data.punishments[punishI];

    if(!(punish instanceof Punish)) {
      punish = new Punish(punish.guild_id, punish.user_id, punish.interval, punish.apply_at);
    }

    if(!punish.isApplicable()) continue;

    const guilds = client.guilds.cache;

    const guild = guilds.find(guild => guild.id == punish.guild_id);

    if(!guild) continue;

    const member = await guild.members.fetch({
      user: punish.user_id,
      cache: false
    });

    if(!member || member && !member.kickable) continue;

    console.log("Applying cock to "+member.user.username);

    let channels = guild.channels.cache.filter(channel => channel.isTextBased());

    const invitation = await guild.invites.create(channels.first());

    const dm = await member.createDM();

    const embed = new EmbedBuilder({
      title: "Tu tiempo en `"+guild.name+"` ha expirado!",
      description: "Unete usando este link "+invitation.url
    });

    embed.setColor("#e74c3c");

    await dm.send({
      embeds: [embed]
    })

    punish.renew();
    
    const cuckChannel = await guild.channels.fetch("651622704453255183");

    const cuckEmbed = new EmbedBuilder({
      title: "Tota aplicada",
      description: "<@"+member.id+"> fue cockeado 🥵"
    });

    cuckEmbed.setColor("#3498db");

    await cuckChannel.send({
      embeds: [cuckEmbed]
    })

    member.kick();

    config.data.punishments[punishI] = punish;      

  }

  config.save();

  setTimeout(cock, ms("1 minute"));
}

client.on('ready', (client) => {
  console.log(`Logged in as ${client.user.tag}!`);

  cock();
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'ping') {
    await interaction.reply('Pong!');
  } else if(interaction.commandName === 'punish') {

    const user = interaction.options.getUser('target');
    const timer = interaction.options.getString('timer');

    const timerMs = ms(timer)||5000;

    const apply_at = Date.now() + timerMs;

    const punish = new Punish(interaction.channel.guildId, user.id, timerMs, apply_at);

    const {punishments} = config.data;

    const pI = punishments.findIndex(punish => punish.user_id == user.id);

    if(pI < 0) {

        config.data.punishments.push(punish);

    } else {

        config.data.punishments[pI] = punish;

    }

    config.save();
    await interaction.reply({
      embeds:[
        new EmbedBuilder({
          title: "Se ha añadido o actualizado un castigo",
          description: user.username + " sera castigado cada `"+timerMs+"` ms!"
        }).setColor("#3498db")
      ]
    });

  } else if(interaction.commandName === 'unpunish') {

    const user = interaction.options.getUser('target');

    const {punishments} = config.data;

    const pI = punishments.findIndex(punish => punish.user_id == user.id);

    if(pI < 0) {

      await interaction.reply({
        embeds:[
          new EmbedBuilder({
            title: user.username+" no tiene totas pendientes!",
            description: `🤓: De hecho ${user.displayName} no está en mi registros.`
          }).setColor("#f1c40f")
        ]
      });

    } else {

        config.data.punishments.splice(pI);

        await interaction.reply({
          embeds:[
            new EmbedBuilder({
              title: user.username+" ya no tiene totas pendientes!",
              description: `${user.displayName} fue liberado.`
            }).setColor("#3498db")
          ]
        });

    }

    config.save();

  }
});

client.login(process.env.TOKEN);