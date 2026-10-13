# Active curriculum

These files contain authored context sentences and idiomatic expressions. The catalog in learning/catalog.js combines them with selected core vocabulary and original category sentences.

Generated template sentence banks and adjective-pattern casual banks are excluded from active practice. The older files remain on disk for rollback, and tests/bank.test.cjs validates them as archives only. Startup loads 17 vocabulary banks rather than the previous 52 bank files.

New items require a stable ID, category, tier, practice mode and complete translations. Use a new ID when the meaning changes. Add Canadian French overrides where usage differs and standard MSA counterparts where spoken slang has no MSA equivalent.

Easy should use familiar words and short direct exchanges. Medium adds specific details, fuller expressions, and past or future information. Hard adds nuanced idioms, concession, conditions, alternatives, and multi-part situations. Word count alone cannot assign a tier.

Hard vocabulary may include explicitly accepted synonyms and gender variants. Hard sentence ordering checks a taught form, not every grammatically valid translation. Add reviewed alternatives explicitly rather than accepting any permutation of the same words.

Keep content grouped by topic and follow the source size limit in AGENTS.md.
