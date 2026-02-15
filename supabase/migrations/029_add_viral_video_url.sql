-- URL of the viral video analyzed in the case study (Instagram, YouTube, etc.)
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS viral_video_url TEXT;
