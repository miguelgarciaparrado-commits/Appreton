-- Appreton — Datos demo para screenshots de Google Play
-- Ejecutar en Supabase Dashboard → SQL Editor
--
-- 10 establecimientos ficticios alrededor de Puerta del Sol, Madrid
-- 9 reviews con textos realistas
-- 1 usuario de prueba (demo_user_1)
--
-- Para borrar: ejecutar supabase/scripts/delete_demo_data.sql

-- 1. Usuario de prueba
INSERT INTO user_profiles (id, display_name, email, provider, avatar_type, level, xp, total_reviews, join_date, profile_completed, gender)
VALUES ('demo_user_1', 'CacaExplorer', 'demo@appreton.test', 'email', 'poop_3', 4, 520, 9, '2026-03-15', true, 'hombre')
ON CONFLICT (id) DO NOTHING;

-- 2. Establecimientos
INSERT INTO places (id, name, type, address, latitude, longitude, avg_rating, review_count) VALUES
('demo_place_1',  'Cafeteria La Solana',     'bar',          'C. del Arenal, 7, Madrid',           40.41720, -3.70450, 5.0, 1),
('demo_place_2',  'Bar El Rincon',           'bar',          'C. de la Montera, 22, Madrid',       40.41780, -3.70150, 4.0, 1),
('demo_place_3',  'Gasolinera Central',      'gasolinera',   'C. Gran Via, 1, Madrid',             40.41950, -3.70100, 3.5, 1),
('demo_place_4',  'Restaurante Don Paco',    'restaurante',  'C. Mayor, 18, Madrid',               40.41580, -3.70700, 4.5, 1),
('demo_place_5',  'Cerveceria La Plaza',     'bar',          'Plaza Mayor, 5, Madrid',             40.41560, -3.70730, 2.5, 1),
('demo_place_6',  'Panaderia Aurora',        'bar',          'C. de Preciados, 10, Madrid',        40.41850, -3.70300, 4.0, 1),
('demo_place_7',  'Pub El Farol',            'bar',          'C. de las Huertas, 33, Madrid',      40.41400, -3.69800, 3.0, 1),
('demo_place_8',  'Hamburgueseria Diego',    'restaurante',  'C. de Atocha, 14, Madrid',           40.41300, -3.70000, 4.5, 1),
('demo_place_9',  'Discoteca Luna',          'bar',          'C. de la Cruz, 26, Madrid',          40.41650, -3.70050, 0.0, 0),
('demo_place_10', 'Cafe Central',            'bar',          'Plaza del Angel, 10, Madrid',        40.41470, -3.70020, 5.0, 1)
ON CONFLICT (id) DO NOTHING;

-- 3. Reviews (una por establecimiento, excepto Discoteca Luna que no tiene)
INSERT INTO reviews (id, place_id, user_id, rating, comment, has_paper, has_soap, has_brush, required_order, extras, date, created_at, gender, author_name, moderation_status) VALUES
('demo_review_1',  'demo_place_1',  'demo_user_1', 5, 'Impecable, recien limpiado. Huele a lavanda y tiene de todo.',                    true,  true,  true,  0, '["Secador de manos","Buen olor","Cierre en la puerta","Buena iluminacion"]', '2026-04-23', NOW() - interval '30 minutes',  'hombre', 'CacaExplorer', 'visible'),
('demo_review_2',  'demo_place_2',  'demo_user_1', 4, 'Tiene papel y jabon, recomendable. Un poco estrecho pero limpio.',                true,  true,  false, 0, '["Cierre en la puerta","Espejo"]',                                          '2026-04-23', NOW() - interval '2 hours',     'hombre', 'CacaExplorer', 'visible'),
('demo_review_3',  'demo_place_3',  'demo_user_1', 3, 'Aceptable para un apuro. Sin escobilla pero al menos hay papel.',                 true,  false, false, 0, '["Buena iluminacion"]',                                                     '2026-04-23', NOW() - interval '8 hours',     'hombre', 'CacaExplorer', 'visible'),
('demo_review_4',  'demo_place_4',  'demo_user_1', 5, 'Muy limpio y con todo lo necesario. Cambiador de bebes incluido.',                true,  true,  true,  1, '["Cambiador de bebes","Buen olor","Accesible","Bien limpio"]',               '2026-04-23', NOW() - interval '1 hour',      'hombre', 'CacaExplorer', 'visible'),
('demo_review_5',  'demo_place_5',  'demo_user_1', 2, 'Pasable pero sin papel ni jabon. Olor fuerte. No recomiendo si puedes evitarlo.', false, false, false, 1, '[]',                                                                        '2026-04-21', NOW() - interval '2 days',      'hombre', 'CacaExplorer', 'visible'),
('demo_review_6',  'demo_place_6',  'demo_user_1', 4, 'Limpio y cuidado. Solo le falta la escobilla.',                                   true,  true,  false, 0, '["Cierre en la puerta","Espejo","Buena iluminacion"]',                       '2026-04-23', NOW() - interval '45 minutes',  'hombre', 'CacaExplorer', 'visible'),
('demo_review_7',  'demo_place_7',  'demo_user_1', 3, 'Sin escobilla pero limpio. El cierre de la puerta va justo.',                     true,  true,  false, 0, '["Buena iluminacion"]',                                                     '2026-04-22', NOW() - interval '20 hours',    'hombre', 'CacaExplorer', 'visible'),
('demo_review_8',  'demo_place_8',  'demo_user_1', 5, 'De los mejores banos que he visto. Secador, jabon, papel, todo perfecto.',         true,  true,  true,  0, '["Secador de manos","Buen olor","Bien limpio","Accesible"]',                 '2026-04-23', NOW() - interval '3 hours',     'hombre', 'CacaExplorer', 'visible'),
('demo_review_10', 'demo_place_10', 'demo_user_1', 5, 'Perfecto. Limpio, con olor agradable y todo en su sitio. 10/10.',                 true,  true,  true,  0, '["Buen olor","Bien limpio","Cierre en la puerta","Espejo"]',                 '2026-04-23', NOW() - interval '10 minutes',  'hombre', 'CacaExplorer', 'visible')
ON CONFLICT (id) DO NOTHING;
