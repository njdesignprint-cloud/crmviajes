ALTER TABLE `quotes` ADD `share_token_hash` text;--> statement-breakpoint
ALTER TABLE `quotes` ADD `viewed_at` text;--> statement-breakpoint
ALTER TABLE `quotes` ADD `accepted_at` text;--> statement-breakpoint
ALTER TABLE `quotes` ADD `accepted_name` text;
--> statement-breakpoint
CREATE UNIQUE INDEX `quotes_share_token_unique` ON `quotes` (`share_token_hash`) WHERE `share_token_hash` IS NOT NULL;
