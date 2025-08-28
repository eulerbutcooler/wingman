-- Insert a test user for testing course creation
INSERT INTO users (id, name, email, password, email_verified) 
VALUES (
  '550e8400-e29b-41d4-a716-446655440000', 
  'Test User', 
  'test@example.com', 
  'dummy_password_hash',
  true
) ON CONFLICT (id) DO NOTHING;
