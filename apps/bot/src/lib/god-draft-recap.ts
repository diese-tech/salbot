import type { Client, EmbedBuilder } from 'discord.js';
import { getGodDraftRecapData, type SupabaseClient } from '@salbot/db';
import { getResultsChannelId } from './channels';
import { buildGodDraftRecapEmbed } from './embeds';

type RealtimePayload = {
  new?: {
    id?: string;
    status?: string;
  };
};

export function subscribeToGodDraftRecaps(client: Client, db: SupabaseClient): unknown {
  return db
    .channel('salbot-god-draft-recaps')
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'god_draft_sessions', filter: 'status=eq.complete' },
      (payload: RealtimePayload) => {
        void handleGodDraftSessionComplete(client, db, payload);
      },
    )
    .subscribe((status) => {
      console.log(`[bot] God draft recap realtime status: ${status}`);
    });
}

export async function handleGodDraftSessionComplete(
  client: Pick<Client, 'channels'>,
  db: SupabaseClient,
  payload: RealtimePayload,
) {
  const sessionId = payload.new?.id;
  if (!sessionId || payload.new?.status !== 'complete') return false;

  const recap = await getGodDraftRecapData(db, sessionId);
  if (!recap?.session.matches) return false;

  const channelId = getResultsChannelId(recap.session.matches.division_id);
  const channel = await client.channels.fetch(channelId);
  if (!isSendableChannel(channel)) return false;

  await channel.send({ embeds: [buildGodDraftRecapEmbed(recap)] });
  return true;
}

function isSendableChannel(channel: unknown): channel is { send: (message: { embeds: EmbedBuilder[] }) => Promise<unknown> } {
  return Boolean(channel && typeof channel === 'object' && 'send' in channel);
}
