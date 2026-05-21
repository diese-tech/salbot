-- Development seed data
-- Run after migrations for local testing

INSERT INTO divisions (name, slug, season, discord_results_channel_id, discord_reschedules_channel_id)
VALUES
  ('Gold', 'gold', '2025-spring', 'CHANNEL_ID_PLACEHOLDER', 'CHANNEL_ID_PLACEHOLDER'),
  ('Silver', 'silver', '2025-spring', 'CHANNEL_ID_PLACEHOLDER', 'CHANNEL_ID_PLACEHOLDER');

INSERT INTO teams (division_id, name, slug)
VALUES
  ((SELECT id FROM divisions WHERE slug = 'gold'), 'Team Alpha', 'team-alpha'),
  ((SELECT id FROM divisions WHERE slug = 'gold'), 'Team Beta', 'team-beta'),
  ((SELECT id FROM divisions WHERE slug = 'gold'), 'Team Gamma', 'team-gamma'),
  ((SELECT id FROM divisions WHERE slug = 'silver'), 'Team Delta', 'team-delta'),
  ((SELECT id FROM divisions WHERE slug = 'silver'), 'Team Epsilon', 'team-epsilon');

-- Example captain (replace discord_id with real test IDs)
INSERT INTO players (discord_id, display_name, team_id, is_captain)
VALUES
  ('000000000000000001', 'TestCaptainAlpha', (SELECT id FROM teams WHERE slug = 'team-alpha'), true),
  ('000000000000000002', 'TestCaptainBeta', (SELECT id FROM teams WHERE slug = 'team-beta'), true);

-- Example scheduled matches
INSERT INTO matches (external_id, division_id, week, team_a_id, team_b_id, scheduled_at)
VALUES
  (
    'sal-w1-gold-001',
    (SELECT id FROM divisions WHERE slug = 'gold'),
    1,
    (SELECT id FROM teams WHERE slug = 'team-alpha'),
    (SELECT id FROM teams WHERE slug = 'team-beta'),
    now() + interval '2 days'
  ),
  (
    'sal-w1-gold-002',
    (SELECT id FROM divisions WHERE slug = 'gold'),
    1,
    (SELECT id FROM teams WHERE slug = 'team-alpha'),
    (SELECT id FROM teams WHERE slug = 'team-gamma'),
    now() + interval '4 days'
  );
