-- Migration to add support for docx files in lessons table
-- Add 'docx' to the enum type for lesson types

-- First, drop the existing constraint
ALTER TABLE lessons DROP CONSTRAINT IF EXISTS lessons_type_check;

-- Add the new constraint with docx support
ALTER TABLE lessons ADD CONSTRAINT lessons_type_check CHECK (type IN ('video', 'pdf', 'pptx', 'docx'));
