CREATE TABLE `leads` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`phone` text NOT NULL,
	`email` text,
	`case_type` text NOT NULL,
	`message` text,
	`preferred_contact` text NOT NULL,
	`language` text NOT NULL,
	`source` text DEFAULT '{}' NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`assigned_to` text,
	`privacy_accepted_at` integer NOT NULL,
	`marketing_consent` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `leads_created_at_idx` ON `leads` (`created_at`);--> statement-breakpoint
CREATE INDEX `leads_status_idx` ON `leads` (`status`);--> statement-breakpoint
CREATE INDEX `leads_phone_idx` ON `leads` (`phone`);