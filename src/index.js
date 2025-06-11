import { Client, GatewayIntentBits, Collection } from 'discord.js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readdirSync } from 'fs';

config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class DiscordBot {
  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
      ]
    });

    this.client.commands = new Collection();
    this.client.tickets = new Map(); // Store active tickets
    this.ticketCounter = 1;
    
    this.init();
  }

  async init() {
    await this.loadCommands();
    await this.loadEvents();
    await this.login();
  }

  async loadCommands() {
    const commandsPath = join(__dirname, 'commands');
    try {
      const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'));
      
      for (const file of commandFiles) {
        const { default: command } = await import(`./commands/${file}`);
        this.client.commands.set(command.data.name, command);
        console.log(`✅ Loaded command: ${command.data.name}`);
      }
    } catch (error) {
      console.log('📁 Commands directory not found, commands will be loaded inline');
    }
  }

  async loadEvents() {
    const eventsPath = join(__dirname, 'events');
    try {
      const eventFiles = readdirSync(eventsPath).filter(file => file.endsWith('.js'));
      
      for (const file of eventFiles) {
        const { default: event } = await import(`./events/${file}`);
        if (event.once) {
          this.client.once(event.name, (...args) => event.execute(...args, this.client));
        } else {
          this.client.on(event.name, (...args) => event.execute(...args, this.client));
        }
        console.log(`✅ Loaded event: ${event.name}`);
      }
    } catch (error) {
      console.log('📁 Events directory not found, events will be loaded inline');
      this.setupInlineEvents();
    }
  }

  setupInlineEvents() {
    this.client.once('ready', () => {
      console.log(`🚀 Bot is online as ${this.client.user.tag}!`);
      console.log(`📊 Serving ${this.client.guilds.cache.size} guilds`);
    });

    this.client.on('interactionCreate', async (interaction) => {
      if (interaction.isChatInputCommand()) {
        await this.handleSlashCommand(interaction);
      } else if (interaction.isButton()) {
        await this.handleButtonInteraction(interaction);
      }
    });
  }

  async handleSlashCommand(interaction) {
    const command = this.client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction, this.client);
    } catch (error) {
      console.error(`Error executing command ${interaction.commandName}:`, error);
      const reply = {
        content: '❌ There was an error executing this command!',
        ephemeral: true
      };
      
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(reply);
      } else {
        await interaction.reply(reply);
      }
    }
  }

  async handleButtonInteraction(interaction) {
    const { customId } = interaction;

    if (customId === 'contact_staff') {
      await this.showTicketOptions(interaction);
    } else if (customId.startsWith('ticket_')) {
      await this.createTicket(interaction);
    } else if (customId.startsWith('close_ticket_')) {
      await this.closeTicket(interaction);
    }
  }

  async showTicketOptions(interaction) {
    const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = await import('discord.js');
    
    const embed = new EmbedBuilder()
      .setTitle('🎫 Select Ticket Category')
      .setDescription('Please choose the category that best describes your inquiry:')
      .setColor('#FFD700')
      .setTimestamp();

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('ticket_general')
          .setLabel('General Help')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('❓'),
        new ButtonBuilder()
          .setCustomId('ticket_business')
          .setLabel('Business Inquiries')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('💼'),
        new ButtonBuilder()
          .setCustomId('ticket_technical')
          .setLabel('Technical Support')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('🔧'),
        new ButtonBuilder()
          .setCustomId('ticket_report')
          .setLabel('Report an Issue')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('⚠️'),
        new ButtonBuilder()
          .setCustomId('ticket_other')
          .setLabel('Other')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('📝')
      );

    await interaction.reply({
      embeds: [embed],
      components: [row],
      ephemeral: true
    });
  }

  async createTicket(interaction) {
    const { ChannelType, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = await import('discord.js');
    
    const category = interaction.customId.split('_')[1];
    const categoryNames = {
      general: 'General Help',
      business: 'Business Inquiries',
      technical: 'Technical Support',
      report: 'Report an Issue',
      other: 'Other'
    };

    const ticketNumber = this.ticketCounter++;
    const channelName = `ticket-${interaction.user.username}-${ticketNumber}`;

    try {
      // Create ticket channel
      const ticketChannel = await interaction.guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          {
            id: interaction.guild.id,
            deny: [PermissionFlagsBits.ViewChannel]
          },
          {
            id: interaction.user.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory
            ]
          }
        ]
      });

      // Add staff/moderator permissions
      const staffRoles = interaction.guild.roles.cache.filter(role => 
        role.name.toLowerCase().includes('staff') || 
        role.name.toLowerCase().includes('mod') ||
        role.name.toLowerCase().includes('admin')
      );

      for (const role of staffRoles.values()) {
        await ticketChannel.permissionOverwrites.create(role, {
          ViewChannel: true,
          SendMessages: true,
          ReadMessageHistory: true,
          ManageMessages: true
        });
      }

      // Store ticket info
      this.client.tickets.set(ticketChannel.id, {
        userId: interaction.user.id,
        category: categoryNames[category],
        createdAt: new Date(),
        ticketNumber
      });

      // Create welcome embed
      const welcomeEmbed = new EmbedBuilder()
        .setTitle('🎫 Support Ticket Created')
        .setDescription(`Hello ${interaction.user}, thank you for contacting our support team!`)
        .addFields(
          { name: '📋 Category', value: categoryNames[category], inline: true },
          { name: '🔢 Ticket Number', value: `#${ticketNumber}`, inline: true },
          { name: '📅 Created', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true },
          { name: '📝 Instructions', value: 'Please describe your issue in detail. A staff member will assist you shortly.', inline: false }
        )
        .setColor('#FFD700')
        .setTimestamp()
        .setFooter({ text: 'Support Team', iconURL: interaction.guild.iconURL() });

      const closeButton = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`close_ticket_${ticketChannel.id}`)
            .setLabel('Close Ticket')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('🔒')
        );

      await ticketChannel.send({
        content: `${interaction.user} | Staff will be notified`,
        embeds: [welcomeEmbed],
        components: [closeButton]
      });

      // Log ticket creation
      console.log(`🎫 Ticket created: ${channelName} by ${interaction.user.tag} (Category: ${categoryNames[category]})`);

      await interaction.reply({
        content: `✅ Ticket created! Please check ${ticketChannel}`,
        ephemeral: true
      });

    } catch (error) {
      console.error('Error creating ticket:', error);
      await interaction.reply({
        content: '❌ Failed to create ticket. Please try again or contact an administrator.',
        ephemeral: true
      });
    }
  }

  async closeTicket(interaction) {
    const { EmbedBuilder } = await import('discord.js');
    
    const channelId = interaction.customId.split('_')[2];
    const ticketInfo = this.client.tickets.get(channelId);

    if (!ticketInfo) {
      return await interaction.reply({
        content: '❌ Ticket information not found.',
        ephemeral: true
      });
    }

    // Check permissions
    const member = interaction.member;
    const hasPermission = member.permissions.has(PermissionFlagsBits.ManageChannels) ||
                         member.roles.cache.some(role => 
                           role.name.toLowerCase().includes('staff') ||
                           role.name.toLowerCase().includes('mod') ||
                           role.name.toLowerCase().includes('admin')
                         );

    if (!hasPermission && interaction.user.id !== ticketInfo.userId) {
      return await interaction.reply({
        content: '❌ You do not have permission to close this ticket.',
        ephemeral: true
      });
    }

    try {
      const closeEmbed = new EmbedBuilder()
        .setTitle('🔒 Ticket Closed')
        .setDescription(`Ticket #${ticketInfo.ticketNumber} has been closed by ${interaction.user}`)
        .addFields(
          { name: '📋 Category', value: ticketInfo.category, inline: true },
          { name: '⏱️ Duration', value: `<t:${Math.floor(ticketInfo.createdAt.getTime() / 1000)}:R>`, inline: true },
          { name: '👤 Closed by', value: interaction.user.toString(), inline: true }
        )
        .setColor('#FF0000')
        .setTimestamp();

      await interaction.reply({ embeds: [closeEmbed] });

      // Log ticket closure
      console.log(`🔒 Ticket closed: ${interaction.channel.name} by ${interaction.user.tag}`);

      // Remove from active tickets
      this.client.tickets.delete(channelId);

      // Delete channel after 5 seconds
      setTimeout(async () => {
        try {
          await interaction.channel.delete();
        } catch (error) {
          console.error('Error deleting ticket channel:', error);
        }
      }, 5000);

    } catch (error) {
      console.error('Error closing ticket:', error);
      await interaction.reply({
        content: '❌ Failed to close ticket. Please try again.',
        ephemeral: true
      });
    }
  }

  async login() {
    try {
      await this.client.login(process.env.DISCORD_TOKEN);
    } catch (error) {
      console.error('❌ Failed to login:', error);
      process.exit(1);
    }
  }
}

// Start the bot
new DiscordBot();