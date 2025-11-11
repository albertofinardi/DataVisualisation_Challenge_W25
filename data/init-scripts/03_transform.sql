-- ============================================
-- STAGE 2/3: TRANSFORM AND LOAD INTO FINAL TABLES
-- ============================================

DO $$ BEGIN RAISE NOTICE '=== [STAGE 2/3] TRANSFORMING AND LOADING DATA (cleaning types, handling NULLs) ==='; END $$;

-- Drop foreign key constraints and indexes temporarily for faster bulk inserts
DO $$ BEGIN RAISE NOTICE '→ Temporarily dropping constraints and indexes for faster import...'; END $$;
ALTER TABLE participant_status_logs DROP CONSTRAINT IF EXISTS participant_status_logs_participant_id_fkey;
ALTER TABLE participant_status_logs DROP CONSTRAINT IF EXISTS participant_status_logs_apartment_id_fkey;
ALTER TABLE participant_status_logs DROP CONSTRAINT IF EXISTS participant_status_logs_job_id_fkey;
DROP INDEX IF EXISTS idx_participant_status_logs_participant_id;
DROP INDEX IF EXISTS idx_participant_status_logs_timestamp;
DO $$ BEGIN RAISE NOTICE '✓ Constraints and indexes dropped'; END $$;

-- Import Participants
DO $$ BEGIN RAISE NOTICE '[1/11] Transforming Participants...'; END $$;
INSERT INTO participants (participant_id, household_size, have_kids, age, education_level, interest_group, joviality)
SELECT
    CAST(participantId AS INTEGER),
    CAST(householdSize AS INTEGER),
    CASE WHEN haveKids ILIKE 'true' THEN TRUE ELSE FALSE END,
    CAST(age AS INTEGER),
    educationLevel,
    interestGroup,
    CAST(joviality AS DECIMAL(10,9))
FROM participants_staging
ON CONFLICT (participant_id) DO NOTHING;
DO $$ BEGIN RAISE NOTICE '✓ Participants transformed'; END $$;

-- Import Buildings
DO $$ BEGIN RAISE NOTICE '[2/11] Transforming Buildings...'; END $$;
INSERT INTO buildings (building_id, location, building_type, max_occupancy, units)
SELECT
    CAST(buildingId AS INTEGER),
    ST_GeomFromText(location),
    buildingType,
    CASE WHEN maxOccupancy = '' THEN NULL ELSE CAST(maxOccupancy AS INTEGER) END,
    CASE WHEN units = '' THEN NULL ELSE string_to_array(TRIM(BOTH '[]' FROM units), ',')::INTEGER[] END
FROM buildings_staging;
DO $$ BEGIN RAISE NOTICE '✓ Buildings transformed'; END $$;

-- Import Apartments
INSERT INTO apartments (apartment_id, building_id, max_occupancy, rent)
SELECT
    CAST(apartmentId AS INTEGER),
    CAST(buildingId AS INTEGER),
    CAST(maxOccupancy AS INTEGER),
    CAST(rentalCost AS DECIMAL(10,2))
FROM apartments_staging;

-- Import Employers
INSERT INTO employers (employer_id, building_id, employer_name)
SELECT
    CAST(employerId AS INTEGER),
    CAST(buildingId AS INTEGER),
    location
FROM employers_staging;

-- Import Jobs
INSERT INTO jobs (job_id, employer_id, hourly_rate, start_time, end_time, days_of_week, education_requirement)
SELECT
    CAST(jobId AS INTEGER),
    CAST(employerId AS INTEGER),
    CAST(hourlyRate AS DECIMAL(10,2)),
    startTime::TIME,
    endTime::TIME,
    daysToWork,
    educationRequirement
FROM jobs_staging;

-- Import Pubs
INSERT INTO pubs (pub_id, building_id, pub_name, food_cost)
SELECT
    CAST(pubId AS INTEGER),
    CAST(buildingId AS INTEGER),
    location,
    CAST(hourlyCost AS DECIMAL(10,2))
FROM pubs_staging;

-- Import Restaurants
INSERT INTO restaurants (restaurant_id, building_id, restaurant_name, food_cost)
SELECT
    CAST(restaurantId AS INTEGER),
    CAST(buildingId AS INTEGER),
    location,
    CAST(foodCost AS DECIMAL(10,2))
FROM restaurants_staging;

-- Import Schools
INSERT INTO schools (school_id, building_id, school_name, monthly_cost)
SELECT
    CAST(schoolId AS INTEGER),
    CAST(buildingId AS INTEGER),
    location,
    CAST(monthlyCost AS DECIMAL(10,2))
FROM schools_staging;

-- Import Participant Status Logs (from all staging data)
DO $$ BEGIN RAISE NOTICE '[8/11] Transforming ParticipantStatusLogs...'; END $$;
INSERT INTO participant_status_logs (timestamp, current_location, participant_id, current_mode, hunger_status, sleep_status, apartment_id, available_balance, job_id, financial_status, daily_food_budget, weekly_extra_budget)
SELECT
    timestamp::TIMESTAMP,
    CASE
        WHEN currentLocation IS NULL OR currentLocation = '' OR LENGTH(currentLocation) < 10 THEN NULL
        WHEN currentLocation ~ '^POINT\s*\(' THEN
            -- Only try to parse if it looks like valid WKT
            ST_GeomFromText(currentLocation)
        ELSE NULL
    END,
    CAST(participantId AS INTEGER),
    currentMode,
    hungerStatus,
    sleepStatus,
    CASE WHEN apartmentId = '' OR apartmentId = 'NA' OR apartmentId IS NULL THEN NULL ELSE CAST(apartmentId AS INTEGER) END,
    CASE WHEN availableBalance = '' OR availableBalance = 'NA' OR availableBalance IS NULL THEN NULL ELSE CAST(availableBalance AS DECIMAL(10,2)) END,
    CASE WHEN jobId = '' OR jobId = 'NA' OR jobId IS NULL THEN NULL ELSE CAST(jobId AS INTEGER) END,
    financialStatus,
    CASE WHEN dailyFoodBudget = '' OR dailyFoodBudget = 'NA' OR dailyFoodBudget IS NULL THEN NULL ELSE CAST(dailyFoodBudget AS DECIMAL(10,2)) END,
    CASE WHEN weeklyExtraBudget = '' OR weeklyExtraBudget = 'NA' OR weeklyExtraBudget IS NULL THEN NULL ELSE CAST(weeklyExtraBudget AS DECIMAL(10,2)) END
FROM participant_status_logs_staging
WHERE currentLocation ~ '^POINT\s*\(';  -- Only insert rows with valid POINT format
DO $$ BEGIN RAISE NOTICE '✓ ParticipantStatusLogs transformed'; END $$;

-- Re-add foreign key constraints and indexes
DO $$ BEGIN RAISE NOTICE '→ Re-adding constraints and rebuilding indexes...'; END $$;
ALTER TABLE participant_status_logs
    ADD CONSTRAINT participant_status_logs_participant_id_fkey
    FOREIGN KEY (participant_id) REFERENCES participants(participant_id);
ALTER TABLE participant_status_logs
    ADD CONSTRAINT participant_status_logs_apartment_id_fkey
    FOREIGN KEY (apartment_id) REFERENCES apartments(apartment_id);
ALTER TABLE participant_status_logs
    ADD CONSTRAINT participant_status_logs_job_id_fkey
    FOREIGN KEY (job_id) REFERENCES jobs(job_id);

-- Rebuild indexes
CREATE INDEX idx_participant_status_logs_participant_id ON participant_status_logs(participant_id);
CREATE INDEX idx_participant_status_logs_timestamp ON participant_status_logs(timestamp);
DO $$ BEGIN RAISE NOTICE '✓ Constraints and indexes restored'; END $$;

-- Import Checkin Journal
INSERT INTO checkin_journal (participant_id, timestamp, venue_id, venue_type)
SELECT
    CAST(participantId AS INTEGER),
    timestamp::TIMESTAMP,
    CAST(venueId AS INTEGER),
    venueType
FROM checkin_journal_staging;

-- Import Financial Journal
INSERT INTO financial_journal (participant_id, timestamp, category, amount)
SELECT
    CAST(participantId AS INTEGER),
    timestamp::TIMESTAMP,
    category,
    CAST(amount AS DECIMAL(10,2))
FROM financial_journal_staging;

-- Import Social Network
DO $$ BEGIN RAISE NOTICE '[10/11] Transforming SocialNetwork...'; END $$;
INSERT INTO social_network (participant_id, friend_id)
SELECT
    CAST(participantIdFrom AS INTEGER),
    CAST(participantIdTo AS INTEGER)
FROM social_network_staging;
DO $$ BEGIN RAISE NOTICE '✓ SocialNetwork transformed'; END $$;

-- Import Travel Journal
DO $$ BEGIN RAISE NOTICE '[11/11] Transforming TravelJournal...'; END $$;
INSERT INTO travel_journal (participant_id, travel_start_time, travel_start_location_id, travel_end_time, travel_end_location_id, purpose, check_in_time, check_out_time, starting_balance, ending_balance)
SELECT
    CAST(participantId AS INTEGER),
    travelStartTime::TIMESTAMP,
    CASE WHEN travelStartLocationId = 'NA' OR travelStartLocationId = '' OR travelStartLocationId IS NULL THEN NULL ELSE CAST(travelStartLocationId AS INTEGER) END,
    travelEndTime::TIMESTAMP,
    CASE WHEN travelEndLocationId = 'NA' OR travelEndLocationId = '' OR travelEndLocationId IS NULL THEN NULL ELSE CAST(travelEndLocationId AS INTEGER) END,
    purpose,
    checkInTime::TIMESTAMP,
    checkOutTime::TIMESTAMP,
    CAST(startingBalance AS DECIMAL(10,2)),
    CAST(endingBalance AS DECIMAL(10,2))
FROM travel_journal_staging;
DO $$ BEGIN RAISE NOTICE '✓ TravelJournal transformed'; END $$;

DO $$ BEGIN RAISE NOTICE '=== STAGE 2/3 COMPLETE: All data transformed and loaded ==='; END $$;

-- ============================================
-- STAGE 3/3: CLEANUP - DROP STAGING TABLES
-- ============================================

DO $$ BEGIN RAISE NOTICE '=== [STAGE 3/3] CLEANING UP: Dropping staging tables to free space ==='; END $$;

DROP TABLE IF EXISTS participants_staging CASCADE;
DROP TABLE IF EXISTS buildings_staging CASCADE;
DROP TABLE IF EXISTS apartments_staging CASCADE;
DROP TABLE IF EXISTS employers_staging CASCADE;
DROP TABLE IF EXISTS jobs_staging CASCADE;
DROP TABLE IF EXISTS pubs_staging CASCADE;
DROP TABLE IF EXISTS restaurants_staging CASCADE;
DROP TABLE IF EXISTS schools_staging CASCADE;
DROP TABLE IF EXISTS participant_status_logs_staging CASCADE;
DROP TABLE IF EXISTS checkin_journal_staging CASCADE;
DROP TABLE IF EXISTS financial_journal_staging CASCADE;
DROP TABLE IF EXISTS social_network_staging CASCADE;
DROP TABLE IF EXISTS travel_journal_staging CASCADE;

DO $$ BEGIN RAISE NOTICE '=== STAGE 3/3 COMPLETE: All staging tables dropped ==='; END $$;
DO $$ BEGIN RAISE NOTICE ''; END $$;
DO $$ BEGIN RAISE NOTICE '╔════════════════════════════════════════════╗'; END $$;
DO $$ BEGIN RAISE NOTICE '║  DATABASE INITIALIZATION COMPLETE!         ║'; END $$;
DO $$ BEGIN RAISE NOTICE '║  All data loaded and ready to use          ║'; END $$;
DO $$ BEGIN RAISE NOTICE '╚════════════════════════════════════════════╝'; END $$;
DO $$ BEGIN RAISE NOTICE 'INIT_COMPLETE_READY'; END $$;
