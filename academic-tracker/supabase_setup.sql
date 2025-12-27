-- Academic Tracker Database Setup for Supabase
-- Run this script in the Supabase SQL Editor

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create subjects table
CREATE TABLE IF NOT EXISTS subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    current_average NUMERIC(5, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create grades table
CREATE TABLE IF NOT EXISTS grades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    score NUMERIC(10, 2) NOT NULL,
    total NUMERIC(10, 2) NOT NULL,
    percentage NUMERIC(5, 2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('Activities', 'Assignments', 'Quizzes', 'Examinations')),
    mode TEXT NOT NULL CHECK (mode IN ('Written', 'Online')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security (RLS) on both tables
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-running the script)
DROP POLICY IF EXISTS "Users can view their own subjects" ON subjects;
DROP POLICY IF EXISTS "Users can insert their own subjects" ON subjects;
DROP POLICY IF EXISTS "Users can update their own subjects" ON subjects;
DROP POLICY IF EXISTS "Users can delete their own subjects" ON subjects;

DROP POLICY IF EXISTS "Users can view grades of their own subjects" ON grades;
DROP POLICY IF EXISTS "Users can insert grades to their own subjects" ON grades;
DROP POLICY IF EXISTS "Users can update grades of their own subjects" ON grades;
DROP POLICY IF EXISTS "Users can delete grades of their own subjects" ON grades;

-- RLS Policies for subjects table
-- Users can only view their own subjects
CREATE POLICY "Users can view their own subjects"
    ON subjects FOR SELECT
    USING (auth.uid() = user_id);

-- Users can only insert subjects for themselves
CREATE POLICY "Users can insert their own subjects"
    ON subjects FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can only update their own subjects
CREATE POLICY "Users can update their own subjects"
    ON subjects FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own subjects
CREATE POLICY "Users can delete their own subjects"
    ON subjects FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policies for grades table
-- Users can only view grades of their own subjects
CREATE POLICY "Users can view grades of their own subjects"
    ON grades FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM subjects
            WHERE subjects.id = grades.subject_id
            AND subjects.user_id = auth.uid()
        )
    );

-- Users can only insert grades to their own subjects
CREATE POLICY "Users can insert grades to their own subjects"
    ON grades FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM subjects
            WHERE subjects.id = grades.subject_id
            AND subjects.user_id = auth.uid()
        )
    );

-- Users can only update grades of their own subjects
CREATE POLICY "Users can update grades of their own subjects"
    ON grades FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM subjects
            WHERE subjects.id = grades.subject_id
            AND subjects.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM subjects
            WHERE subjects.id = grades.subject_id
            AND subjects.user_id = auth.uid()
        )
    );

-- Users can only delete grades of their own subjects
CREATE POLICY "Users can delete grades of their own subjects"
    ON grades FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM subjects
            WHERE subjects.id = grades.subject_id
            AND subjects.user_id = auth.uid()
        )
    );

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_subjects_user_id ON subjects(user_id);
CREATE INDEX IF NOT EXISTS idx_grades_subject_id ON grades(subject_id);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to update updated_at automatically
DROP TRIGGER IF EXISTS update_subjects_updated_at ON subjects;
CREATE TRIGGER update_subjects_updated_at
    BEFORE UPDATE ON subjects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_grades_updated_at ON grades;
CREATE TRIGGER update_grades_updated_at
    BEFORE UPDATE ON grades
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Optional: Create a function to automatically calculate and update current_average
-- This can be called whenever grades are added/updated/deleted
CREATE OR REPLACE FUNCTION update_subject_average(subject_uuid UUID)
RETURNS void AS $$
DECLARE
    avg_percentage NUMERIC(5, 2);
BEGIN
    SELECT COALESCE(AVG(percentage), 0) INTO avg_percentage
    FROM grades
    WHERE subject_id = subject_uuid;
    
    UPDATE subjects
    SET current_average = avg_percentage
    WHERE id = subject_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

