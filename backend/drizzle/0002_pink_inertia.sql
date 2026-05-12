ALTER TABLE "exportedReports" RENAME TO "exported_reports";--> statement-breakpoint
ALTER TABLE "exported_reports" DROP CONSTRAINT "exportedReports_survey_id_surveys_id_fk";
--> statement-breakpoint
ALTER TABLE "exported_reports" DROP CONSTRAINT "exportedReports_report_id_reports_id_fk";
--> statement-breakpoint
ALTER TABLE "exported_reports" DROP CONSTRAINT "exportedReports_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "exported_reports" ADD CONSTRAINT "exported_reports_survey_id_surveys_id_fk" FOREIGN KEY ("survey_id") REFERENCES "public"."surveys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exported_reports" ADD CONSTRAINT "exported_reports_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exported_reports" ADD CONSTRAINT "exported_reports_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;