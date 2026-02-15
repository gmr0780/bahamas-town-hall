-- Seed data: 30 realistic Bahamian citizen profiles with dynamic survey responses
-- Run after migrate.sql, migrate-dynamic.sql, and seed-questions.sql
-- Question IDs: 1=comfort, 2=barrier, 3=career, 4=skill, 5=concern, 6=opportunity, 7=gov_service, 8=suggestion, 9=priorities, 10=interests

-- Clear existing data (cascades to responses)
TRUNCATE responses, citizens RESTART IDENTITY CASCADE;

-- Citizens
INSERT INTO citizens (name, email, phone, lives_in_bahamas, island, country, age_group, sector) VALUES
('Deandra Rolle', 'deandra.rolle@gmail.com', '(242) 323-1001', true, 'New Providence (Nassau)', NULL, '25-34', 'Financial Services'),
('Marcus Thompson', 'marcus.t@outlook.com', '(242) 352-2002', true, 'Grand Bahama (Freeport)', NULL, '35-44', 'Tourism & Hospitality'),
('Shaniqua Johnson', 'shaniqua.j@yahoo.com', '(242) 367-3003', true, 'Abaco', NULL, '18-24', 'Student'),
('Ricardo Munroe', 'ricardo.munroe@bahamas.gov.bs', '(242) 323-4004', true, 'New Providence (Nassau)', NULL, '45-54', 'Government / Public Sector'),
('Tanya Williams', 'tanya.w@hotmail.com', '(242) 332-5005', true, 'Eleuthera', NULL, '55-64', 'Education'),
('Devon Smith', 'devon.smith@live.com', '(242) 345-6006', true, 'Exuma', NULL, '25-34', 'Technology / IT'),
('Crystal Bethel', 'crystal.b@gmail.com', '(242) 323-7007', true, 'New Providence (Nassau)', NULL, '18-24', 'Retail & Commerce'),
('Anthony Ferguson', 'a.ferguson@outlook.com', '(242) 368-8008', true, 'Andros', NULL, '35-44', 'Agriculture & Fisheries'),
('Jasmine Cartwright', 'jasmine.cart@yahoo.com', '(242) 323-9009', true, 'New Providence (Nassau)', NULL, '25-34', 'Healthcare'),
('Terrance Knowles', 'terrance.k@gmail.com', '(242) 352-1010', true, 'Grand Bahama (Freeport)', NULL, '45-54', 'Construction'),
('Monique Davis', 'monique.davis@hotmail.com', '(242) 337-1011', true, 'Long Island', NULL, '65+', 'Retired'),
('Patrick Sears', 'p.sears@gmail.com', '(242) 323-1012', true, 'New Providence (Nassau)', NULL, '35-44', 'Self-Employed / Entrepreneur'),
('Lakeisha Forbes', 'lakeisha.f@outlook.com', NULL, false, 'Cat Island', 'United States', '25-34', 'Tourism & Hospitality'),
('Dario Moss', 'dario.moss@yahoo.com', '(242) 323-1014', true, 'New Providence (Nassau)', NULL, '18-24', 'Technology / IT'),
('Renee Cooper', 'renee.cooper@gmail.com', '(242) 347-1015', true, 'San Salvador', NULL, '55-64', 'Government / Public Sector'),
('Carlton Strachan', 'carlton.s@live.com', NULL, false, 'Grand Bahama (Freeport)', 'Canada', '25-34', 'Financial Services'),
('Shantell Butler', 'shantell.b@gmail.com', '(242) 323-1017', true, 'New Providence (Nassau)', NULL, '35-44', 'Education'),
('Kendrick Bain', 'kendrick.bain@outlook.com', '(242) 346-1018', true, 'Bimini', NULL, '18-24', 'Tourism & Hospitality'),
('Angela Major', 'angela.m@yahoo.com', '(242) 323-1019', true, 'New Providence (Nassau)', NULL, '45-54', 'Healthcare'),
('Trevor Dean', 'trevor.dean@gmail.com', '(242) 339-1020', true, 'Inagua', NULL, '35-44', 'Government / Public Sector'),
('Nicole Lightbourne', 'nicole.l@hotmail.com', NULL, false, 'Grand Bahama (Freeport)', 'United Kingdom', '25-34', 'Retail & Commerce'),
('Jermaine Russell', 'jermaine.r@gmail.com', '(242) 323-1022', true, 'New Providence (Nassau)', NULL, '55-64', 'Construction'),
('Samantha Clarke', 'samantha.c@outlook.com', '(242) 335-1023', true, 'Acklins', NULL, '25-34', 'Agriculture & Fisheries'),
('Robert Adderley', 'robert.a@yahoo.com', '(242) 367-1024', true, 'Abaco', NULL, '45-54', 'Self-Employed / Entrepreneur'),
('Tamika Wells', 'tamika.w@gmail.com', NULL, false, 'New Providence (Nassau)', 'United States', '18-24', 'Student'),
('Dwight Rolle', 'dwight.rolle@live.com', '(242) 332-1026', true, 'Eleuthera', NULL, '35-44', 'Tourism & Hospitality'),
('Keisha McPhee', 'keisha.m@hotmail.com', '(242) 345-1027', true, 'Exuma', NULL, '65+', 'Retired'),
('Adrian Hepburn', 'adrian.h@gmail.com', '(242) 323-1028', true, 'New Providence (Nassau)', NULL, '25-34', 'Financial Services'),
('Sonia Armbrister', 'sonia.a@outlook.com', '(242) 348-1029', true, 'Berry Islands', NULL, '45-54', 'Education'),
('Desmond Curry', 'desmond.c@yahoo.com', '(242) 352-1030', true, 'Grand Bahama (Freeport)', NULL, '35-44', 'Technology / IT');

-- Dynamic Responses (question_id references seed-questions.sql IDs)
-- Q1: Tech comfort (scale 1-5)
INSERT INTO responses (citizen_id, question_id, value) VALUES
(1,1,'4'),(2,1,'3'),(3,1,'5'),(4,1,'3'),(5,1,'2'),(6,1,'5'),(7,1,'3'),(8,1,'2'),(9,1,'4'),(10,1,'2'),
(11,1,'1'),(12,1,'4'),(13,1,'3'),(14,1,'5'),(15,1,'2'),(16,1,'4'),(17,1,'3'),(18,1,'4'),(19,1,'3'),(20,1,'2'),
(21,1,'4'),(22,1,'2'),(23,1,'3'),(24,1,'4'),(25,1,'5'),(26,1,'3'),(27,1,'1'),(28,1,'4'),(29,1,'3'),(30,1,'5');

-- Q2: Primary barrier (dropdown)
INSERT INTO responses (citizen_id, question_id, value) VALUES
(1,2,'Cost of internet / devices'),(2,2,'Lack of training or skills'),(3,2,'Cost of internet / devices'),
(4,2,'Privacy / security concerns'),(5,2,'Lack of training or skills'),(6,2,'Limited internet access in my area'),
(7,2,'Cost of internet / devices'),(8,2,'Limited internet access in my area'),(9,2,'Privacy / security concerns'),
(10,2,'Lack of training or skills'),(11,2,'Don''t see the need'),(12,2,'Cost of internet / devices'),
(13,2,'Limited internet access in my area'),(14,2,'Cost of internet / devices'),(15,2,'Lack of local tech support'),
(16,2,'Cost of internet / devices'),(17,2,'Lack of training or skills'),(18,2,'Cost of internet / devices'),
(19,2,'Privacy / security concerns'),(20,2,'Limited internet access in my area'),(21,2,'Cost of internet / devices'),
(22,2,'Lack of training or skills'),(23,2,'Limited internet access in my area'),(24,2,'Lack of local tech support'),
(25,2,'Cost of internet / devices'),(26,2,'Limited internet access in my area'),(27,2,'Lack of training or skills'),
(28,2,'Cost of internet / devices'),(29,2,'Lack of training or skills'),(30,2,'Cost of internet / devices');

-- Q3: Career interest (checkbox)
INSERT INTO responses (citizen_id, question_id, value) VALUES
(1,3,'["Yes, I am interested in a tech career"]'),(3,3,'["Yes, I am interested in a tech career"]'),
(6,3,'["Yes, I am interested in a tech career"]'),(9,3,'["Yes, I am interested in a tech career"]'),
(12,3,'["Yes, I am interested in a tech career"]'),(14,3,'["Yes, I am interested in a tech career"]'),
(16,3,'["Yes, I am interested in a tech career"]'),(18,3,'["Yes, I am interested in a tech career"]'),
(24,3,'["Yes, I am interested in a tech career"]'),(25,3,'["Yes, I am interested in a tech career"]'),
(28,3,'["Yes, I am interested in a tech career"]'),(30,3,'["Yes, I am interested in a tech career"]');

-- Q4: Desired skill (dropdown)
INSERT INTO responses (citizen_id, question_id, value) VALUES
(1,4,'Data analysis'),(2,4,'Digital marketing'),(3,4,'Coding / Software development'),
(4,4,'Cybersecurity'),(5,4,'Basic computer literacy'),(6,4,'AI / Machine learning'),
(7,4,'Digital marketing'),(8,4,'Basic computer literacy'),(9,4,'Data analysis'),
(10,4,'Project management'),(11,4,'Basic computer literacy'),(12,4,'Graphic design'),
(13,4,'Digital marketing'),(14,4,'Coding / Software development'),(15,4,'Cybersecurity'),
(16,4,'AI / Machine learning'),(17,4,'Project management'),(18,4,'Digital marketing'),
(19,4,'Cybersecurity'),(20,4,'Basic computer literacy'),(21,4,'Digital marketing'),
(22,4,'Project management'),(23,4,'Data analysis'),(24,4,'Graphic design'),
(25,4,'Coding / Software development'),(26,4,'Digital marketing'),(27,4,'Basic computer literacy'),
(28,4,'Data analysis'),(29,4,'Project management'),(30,4,'AI / Machine learning');

-- Q5: Biggest concern (textarea)
INSERT INTO responses (citizen_id, question_id, value) VALUES
(1,5,'The high cost of internet makes it hard for regular people to participate in the digital economy.'),
(2,5,'Tourism industry needs better tech integration but workers lack training.'),
(3,5,'My generation wants tech careers but there are few opportunities in Nassau.'),
(4,5,'Government systems are vulnerable to cyber attacks and data breaches.'),
(5,5,'Many teachers still do not know how to use technology effectively in classrooms.'),
(6,5,'Brain drain - our best tech talent leaves for the US because there are no jobs here.'),
(7,5,'Small businesses cannot afford the technology they need to compete.'),
(8,5,'Andros has terrible internet coverage. We feel left behind.'),
(9,5,'Patient data security is a major concern as we digitize health records.'),
(10,5,'Construction industry is behind on adopting modern technology.'),
(11,5,'Technology moves too fast for people my age. We get left behind.'),
(12,5,'Starting a business in the Bahamas requires too much paperwork and in-person visits.'),
(13,5,'Cat Island tourists want to book online but our internet is unreliable.'),
(14,5,'We need more hackathons and coding competitions to build a tech culture.'),
(15,5,'Government websites go down frequently and are hard to navigate.'),
(16,5,'Banking fees are too high and technology could help bring them down.'),
(17,5,'Teachers need ongoing professional development in technology.'),
(18,5,'Young people in Bimini have to leave for better opportunities.'),
(19,5,'Hospital record systems are outdated and error-prone.'),
(20,5,'Inagua has the worst connectivity in the country. We need help.'),
(21,5,'Cost of living in Freeport makes it hard to invest in technology.'),
(22,5,'Many tradespeople could benefit from technology but nobody teaches us.'),
(23,5,'Farming in Acklins is still done the old way. Technology could help.'),
(24,5,'When something breaks there is nobody qualified to fix it on the outer islands.'),
(25,5,'I want to study computer science but COB barely offers courses.'),
(26,5,'Eleuthera tourism could boom with better online marketing tools.'),
(27,5,'At my age, even using a smartphone is challenging.'),
(28,5,'Financial services sector needs to modernize or lose business to other jurisdictions.'),
(29,5,'Berry Islands schools need better technology resources.'),
(30,5,'Internet costs in the Bahamas are among the highest in the Caribbean.');

-- Q6: Best opportunity (textarea)
INSERT INTO responses (citizen_id, question_id, value) VALUES
(1,6,'Fintech could revolutionize banking access across the islands.'),
(2,6,'Digital tourism marketing could attract more visitors to Family Islands.'),
(3,6,'Young Bahamians could build apps and services for the Caribbean region.'),
(4,6,'Digitizing government services would reduce corruption and increase transparency.'),
(5,6,'Online learning could reach students on remote islands who lack resources.'),
(6,6,'The Bahamas could become a Caribbean tech hub if we invest in infrastructure.'),
(7,6,'E-commerce could open up Family Island businesses to the world.'),
(8,6,'Technology could help farmers track weather patterns and market prices.'),
(9,6,'Telemedicine could transform healthcare access for Family Island residents.'),
(10,6,'Building Information Modeling could reduce costs and improve project delivery.'),
(11,6,'Video calls let me stay connected with grandchildren in Nassau.'),
(12,6,'Digital tools let small businesses punch above their weight in global markets.'),
(13,6,'Family Islands could develop eco-tourism through better online presence.'),
(14,6,'Bahamian developers could create solutions for Caribbean-specific problems.'),
(15,6,'E-government could save people from traveling to Nassau for every document.'),
(16,6,'Digital banking and crypto could provide financial inclusion for the unbanked.'),
(17,6,'Blended learning models could improve education outcomes across the islands.'),
(18,6,'Marine technology and tourism tech could create jobs on smaller islands.'),
(19,6,'AI diagnostics could help our understaffed clinics serve patients better.'),
(20,6,'Technology could help environmental monitoring and conservation efforts.'),
(21,6,'Grand Bahama could attract remote workers with better infrastructure.'),
(22,6,'Construction tech could create safer building practices in hurricane zones.'),
(23,6,'Agricultural technology could help food security and reduce imports.'),
(24,6,'Abaco could attract tech workers looking for island lifestyle.'),
(25,6,'Bahamian youth could lead tech innovation in the Caribbean.'),
(26,6,'Sustainable tourism tech could be a model for the Caribbean.'),
(27,6,'Keeping in touch with family through technology is wonderful.'),
(28,6,'The Bahamas could lead Caribbean fintech innovation.'),
(29,6,'Distance learning could equalize education between Nassau and Family Islands.'),
(30,6,'The Bahamas could become a Caribbean AI research and development center.');

-- Q7: Preferred gov service (dropdown)
INSERT INTO responses (citizen_id, question_id, value) VALUES
(1,7,'Online tax filing'),(2,7,'Business registration online'),(3,7,'Online education portal'),
(4,7,'Digital ID / passport renewal'),(5,7,'Online education portal'),(6,7,'Business registration online'),
(7,7,'Online utility payments'),(8,7,'Online utility payments'),(9,7,'E-health records'),
(10,7,'Digital land registry'),(11,7,'Digital ID / passport renewal'),(12,7,'Business registration online'),
(13,7,'Government job portal'),(14,7,'Online education portal'),(15,7,'Online court services'),
(16,7,'Online tax filing'),(17,7,'Online education portal'),(18,7,'Government job portal'),
(19,7,'E-health records'),(20,7,'Emergency alert system'),(21,7,'Online utility payments'),
(22,7,'Digital land registry'),(23,7,'Business registration online'),(24,7,'Business registration online'),
(25,7,'Online education portal'),(26,7,'Online utility payments'),(27,7,'Digital ID / passport renewal'),
(28,7,'Online tax filing'),(29,7,'Online education portal'),(30,7,'Business registration online');

-- Q8: Gov tech suggestion (textarea)
INSERT INTO responses (citizen_id, question_id, value) VALUES
(1,8,'Create a single government portal for all services.'),
(2,8,'Better online booking systems for government-related tourism permits.'),
(3,8,'Offer free Wi-Fi in all government buildings and public spaces.'),
(4,8,'Invest in cybersecurity training for all government employees.'),
(5,8,'Provide tablets and internet access to every school in the country.'),
(6,8,'Build a government tech incubator and offer tax breaks for tech startups.'),
(7,8,'Create small business tech grants and subsidize internet costs.'),
(8,8,'Extend broadband to all inhabited islands, not just Nassau and Freeport.'),
(9,8,'Implement a national electronic health records system with proper security.'),
(10,8,'Require digital building permits and inspection reports.'),
(11,8,'Offer free computer classes for seniors at community centers.'),
(12,8,'All business registration and licensing should be 100% online.'),
(13,8,'Install community Wi-Fi hotspots in all settlement centers.'),
(14,8,'Partner with tech companies to create internship programs for young Bahamians.'),
(15,8,'Hire competent IT professionals and pay them competitive salaries.'),
(16,8,'Support the Sand Dollar digital currency and reduce transaction fees.'),
(17,8,'Create a national teacher training program for educational technology.'),
(18,8,'Create a youth tech apprenticeship program.'),
(19,8,'Implement telemedicine for Family Island clinics.'),
(20,8,'The government must treat internet as a basic utility.'),
(21,8,'Reduce import duties on computers and tech equipment.'),
(22,8,'Offer trade-specific technology courses at BTVI.'),
(23,8,'Create a national agricultural technology program.'),
(24,8,'Train local technicians on every major island.'),
(25,8,'Offer coding boot camps and scholarships for tech education.'),
(26,8,'Build out fiber optic connections to all major Family Islands.'),
(27,8,'Have patient young people teach seniors at churches and community centers.'),
(28,8,'Create regulatory sandbox for fintech startups.'),
(29,8,'Every school should have reliable internet and modern computers.'),
(30,8,'Regulate internet providers to bring down costs and improve service.');

-- Q9: Technology priorities (checkbox - stored as JSON arrays)
INSERT INTO responses (citizen_id, question_id, value) VALUES
(1,9,'["Digital financial inclusion","Affordable internet access","Support for local tech startups"]'),
(2,9,'["Tech education in schools","E-commerce development","Digital government services"]'),
(3,9,'["Support for local tech startups","Affordable internet access","Tech education in schools"]'),
(4,9,'["Cybersecurity and data privacy","Digital government services","Smart city infrastructure"]'),
(5,9,'["Tech education in schools","Affordable internet access","Telemedicine and e-health"]'),
(6,9,'["Support for local tech startups","Affordable internet access","Smart city infrastructure"]'),
(7,9,'["E-commerce development","Affordable internet access","Support for local tech startups"]'),
(8,9,'["Affordable internet access","Environmental tech solutions","Tech education in schools"]'),
(9,9,'["Telemedicine and e-health","Cybersecurity and data privacy","Digital government services"]'),
(10,9,'["Smart city infrastructure","Tech education in schools","Digital government services"]'),
(11,9,'["Digital government services","Telemedicine and e-health","Affordable internet access"]'),
(12,9,'["E-commerce development","Support for local tech startups","Digital government services"]'),
(13,9,'["Affordable internet access","E-commerce development","Tech education in schools"]'),
(14,9,'["Support for local tech startups","Tech education in schools","Affordable internet access"]'),
(15,9,'["Digital government services","Cybersecurity and data privacy","Smart city infrastructure"]'),
(16,9,'["Digital financial inclusion","Support for local tech startups","Affordable internet access"]'),
(17,9,'["Tech education in schools","Digital government services","Affordable internet access"]'),
(18,9,'["Support for local tech startups","Affordable internet access","E-commerce development"]'),
(19,9,'["Telemedicine and e-health","Cybersecurity and data privacy","Tech education in schools"]'),
(20,9,'["Affordable internet access","Environmental tech solutions","Digital government services"]'),
(21,9,'["Affordable internet access","E-commerce development","Smart city infrastructure"]'),
(22,9,'["Tech education in schools","Smart city infrastructure","Affordable internet access"]'),
(23,9,'["Environmental tech solutions","Affordable internet access","Tech education in schools"]'),
(24,9,'["Support for local tech startups","Affordable internet access","E-commerce development"]'),
(25,9,'["Tech education in schools","Support for local tech startups","Affordable internet access"]'),
(26,9,'["Affordable internet access","E-commerce development","Environmental tech solutions"]'),
(27,9,'["Digital government services","Telemedicine and e-health","Tech education in schools"]'),
(28,9,'["Digital financial inclusion","Support for local tech startups","Cybersecurity and data privacy"]'),
(29,9,'["Tech education in schools","Affordable internet access","Digital government services"]'),
(30,9,'["Affordable internet access","Support for local tech startups","Smart city infrastructure"]');

-- Q10: Interest areas (checkbox - stored as JSON arrays)
INSERT INTO responses (citizen_id, question_id, value) VALUES
(1,10,'["Tech career mentorship","Small business tech grants"]'),
(2,10,'["Free coding workshops","Senior digital literacy classes"]'),
(3,10,'["Free coding workshops","Hackathons and competitions","Tech internship programs"]'),
(4,10,'["Open data initiatives","Tech career mentorship"]'),
(5,10,'["Senior digital literacy classes","Youth tech programs"]'),
(6,10,'["Hackathons and competitions","Tech internship programs","Small business tech grants"]'),
(7,10,'["Small business tech grants","Free coding workshops"]'),
(8,10,'["Community Wi-Fi hotspots","Senior digital literacy classes"]'),
(9,10,'["Tech career mentorship","Women in tech initiatives"]'),
(10,10,'["Free coding workshops","Community Wi-Fi hotspots"]'),
(11,10,'["Senior digital literacy classes","Community Wi-Fi hotspots"]'),
(12,10,'["Small business tech grants","Hackathons and competitions","Tech career mentorship"]'),
(13,10,'["Community Wi-Fi hotspots","Small business tech grants"]'),
(14,10,'["Hackathons and competitions","Tech internship programs","Free coding workshops"]'),
(15,10,'["Open data initiatives"]'),
(16,10,'["Tech career mentorship","Small business tech grants","Hackathons and competitions"]'),
(17,10,'["Youth tech programs","Free coding workshops"]'),
(18,10,'["Youth tech programs","Tech internship programs","Free coding workshops"]'),
(19,10,'["Women in tech initiatives","Tech career mentorship"]'),
(20,10,'["Community Wi-Fi hotspots"]'),
(21,10,'["Small business tech grants","Free coding workshops"]'),
(22,10,'["Free coding workshops","Community Wi-Fi hotspots"]'),
(23,10,'["Community Wi-Fi hotspots","Small business tech grants"]'),
(24,10,'["Small business tech grants","Tech career mentorship"]'),
(25,10,'["Hackathons and competitions","Tech internship programs","Free coding workshops","Youth tech programs"]'),
(26,10,'["Community Wi-Fi hotspots","Small business tech grants"]'),
(27,10,'["Senior digital literacy classes"]'),
(28,10,'["Tech career mentorship","Hackathons and competitions"]'),
(29,10,'["Youth tech programs","Community Wi-Fi hotspots"]'),
(30,10,'["Hackathons and competitions","Tech internship programs","Small business tech grants"]');
