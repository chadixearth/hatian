CREATE TABLE "group_follows" (
	"user_id" uuid NOT NULL,
	"group_id" text NOT NULL,
	"member_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_viewed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "group_follows_user_id_group_id_pk" PRIMARY KEY("user_id","group_id")
);
--> statement-breakpoint
ALTER TABLE "group_follows" ADD CONSTRAINT "group_follows_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_follows" ADD CONSTRAINT "group_follows_member_fk" FOREIGN KEY ("group_id","member_id") REFERENCES "public"."members"("group_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "group_follows_member_uq" ON "group_follows" USING btree ("group_id","member_id");--> statement-breakpoint
CREATE INDEX "group_follows_user_idx" ON "group_follows" USING btree ("user_id","last_viewed_at" DESC NULLS LAST);--> statement-breakpoint
-- Hand-added: drizzle-kit does not manage the neon_auth schema.
ALTER TABLE "group_follows" ADD CONSTRAINT "group_follows_user_fk" FOREIGN KEY ("user_id") REFERENCES "neon_auth"."user"("id") ON DELETE cascade ON UPDATE no action;
