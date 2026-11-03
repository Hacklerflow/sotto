CREATE TABLE "signing_grants" (
	"user_id" uuid NOT NULL,
	"survey_id" uuid NOT NULL,
	"granted_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "signing_grants_user_survey_unique" UNIQUE("user_id","survey_id")
);
--> statement-breakpoint
CREATE TABLE "survey_signing_keys" (
	"survey_id" uuid PRIMARY KEY NOT NULL,
	"private_key" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "signing_grants" ADD CONSTRAINT "signing_grants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;