CREATE TABLE "survey_public_keys" (
	"survey_id" uuid PRIMARY KEY NOT NULL,
	"public_key" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "used_signatures" (
	"signature_hash" text PRIMARY KEY NOT NULL,
	"survey_id" uuid NOT NULL
);
