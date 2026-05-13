-- Fix neighborhood data to be strictly arrays
-- We use a more defensive approach that doesn't fail on invalid JSON syntax
UPDATE location_catalog
SET neighborhood = jsonb_build_array(neighborhood #>> '{}')
WHERE neighborhood IS NOT NULL 
  AND neighborhood::text != '[]' 
  AND neighborhood::text NOT LIKE '[%';

-- Ensure NULLs or empty strings become empty arrays
UPDATE location_catalog
SET neighborhood = '[]'::jsonb
WHERE neighborhood IS NULL 
  OR neighborhood::text = '' 
  OR neighborhood::text = '""';

-- Same logic for city data
UPDATE location_catalog
SET city = jsonb_build_array(city #>> '{}')
WHERE city IS NOT NULL 
  AND city::text != '[]' 
  AND city::text NOT LIKE '[%';

UPDATE location_catalog
SET city = '[]'::jsonb
WHERE city IS NULL 
  OR city::text = '' 
  OR city::text = '""';
