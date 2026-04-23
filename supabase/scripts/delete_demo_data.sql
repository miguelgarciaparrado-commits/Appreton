-- Appreton — Borrar TODOS los datos demo
-- Ejecutar en Supabase Dashboard → SQL Editor
-- Solo borra registros con ID que empiece por 'demo_'
-- NO afecta datos reales de usuarios ni establecimientos.

DELETE FROM reviews WHERE id LIKE 'demo_%';
DELETE FROM places WHERE id LIKE 'demo_%';
DELETE FROM user_profiles WHERE id LIKE 'demo_%';

-- Verificar que no queda nada:
-- SELECT 'reviews' as tabla, COUNT(*) FROM reviews WHERE id LIKE 'demo_%'
-- UNION ALL
-- SELECT 'places', COUNT(*) FROM places WHERE id LIKE 'demo_%'
-- UNION ALL
-- SELECT 'user_profiles', COUNT(*) FROM user_profiles WHERE id LIKE 'demo_%';
