-- Users log in with their email address, which a password reset by mail needs anyway; a separate
-- username would be a second identifier. The code stores addresses in lowercase, so the UNIQUE
-- constraint holds regardless of letter case.
ALTER TABLE users RENAME COLUMN username TO email;
