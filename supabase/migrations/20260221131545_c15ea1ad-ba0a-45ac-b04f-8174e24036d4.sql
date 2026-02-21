-- Remove the incorrect platform admin entry
DELETE FROM platform_admins WHERE user_id = '7f3a2b6e-9c4d-4a1b-8f2d-3c5e9b1d2a6f';

-- Insert the correct user as platform admin
INSERT INTO platform_admins (user_id) VALUES ('a4330dc1-42a6-4971-a1dd-067bf2079363')
ON CONFLICT DO NOTHING;