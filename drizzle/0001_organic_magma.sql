CREATE TABLE `access_arrangements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` varchar(64) NOT NULL,
	`approvedBy` varchar(128),
	`evidenceLog` json DEFAULT (JSON_ARRAY()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `access_arrangements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `assignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`classId` int NOT NULL,
	`specPointIds` json DEFAULT (JSON_ARRAY()),
	`dueAt` timestamp,
	`noteEn` text,
	`noteAr` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `assignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `attempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`checkItemId` int NOT NULL,
	`response` text,
	`correct` boolean,
	`attemptedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `attempts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `check_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`lessonId` int NOT NULL,
	`conceptId` int,
	`specPointId` int,
	`type` enum('multiple_choice','short_answer','voice','selection') NOT NULL DEFAULT 'multiple_choice',
	`questionEn` text NOT NULL,
	`questionAr` text NOT NULL,
	`optionsEn` json,
	`optionsAr` json,
	`correctAnswer` text,
	`markSchemeEn` text,
	`markSchemeAr` text,
	`commandWord` varchar(64),
	`marks` int DEFAULT 1,
	`order` int NOT NULL DEFAULT 0,
	`readingLevel` int DEFAULT 2,
	CONSTRAINT `check_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `classes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`teacherId` int NOT NULL,
	`curriculumId` int NOT NULL,
	`subjectId` int,
	`tier` enum('foundation','higher','core','extended','sl','hl','all') DEFAULT 'all',
	`language` enum('ar','en') NOT NULL DEFAULT 'en',
	`nameEn` text NOT NULL,
	`nameAr` text NOT NULL,
	`joinCode` varchar(8) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `classes_id` PRIMARY KEY(`id`),
	CONSTRAINT `classes_joinCode_unique` UNIQUE(`joinCode`)
);
--> statement-breakpoint
CREATE TABLE `concepts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`canonicalStatementEn` text NOT NULL,
	`canonicalStatementAr` text NOT NULL,
	`prerequisites` json DEFAULT (JSON_ARRAY()),
	`subjectArea` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `concepts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `curricula` (
	`id` int AUTO_INCREMENT NOT NULL,
	`family` varchar(64) NOT NULL,
	`board` varchar(64) NOT NULL,
	`region` varchar(64),
	`language` enum('ar','en','both') NOT NULL DEFAULT 'en',
	`version` varchar(32),
	`titleEn` text NOT NULL,
	`titleAr` text NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `curricula_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `curriculum_mappings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conceptId` int NOT NULL,
	`specPointId` int NOT NULL,
	`depth` enum('recall','understand','apply','analyse','evaluate') NOT NULL DEFAULT 'understand',
	`terminologyEn` text,
	`terminologyAr` text,
	`commandWords` json DEFAULT (JSON_ARRAY()),
	`assessmentStyle` varchar(128),
	`practicalRequired` boolean NOT NULL DEFAULT false,
	CONSTRAINT `curriculum_mappings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ecc_areas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`number` int NOT NULL,
	`nameEn` text NOT NULL,
	`nameAr` text NOT NULL,
	`descriptionEn` text,
	`descriptionAr` text,
	`iconName` varchar(64),
	CONSTRAINT `ecc_areas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ecc_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`unitId` int NOT NULL,
	`status` enum('not_started','rehearsed','practised','mastered') NOT NULL DEFAULT 'not_started',
	`source` enum('self','tvi','guardian') NOT NULL DEFAULT 'self',
	`verifiedBy` int,
	`notes` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ecc_progress_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ecc_units` (
	`id` int AUTO_INCREMENT NOT NULL,
	`areaId` int NOT NULL,
	`lessonId` int,
	`titleEn` text NOT NULL,
	`titleAr` text NOT NULL,
	`requiresInPersonPractice` boolean NOT NULL DEFAULT false,
	`inPersonNoteEn` text,
	`inPersonNoteAr` text,
	`order` int NOT NULL DEFAULT 0,
	CONSTRAINT `ecc_units_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `enrolments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`classId` int NOT NULL,
	`userId` int NOT NULL,
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `enrolments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `guardian_links` (
	`id` int AUTO_INCREMENT NOT NULL,
	`guardianId` int NOT NULL,
	`learnerId` int NOT NULL,
	`consentAt` timestamp NOT NULL DEFAULT (now()),
	`scope` json DEFAULT (JSON_ARRAY('progress','time','preferences')),
	CONSTRAINT `guardian_links_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `insights` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` varchar(64) NOT NULL,
	`value` json,
	`confidence` float DEFAULT 0.5,
	`visibleToLearner` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `insights_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `learner_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`mode` enum('audio_first','reading','focus','custom') NOT NULL DEFAULT 'reading',
	`primaryModality` enum('audio','text','visual') NOT NULL DEFAULT 'text',
	`autoNarrate` boolean NOT NULL DEFAULT false,
	`speechRate` float NOT NULL DEFAULT 1,
	`voice` varchar(128) DEFAULT 'alloy',
	`earcons` boolean NOT NULL DEFAULT true,
	`theme` enum('light','dark','cream','calm','high_contrast') NOT NULL DEFAULT 'light',
	`fontFamily` enum('atkinson','plex','opendyslexic','naskh') NOT NULL DEFAULT 'atkinson',
	`fontScale` float NOT NULL DEFAULT 1,
	`lineHeight` float NOT NULL DEFAULT 1.7,
	`letterSpacing` float NOT NULL DEFAULT 0,
	`wordSpacing` float NOT NULL DEFAULT 0,
	`maxLineLength` int NOT NULL DEFAULT 65,
	`rulerOverlay` boolean NOT NULL DEFAULT false,
	`overlayTint` enum('none','blue','yellow','peach','green','grey') NOT NULL DEFAULT 'none',
	`overlayOpacity` float NOT NULL DEFAULT 0.35,
	`chunkSize` enum('micro','standard') NOT NULL DEFAULT 'standard',
	`reduceMotion` boolean NOT NULL DEFAULT false,
	`hideDecorative` boolean NOT NULL DEFAULT false,
	`timers` boolean NOT NULL DEFAULT false,
	`bodyDouble` boolean NOT NULL DEFAULT false,
	`rewards` enum('off','gentle','full') NOT NULL DEFAULT 'gentle',
	`readingLevel` int NOT NULL DEFAULT 2,
	`tashkeel` boolean NOT NULL DEFAULT false,
	`numerals` enum('arabic_indic','western') NOT NULL DEFAULT 'western',
	`syllableSplit` boolean NOT NULL DEFAULT false,
	`curriculum` enum('igcse_edexcel','qatar_moehe','gcse','igcse_caie','us','ib','a_level','none') NOT NULL DEFAULT 'none',
	`board` varchar(64),
	`tier` enum('foundation','higher','core','extended','sl','hl'),
	`yearGroup` varchar(32),
	`classCodes` json DEFAULT (JSON_ARRAY()),
	`accessArrangements` json DEFAULT (JSON_ARRAY()),
	`inputMethod` enum('keyboard','pointer','switch','voice','braille_display') NOT NULL DEFAULT 'keyboard',
	`singleKeyShortcuts` boolean NOT NULL DEFAULT true,
	`keyMap` json DEFAULT (JSON_OBJECT()),
	`brailleOutput` enum('off','ueb','ueb_contracted','arabic_braille') NOT NULL DEFAULT 'off',
	`mathNotation` enum('mathml','nemeth','ueb_math','spoken') NOT NULL DEFAULT 'mathml',
	`eccEnabled` boolean NOT NULL DEFAULT false,
	`eccAreas` json DEFAULT (JSON_ARRAY()),
	`tviId` int,
	`onboardingComplete` boolean NOT NULL DEFAULT false,
	`onboardingStep` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `learner_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `learner_profiles_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `lessons` (
	`id` int AUTO_INCREMENT NOT NULL,
	`topicId` int NOT NULL,
	`titleEn` text NOT NULL,
	`titleAr` text NOT NULL,
	`conceptGraph` json,
	`order` int NOT NULL DEFAULT 0,
	`estimatedMinutes` int DEFAULT 15,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lessons_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mastery` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`conceptId` int NOT NULL,
	`level` int NOT NULL DEFAULT 0,
	`evidence` json DEFAULT (JSON_ARRAY()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `mastery_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `media` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('image','diagram','chart','audio','video','mathml','tactile_svg') NOT NULL,
	`srcRef` text NOT NULL,
	`altShortEn` text NOT NULL,
	`altShortAr` text NOT NULL,
	`altLongEn` text,
	`altLongAr` text,
	`sonificationData` json,
	`mathml` text,
	`tactileSvg` text,
	`captionEn` text,
	`captionAr` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `media_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `parked_thoughts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`sessionId` varchar(64),
	`text` text NOT NULL,
	`resolved` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `parked_thoughts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`lessonId` int NOT NULL,
	`sectionId` int,
	`cursorOffset` int DEFAULT 0,
	`status` enum('not_started','in_progress','complete') NOT NULL DEFAULT 'not_started',
	`completedAt` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `progress_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`lessonId` int NOT NULL,
	`order` int NOT NULL DEFAULT 0,
	`titleEn` text NOT NULL,
	`titleAr` text NOT NULL,
	`summaryEn` text NOT NULL,
	`summaryAr` text NOT NULL,
	`bodyEn` text NOT NULL,
	`bodyAr` text NOT NULL,
	`narrationScriptEn` text,
	`narrationScriptAr` text,
	`mediaRefs` json DEFAULT (JSON_ARRAY()),
	`readingLevel` int NOT NULL DEFAULT 2,
	CONSTRAINT `sections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `session_states` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`payload` json NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `session_states_id` PRIMARY KEY(`id`),
	CONSTRAINT `session_states_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `spec_points` (
	`id` int AUTO_INCREMENT NOT NULL,
	`curriculumId` int NOT NULL,
	`subjectId` int NOT NULL,
	`code` varchar(64) NOT NULL,
	`titleEn` text NOT NULL,
	`titleAr` text NOT NULL,
	`tier` enum('foundation','higher','core','extended','sl','hl','all') NOT NULL DEFAULT 'all',
	`depth` enum('recall','understand','apply','analyse','evaluate') NOT NULL DEFAULT 'understand',
	`weighting` float DEFAULT 1,
	`parentId` int,
	`order` int NOT NULL DEFAULT 0,
	CONSTRAINT `spec_points_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subjects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`curriculumId` int NOT NULL,
	`titleEn` text NOT NULL,
	`titleAr` text NOT NULL,
	`code` varchar(32),
	`iconName` varchar(64),
	`colorToken` varchar(32),
	`order` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	CONSTRAINT `subjects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `topics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`subjectId` int NOT NULL,
	`specPointId` int,
	`conceptId` int,
	`titleEn` text NOT NULL,
	`titleAr` text NOT NULL,
	`summaryEn` text,
	`summaryAr` text,
	`order` int NOT NULL DEFAULT 0,
	`prerequisites` json DEFAULT (JSON_ARRAY()),
	`estimatedMinutes` int DEFAULT 15,
	`isActive` boolean NOT NULL DEFAULT true,
	CONSTRAINT `topics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tutor_conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`lessonId` int,
	`sessionId` varchar(64) NOT NULL,
	`messages` json DEFAULT (JSON_ARRAY()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tutor_conversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tvi_links` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tviId` int NOT NULL,
	`learnerId` int NOT NULL,
	`consentAt` timestamp NOT NULL DEFAULT (now()),
	`scope` json DEFAULT (JSON_ARRAY()),
	CONSTRAINT `tvi_links_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('learner','guardian','teacher','admin') NOT NULL DEFAULT 'learner';--> statement-breakpoint
ALTER TABLE `users` ADD `locale` enum('ar','en') DEFAULT 'en' NOT NULL;