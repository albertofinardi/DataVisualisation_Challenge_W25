-- ============================================
-- STAGE: LOADING CSV FILES INTO STAGING TABLES
-- ============================================

DO $$ BEGIN RAISE NOTICE '=== [STAGE 1/3] LOADING CSV FILES INTO STAGING TABLES ==='; END $$;

-- Load Participants into staging
DO $$ BEGIN RAISE NOTICE '[1/9] Loading Participants CSV...'; END $$;
COPY participants_staging FROM '/data/Datasets/Attributes/Participants.csv' WITH (FORMAT csv, HEADER true);
DO $$ BEGIN RAISE NOTICE '✓ Participants loaded'; END $$;

-- Load Buildings into staging
DO $$ BEGIN RAISE NOTICE '[2/9] Loading Buildings CSV...'; END $$;
COPY buildings_staging FROM '/data/Datasets/Attributes/Buildings.csv' WITH (FORMAT csv, HEADER true);
DO $$ BEGIN RAISE NOTICE '✓ Buildings loaded'; END $$;

-- Load Apartments into staging
DO $$ BEGIN RAISE NOTICE '[3/9] Loading Apartments CSV...'; END $$;
COPY apartments_staging FROM '/data/Datasets/Attributes/Apartments.csv' WITH (FORMAT csv, HEADER true);
DO $$ BEGIN RAISE NOTICE '✓ Apartments loaded'; END $$;

-- Load Employers into staging
DO $$ BEGIN RAISE NOTICE '[4/9] Loading Employers CSV...'; END $$;
COPY employers_staging FROM '/data/Datasets/Attributes/Employers.csv' WITH (FORMAT csv, HEADER true);
DO $$ BEGIN RAISE NOTICE '✓ Employers loaded'; END $$;

-- Load Jobs into staging
DO $$ BEGIN RAISE NOTICE '[5/9] Loading Jobs CSV...'; END $$;
COPY jobs_staging FROM '/data/Datasets/Attributes/Jobs.csv' WITH (FORMAT csv, HEADER true);
DO $$ BEGIN RAISE NOTICE '✓ Jobs loaded'; END $$;

-- Load Pubs into staging
DO $$ BEGIN RAISE NOTICE '[6/9] Loading Pubs CSV...'; END $$;
COPY pubs_staging FROM '/data/Datasets/Attributes/Pubs.csv' WITH (FORMAT csv, HEADER true);
DO $$ BEGIN RAISE NOTICE '✓ Pubs loaded'; END $$;

-- Load Restaurants into staging
DO $$ BEGIN RAISE NOTICE '[7/9] Loading Restaurants CSV...'; END $$;
COPY restaurants_staging FROM '/data/Datasets/Attributes/Restaurants.csv' WITH (FORMAT csv, HEADER true);
DO $$ BEGIN RAISE NOTICE '✓ Restaurants loaded'; END $$;

-- Load Schools into staging
DO $$ BEGIN RAISE NOTICE '[8/9] Loading Schools CSV...'; END $$;
COPY schools_staging FROM '/data/Datasets/Attributes/Schools.csv' WITH (FORMAT csv, HEADER true);
DO $$ BEGIN RAISE NOTICE '✓ Schools loaded'; END $$;

-- Load Participant Status Logs (all 72 files) into staging
DO $$ BEGIN RAISE NOTICE '[9/9] Loading 72 ParticipantStatusLogs CSV files...'; END $$;
COPY participant_status_logs_staging FROM '/data/Datasets/Activity Logs/ParticipantStatusLogs1.csv' WITH (FORMAT csv, HEADER true);
COPY participant_status_logs_staging FROM '/data/Datasets/Activity Logs/ParticipantStatusLogs2.csv' WITH (FORMAT csv, HEADER true);
COPY participant_status_logs_staging FROM '/data/Datasets/Activity Logs/ParticipantStatusLogs3.csv' WITH (FORMAT csv, HEADER true);
COPY participant_status_logs_staging FROM '/data/Datasets/Activity Logs/ParticipantStatusLogs4.csv' WITH (FORMAT csv, HEADER true);
COPY participant_status_logs_staging FROM '/data/Datasets/Activity Logs/ParticipantStatusLogs5.csv' WITH (FORMAT csv, HEADER true);
COPY participant_status_logs_staging FROM '/data/Datasets/Activity Logs/ParticipantStatusLogs6.csv' WITH (FORMAT csv, HEADER true);
COPY participant_status_logs_staging FROM '/data/Datasets/Activity Logs/ParticipantStatusLogs7.csv' WITH (FORMAT csv, HEADER true);
COPY participant_status_logs_staging FROM '/data/Datasets/Activity Logs/ParticipantStatusLogs8.csv' WITH (FORMAT csv, HEADER true);
COPY participant_status_logs_staging FROM '/data/Datasets/Activity Logs/ParticipantStatusLogs9.csv' WITH (FORMAT csv, HEADER true);
COPY participant_status_logs_staging FROM '/data/Datasets/Activity Logs/ParticipantStatusLogs10.csv' WITH (FORMAT csv, HEADER true);
COPY participant_status_logs_staging FROM '/data/Datasets/Activity Logs/ParticipantStatusLogs11.csv' WITH (FORMAT csv, HEADER true);
COPY participant_status_logs_staging FROM '/data/Datasets/Activity Logs/ParticipantStatusLogs12.csv' WITH (FORMAT csv, HEADER true);
COPY participant_status_logs_staging FROM '/data/Datasets/Activity Logs/ParticipantStatusLogs13.csv' WITH (FORMAT csv, HEADER true);
COPY participant_status_logs_staging FROM '/data/Datasets/Activity Logs/ParticipantStatusLogs14.csv' WITH (FORMAT csv, HEADER true);
COPY participant_status_logs_staging FROM '/data/Datasets/Activity Logs/ParticipantStatusLogs15.csv' WITH (FORMAT csv, HEADER true);
COPY participant_status_logs_staging FROM '/data/Datasets/Activity Logs/ParticipantStatusLogs16.csv' WITH (FORMAT csv, HEADER true);
COPY participant_status_logs_staging FROM '/data/Datasets/Activity Logs/ParticipantStatusLogs17.csv' WITH (FORMAT csv, HEADER true);
COPY participant_status_logs_staging FROM '/data/Datasets/Activity Logs/ParticipantStatusLogs18.csv' WITH (FORMAT csv, HEADER true);
COPY participant_status_logs_staging FROM '/data/Datasets/Activity Logs/ParticipantStatusLogs19.csv' WITH (FORMAT csv, HEADER true);
COPY participant_status_logs_staging FROM '/data/Datasets/Activity Logs/ParticipantStatusLogs20.csv' WITH (FORMAT csv, HEADER true);
COPY participant_status_logs_staging FROM '/data/Datasets/Activity Logs/ParticipantStatusLogs21.csv' WITH (FORMAT csv, HEADER true);
COPY participant_status_logs_staging FROM '/data/Datasets/Activity Logs/ParticipantStatusLogs22.csv' WITH (FORMAT csv, HEADER true);
COPY participant_status_logs_staging FROM '/data/Datasets/Activity Logs/ParticipantStatusLogs23.csv' WITH (FORMAT csv, HEADER true);
COPY participant_status_logs_staging FROM '/data/Datasets/Activity Logs/ParticipantStatusLogs24.csv' WITH (FORMAT csv, HEADER true);
COPY participant_status_logs_staging FROM '/data/Datasets/Activity Logs/ParticipantStatusLogs25.csv' WITH (FORMAT csv, HEADER true);
COPY participant_status_logs_staging FROM '/data/Datasets/Activity Logs/ParticipantStatusLogs26.csv' WITH (FORMAT csv, HEADER true);
COPY participant_status_logs_staging FROM '/data/Datasets/Activity Logs/ParticipantStatusLogs27.csv' WITH (FORMAT csv, HEADER true);
COPY participant_status_logs_staging FROM '/data/Datasets/Activity Logs/ParticipantStatusLogs28.csv' WITH (FORMAT csv, HEADER true);
COPY participant_status_logs_staging FROM '/data/Datasets/Activity Logs/ParticipantStatusLogs29.csv' WITH (FORMAT csv, HEADER true);
COPY participant_status_logs_staging FROM '/data/Datasets/Activity Logs/ParticipantStatusLogs30.csv' WITH (FORMAT csv, HEADER true);
COPY participant_status_logs_staging FROM '/data/Datasets/Activity Logs/ParticipantStatusLogs31.csv' WITH (FORMAT csv, HEADER true);
COPY participant_status_logs_staging FROM '/data/Datasets/Activity Logs/ParticipantStatusLogs32.csv' WITH (FORMAT csv, HEADER true);
COPY participant_status_logs_staging FROM '/data/Datasets/Activity Logs/ParticipantStatusLogs33.csv' WITH (FORMAT csv, HEADER true);
COPY participant_status_logs_staging FROM '/data/Datasets/Activity Logs/ParticipantStatusLogs34.csv' WITH (FORMAT csv, HEADER true);
COPY participant_status_logs_staging FROM '/data/Datasets/Activity Logs/ParticipantStatusLogs35.csv' WITH (FORMAT csv, HEADER true);
COPY participant_status_logs_staging FROM '/data/Datasets/Activity Logs/ParticipantStatusLogs36.csv' WITH (FORMAT csv, HEADER true);
COPY participant_status_logs_staging FROM '/data/Datasets/Activity Logs/ParticipantStatusLogs37.csv' WITH (FORMAT csv, HEADER true);
COPY participant_status_logs_staging FROM '/data/Datasets/Activity Logs/ParticipantStatusLogs38.csv' WITH (FORMAT csv, HEADER true);
COPY participant_status_logs_staging FROM '/data/Datasets/Activity Logs/ParticipantStatusLogs39.csv' WITH (FORMAT csv, HEADER true);
COPY participant_status_logs_staging FROM '/data/Datasets/Activity Logs/ParticipantStatusLogs40.csv' WITH (FORMAT csv, HEADER true);
COPY participant_status_logs_staging FROM '/data/Datasets/Activity Logs/ParticipantStatusLogs41.csv' WITH (FORMAT csv, HEADER true);
COPY participant_status_logs_staging FROM '/data/Datasets/Activity Logs/ParticipantStatusLogs42.csv' WITH (FORMAT csv, HEADER true);
COPY participant_status_logs_staging FROM '/data/Datasets/Activity Logs/ParticipantStatusLogs43.csv' WITH (FORMAT csv, HEADER true);
COPY participant_status_logs_staging FROM '/data/Datasets/Activity Logs/ParticipantStatusLogs44.csv' WITH (FORMAT csv, HEADER true);
COPY participant_status_logs_staging FROM '/data/Datasets/Activity Logs/ParticipantStatusLogs45.csv' WITH (FORMAT csv, HEADER true);
COPY participant_status_logs_staging FROM '/data/Datasets/Activity Logs/ParticipantStatusLogs46.csv' WITH (FORMAT csv, HEADER true);
COPY participant_status_logs_staging FROM '/data/Datasets/Activity Logs/ParticipantStatusLogs47.csv' WITH (FORMAT csv, HEADER true);
COPY participant_status_logs_staging FROM '/data/Datasets/Activity Logs/ParticipantStatusLogs48.csv' WITH (FORMAT csv, HEADER true);
COPY participant_status_logs_staging FROM '/data/Datasets/Activity Logs/ParticipantStatusLogs49.csv' WITH (FORMAT csv, HEADER true);
COPY participant_status_logs_staging FROM '/data/Datasets/Activity Logs/ParticipantStatusLogs50.csv' WITH (FORMAT csv, HEADER true);
COPY participant_status_logs_staging FROM '/data/Datasets/Activity Logs/ParticipantStatusLogs51.csv' WITH (FORMAT csv, HEADER true);
COPY participant_status_logs_staging FROM '/data/Datasets/Activity Logs/ParticipantStatusLogs52.csv' WITH (FORMAT csv, HEADER true);
COPY participant_status_logs_staging FROM '/data/Datasets/Activity Logs/ParticipantStatusLogs53.csv' WITH (FORMAT csv, HEADER true);
COPY participant_status_logs_staging FROM '/data/Datasets/Activity Logs/ParticipantStatusLogs54.csv' WITH (FORMAT csv, HEADER true);
COPY participant_status_logs_staging FROM '/data/Datasets/Activity Logs/ParticipantStatusLogs55.csv' WITH (FORMAT csv, HEADER true);
COPY participant_status_logs_staging FROM '/data/Datasets/Activity Logs/ParticipantStatusLogs56.csv' WITH (FORMAT csv, HEADER true);
COPY participant_status_logs_staging FROM '/data/Datasets/Activity Logs/ParticipantStatusLogs57.csv' WITH (FORMAT csv, HEADER true);
COPY participant_status_logs_staging FROM '/data/Datasets/Activity Logs/ParticipantStatusLogs58.csv' WITH (FORMAT csv, HEADER true);
COPY participant_status_logs_staging FROM '/data/Datasets/Activity Logs/ParticipantStatusLogs59.csv' WITH (FORMAT csv, HEADER true);
COPY participant_status_logs_staging FROM '/data/Datasets/Activity Logs/ParticipantStatusLogs60.csv' WITH (FORMAT csv, HEADER true);
COPY participant_status_logs_staging FROM '/data/Datasets/Activity Logs/ParticipantStatusLogs61.csv' WITH (FORMAT csv, HEADER true);
COPY participant_status_logs_staging FROM '/data/Datasets/Activity Logs/ParticipantStatusLogs62.csv' WITH (FORMAT csv, HEADER true);
COPY participant_status_logs_staging FROM '/data/Datasets/Activity Logs/ParticipantStatusLogs63.csv' WITH (FORMAT csv, HEADER true);
COPY participant_status_logs_staging FROM '/data/Datasets/Activity Logs/ParticipantStatusLogs64.csv' WITH (FORMAT csv, HEADER true);
COPY participant_status_logs_staging FROM '/data/Datasets/Activity Logs/ParticipantStatusLogs65.csv' WITH (FORMAT csv, HEADER true);
COPY participant_status_logs_staging FROM '/data/Datasets/Activity Logs/ParticipantStatusLogs66.csv' WITH (FORMAT csv, HEADER true);
COPY participant_status_logs_staging FROM '/data/Datasets/Activity Logs/ParticipantStatusLogs67.csv' WITH (FORMAT csv, HEADER true);
COPY participant_status_logs_staging FROM '/data/Datasets/Activity Logs/ParticipantStatusLogs68.csv' WITH (FORMAT csv, HEADER true);
COPY participant_status_logs_staging FROM '/data/Datasets/Activity Logs/ParticipantStatusLogs69.csv' WITH (FORMAT csv, HEADER true);
COPY participant_status_logs_staging FROM '/data/Datasets/Activity Logs/ParticipantStatusLogs70.csv' WITH (FORMAT csv, HEADER true);
COPY participant_status_logs_staging FROM '/data/Datasets/Activity Logs/ParticipantStatusLogs71.csv' WITH (FORMAT csv, HEADER true);
COPY participant_status_logs_staging FROM '/data/Datasets/Activity Logs/ParticipantStatusLogs72.csv' WITH (FORMAT csv, HEADER true);
DO $$ BEGIN RAISE NOTICE '✓ All 72 ParticipantStatusLogs files loaded'; END $$;

-- Load Journals into staging
DO $$ BEGIN RAISE NOTICE 'Loading Journal files...'; END $$;
COPY checkin_journal_staging FROM '/data/Datasets/Journals/CheckinJournal.csv' WITH (FORMAT csv, HEADER true);
DO $$ BEGIN RAISE NOTICE '✓ CheckinJournal loaded'; END $$;

COPY financial_journal_staging FROM '/data/Datasets/Journals/FinancialJournal.csv' WITH (FORMAT csv, HEADER true);
DO $$ BEGIN RAISE NOTICE '✓ FinancialJournal loaded'; END $$;

COPY social_network_staging FROM '/data/Datasets/Journals/SocialNetwork.csv' WITH (FORMAT csv, HEADER true);
DO $$ BEGIN RAISE NOTICE '✓ SocialNetwork loaded'; END $$;

COPY travel_journal_staging FROM '/data/Datasets/Journals/TravelJournal.csv' WITH (FORMAT csv, HEADER true);
DO $$ BEGIN RAISE NOTICE '✓ TravelJournal loaded'; END $$;

DO $$ BEGIN RAISE NOTICE '=== STAGE 1/3 COMPLETE: All CSV files loaded into staging ==='; END $$;
