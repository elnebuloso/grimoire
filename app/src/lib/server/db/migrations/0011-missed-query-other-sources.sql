-- A query restricted to sources whose missing words other readable sources hold records their
-- slugs as a JSON array: the agent picked the wrong source rather than hit a gap. NULL: none.
ALTER TABLE missed_queries ADD COLUMN other_sources TEXT CHECK (json_valid(other_sources));
