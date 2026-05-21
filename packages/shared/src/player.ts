export function getPlayerDisplayName(player: { ign: string; display_alias?: string | null }): string {
  return player.display_alias ?? player.ign;
}
