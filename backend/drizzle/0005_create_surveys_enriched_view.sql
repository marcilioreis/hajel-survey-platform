-- Custom SQL migration file, put your code below! --DROP VIEW IF EXISTS surveys_enriched;
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
  s.created_at,
  COALESCE((
    SELECT json_agg(json_build_object(
      'id', q.id, 'text', q.text, 'type', q.type, 'required', q.required,
      'order', q."order", 'options', q.options, 'conditional_logic', q.conditional_logic
    ) ORDER BY q."order")
    FROM questions q WHERE q.survey_id = s.id
  ), '[]'::json) AS questions,
  COALESCE((
    SELECT json_agg(json_build_object(
      'id', l.id, 'name', l.name, 'order', l."order"
    ) ORDER BY l."order")
    FROM locations l WHERE l.survey_id = s.id
  ), '[]'::json) AS locations,
  CAST(COALESCE((
    SELECT COUNT(*) FROM response_sessions rs
    WHERE rs.survey_id = s.id AND rs.status = 'concluida'
  ), 0) AS INTEGER) AS responses_count,
  CASE
    WHEN s.end_date < CURRENT_TIMESTAMP THEN 'expirada'
    WHEN s.active = true AND s.start_date <= CURRENT_TIMESTAMP AND s.end_date >= CURRENT_TIMESTAMP THEN 'ativa'
    WHEN s.active = false AND s.start_date <= CURRENT_TIMESTAMP AND s.end_date >= CURRENT_TIMESTAMP THEN 'rascunho'
    ELSE 'inativa'
  END AS status
FROM surveys s;