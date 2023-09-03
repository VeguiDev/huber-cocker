import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";
import ms from "ms";

if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

import {
  Client,
  EmbedBuilder,
  GatewayIntentBits,
  PermissionFlagsBits,
  REST,
  Routes,
  SlashCommandBuilder,
} from "discord.js";
import Configuration from "./config.js";
import Punish from "./punish.js";
import ReportChannel from "./ReportChannel.js";

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
    .addUserOption((builder) =>
      builder
        .setName("target")
        .setDescription("Objetivo del castigo")
        .setRequired(true)
    )
    .addStringOption((builder) =>
      builder
        .setName("timer")
        .setDescription("Intervalo del castigo")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

  commands.push(punishBuidler);

  let unPunishBuidler = new SlashCommandBuilder()
    .setName("unpunish")
    .setDescription("Des-Castiga a un miembro.")
    .addUserOption((builder) =>
      builder
        .setName("target")
        .setDescription("Objetivo del castigo")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

  commands.push(unPunishBuidler);

  let setCockChannel = new SlashCommandBuilder()
    .setName("set-cock-channel")
    .setDescription("Establece el canal para enviar los reportes de castigos.")
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("El canal que debe ser usado para enviar reportes.")
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

  commands.push(setCockChannel);

  commands.map((command) => command.toJSON());

  try {
    console.log("Started refreshing application (/) commands.");

    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
      body: commands,
    });

    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error(error);
  }
}

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

createCommands();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

async function cock() {
  for (const punishI in config.data.punishments) {
    let punish = config.data.punishments[punishI];

    if (!(punish instanceof Punish)) {
      punish = new Punish(
        punish.guild_id,
        punish.user_id,
        punish.interval,
        punish.apply_at
      );
    }

    if (!punish.isApplicable()) continue;

    const guilds = client.guilds.cache;

    const guild = guilds.find((guild) => guild.id == punish.guild_id);

    if (!guild) continue;

    const member = await guild.members.fetch({
      user: punish.user_id,
      cache: false,
    });

    if (!member || (member && !member.kickable)) continue;

    if (member.id == "403040431686025219") {
      const embed = new EmbedBuilder({
        title: "Buen chiste 🫳🥵!",
        description: "No puedo totear a VeguiDev porque si no me apaga :(",
      });

      embed.setColor("#e74c3c");

      let reportChannel = await config.data.reportChannels.find(
        (ch) => ch.guild_id == guild.id
      );

      if (reportChannel) {
        let realChannel = await guild.channels.fetch(reportChannel.channel_id);

        if (realChannel) {
          await realChannel.send({
            embeds: [embed],
          });
        }
      }

      punish.renew();
      config.data.punishments[punishI] = punish;
      config.save();

      continue;
    }

    console.log("Applying cock to " + member.user.username);

    let channels = guild.channels.cache.filter((channel) =>
      channel.isTextBased()
    );

    const invitation = await guild.invites.create(channels.first());

    const dm = await member.createDM();

    const embed = new EmbedBuilder({
      title: "Tu tiempo en `" + guild.name + "` ha expirado!",
      description: "Unete usando este link " + invitation.url,
    });

    embed.setColor("#e74c3c");

    await dm.send({
      embeds: [embed],
    });

    punish.renew();

    let reportChannel = await config.data.reportChannels.find(
      (ch) => ch.guild_id == guild.id
    );

    if (reportChannel) {
      let realChannel = await guild.channels.fetch(reportChannel.channel_id);

      if (realChannel) {
        const cuckEmbed = new EmbedBuilder({
          title: "Tota aplicada",
          description: "<@" + member.id + "> fue cockeado 🥵",
        });

        cuckEmbed.setColor("#3498db");

        await realChannel.send({
          embeds: [cuckEmbed],
        });
      }
    }

    member.kick();

    config.data.punishments[punishI] = punish;
  }

  config.save();

  setTimeout(cock, ms("1 minute"));
}

client.on("ready", (client) => {
  console.log(`Logged in as ${client.user.tag}!`);

  cock();
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "ping") {
    await interaction.reply("Pong!");
  } else if (interaction.commandName === "punish") {
    const user = interaction.options.getUser("target");
    const timer = interaction.options.getString("timer");

    const timerMs = ms(timer) || 5000;

    const apply_at = Date.now() + timerMs;

    const punish = new Punish(
      interaction.channel.guildId,
      user.id,
      timerMs,
      apply_at
    );

    const { punishments } = config.data;

    const pI = punishments.findIndex((punish) => punish.user_id == user.id);

    if (pI < 0) {
      config.data.punishments.push(punish);
    } else {
      config.data.punishments[pI] = punish;
    }

    config.save();
    await interaction.reply({
      embeds: [
        new EmbedBuilder({
          title: "Se ha añadido o actualizado un castigo",
          description:
            user.username + " sera castigado cada `" + timerMs + "` ms!",
        }).setColor("#3498db"),
      ],
    });
  } else if (interaction.commandName === "unpunish") {
    const user = interaction.options.getUser("target");

    const { punishments } = config.data;

    const pI = punishments.findIndex((punish) => punish.user_id == user.id);

    if (pI < 0) {
      await interaction.reply({
        embeds: [
          new EmbedBuilder({
            title: user.username + " no tiene totas pendientes!",
            description: `🤓: De hecho ${user.displayName} no está en mi registros.`,
          }).setColor("#f1c40f"),
        ],
      });
    } else {
      config.data.punishments.splice(pI);

      await interaction.reply({
        embeds: [
          new EmbedBuilder({
            title: user.username + " ya no tiene totas pendientes!",
            description: `${user.displayName} fue liberado.`,
          }).setColor("#3498db"),
        ],
      });
    }

    config.save();
  } else if (interaction.commandName == "set-cock-channel") {
    let channelOpt = interaction.options.getChannel("channel");

    let currentChannelI = config.data.reportChannels.findIndex(
      (ch) => ch.guild_id == interaction.guildId
    );

    const newReportChannel = channelOpt || interaction.channel;

    if (currentChannelI < 0) {
      const reportChannel = new ReportChannel(
        newReportChannel.guild.id,
        newReportChannel.id
      );

      config.data.reportChannels.push(reportChannel);
    } else {
      const currentChannel = config.data.reportChannels[currentChannelI];

      if (currentChannel.channel_id == newReportChannel.id) {
        let embed = new EmbedBuilder();

        embed
          .setTitle("Ya está establecido ese canal para realizar los reportes!")
          .setColor("#e74c3c");

        interaction.reply({
          embeds: [embed],
        });

        return;
      }

      const reportChannel = new ReportChannel(
        newReportChannel.guild.id,
        newReportChannel.id
      );

      config.data.reportChannels[currentChannelI] = reportChannel;
    }

    let embed = new EmbedBuilder();

    embed
      .setTitle(
        "`" +
          newReportChannel.name +
          "` se ha establecido como canal de reportes!"
      )
      .setColor("#2ecc71");

    interaction.reply({
      embeds: [embed],
    });

    config.save();
  }
});

client.login(process.env.TOKEN);
