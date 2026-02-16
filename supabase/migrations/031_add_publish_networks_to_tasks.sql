-- Networks selected for publishing (e.g. Instagram, YouTube, TikTok, Facebook)
-- Array of network names so a script can be planned for multiple platforms.
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS publish_networks TEXT[] DEFAULT '{}';

COMMENT ON COLUMN tasks.publish_networks IS 'Network names for publishing (Mreza za objavljivanje), e.g. {Instagram,YouTube}';
