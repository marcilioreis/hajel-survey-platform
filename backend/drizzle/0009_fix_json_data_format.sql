-- Fix neighborhood data to be strictly arrays
UPDATE location_catalog
SET neighborhood = 
  CASE 
    WHEN neighborhood IS NULL THEN '[]'::jsonb
    WHEN jsonb_typeof(neighborhood) = 'string' AND (neighborhood #>> '{}') = '' THEN '[]'::jsonb
    WHEN jsonb_typeof(neighborhood) = 'string' THEN jsonb_build_array(neighborhood #>> '{}')
    ELSE neighborhood
  END
WHERE jsonb_typeof(neighborhood) != 'array' OR neighborhood IS NULL;

-- Fix city data to be strictly arrays
UPDATE location_catalog
SET city = 
  CASE 
    WHEN city IS NULL THEN '[]'::jsonb
    WHEN jsonb_typeof(city) = 'string' AND (city #>> '{}') = '' THEN '[]'::jsonb
    WHEN jsonb_typeof(city) = 'string' THEN jsonb_build_array(city #>> '{}')
    ELSE city
  END
WHERE jsonb_typeof(city) != 'array' OR city IS NULL;
