ALTER TABLE "surveys" ADD COLUMN IF NOT EXISTS "sample_size" integer;--> statement-breakpoint
ALTER TABLE "surveys" ADD COLUMN IF NOT EXISTS "margin_of_error" double precision;--> statement-breakpoint
ALTER TABLE "surveys" ADD COLUMN IF NOT EXISTS "population_size" integer;--> statement-breakpoint
ALTER TABLE "surveys" ADD COLUMN IF NOT EXISTS "confidence_level" double precision DEFAULT 0.95;--> statement-breakpoint
ALTER TABLE "surveys" ADD COLUMN IF NOT EXISTS "expected_proportion" double precision DEFAULT 0.5;--> statement-breakpoint
ALTER TABLE "surveys" ADD COLUMN IF NOT EXISTS "response_rate" double precision;--> statement-breakpoint

-- Recria a view surveys_enriched incluindo os campos de amostragem
DROP VIEW IF EXISTS surveys_enriched;--> statement-breakpoint
CREATE VIEW surveys_enriched AS
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
  s.sample_size,
  s.margin_of_error,
  s.population_size,
  s.confidence_level,
  s.expected_proportion,
  s.response_rate,
  s.created_at,
  COALESCE((
    SELECT json_agg(
      json_build_object(
        'id', q.id,
        'text', q.text,
        'type', q.type,
        'required', q.required,
        'order', q."order",
        'options', q.options,
        'conditional_logic', q.conditional_logic
      ) ORDER BY q."order"
    )
    FROM questions q
    WHERE q.survey_id = s.id
  ), '[]'::json) AS questions,
  COALESCE((
    SELECT json_agg(
      json_build_object(
        'id', lc.id,
        'name', lc.name,
        'notes', lc.notes,
        'order', sl."order"
      ) ORDER BY sl."order"
    )
    FROM survey_locations sl
    JOIN location_catalog lc ON sl.location_id = lc.id
    WHERE sl.survey_id = s.id
  ), '[]'::json) AS locations,
  CAST(COALESCE((
    SELECT COUNT(*)
    FROM response_sessions rs
    WHERE rs.survey_id = s.id
      AND rs.status = 'concluida'
  ), 0) AS INTEGER) AS responses_count,
  CASE
    WHEN s.end_date < CURRENT_TIMESTAMP THEN 'expirada'
    WHEN s.active = true AND s.start_date <= CURRENT_TIMESTAMP AND s.end_date >= CURRENT_TIMESTAMP THEN 'ativa'
    WHEN s.active = false AND s.start_date <= CURRENT_TIMESTAMP AND s.end_date >= CURRENT_TIMESTAMP THEN 'rascunho'
    ELSE 'inativa'
  END AS status
FROM surveys s;
