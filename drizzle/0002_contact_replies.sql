CREATE TABLE "contact_replies" (
	"id" serial PRIMARY KEY NOT NULL,
	"contact_id" integer NOT NULL,
	"message" text NOT NULL,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "contact_replies" ADD CONSTRAINT "contact_replies_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;