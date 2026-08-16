ALTER TABLE `learner_profiles` ADD `learningGoals` json;
--> statement-breakpoint
ALTER TABLE `learner_profiles` ADD `explanationPreference` enum('quick','balanced','detailed','step_by_step') DEFAULT 'balanced' NOT NULL;
--> statement-breakpoint
ALTER TABLE `learner_profiles` ADD `practicePreference` enum('short','mixed','exam_style','step_by_step') DEFAULT 'mixed' NOT NULL;
--> statement-breakpoint
ALTER TABLE `learner_profiles` ADD `sessionPreference` enum('short','medium','long') DEFAULT 'medium' NOT NULL;
