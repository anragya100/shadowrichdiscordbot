import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('announce')
    .setDescription('Send an announcement to a specified channel')
    .addStringOption(option =>
      option.setName('message')
        .setDescription('The announcement message to send')
        .setRequired(true)
    )
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('The channel to send the announcement to')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('attachment_url')
        .setDescription('URL of an image or file to attach (optional)')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('title')
        .setDescription('Optional title for the announcement')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    const message = interaction.options.getString('message');
    const channel = interaction.options.getChannel('channel');
    const attachmentUrl = interaction.options.getString('attachment_url');
    const title = interaction.options.getString('title');

    // Verify the channel is a text channel
    if (!channel.isTextBased()) {
      return await interaction.reply({
        content: '❌ Please select a text channel for the announcement.',
        ephemeral: true
      });
    }

    // Check if bot has permission to send messages in the target channel
    const botMember = interaction.guild.members.cache.get(interaction.client.user.id);
    if (!channel.permissionsFor(botMember).has(PermissionFlagsBits.SendMessages)) {
      return await interaction.reply({
        content: `❌ I don't have permission to send messages in ${channel}.`,
        ephemeral: true
      });
    }

    try {
      // Create the announcement embed
      const embed = new EmbedBuilder()
        .setDescription(message)
        .setColor('#FFD700') // Golden border
        .setTimestamp()
        .setFooter({ 
          text: `Announced by ${interaction.user.tag}`, 
          iconURL: interaction.user.displayAvatarURL() 
        });

      // Add title if provided
      if (title) {
        embed.setTitle(title);
      }

      // Add attachment if provided
      if (attachmentUrl) {
        // Validate URL format
        try {
          new URL(attachmentUrl);
          
          // Check if it's an image URL
          const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
          const isImage = imageExtensions.some(ext => 
            attachmentUrl.toLowerCase().includes(ext)
          );

          if (isImage) {
            embed.setImage(attachmentUrl);
          } else {
            embed.addFields({
              name: '📎 Attachment',
              value: `[Click here to view](${attachmentUrl})`,
              inline: false
            });
          }
        } catch (error) {
          return await interaction.reply({
            content: '❌ Invalid attachment URL provided.',
            ephemeral: true
          });
        }
      }

      // Send the announcement
      await channel.send({ embeds: [embed] });

      // Confirm to the user
      const confirmEmbed = new EmbedBuilder()
        .setTitle('✅ Announcement Sent')
        .setDescription(`Your announcement has been successfully sent to ${channel}`)
        .addFields(
          { name: '📝 Message Preview', value: message.length > 100 ? message.substring(0, 100) + '...' : message, inline: false },
          { name: '📍 Channel', value: channel.toString(), inline: true },
          { name: '⏰ Sent At', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
        )
        .setColor('#00FF00')
        .setTimestamp();

      if (attachmentUrl) {
        confirmEmbed.addFields({
          name: '📎 Attachment',
          value: 'Included',
          inline: true
        });
      }

      await interaction.reply({ embeds: [confirmEmbed], ephemeral: true });

      // Log the announcement
      console.log(`📢 Announcement sent by ${interaction.user.tag} to #${channel.name}: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`);

    } catch (error) {
      console.error('Error sending announcement:', error);
      await interaction.reply({
        content: '❌ Failed to send announcement. Please check the channel permissions and try again.',
        ephemeral: true
      });
    }
  }
};