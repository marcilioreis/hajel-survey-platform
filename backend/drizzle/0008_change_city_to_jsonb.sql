ALTER TABLE "location_catalog" ALTER COLUMN "city" SET DATA TYPE jsonb USING 
  CASE 
    WHEN "city" IS NULL THEN '[]'::jsonb 
    ELSE jsonb_build_array("city") 
  END;
ALTER TABLE "location_catalog" ALTER COLUMN "city" SET DEFAULT '[]'::jsonb;

-- Recreate view to reflect changes in location_catalog (city is now jsonb)
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
