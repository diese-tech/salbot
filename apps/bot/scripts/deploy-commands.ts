// Run once to register / update slash commands with Discord.
// Usage: pnpm --filter @salbot/bot deploy:commands

import { REST, Routes } from 'discord.js';
import * as reportResult from '../src/commands/report-result';
import * as reschedule from '../src/commands/reschedule';
import * as requestAdminReview from '../src/commands/request-admin-review';
import * as updateIgn from '../src/commands/update-ign';
import * as rules from '../src/commands/rules';

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;
const guildId = process.env.DISCORD_GUILD_ID;

if (!token || !clientId || !guildId) {
  console.error('DISCORD_TOKEN, DISCORD_CLIENT_ID, and DISCORD_GUILD_ID are required');
  process.exit(1);
}

const commands = [
  reportResult.data,
  reschedule.data,
  requestAdminReview.data,
  updateIgn.data,
  rules.data,
];

const rest = new REST().setToken(token);

console.log(`Registering ${commands.length} slash commands to guild ${guildId}...`);

rest
  .put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
  .then(() => console.log('✅ Commands registered successfully.'))
  .catch((err) => {
    console.error('Failed to register commands:', err);
    process.exit(1);
  });
