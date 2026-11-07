-- A query that found hits while some of its words occur in no searched source is recorded too,
-- with those words as a JSON array. NULL: the query found nothing at all.
ALTER TABLE missed_queries ADD COLUMN unknown_words TEXT CHECK (json_valid(unknown_words));
