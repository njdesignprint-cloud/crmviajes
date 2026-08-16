ALTER TABLE `agencies` ADD `status` text NOT NULL DEFAULT 'trial';
ALTER TABLE `agencies` ADD `trial_ends_at` text;
ALTER TABLE `agencies` ADD `plan` text NOT NULL DEFAULT 'trial';
ALTER TABLE `agencies` ADD `phone` text NOT NULL DEFAULT '';
ALTER TABLE `agencies` ADD `stripe_customer_id` text;
ALTER TABLE `agencies` ADD `stripe_subscription_id` text;
ALTER TABLE `agencies` ADD `updated_at` text;

CREATE TABLE `email_codes` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `email` text NOT NULL,
  `code_hash` text NOT NULL,
  `purpose` text NOT NULL DEFAULT 'signup',
  `payload_json` text NOT NULL DEFAULT '{}',
  `attempts` integer NOT NULL DEFAULT 0,
  `expires_at` text NOT NULL,
  `consumed_at` text,
  `created_at` text NOT NULL
);
CREATE INDEX `email_codes_email_created_idx` ON `email_codes` (`email`,`created_at`);

CREATE TABLE `user_sessions` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `member_id` integer NOT NULL,
  `token_hash` text NOT NULL UNIQUE,
  `expires_at` text NOT NULL,
  `last_seen_at` text NOT NULL,
  `created_at` text NOT NULL
);
CREATE INDEX `user_sessions_member_idx` ON `user_sessions` (`member_id`);

CREATE TABLE `billing_events` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `provider_event_id` text NOT NULL UNIQUE,
  `event_type` text NOT NULL,
  `agency_id` integer,
  `payload_json` text NOT NULL DEFAULT '{}',
  `created_at` text NOT NULL
);

CREATE TABLE `sales_notes` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `agency_id` integer NOT NULL,
  `author_email` text NOT NULL,
  `note` text NOT NULL,
  `created_at` text NOT NULL
);
CREATE INDEX `sales_notes_agency_idx` ON `sales_notes` (`agency_id`,`created_at`);
