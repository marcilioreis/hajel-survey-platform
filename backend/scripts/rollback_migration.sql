-- Script de Rollback Manual para a alteração de bairros
ALTER TABLE "location_catalog" ALTER COLUMN "neighborhood" SET DEFAULT NULL;
ALTER TABLE "location_catalog" ALTER COLUMN "neighborhood" SET DATA TYPE varchar(100) USING 
  CASE 
    WHEN "neighborhood" IS NULL OR "neighborhood"::text = '[]' THEN NULL
    ELSE "neighborhood"->>0 
  END;
