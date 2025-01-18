/*
  # Add email column to users table

  1. Changes
    - Add email column to users table
    - Update handle_new_user function to properly handle email
  
  2. Security
    - Email must be unique
    - Email is required
*/

-- Add email column
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS email TEXT UNIQUE NOT NULL;

-- Update handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, full_name, email)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    new.email
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;