-- Script atualizado para criar a view surveys_enriched
-- Compatível com a migração do catálogo global de locais e novos campos

DROP VIEW IF EXISTS surveys_enriched;

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
  -- Perguntas agregadas em JSON
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
  -- Locais associados via survey_locations e location_catalog
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
  -- Contagem de respostas concluídas (como INTEGER)
  CAST(COALESCE((
    SELECT COUNT(*)
    FROM response_sessions rs
    WHERE rs.survey_id = s.id
      AND rs.status = 'concluida'
  ), 0) AS INTEGER) AS responses_count,
  -- Status calculado baseado nas datas e active
  CASE
    WHEN s.end_date < CURRENT_TIMESTAMP THEN 'expirada'
    WHEN s.active = true AND s.start_date <= CURRENT_TIMESTAMP AND s.end_date >= CURRENT_TIMESTAMP THEN 'ativa'
    WHEN s.active = false AND s.start_date <= CURRENT_TIMESTAMP AND s.end_date >= CURRENT_TIMESTAMP THEN 'rascunho'
    ELSE 'inativa'
  END AS status
FROM surveys s;