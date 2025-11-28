-- Add level field to subjects table for organizing by year
ALTER TABLE subjects ADD COLUMN level TEXT CHECK (level IN ('100L', '200L', '300L', '400L', '500L'));

-- Add index for faster filtering by level
CREATE INDEX idx_subjects_level ON subjects(level);

-- Update existing subjects to have a default level (can be changed by admin)
UPDATE subjects SET level = '100L' WHERE level IS NULL;