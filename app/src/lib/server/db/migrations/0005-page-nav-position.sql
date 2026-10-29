-- Index of the page in the site's `nav`; NULL when the page is not listed there.
ALTER TABLE pages ADD COLUMN nav_position INTEGER;
