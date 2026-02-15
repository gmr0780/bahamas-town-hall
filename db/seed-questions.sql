-- Seed dynamic questions from the original hardcoded survey
-- Run after migrate-dynamic.sql

INSERT INTO questions (type, label, description, required, sort_order, options, active) VALUES
('scale', 'How comfortable are you with technology?', NULL, true, 1,
 '{"min": 1, "max": 5, "min_label": "Not at all", "max_label": "Very comfortable"}', true),

('dropdown', 'What is your primary barrier to using technology?', NULL, false, 2,
 '["Cost of internet / devices", "Lack of training or skills", "Limited internet access in my area", "Don''t see the need", "Privacy / security concerns", "Lack of local tech support", "Other"]', true),

('checkbox', 'Are you interested in a career in technology?', NULL, false, 3,
 '["Yes, I am interested in a tech career"]', true),

('dropdown', 'What tech skill would you most like to learn?', NULL, false, 4,
 '["Basic computer literacy", "Coding / Software development", "Digital marketing", "Cybersecurity", "Data analysis", "Graphic design", "AI / Machine learning", "Project management", "Other"]', true),

('textarea', 'What is your biggest concern about technology in The Bahamas?', 'Share your thoughts...', false, 5, NULL, true),

('textarea', 'What do you see as the best opportunity technology can bring?', 'Share your vision...', false, 6, NULL, true),

('dropdown', 'What government service would you most like to access online?', NULL, false, 7,
 '["Online tax filing", "Digital ID / passport renewal", "Business registration online", "Online court services", "E-health records", "Online education portal", "Digital land registry", "Online utility payments", "Government job portal", "Emergency alert system"]', true),

('textarea', 'Any suggestions for how government can better use technology?', 'Your suggestions...', false, 8, NULL, true),

('checkbox', 'Select your top technology priorities for The Bahamas', 'Select all that apply', false, 9,
 '["Affordable internet access", "Digital government services", "Tech education in schools", "Cybersecurity and data privacy", "Support for local tech startups", "E-commerce development", "Smart city infrastructure", "Telemedicine and e-health", "Digital financial inclusion", "Environmental tech solutions"]', true),

('checkbox', 'Which of these initiatives would you be interested in?', 'Select all that apply', false, 10,
 '["Free coding workshops", "Tech career mentorship", "Small business tech grants", "Community Wi-Fi hotspots", "Youth tech programs", "Senior digital literacy classes", "Women in tech initiatives", "Hackathons and competitions", "Tech internship programs", "Open data initiatives"]', true)

ON CONFLICT DO NOTHING;
