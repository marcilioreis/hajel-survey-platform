-- 1. Fix user table (incase 0007 was synced but not run)
DO $$
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user' AND column_name = 'active') THEN
        ALTER TABLE "user" ADD COLUMN "active" boolean DEFAULT true;
    END IF;
END $$;

-- 2. Fix neighborhood column type and data
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'location_catalog' AND column_name = 'neighborhood' AND data_type = 'character varying') THEN
        ALTER TABLE "location_catalog" ALTER COLUMN "neighborhood" SET DATA TYPE jsonb 
        USING CASE 
            WHEN "neighborhood" IS NULL OR "neighborhood" = '' THEN '[]'::jsonb 
            ELSE jsonb_build_array("neighborhood") 
        END;
    END IF;
    ALTER TABLE "location_catalog" ALTER COLUMN "neighborhood" SET DEFAULT '[]'::jsonb;
END $$;

-- 3. Fix city column type and data
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'location_catalog' AND column_name = 'city' AND data_type = 'character varying') THEN
        ALTER TABLE "location_catalog" ALTER COLUMN "city" SET DATA TYPE jsonb 
        USING CASE 
            WHEN "city" IS NULL OR "city" = '' THEN '[]'::jsonb 
            ELSE jsonb_build_array("city") 
        END;
    END IF;
    ALTER TABLE "location_catalog" ALTER COLUMN "city" SET DEFAULT '[]'::jsonb;
END $$;

-- 4. Clean up any scalar strings in jsonb columns (already jsonb but store "text" instead of ["text"])
UPDATE location_catalog
SET neighborhood = jsonb_build_array(neighborhood #>> '{}')
WHERE neighborhood IS NOT NULL AND neighborhood::text NOT LIKE '[%';

UPDATE location_catalog
SET city = jsonb_build_array(city #>> '{}')
WHERE city IS NOT NULL AND city::text NOT LIKE '[%';

-- 5. Recreate View
CREATE OR REPLACE VIEW surveys_enriched AS
SELECT
  s.id,
  s.title,
  s.description,
  s.created_by,
  s.public,
  s.slug,
  s.start_date,
  s.end_date,
  s.active,
  s.custom_style,
  s.created_at,
  COALESCE((
    SELECT json_agg(json_build_object(
      'id', q.id,
      'text', q.text,
      'type', q.type,
      'required', q.required,
      'order', q."order",
      'options', q.options,
      'conditional_logic', q.conditional_logic
    ) ORDER BY q."order")
    FROM questions q WHERE q.survey_id = s.id
  ), '[]'::json) AS questions,
  COALESCE((
    SELECT json_agg(json_build_object(
      'id', lc.id,
      'name', lc.name,
      'notes', lc.notes,
      'order', sl."order"
    ) ORDER BY sl."order")
    FROM survey_locations sl
    JOIN location_catalog lc ON sl.location_id = lc.id
    WHERE sl.survey_id = s.id
  ), '[]'::json) AS locations,
  CAST(COALESCE((
    SELECT COUNT(*) FROM response_sessions rs
    WHERE rs.survey_id = s.id AND rs.status = 'concluida'
  ), 0) AS INTEGER) AS responses_count,
  CASE
    WHEN s.end_date IS NOT NULL AND CURRENT_TIMESTAMP > s.end_date THEN 'encerrada'
    WHEN s.active = false THEN 'inativa'
    WHEN s.start_date IS NOT NULL AND CURRENT_TIMESTAMP < s.start_date
         AND (s.end_date IS NULL OR CURRENT_TIMESTAMP <= s.end_date) THEN 'rascunho'
    WHEN s.active = true THEN 'ativa'
    ELSE 'inativa'
  END AS status
FROM surveys s;
