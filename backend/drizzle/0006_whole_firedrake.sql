CREATE TABLE "location_catalog" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"notes" text,
	"state" varchar(2),
	"city" varchar(100),
	"neighborhood" varchar(100),
	"cep" varchar(10),
	"address" text,
	"ibge_code" varchar(7),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "location_catalog_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "neighborhoods" (
	"id" serial PRIMARY KEY NOT NULL,
	"state" varchar(2) NOT NULL,
	"city" varchar(100) NOT NULL,
	"ibge_code" varchar(7),
	"neighborhood" varchar(150) NOT NULL,
	"type" varchar(20)
);
--> statement-breakpoint
CREATE TABLE "survey_locations" (
	"survey_id" integer NOT NULL,
	"location_id" integer NOT NULL,
	"order" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "survey_locations_survey_id_location_id_pk" PRIMARY KEY("survey_id","location_id")
);
--> statement-breakpoint
ALTER TABLE "survey_locations" ADD CONSTRAINT "survey_locations_survey_id_surveys_id_fk" FOREIGN KEY ("survey_id") REFERENCES "public"."surveys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_locations" ADD CONSTRAINT "survey_locations_location_id_location_catalog_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."location_catalog"("id") ON DELETE cascade ON UPDATE no action;