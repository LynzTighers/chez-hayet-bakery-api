CREATE TABLE "login_attempts" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" varchar(50) NOT NULL,
	"succeeded" boolean NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"token_hash" varchar(64) PRIMARY KEY NOT NULL,
	"admin_id" integer NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_admin_id_admins_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "login_attempts_username_created_at_idx" ON "login_attempts" USING btree ("username","created_at");