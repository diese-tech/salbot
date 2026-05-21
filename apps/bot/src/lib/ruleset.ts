import * as fs from 'fs';
import * as path from 'path';

let cached: string | null = null;

export function getRuleset(): string {
  if (cached) return cached;

  const rulesDir = path.join(__dirname, '..', '..', '..', '..', '..', 'docs', 'rules');
  const ruleset = fs.readFileSync(path.join(rulesDir, 'ruleset.md'), 'utf-8');
  const edgeCases = fs.readFileSync(path.join(rulesDir, 'edge-cases.md'), 'utf-8');

  cached = `${ruleset}\n\n---\n\n${edgeCases}`;
  return cached;
}

// In tests or hot-reload scenarios, clear the cache so updated files are picked up.
export function clearRulesetCache(): void {
  cached = null;
}
