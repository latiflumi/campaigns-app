-- Data fix, no schema change. Until this release "lastSeenAt" was written with plain now(), which a
-- timestamp-without-time-zone column stores in the database server's own time zone. Prisma reads the
-- column as UTC, so on a server set to local time (e.g. Europe/Belgrade) everyone looked "seen" hours
-- in the future, i.e. online. Convert the stored values from the server's time zone to UTC.
-- On a database already running in UTC this changes nothing.
UPDATE "users"
SET "lastSeenAt" = ("lastSeenAt" AT TIME ZONE current_setting('TimeZone')) AT TIME ZONE 'UTC'
WHERE "lastSeenAt" IS NOT NULL;
