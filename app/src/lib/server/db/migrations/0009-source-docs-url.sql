-- Where the documentation of the source is published as a site, for people; NULL when not given.
ALTER TABLE sources ADD COLUMN docs_url TEXT;
