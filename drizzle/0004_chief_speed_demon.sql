CREATE TABLE `feedback_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`message` text NOT NULL,
	`screenshotKey` varchar(512),
	`screenshotUrl` varchar(1024),
	`page` varchar(255),
	`userAgent` varchar(512),
	`status` enum('open','acknowledged','resolved') NOT NULL DEFAULT 'open',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `feedback_reports_id` PRIMARY KEY(`id`)
);
