import { Client, GatewayIntentBits } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import { isAdminUser } from '@salbot/db';
import { db } from './lib/db';
import { handleProofUpload, activeProofThreads } from './lib/proof-thread';

// Command modules
import * as reportResult from './commands/report-result';
import * as reschedule from './commands/reschedule';
import * as requestAdminReview from './commands/request-admin-review';
import * as updateIgn from './commands/update-ign';
import * as rules from './commands/rules';

// Approval handlers
import {
  handleApproveButton,
  handleDenyButton,
  handleDenyModal,
  handleNeedsInfoButton,
  handleNeedsInfoModal,
} from './handlers/approval';

type CommandModule = {
  data: { name: string };
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
};

const commands = new Map<string, CommandModule>([
  [reportResult.data.name, reportResult],
  [reschedule.data.name, reschedule],
  [requestAdminReview.data.name, requestAdminReview],
  [updateIgn.data.name, updateIgn],
  [rules.data.name, rules],
]);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once('ready', () => {
  console.log(`[bot] Ready as ${client.user?.tag}`);
  console.log(`[bot] Loaded commands: ${[...commands.keys()].join(', ')}`);
  console.log(`[bot] Admin review channel: ${process.env.CHANNEL_ADMIN_REVIEW ?? 'NOT SET'}`);
});

// ── Interaction handler ───────────────────────────────────────────────────────

client.on('interactionCreate', async (interaction) => {
  try {
    // Slash commands
    if (interaction.isChatInputCommand()) {
      const cmd = commands.get(interaction.commandName);
      if (cmd) await cmd.execute(interaction);
      return;
    }

    // String select menus
    if (interaction.isStringSelectMenu()) {
      const id = interaction.customId;
      if (id === 'rr_match') {
        await reportResult.handleMatchSelect(interaction);
      } else if (id.startsWith('rr_winner:')) {
        await reportResult.handleWinnerSelect(interaction);
      } else if (id === 'rs_match') {
        await reschedule.handleMatchSelect(interaction);
      }
      return;
    }

    // Buttons
    if (interaction.isButton()) {
      const [action, pendingActionId] = interaction.customId.split(':');

      // Admin-only actions
      if (['approve', 'deny', 'needs_info'].includes(action)) {
        const isAdmin = await isAdminUser(db, interaction.user.id);
        if (!isAdmin) {
          await interaction.reply({ content: 'Only admins can use this button.', ephemeral: true });
          return;
        }
      }

      if (action === 'approve') await handleApproveButton(interaction, pendingActionId);
      else if (action === 'deny') await handleDenyButton(interaction, pendingActionId);
      else if (action === 'needs_info') await handleNeedsInfoButton(interaction, pendingActionId);
      return;
    }

    // Modal submissions
    if (interaction.isModalSubmit()) {
      const id = interaction.customId;
      if (id.startsWith('rr_score:')) {
        await reportResult.handleScoreModal(interaction);
      } else if (id.startsWith('rs_modal:')) {
        await reschedule.handleRescheduleModal(interaction);
      } else if (id.startsWith('modal_deny:')) {
        const pendingActionId = id.split(':')[1];
        await handleDenyModal(interaction, pendingActionId);
      } else if (id.startsWith('modal_needs_info:')) {
        const pendingActionId = id.split(':')[1];
        await handleNeedsInfoModal(interaction, pendingActionId);
      }
      return;
    }
  } catch (err) {
    console.error('[bot] Unhandled interaction error:', err);
    try {
      if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: 'An unexpected error occurred. Please try again.', ephemeral: true });
      }
    } catch { /* ignore */ }
  }
});

// ── Proof thread screenshot tracking (Phase 1 stub) ──────────────────────────

client.on('messageCreate', async (message) => {
  if (message.author.bot || message.attachments.size === 0) return;
  if (!activeProofThreads.has(message.channelId)) return;
  await handleProofUpload(client, message.channelId, message.attachments.size);
});

client.login(process.env.DISCORD_TOKEN);
