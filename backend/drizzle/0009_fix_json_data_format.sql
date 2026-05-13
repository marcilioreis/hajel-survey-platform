-- Fix neighborhood data to be strictly arrays
-- Ensure column is treated as jsonb to use jsonb_typeof
UPDATE location_catalog
SET neighborhood = 
  CASE 
    WHEN neighborhood IS NULL THEN '[]'::jsonb
    WHEN jsonb_typeof(neighborhood::jsonb) = 'string' AND (neighborhood::jsonb #>> '{}') = '' THEN '[]'::jsonb
    WHEN jsonb_typeof(neighborhood::jsonb) = 'string' THEN jsonb_build_array(neighborhood::jsonb #>> '{}')
    ELSE neighborhood::jsonb
  END
WHERE neighborhood IS NULL OR jsonb_typeof(neighborhood::jsonb) != 'array';

-- Fix city data to be strictly arrays
UPDATE location_catalog
SET city = 
  CASE 
    WHEN city IS NULL THEN '[]'::jsonb
    WHEN jsonb_typeof(city::jsonb) = 'string' AND (city::jsonb #>> '{}') = '' THEN '[]'::jsonb
    WHEN jsonb_typeof(city::jsonb) = 'string' THEN jsonb_build_array(city::jsonb #>> '{}')
    ELSE city::jsonb
  END
WHERE city IS NULL OR jsonb_typeof(city::jsonb) != 'array';
