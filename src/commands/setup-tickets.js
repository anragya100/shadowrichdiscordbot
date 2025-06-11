import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('setup-tickets')
    .setDescription('Set up the ticket system in the current channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    try {
      // Create the main ticket embed
      const ticketEmbed = new EmbedBuilder()
        .setTitle('🎫 Support Ticket System')
        .setDescription(
          '**Need help or have questions?**\n\n' +
          'Click the button below to create a support ticket. Our staff team will assist you as soon as possible.\n\n' +
          '**What happens next?**\n' +
          '• A private channel will be created for you\n' +
          '• Only you and staff members can see it\n' +
          '• Describe your issue and we\'ll help you out!\n\n' +
          '**Response Times:**\n' +
          '• General Help: Within 2-4 hours\n' +
          '• Technical Support: Within 1-2 hours\n' +
          '• Business Inquiries: Within 24 hours\n' +
          '• Reports: Within 1 hour'
        )
        .setColor('#FFD700')
        .setThumbnail(interaction.guild.iconURL())
        .setFooter({ 
          text: 'Support Team • Click the button below to get started',
          iconURL: interaction.client.user.displayAvatarURL()
        })
        .setTimestamp();

      // Create the contact button
      const contactButton = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('contact_staff')
            .setLabel('Contact Staff')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('📞')
        );

      // Send the ticket system message
      await interaction.channel.send({
        embeds: [ticketEmbed],
        components: [contactButton]
      });

      // Confirm setup to the admin
      const confirmEmbed = new EmbedBuilder()
        .setTitle('✅ Ticket System Setup Complete')
        .setDescription(`The ticket system has been successfully set up in ${interaction.channel}`)
        .addFields(
          { name: '📍 Channel', value: interaction.channel.toString(), inline: true },
          { name: '⚙️ Setup by', value: interaction.user.toString(), inline: true },
          { name: '📋 Features', value: '• Interactive ticket creation\n• Category selection\n• Auto-permissions\n• Staff notifications\n• Ticket logging', inline: false }
        )
        .setColor('#00FF00')
        .setTimestamp();

      await interaction.reply({ embeds: [confirmEmbed], ephemeral: true });

      console.log(`🎫 Ticket system set up in #${interaction.channel.name} by ${interaction.user.tag}`);

    } catch (error) {
      console.error('Error setting up ticket system:', error);
      await interaction.reply({
        content: '❌ Failed to set up ticket system. Please check my permissions and try again.',
        ephemeral: true
      });
    }
  }
};