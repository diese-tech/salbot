import type { ChatInputCommandInteraction, TextChannel } from 'discord.js';
import {
  createPendingAction,
  updatePendingActionMessages,
} from '@salbot/db';
import type { AdminReviewPayload } from '@salbot/shared';
import { db } from '../lib/db';
import { getAdminReviewChannelId } from '../lib/channels';
import { buildAdminReviewEmbed, buildApprovalButtons } from '../lib/embeds';

export const data = {
  name: 'request-admin-review',
  description: 'Escalate an issue to admin review.',
  options: [
    {
      type: 3, // STRING
      name: 'issue_type',
      description: 'Type of issue',
      required: true,
      choices: [
        { name: 'Score Dispute', value: 'score_dispute' },
        { name: 'Scheduling Issue', value: 'scheduling_issue' },
        { name: 'Eligibility Concern', value: 'eligibility_concern' },
        { name: 'Other', value: 'other' },
      ],
    },
    {
      type: 3, // STRING
      name: 'description',
      description: 'Describe the issue in detail',
      required: true,
      max_length: 1000,
    },
  ],
} as const;

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });

  const issueType = interaction.options.get('issue_type')?.value as AdminReviewPayload['issueType'];
  const description = interaction.options.get('description')?.value as string;

  const payload: AdminReviewPayload = { issueType, description };

  const pendingAction = await createPendingAction(db, {
    type: 'admin_review',
    requestedByDiscordId: interaction.user.id,
    payloadJson: payload as unknown as Record<string, unknown>,
  });

  // Admin review card only — no public receipt for escalations
  const adminChannel = await interaction.client.channels.fetch(getAdminReviewChannelId()) as TextChannel;
  const adminEmbed = buildAdminReviewEmbed(issueType, description, interaction.user.id, pendingAction.id);
  const reviewMsg = await adminChannel.send({
    embeds: [adminEmbed],
    components: [buildApprovalButtons(pendingAction.id)],
  });

  await updatePendingActionMessages(db, pendingAction.id, {
    adminReviewMessageId: reviewMsg.id,
  });

  await interaction.editReply('✅ Your issue has been submitted to admin review. An admin will follow up with you.');
}
