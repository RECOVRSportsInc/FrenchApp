# FrenchApp development rules

- Keep main stable. Develop changes on feature branches and review pull requests before publishing.
- Aim for 150 lines per source file. Split files above 200 lines into focused modules. Store shared learning logic in learning/, topic content in data/curriculum/, styles in css/ and checks in tests/.
- Data files may use one complete object per line. Every active multilingual item must include English, French, Polish, Spanish, Italian and MSA meanings, with Canadian French overrides where usage differs.
- Never inflate content counts by substituting nouns into repeated templates. Count distinct concepts and context examples honestly.
- Difficulty must change the learning demand: Easy recognition and short exchanges; Medium specific details and reverse selection; Hard unaided vocabulary recall and complex sentence construction.
- App tiers are not certified CEFR levels. Do not claim native-speaker review or translation certification without evidence.
- Each tier test has exactly 20 unique question IDs. A score of 15/20 or higher passes. Tests have one first answer, no hints, no audio and no answer feedback before results.
- Lesson order and tier prerequisites must be enforced in the session model as well as the UI. Tests can bypass lessons only in an unlocked tier.
- Scope roadmap progress to learner code, learning language, answer language and topic. Do not infer tier completion from XP or historical word counts.
- Preserve existing XP and word history. Do not overwrite damaged progress records. Include roadmap progress and unreadable records in exported backups.
- Keep provider credentials out of frontend JavaScript. Cloud XP does not imply cloud roadmap synchronization.
- Run relevant curriculum, progression, loading, startup and browser checks before delivering changes. Verify both Arabic text direction and mobile layout.
