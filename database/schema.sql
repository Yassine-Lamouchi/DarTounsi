-- ============================================
-- DarTounsi v2 — Database Schema & Seed Data
-- Run this in phpMyAdmin after creating the database
-- ============================================

DROP DATABASE IF EXISTS dartounsi;
CREATE DATABASE dartounsi CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE dartounsi;

-- ============================================
-- TABLES
-- ============================================

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  avatar_url VARCHAR(500),
  banner_url VARCHAR(500),
  description TEXT,
  location VARCHAR(200),
  role ENUM('tenant','owner','hotel_manager','admin','super_admin') DEFAULT 'tenant',
  google_id VARCHAR(100),
  phone VARCHAR(20),
  is_verified TINYINT(1) DEFAULT 0,
  lifestyle_prefs JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_role (role),
  INDEX idx_email (email)
) ENGINE=InnoDB;

CREATE TABLE properties (
  id INT AUTO_INCREMENT PRIMARY KEY,
  owner_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  type ENUM('apartment','house','studio','room','hotel_room') NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'TND',
  city VARCHAR(50) NOT NULL,
  neighborhood VARCHAR(100),
  address VARCHAR(255),
  lat DECIMAL(10,7),
  lng DECIMAL(10,7),
  bedrooms INT DEFAULT 1,
  bathrooms INT DEFAULT 1,
  area_sqm INT,
  amenities JSON,
  images JSON,
  is_furnished TINYINT(1) DEFAULT 0,
  is_premium TINYINT(1) DEFAULT 0,
  status ENUM('pending','active','rejected','rented','archived') DEFAULT 'pending',
  views_count INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_city (city),
  INDEX idx_status (status),
  INDEX idx_type (type),
  INDEX idx_price (price)
) ENGINE=InnoDB;

CREATE TABLE rental_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT NOT NULL,
  property_id INT NOT NULL,
  owner_id INT NOT NULL,
  status ENUM('pending','accepted','rejected') DEFAULT 'pending',
  message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_tenant (tenant_id),
  INDEX idx_owner (owner_id),
  INDEX idx_status (status)
) ENGINE=InnoDB;

CREATE TABLE favorites (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  property_id INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
  UNIQUE KEY uk_fav (user_id, property_id)
) ENGINE=InnoDB;

CREATE TABLE reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  property_id INT NOT NULL,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sender_id INT NOT NULL,
  receiver_id INT NOT NULL,
  property_id INT,
  content TEXT NOT NULL,
  is_read TINYINT(1) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE SET NULL,
  INDEX idx_receiver (receiver_id, is_read)
) ENGINE=InnoDB;

CREATE TABLE matchmaking_profiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNIQUE NOT NULL,
  sleep_schedule ENUM('early_bird','night_owl','flexible') DEFAULT 'flexible',
  noise_level ENUM('quiet','moderate','social') DEFAULT 'moderate',
  is_smoker TINYINT(1) DEFAULT 0,
  pets_allowed TINYINT(1) DEFAULT 0,
  cleanliness ENUM('very_clean','moderate','relaxed') DEFAULT 'moderate',
  guest_policy ENUM('never','sometimes','often') DEFAULT 'sometimes',
  budget_min DECIMAL(10,2),
  budget_max DECIMAL(10,2),
  preferred_city VARCHAR(50),
  preferred_neighborhood VARCHAR(100),
  bio TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE match_results (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_a_id INT NOT NULL,
  user_b_id INT NOT NULL,
  compatibility_score DECIMAL(5,2),
  score_breakdown JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_a_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (user_b_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  type VARCHAR(50),
  title VARCHAR(200),
  message TEXT,
  link VARCHAR(255),
  is_read TINYINT(1) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_read (user_id, is_read)
) ENGINE=InnoDB;

CREATE TABLE reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reporter_id INT NOT NULL,
  property_id INT NOT NULL,
  reason VARCHAR(100),
  details TEXT,
  status ENUM('pending','reviewed','resolved') DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  property_id INT NOT NULL,
  amount DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'TND',
  payment_method VARCHAR(50),
  status ENUM('pending','completed','failed') DEFAULT 'pending',
  transaction_ref VARCHAR(100),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE area_safety (
  id INT AUTO_INCREMENT PRIMARY KEY,
  city VARCHAR(50) NOT NULL,
  neighborhood VARCHAR(100) NOT NULL,
  safety_score INT CHECK (safety_score BETWEEN 1 AND 100),
  description TEXT,
  stats JSON,
  UNIQUE KEY uk_area (city, neighborhood)
) ENGINE=InnoDB;

-- ============================================
-- SEED DATA
-- ============================================

-- Password hashes: 'password123' = $2y$12$FzmNa... | '456789' = $2y$12$0FN2C...
-- Super Admin & Admins use password '456789', everyone else uses 'password123'

INSERT INTO users (name, email, password_hash, avatar_url, role, phone, is_verified, description, location) VALUES
-- Super Admin (password: 456789)
('Yassine Lamouchi','yassine.lamouchi@dartounsi.tn','$2y$12$0FN2C5beFE4tGBAZNATFjeMdZ04Q0N3Z.bJEPZwKsziiGJJ4hPNtu',NULL,'super_admin','+216 98 000 001',1,'Founder & Super Administrator of DarTounsi. Product Owner of the Scrum team.','Tunis, Tunisia'),
-- Admins (password: 456789)
('Mohamed Khabou','mohamed.khabou@dartounsi.tn','$2y$12$0FN2C5beFE4tGBAZNATFjeMdZ04Q0N3Z.bJEPZwKsziiGJJ4hPNtu',NULL,'admin','+216 55 000 002',1,'Platform administrator and Scrum Master.','Tunis, Tunisia'),
('Aymen Majdoub','aymen.majdoub@dartounsi.tn','$2y$12$0FN2C5beFE4tGBAZNATFjeMdZ04Q0N3Z.bJEPZwKsziiGJJ4hPNtu',NULL,'admin','+216 22 000 003',1,'Platform administrator. Development team member.','Tunis, Tunisia'),
('Adem Loukil','adem.loukil@dartounsi.tn','$2y$12$0FN2C5beFE4tGBAZNATFjeMdZ04Q0N3Z.bJEPZwKsziiGJJ4hPNtu',NULL,'admin','+216 33 000 004',1,'Platform administrator. Development team member.','Tunis, Tunisia'),
('Raed Guesmi','raed.guesmi@dartounsi.tn','$2y$12$0FN2C5beFE4tGBAZNATFjeMdZ04Q0N3Z.bJEPZwKsziiGJJ4hPNtu',NULL,'admin','+216 44 000 005',1,'Platform administrator. Development team member.','Tunis, Tunisia'),
('Mohamed Amin Guirat','mohamedamin.guirat@dartounsi.tn','$2y$12$0FN2C5beFE4tGBAZNATFjeMdZ04Q0N3Z.bJEPZwKsziiGJJ4hPNtu',NULL,'admin','+216 55 000 006',1,'Platform administrator. Development team member.','Tunis, Tunisia'),
-- Regular users (password: password123)
('Asma Ben Ali','asma.benali@email.tn','$2y$12$FzmNa.slLp5mFpNGBzo37eDAU/lEELD/L/qBc2L6to8HfYR.EOYr6',NULL,'tenant','+216 90 111 001',0,'Engineering student looking for affordable housing near campus.','El Manar, Tunis'),
('Mehdi Trabelsi','mehdi.trabelsi@email.tn','$2y$12$FzmNa.slLp5mFpNGBzo37eDAU/lEELD/L/qBc2L6to8HfYR.EOYr6',NULL,'owner','+216 25 222 002',1,'Real estate investor specializing in student housing.','Sfax, Tunisia'),
('Nour Hamdi','nour.hamdi@email.tn','$2y$12$FzmNa.slLp5mFpNGBzo37eDAU/lEELD/L/qBc2L6to8HfYR.EOYr6',NULL,'tenant','+216 50 333 003',0,'Medical student seeking quiet accommodation in Sousse.','Sousse, Tunisia'),
('Khaled Mansouri','khaled.mansouri@email.tn','$2y$12$FzmNa.slLp5mFpNGBzo37eDAU/lEELD/L/qBc2L6to8HfYR.EOYr6',NULL,'owner','+216 98 444 004',1,'Luxury property owner in Hammamet and Tunis.','Hammamet, Tunisia'),
('Fatma Gharbi','fatma.gharbi@email.tn','$2y$12$FzmNa.slLp5mFpNGBzo37eDAU/lEELD/L/qBc2L6to8HfYR.EOYr6',NULL,'tenant','+216 23 555 005',1,'Young professional working in IT sector.','Lac 1, Tunis'),
('Slim Bouaziz','slim.bouaziz@email.tn','$2y$12$FzmNa.slLp5mFpNGBzo37eDAU/lEELD/L/qBc2L6to8HfYR.EOYr6',NULL,'hotel_manager','+216 71 666 006',1,'Managing boutique hotels across Tunisia since 2015.','Hammamet, Tunisia'),
('Ines Chahed','ines.chahed@email.tn','$2y$12$FzmNa.slLp5mFpNGBzo37eDAU/lEELD/L/qBc2L6to8HfYR.EOYr6',NULL,'tenant','+216 52 777 007',0,'Architecture student looking for inspiring living spaces.','Sidi Bou Said, Tunis'),
('Rami Jebali','rami.jebali@email.tn','$2y$12$FzmNa.slLp5mFpNGBzo37eDAU/lEELD/L/qBc2L6to8HfYR.EOYr6',NULL,'owner','+216 97 888 008',1,'Experienced landlord with properties in Sidi Bou Said and La Marsa.','Sidi Bou Said, Tunis'),
('Sarra Mzoughi','sarra.mzoughi@email.tn','$2y$12$FzmNa.slLp5mFpNGBzo37eDAU/lEELD/L/qBc2L6to8HfYR.EOYr6',NULL,'tenant','+216 28 999 009',0,'Law student at University of Tunis.','Centre Ville, Tunis'),
('Omar Cherif','omar.cherif@email.tn','$2y$12$FzmNa.slLp5mFpNGBzo37eDAU/lEELD/L/qBc2L6to8HfYR.EOYr6',NULL,'owner','+216 50 100 010',1,'Real estate developer focused on modern apartments.','Monastir, Tunisia'),
('Leila Ferchichi','leila.ferchichi@email.tn','$2y$12$FzmNa.slLp5mFpNGBzo37eDAU/lEELD/L/qBc2L6to8HfYR.EOYr6',NULL,'hotel_manager','+216 71 200 011',1,'Hospitality professional with 10+ years experience.','Sousse, Tunisia'),
('Anis Dridi','anis.dridi@email.tn','$2y$12$FzmNa.slLp5mFpNGBzo37eDAU/lEELD/L/qBc2L6to8HfYR.EOYr6',NULL,'tenant','+216 92 300 012',0,'Freelance photographer looking for a studio with good light.','La Marsa, Tunis'),
('Mariem Saidi','mariem.saidi@email.tn','$2y$12$FzmNa.slLp5mFpNGBzo37eDAU/lEELD/L/qBc2L6to8HfYR.EOYr6',NULL,'tenant','+216 53 400 013',1,'Teacher at a private school in Ennasr.','Ennasr, Tunis'),
('Hichem Nasri','hichem.nasri@email.tn','$2y$12$FzmNa.slLp5mFpNGBzo37eDAU/lEELD/L/qBc2L6to8HfYR.EOYr6',NULL,'owner','+216 26 500 014',1,'Family property manager in Nabeul region.','Nabeul, Tunisia'),
('Amira Oueslati','amira.oueslati@email.tn','$2y$12$FzmNa.slLp5mFpNGBzo37eDAU/lEELD/L/qBc2L6to8HfYR.EOYr6',NULL,'tenant','+216 55 600 015',0,'Business school student at IHEC.','Manouba, Tunis'),
('Bilel Karray','bilel.karray@email.tn','$2y$12$FzmNa.slLp5mFpNGBzo37eDAU/lEELD/L/qBc2L6to8HfYR.EOYr6',NULL,'owner','+216 98 700 016',0,'New property owner with an apartment in Sousse.','Sousse, Tunisia'),
('Dalila Hammami','dalila.hammami@email.tn','$2y$12$FzmNa.slLp5mFpNGBzo37eDAU/lEELD/L/qBc2L6to8HfYR.EOYr6',NULL,'tenant','+216 20 800 017',1,'Nurse working at Charles Nicolle Hospital.','Bab Saadoun, Tunis'),
('Walid Riahi','walid.riahi@email.tn','$2y$12$FzmNa.slLp5mFpNGBzo37eDAU/lEELD/L/qBc2L6to8HfYR.EOYr6',NULL,'hotel_manager','+216 71 900 018',1,'Hotel chain manager for coastal properties.','Djerba, Tunisia'),
('Syrine Bouzid','syrine.bouzid@email.tn','$2y$12$FzmNa.slLp5mFpNGBzo37eDAU/lEELD/L/qBc2L6to8HfYR.EOYr6',NULL,'tenant','+216 94 010 019',0,'Computer science student at ENIT.','El Manar, Tunis'),
('Karim Tlili','karim.tlili@email.tn','$2y$12$FzmNa.slLp5mFpNGBzo37eDAU/lEELD/L/qBc2L6to8HfYR.EOYr6',NULL,'owner','+216 25 020 020',1,'Retired engineer renting family properties.','Carthage, Tunis'),
('Houda Meftah','houda.meftah@email.tn','$2y$12$FzmNa.slLp5mFpNGBzo37eDAU/lEELD/L/qBc2L6to8HfYR.EOYr6',NULL,'tenant','+216 58 030 021',1,'Graphic designer working remotely.','Gammarth, Tunis'),
('Tarek Abidi','tarek.abidi@email.tn','$2y$12$FzmNa.slLp5mFpNGBzo37eDAU/lEELD/L/qBc2L6to8HfYR.EOYr6',NULL,'owner','+216 97 040 022',1,'Real estate agent and property owner.','Bizerte, Tunisia'),
('Rim Kchaou','rim.kchaou@email.tn','$2y$12$FzmNa.slLp5mFpNGBzo37eDAU/lEELD/L/qBc2L6to8HfYR.EOYr6',NULL,'tenant','+216 52 050 023',0,'Pharmacy student in Monastir.','Monastir, Tunisia'),
('Fares Gharbi','fares.gharbi@email.tn','$2y$12$FzmNa.slLp5mFpNGBzo37eDAU/lEELD/L/qBc2L6to8HfYR.EOYr6',NULL,'owner','+216 22 060 024',1,'Vacation rental specialist in Kelibia.','Kelibia, Tunisia'),
('Mouna Jlassi','mouna.jlassi@email.tn','$2y$12$FzmNa.slLp5mFpNGBzo37eDAU/lEELD/L/qBc2L6to8HfYR.EOYr6',NULL,'tenant','+216 90 070 025',0,'Journalist working in downtown Tunis.','Centre Ville, Tunis');

-- Properties (51 listings with real images from /uploads/)
-- 12 images pool: apartment_modern.png, beach_house.png, hotel_room.png, house_traditional.png, studio_student.png, villa_luxury.png, apartment_city.png, studio_cozy.png, villa_traditional.png, room_shared.png, penthouse_luxury.png, house_garden.png
-- Owner IDs adjusted: old owner_id=3 was Aymen (now admin), reassigned to owner IDs 8,10,14,16,20,22,26,28,30

INSERT INTO properties (owner_id, title, description, type, price, city, neighborhood, address, lat, lng, bedrooms, bathrooms, area_sqm, amenities, images, is_furnished, is_premium, status, views_count) VALUES
(8,'Modern Apartment in L''Aouina','Spacious 3-bedroom apartment with sea breeze, modern kitchen, and balcony overlooking the Mediterranean. 10 minutes from Tunis-Carthage Airport.','apartment',850,'Tunis','L''Aouina','45 Rue de la Plage',36.8465,10.2217,3,2,120,'["wifi","ac","parking","elevator","balcony","washing_machine"]','["uploads/apartment_modern.png"]',1,1,'active',342),
(8,'Cozy Studio Near FST','Fully equipped studio perfect for students. 5-minute walk to Tunis El Manar University. Quiet neighborhood.','studio',400,'Tunis','El Manar','12 Rue Ibn Khaldoun',36.8100,10.1650,1,1,35,'["wifi","ac","furnished","near_university"]','["uploads/studio_student.png"]',1,0,'active',218),
(10,'Sea View Villa in Hammamet','Luxurious 5-bedroom villa with private pool, garden, and panoramic sea view. Traditional Tunisian architecture.','house',2200,'Hammamet','Centre Ville','8 Avenue Habib Bourguiba',36.4000,10.6109,5,3,280,'["wifi","ac","pool","garden","parking","sea_view","security"]','["uploads/villa_luxury.png"]',1,1,'active',567),
(8,'Student Room in Ennasr','Affordable room in shared apartment. Clean, quiet, and close to public transport.','room',250,'Tunis','Ennasr','23 Rue de l''Indépendance',36.8400,10.1900,1,1,18,'["wifi","furnished","near_transport"]','["uploads/room_shared.png"]',1,0,'active',156),
(8,'Furnished Apartment Sfax Centre','Beautiful 2-bedroom apartment in the heart of Sfax. Recently renovated with modern appliances.','apartment',600,'Sfax','Centre Ville','17 Avenue Ali Belhouane',34.7406,10.7603,2,1,85,'["wifi","ac","furnished","elevator"]','["uploads/apartment_city.png"]',1,0,'active',198),
(10,'Luxury Penthouse Lac 2','Exceptional 4-bedroom penthouse with rooftop terrace and 360 views of Tunis Lake. Premium building.','apartment',3500,'Tunis','Lac 2','1 Rue du Lac Biwa',36.8350,10.2330,4,3,200,'["wifi","ac","pool","gym","parking","security","elevator","terrace","sea_view"]','["uploads/penthouse_luxury.png"]',1,1,'active',891),
(14,'Charming House Sidi Bou Said','Traditional Tunisian house in the iconic blue-and-white village. 3 bedrooms, inner courtyard.','house',1800,'Tunis','Sidi Bou Said','5 Rue Habib Thameur',36.8700,10.3450,3,2,150,'["wifi","terrace","sea_view","furnished","garden"]','["uploads/house_traditional.png"]',1,1,'active',423),
(16,'Studio Monastir Beach','Bright studio facing the beach in Monastir. Fully furnished with kitchenette.','studio',350,'Monastir','Skanes','Avenue de la Corniche',35.7643,10.8113,1,1,30,'["wifi","ac","furnished","sea_view","near_beach"]','["uploads/studio_cozy.png"]',1,0,'active',167),
(20,'Family Apartment Sousse','Spacious 3-bedroom apartment in residential area. Close to schools and Sousse corniche.','apartment',750,'Sousse','Sahloul','34 Rue de Marseille',35.8260,10.6360,3,2,110,'["wifi","ac","parking","elevator","furnished"]','["uploads/apartment_modern.png"]',1,0,'active',234),
(26,'Apartment Near ENIT','2-bedroom apartment ideal for engineering students. 3-minute walk to ENIT campus.','apartment',500,'Tunis','El Manar','8 Rue de l''Université',36.8120,10.1680,2,1,65,'["wifi","ac","furnished","near_university","security"]','["uploads/apartment_city.png"]',1,0,'active',289),
(28,'Villa Carthage Byrsa','Magnificent villa near Carthage ruins. 4 bedrooms, swimming pool, landscaped garden.','house',2800,'Tunis','Carthage','12 Avenue Habib Bourguiba',36.8528,10.3230,4,3,250,'["wifi","ac","pool","garden","parking","security","furnished"]','["uploads/villa_traditional.png"]',1,1,'active',445),
(30,'Budget Room Manouba','Clean single room in student residence area. Near University of Manouba. All utilities included.','room',180,'Tunis','Manouba','56 Rue de la République',36.8080,10.0990,1,1,14,'["wifi","furnished","near_university"]','["uploads/room_shared.png"]',1,0,'active',134),
(12,'Hotel Room Hammamet Yasmine','Comfortable hotel room in Yasmine Hammamet tourist zone. Daily housekeeping, breakfast included.','hotel_room',120,'Hammamet','Yasmine','Zone Touristique',36.3700,10.5600,1,1,25,'["wifi","ac","pool","room_service","breakfast"]','["uploads/hotel_room.png"]',1,0,'active',312),
(17,'Hotel Suite Sousse Palace','Luxurious suite in 4-star hotel at Port El Kantaoui. Sea view, spa access.','hotel_room',250,'Sousse','Port El Kantaoui','Avenue de la Plage',35.8920,10.5920,1,1,45,'["wifi","ac","pool","spa","room_service","sea_view","breakfast","gym"]','["uploads/beach_house.png"]',1,1,'active',567),
(24,'Hotel Room Djerba Marina','Charming room in boutique hotel on Djerba island. Traditional decor, rooftop restaurant.','hotel_room',95,'Djerba','Houmt Souk','15 Rue Ulysse',33.8750,10.8570,1,1,22,'["wifi","ac","breakfast","furnished"]','["uploads/hotel_room.png"]',1,0,'active',189),
(8,'Modern Loft Lac 1','Industrial-chic loft in Tunis business district. Open plan, high ceilings.','apartment',950,'Tunis','Lac 1','Avenue Mohamed V',36.8310,10.2250,2,1,90,'["wifi","ac","parking","gym","furnished","elevator"]','["uploads/penthouse_luxury.png"]',1,0,'active',276),
(10,'Apartment Ariana Soghra','Affordable 2-bedroom apartment in quiet residential area. Near tram station.','apartment',420,'Tunis','Ariana','14 Rue de Carthage',36.8620,10.1640,2,1,70,'["wifi","ac","near_transport"]','["uploads/apartment_modern.png"]',0,0,'active',145),
(14,'Penthouse Gammarth','Stunning penthouse with infinity pool overlooking La Marsa bay. Designer interiors.','apartment',4200,'Tunis','Gammarth','Résidence Les Pins',36.9100,10.2900,3,2,180,'["wifi","ac","pool","parking","sea_view","terrace","security","gym"]','["uploads/penthouse_luxury.png"]',1,1,'active',723),
(16,'Studio El Menzah 6','Small but well-organized studio. Fully furnished, all bills included. Near metro line.','studio',320,'Tunis','El Menzah 6','7 Rue du Printemps',36.8350,10.1750,1,1,28,'["wifi","ac","furnished","near_transport"]','["uploads/studio_cozy.png"]',1,0,'active',167),
(20,'House Nabeul Old Town','Traditional house with courtyard in Nabeul medina. 3 bedrooms, renovated kitchen.','house',550,'Nabeul','Medina','Rue des Potiers',36.4510,10.7370,3,1,100,'["wifi","furnished","garden"]','["uploads/house_traditional.png"]',1,0,'active',98),
(26,'Modern Flat Ennasr 2','New construction 3-bedroom flat with garage. Quiet street.','apartment',780,'Tunis','Ennasr 2','45 Rue des Oliviers',36.8450,10.1950,3,2,105,'["wifi","ac","parking","elevator","security"]','["uploads/apartment_city.png"]',0,0,'active',201),
(28,'Shared Apartment IHEC','Looking for one roommate to share a 3-bedroom apartment near IHEC business school.','room',300,'Tunis','La Manouba','22 Rue de la Faculté',36.8085,10.0995,1,1,20,'["wifi","ac","furnished","near_university","washing_machine"]','["uploads/room_shared.png"]',1,0,'active',178),
(30,'Villa Hammamet Nord','Beautiful 4-bedroom villa with garden and BBQ area. 5 min from beach.','house',1500,'Hammamet','Hammamet Nord','Route de Tunis',36.4120,10.6050,4,2,200,'["wifi","ac","garden","parking","pool","bbq"]','["uploads/house_garden.png"]',1,0,'active',312),
(8,'Cozy Apartment Sfax Jadida','Well-maintained apartment in new Sfax development. 2 bedrooms, covered parking.','apartment',480,'Sfax','Sfax Jadida','Nouvelle Zone Urbaine',34.7300,10.7700,2,1,75,'["wifi","ac","parking","elevator"]','["uploads/apartment_modern.png"]',0,0,'active',122),
(8,'Room Cité Olympique','Bright room in shared flat near Cité Olympique. Public transport at doorstep.','room',220,'Tunis','Cité Olympique','3 Rue du Sport',36.7950,10.1800,1,1,16,'["wifi","furnished","near_transport"]','["uploads/room_shared.png"]',1,0,'active',89),
(14,'Duplex La Marsa','Elegant duplex in La Marsa with garden access. 3 bedrooms on upper floor.','apartment',1600,'Tunis','La Marsa','8 Rue de la Plage',36.8780,10.3250,3,2,140,'["wifi","ac","garden","parking","furnished","security"]','["uploads/villa_traditional.png"]',1,1,'active',398),
(16,'Studio Sousse Corniche','Charming studio on the Sousse corniche. Sea view, fully furnished.','studio',380,'Sousse','Corniche','Avenue 14 Janvier',35.8280,10.6340,1,1,32,'["wifi","ac","furnished","sea_view"]','["uploads/studio_student.png"]',1,0,'active',156),
(20,'Apartment Bizerte Marina','Modern apartment overlooking Bizerte old port. 2 bedrooms, renovated.','apartment',520,'Bizerte','Centre','Quai Tarak Ibn Ziad',37.2747,9.8736,2,1,80,'["wifi","ac","parking","sea_view","furnished"]','["uploads/beach_house.png"]',1,0,'active',134),
(26,'Villa Kelibia','Seaside villa in Kelibia with direct beach access. 4 bedrooms.','house',1200,'Nabeul','Kelibia','Route de la Plage',36.8460,11.0990,4,2,180,'["wifi","ac","sea_view","garden","parking","near_beach"]','["uploads/villa_luxury.png"]',1,0,'active',234),
(28,'Room Near FST','Single furnished room for student near FST. Female students preferred. Safe area.','room',200,'Tunis','El Manar 2','Cité Universitaire',36.8090,10.1620,1,1,15,'["wifi","furnished","near_university","security"]','["uploads/room_shared.png"]',1,0,'active',245),
(12,'Hotel Eco Tunis Centre','Economic hotel room in downtown Tunis. Walking distance to Avenue Bourguiba.','hotel_room',75,'Tunis','Centre Ville','2 Rue de Hollande',36.8000,10.1860,1,1,18,'["wifi","ac","breakfast"]','["uploads/hotel_room.png"]',1,0,'active',445),
(8,'Apartment Jardins de Carthage','Bright 3-bedroom apartment in upscale gated community with pool and tennis.','apartment',1100,'Tunis','Jardins de Carthage','Résidence Les Jardins',36.8550,10.2900,3,2,130,'["wifi","ac","pool","gym","parking","security","elevator","garden"]','["uploads/house_garden.png"]',1,1,'active',356),
(10,'House Rades','Comfortable 3-bedroom house with garden in Rades. Near TGM station.','house',650,'Tunis','Rades','15 Rue de Tunis',36.7680,10.2750,3,1,120,'["wifi","garden","parking","near_transport"]','["uploads/house_traditional.png"]',0,0,'active',87),
(14,'Modern Studio Centre Urbain Nord','Brand new studio in Centre Urbain Nord business hub.','studio',550,'Tunis','Centre Urbain Nord','Tour Crystal',36.8425,10.1880,1,1,40,'["wifi","ac","parking","gym","elevator","security"]','["uploads/studio_cozy.png"]',1,0,'active',198),
(16,'Apartment Hammam Lif','Affordable apartment near beach in Hammam Lif. TGM station 2 min away.','apartment',380,'Tunis','Hammam Lif','Avenue de la République',36.7260,10.3390,2,1,60,'["wifi","near_transport","near_beach"]','["uploads/beach_house.png"]',0,0,'active',112),
(20,'Villa Tunis Sud','Large 5-bedroom villa suitable for big families. Two floors, garage.','house',1400,'Tunis','Megrine','Route de Fouchana',36.7700,10.2300,5,3,300,'["wifi","ac","garden","parking","security"]','["uploads/villa_luxury.png"]',0,0,'active',78),
(8,'Studio Kairouan','Affordable studio in Tunisia''s holy city. Near the Great Mosque.','studio',250,'Kairouan','Medina','Rue Okba Ibn Nafaa',35.6781,10.0963,1,1,25,'["wifi","furnished"]','["uploads/studio_student.png"]',1,0,'active',56),
(28,'Apartment Sousse Khezama','Modern 2-bedroom apartment near Sousse beaches. Gated residence.','apartment',650,'Sousse','Khezama','Résidence La Perle',35.8400,10.6100,2,1,80,'["wifi","ac","pool","parking","security","near_beach"]','["uploads/apartment_city.png"]',1,0,'active',187),
(30,'Room Tunis Belvedere','Room in shared apartment near Belvedere Park.','room',280,'Tunis','Belvédère','4 Rue de Marseille',36.8120,10.1740,1,1,17,'["wifi","ac","furnished","near_transport"]','["uploads/room_shared.png"]',1,0,'active',145),
(17,'Boutique Hotel Sidi Bou Said','Charming room in traditional riad-style hotel. Rooftop café.','hotel_room',180,'Tunis','Sidi Bou Said','Rue du 2 Mars',36.8700,10.3460,1,1,30,'["wifi","ac","breakfast","terrace","sea_view"]','["uploads/villa_traditional.png"]',1,1,'active',423),
(24,'Hotel Tozeur Oasis','Desert oasis hotel room with pool and palm garden.','hotel_room',110,'Tozeur','Centre','Avenue Abou El Kacem Chebbi',33.9197,8.1339,1,1,28,'["wifi","ac","pool","breakfast","garden"]','["uploads/hotel_room.png"]',1,0,'active',267),
(8,'Penthouse Tunis Centre','Premium penthouse with private elevator. 3 bedrooms, wraparound terrace.','apartment',3800,'Tunis','Centre Ville','Avenue Habib Bourguiba',36.7996,10.1798,3,2,175,'["wifi","ac","parking","terrace","security","elevator","concierge","sea_view"]','["uploads/penthouse_luxury.png"]',1,1,'active',612),
(10,'House Tabarka Beach','Beachfront house with direct access to Tabarka coral coast. 3 bedrooms.','house',900,'Tabarka','La Plage','Route Touristique',36.9548,8.7580,3,2,130,'["wifi","near_beach","garden","parking","sea_view","bbq"]','["uploads/beach_house.png"]',1,0,'active',189),
(14,'Apartment Menzah 5','Spacious apartment in heart of Menzah 5. Near schools and pharmacy.','apartment',620,'Tunis','El Menzah 5','20 Rue de Palestine',36.8320,10.1720,3,1,100,'["wifi","ac","parking","elevator"]','["uploads/apartment_modern.png"]',0,0,'active',143),
(16,'Studio Monastir University','Compact studio near University of Monastir. High-speed internet.','studio',280,'Monastir','Centre','Rue de la Faculté',35.7770,10.8264,1,1,26,'["wifi","ac","furnished","near_university"]','["uploads/studio_student.png"]',1,0,'active',167),
(26,'Apartment Sfax Route Tunis','Brand new apartment in Sfax expansion zone. 2 bed, covered parking.','apartment',520,'Sfax','Route de Tunis','Résidence Yasmine',34.7550,10.7450,2,1,78,'["wifi","ac","parking","elevator","security"]','["uploads/apartment_city.png"]',0,0,'active',89),
(28,'Luxury Suite Hotel Tunis','5-star hotel suite in central Tunis. Butler service, spa access.','hotel_room',350,'Tunis','Centre Ville','Place de l''Indépendance',36.7990,10.1750,1,1,55,'["wifi","ac","spa","room_service","breakfast","gym","pool","concierge"]','["uploads/penthouse_luxury.png"]',1,1,'active',534),
(8,'Apartment Cite El Khadra','Well-located apartment near Cité El Khadra. 2 bedrooms, new fixtures.','apartment',450,'Tunis','Cité El Khadra','Rue de la Liberté',36.8210,10.1690,2,1,72,'["wifi","ac","near_transport"]','["uploads/apartment_modern.png"]',0,0,'active',98),
(20,'Beach House Mahdia','Mediterranean beach house in historic Mahdia. Terrace with sunset views.','house',800,'Mahdia','Zone Touristique','Route Côtière',35.5047,11.0622,3,2,140,'["wifi","ac","sea_view","terrace","parking","near_beach","garden"]','["uploads/house_garden.png"]',1,0,'active',212),
(30,'Studio Den Den','Budget-friendly studio in Den Den. Basic but functional.','studio',220,'Tunis','Den Den','Rue 9 Avril',36.8300,10.1200,1,1,22,'["wifi","furnished"]','["uploads/studio_cozy.png"]',1,0,'active',67),
(8,'Apartment Mutuelleville','Elegant apartment in prestigious Mutuelleville. Parquet floors, high ceilings.','apartment',1050,'Tunis','Mutuelleville','12 Rue Alain Savary',36.8180,10.1620,3,2,115,'["wifi","ac","parking","elevator","security"]','["uploads/villa_traditional.png"]',1,0,'active',278);

-- Reviews (user_id references adjusted for new user IDs: old 4=new 7, old 5=new 8, etc.)
INSERT INTO reviews (user_id, property_id, rating, comment) VALUES
(7,1,5,'Excellent apartment! Very clean and the owner is responsive.'),
(9,1,4,'Great location near the airport. Parking sometimes full.'),
(11,2,5,'Perfect for students! Very close to campus and affordable.'),
(13,2,4,'Small but well organized. Good wifi and quiet neighbors.'),
(15,3,5,'Dream villa! The pool and sea view are incredible.'),
(7,3,5,'We spent the best vacation here. Owner very welcoming.'),
(9,4,3,'Room is basic but clean. Good for the price.'),
(18,5,4,'Nice apartment in Sfax centre. Good value.'),
(19,5,5,'Loved this place! Modern and well-maintained.'),
(21,6,5,'Most luxurious apartment I have stayed in Tunisia!'),
(23,6,5,'Premium living at its finest.'),
(7,7,5,'Sidi Bou Said is magical and this house captures it.'),
(11,7,4,'Beautiful traditional house but stairs can be challenging.'),
(13,8,4,'Great beach studio! Perfect for weekend getaway.'),
(15,9,4,'Comfortable family apartment. Kids loved it.'),
(9,9,3,'Decent apartment but kitchen could use an upgrade.'),
(18,10,5,'Best apartment for ENIT students.'),
(21,10,4,'Very close to campus. Clean and well-furnished.'),
(7,11,5,'Stunning villa in Carthage. Pool and garden are amazing.'),
(23,11,5,'Prestigious address with luxurious finishes.'),
(9,12,4,'Affordable and close to university.'),
(13,13,3,'Hotel room is ok for the price. Basic but clean.'),
(15,14,5,'Amazing hotel! Spa and sea view made our stay unforgettable.'),
(19,14,4,'Great resort. Breakfast could have more variety.'),
(7,16,4,'Nice loft style apartment. Great for professionals.'),
(11,17,3,'Good price for Ariana area but needs some updates.'),
(18,18,5,'Gammarth penthouse is absolutely spectacular!'),
(21,19,4,'Good studio for the price. Metro access convenient.'),
(23,20,4,'Charming house in Nabeul. Weekly market is a bonus!');

-- Messages (sender/receiver IDs adjusted)
INSERT INTO messages (sender_id, receiver_id, property_id, content, is_read) VALUES
(7,8,1,'Bonjour, is the apartment in L''Aouina still available?',1),
(8,7,1,'Yes, it is! Would you like to schedule a visit?',1),
(7,8,1,'Yes please, I am free this Saturday afternoon.',1),
(8,7,1,'Perfect! Let us meet at 2 PM.',1),
(9,8,2,'Hello, I am a student at FST. Is this studio suitable?',1),
(8,9,2,'Absolutely! Very quiet and wifi is fast.',1),
(11,10,3,'The villa looks amazing! What is the minimum rental period?',1),
(10,11,3,'Minimum is 6 months. Short-term available in summer.',0),
(13,8,4,'Is the room in Ennasr available from September?',1),
(8,13,4,'Yes, available from September 1st. First month deposit required.',1),
(15,8,5,'Interested in the Sfax apartment. Can we discuss?',1),
(8,15,5,'Of course! Call me or we can discuss via WhatsApp.',0),
(18,10,6,'The Lac 2 penthouse is stunning. Price negotiable?',1),
(10,18,6,'The price is firm for this premium property.',1),
(19,14,7,'I love Sidi Bou Said! How far from the main street?',1),
(14,19,7,'Just 2 minutes walk from the main cafe street.',0),
(21,16,8,'Planning a Monastir trip. Available next month?',1),
(16,21,8,'Yes! Small discount for stays longer than 2 weeks.',1),
(23,20,9,'Looking for family apartment in Sousse. Pet-friendly?',1),
(20,23,9,'Small pets welcome. Additional deposit required.',0);

-- Matchmaking Profiles (user_id adjusted)
INSERT INTO matchmaking_profiles (user_id, sleep_schedule, noise_level, is_smoker, pets_allowed, cleanliness, guest_policy, budget_min, budget_max, preferred_city, preferred_neighborhood, bio) VALUES
(7,'early_bird','quiet',0,0,'very_clean','sometimes',300,600,'Tunis','El Manar','Engineering student at FST. Early riser, love quiet environments.'),
(9,'night_owl','moderate',0,1,'moderate','often',200,400,'Tunis','Ennasr','Med school student. I have a small cat named Biscuit.'),
(11,'flexible','quiet',0,0,'very_clean','never',250,500,'Tunis','Lac 1','IT professional. Value privacy and cleanliness.'),
(13,'early_bird','moderate',0,0,'moderate','sometimes',200,350,'Tunis','Manouba','Business student at ISCAE. Love cooking Tunisian food!'),
(15,'night_owl','social',1,0,'relaxed','often',300,700,'Sousse','Centre','Freelance designer, work late hours. Social butterfly.'),
(18,'flexible','quiet',0,1,'very_clean','sometimes',400,800,'Tunis','Lac 2','Marketing professional with a golden retriever.'),
(19,'early_bird','quiet',0,0,'very_clean','never',150,300,'Tunis','El Manar 2','FST student. Looking for respectful roommate.'),
(21,'night_owl','moderate',0,0,'moderate','sometimes',350,600,'Tunis','Centre Ville','Journalist. Love discussing politics and football.'),
(23,'flexible','moderate',0,1,'moderate','sometimes',250,450,'Tunis','Ariana','Primary school teacher. Patient and kind.');

-- Match Results
INSERT INTO match_results (user_a_id, user_b_id, compatibility_score, score_breakdown) VALUES
(7,11,92.50,'{"sleep":100,"noise":100,"smoking":100,"pets":100,"cleanliness":100,"guests":75,"budget":85,"location":80}'),
(7,19,95.00,'{"sleep":100,"noise":100,"smoking":100,"pets":100,"cleanliness":100,"guests":100,"budget":90,"location":95}'),
(9,15,72.50,'{"sleep":100,"noise":50,"smoking":0,"pets":50,"cleanliness":100,"guests":100,"budget":75,"location":60}'),
(11,18,82.50,'{"sleep":75,"noise":100,"smoking":100,"pets":50,"cleanliness":100,"guests":75,"budget":80,"location":85}');

-- Rental Requests (adjusted IDs)
INSERT INTO rental_requests (tenant_id, property_id, owner_id, status, message) VALUES
(7,1,8,'pending','I am an engineering student and I am very interested in this apartment. I am quiet and responsible.'),
(9,2,8,'accepted','Medical student looking for a quiet place near campus. Available immediately.'),
(11,3,10,'rejected','Would love to rent this villa for 6 months starting January.'),
(13,4,8,'pending','Looking for a room near public transport. This seems perfect!'),
(15,5,8,'pending','Freelance designer, work from home. Interested in long-term rental.'),
(18,6,10,'pending','Marketing professional. Very interested in this premium penthouse.');

-- Notifications (adjusted IDs)
INSERT INTO notifications (user_id, type, title, message, link, is_read) VALUES
(8,'rental_request','New Rental Request','Asma Ben Ali wants to rent your property: Modern Apartment in L''Aouina','#/dashboard',0),
(8,'rental_request','New Rental Request','Ines Chahed wants to rent your property: Student Room in Ennasr','#/dashboard',0),
(8,'rental_accepted','Request Accepted','You accepted Nour Hamdi for: Cozy Studio Near FST','#/dashboard',1),
(9,'rental_accepted','Request Accepted!','Great news! Your rental request for Cozy Studio Near FST has been accepted!','#/dashboard',0),
(11,'rental_rejected','Request Rejected','Your rental request for Sea View Villa in Hammamet was rejected.','#/dashboard',0),
(7,'system','Welcome!','Welcome to DarTounsi! Complete your profile to get better matches.','#/profile',1),
(1,'admin','Platform Stats','Weekly report: 5 new users, 3 new listings this week.','#/admin',0),
(8,'review','New Review','Your property Sfax Centre received a 5-star review!','#/property/5',0),
(10,'rental_request','New Rental Request','Mariem Saidi wants to rent your property: Luxury Penthouse Lac 2','#/dashboard',0),
(8,'rental_request','New Rental Request','Sarra Mzoughi wants to rent your property: Furnished Apartment Sfax Centre','#/dashboard',0),
(19,'match','New Match Found!','You have a 95% compatibility match with a tenant in El Manar!','#/matchmaking',0),
(7,'match','New Match!','92% compatibility found with a student near your area!','#/matchmaking',0);

-- Favorites (adjusted IDs)
INSERT INTO favorites (user_id, property_id) VALUES
(7,1),(7,2),(7,10),(7,6),(7,32),
(9,2),(9,4),(9,12),(9,25),
(11,6),(11,16),(11,18),(11,34),
(13,4),(13,12),(13,22),
(15,5),(15,9),(15,38),
(18,6),(18,18),(18,11),
(19,2),(19,10),(19,30),
(21,16),(21,6),(21,42),
(23,9),(23,23);

-- Area Safety
INSERT INTO area_safety (city, neighborhood, safety_score, description, stats) VALUES
('Tunis','L''Aouina',82,'Residential area near the airport. Generally safe.','{"police_stations":2,"hospitals":1,"crime_rate":"low"}'),
('Tunis','El Manar',78,'University district. Safe for students.','{"police_stations":1,"hospitals":1,"crime_rate":"low"}'),
('Tunis','Lac 1',90,'Business district. Very safe area.','{"police_stations":3,"hospitals":2,"crime_rate":"very_low"}'),
('Tunis','Lac 2',92,'Premium area. Excellent security.','{"police_stations":3,"hospitals":2,"crime_rate":"very_low"}'),
('Tunis','Ennasr',75,'Popular residential suburb. Safe.','{"police_stations":2,"hospitals":1,"crime_rate":"low"}'),
('Tunis','La Marsa',88,'Upscale coastal suburb. Very safe.','{"police_stations":2,"hospitals":1,"crime_rate":"very_low"}'),
('Tunis','Sidi Bou Said',85,'Tourist village. Very safe.','{"police_stations":1,"hospitals":0,"crime_rate":"very_low"}'),
('Tunis','Carthage',91,'Historic diplomatic district. High security.','{"police_stations":2,"hospitals":1,"crime_rate":"very_low"}'),
('Tunis','Centre Ville',65,'Downtown. Busy by day, use caution at night.','{"police_stations":4,"hospitals":3,"crime_rate":"moderate"}'),
('Tunis','Manouba',68,'University area. Generally safe.','{"police_stations":1,"hospitals":1,"crime_rate":"moderate"}'),
('Sfax','Centre Ville',72,'Commercial hub. Safe during day.','{"police_stations":3,"hospitals":2,"crime_rate":"low"}'),
('Sousse','Sahloul',80,'Modern residential area. Good safety.','{"police_stations":2,"hospitals":1,"crime_rate":"low"}'),
('Sousse','Port El Kantaoui',87,'Tourist resort. Excellent security.','{"police_stations":2,"hospitals":1,"crime_rate":"very_low"}'),
('Hammamet','Centre Ville',79,'Tourist city. Good police coverage.','{"police_stations":2,"hospitals":1,"crime_rate":"low"}'),
('Tunis','Gammarth',89,'Affluent suburb. Very safe.','{"police_stations":1,"hospitals":1,"crime_rate":"very_low"}');

-- Reports (adjusted IDs)
INSERT INTO reports (reporter_id, property_id, reason, details, status) VALUES
(7,37,'misleading_photos','Photos do not match actual condition.','pending'),
(9,33,'incorrect_price','Listed 650 but owner asked for 800.','pending'),
(13,25,'spam','Same listing posted multiple times.','reviewed'),
(18,50,'scam_suspected','Owner asked for full payment upfront.','pending');

-- Payments (adjusted IDs)
INSERT INTO payments (user_id, property_id, amount, currency, payment_method, status, transaction_ref) VALUES
(8,1,150.00,'TND','konnect','completed','KNT-2025-001'),
(8,5,150.00,'TND','konnect','completed','KNT-2025-002'),
(10,3,150.00,'TND','konnect','completed','KNT-2025-003'),
(10,6,150.00,'TND','konnect','completed','KNT-2025-004'),
(14,7,150.00,'TND','konnect','completed','KNT-2025-005'),
(14,18,150.00,'TND','konnect','completed','KNT-2025-006');