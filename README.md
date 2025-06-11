# Discord Announcement & Ticket Bot

A feature-rich Discord bot with announcement capabilities and a comprehensive ticket system.

## Features

### 🔊 Announcement System
- `/announce` command with golden embed styling
- Support for attachments via URL
- Channel targeting
- Professional formatting with timestamps
- Permission-based access control

### 🎫 Ticket System
- Interactive button-based ticket creation
- Multiple categories: General Help, Business Inquiries, Technical Support, Report Issues, Other
- Private channels with proper permissions
- Auto-generated ticket numbers
- Staff-only close functionality
- Comprehensive logging

## Setup Instructions

### 1. Discord Application Setup
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Go to the "Bot" section and create a bot
4. Copy the bot token
5. Go to "OAuth2" > "URL Generator"
6. Select scopes: `bot` and `applications.commands`
7. Select permissions: `Administrator` (or specific permissions as needed)
8. Use the generated URL to invite the bot to your server

### 2. Environment Configuration
1. Copy `.env.example` to `.env`
2. Fill in your bot credentials:
```env
DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=your_bot_client_id_here
GUILD_ID=your_guild_id_here  # Optional: for faster command deployment
```

### 3. Installation & Running
```bash
# Install dependencies
npm install

# Deploy slash commands
node src/deploy-commands.js

# Start the bot
npm start

# For development (auto-restart on changes)
npm run dev
```

## Commands

### `/announce`
**Required Permissions:** Manage Messages
- `message` (required): The announcement text
- `channel` (required): Target channel for the announcement
- `attachment_url` (optional): URL of image/file to attach
- `title` (optional): Title for the announcement

### `/setup-tickets`
**Required Permissions:** Administrator
- Sets up the ticket system interface in the current channel
- Creates interactive buttons for ticket creation

## Ticket System Usage

1. Use `/setup-tickets` in your desired tickets channel
2. Users click "Contact Staff" to see category options
3. Selecting a category creates a private ticket channel
4. Only the user, staff, and moderators can see the ticket
5. Staff can close tickets using the close button

## Permissions Setup

The bot automatically detects staff roles by looking for roles containing:
- "staff"
- "mod" 
- "admin"

Make sure your staff members have these roles for proper ticket access.

## Rate Limiting & Best Practices

- The bot respects Discord's rate limits
- Commands include proper error handling
- Tickets are logged for administrative purposes
- Channels are automatically cleaned up when tickets are closed

## Troubleshooting

### Commands not appearing
- Make sure you've run `node src/deploy-commands.js`
- Check that CLIENT_ID is correct
- Global commands take up to 1 hour to appear (use GUILD_ID for instant deployment during development)

### Permission errors
- Ensure the bot has Administrator permissions
- Check that the bot role is above the roles it needs to manage
- Verify channel permissions for ticket creation

### Bot not responding
- Check that DISCORD_TOKEN is correct and valid
- Ensure the bot is online in your server
- Check console for error messages

## Support

If you encounter issues:
1. Check the console logs for error messages
2. Verify all environment variables are set correctly
3. Ensure proper permissions are configured
4. Make sure Node.js version is 16.9.0 or higher