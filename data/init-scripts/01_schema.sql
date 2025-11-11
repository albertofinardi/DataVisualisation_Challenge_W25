-- Enable PostGIS extension first
CREATE EXTENSION IF NOT EXISTS postgis;

-- Staging tables for raw CSV import (all columns as TEXT, no constraints)
CREATE TABLE participants_staging (
    participantId TEXT,
    householdSize TEXT,
    haveKids TEXT,
    age TEXT,
    educationLevel TEXT,
    interestGroup TEXT,
    joviality TEXT
);

CREATE TABLE buildings_staging (
    buildingId TEXT,
    location TEXT,
    buildingType TEXT,
    maxOccupancy TEXT,
    units TEXT
);

CREATE TABLE apartments_staging (
    apartmentId TEXT,
    rentalCost TEXT,
    maxOccupancy TEXT,
    numberOfRooms TEXT,
    location TEXT,
    buildingId TEXT
);

CREATE TABLE employers_staging (
    employerId TEXT,
    location TEXT,
    buildingId TEXT
);

CREATE TABLE jobs_staging (
    jobId TEXT,
    employerId TEXT,
    hourlyRate TEXT,
    startTime TEXT,
    endTime TEXT,
    daysToWork TEXT,
    educationRequirement TEXT
);

CREATE TABLE pubs_staging (
    pubId TEXT,
    hourlyCost TEXT,
    maxOccupancy TEXT,
    location TEXT,
    buildingId TEXT
);

CREATE TABLE restaurants_staging (
    restaurantId TEXT,
    foodCost TEXT,
    maxOccupancy TEXT,
    location TEXT,
    buildingId TEXT
);

CREATE TABLE schools_staging (
    schoolId TEXT,
    monthlyCost TEXT,
    maxEnrollment TEXT,
    location TEXT,
    buildingId TEXT
);

CREATE TABLE participant_status_logs_staging (
    timestamp TEXT,
    currentLocation TEXT,
    participantId TEXT,
    currentMode TEXT,
    hungerStatus TEXT,
    sleepStatus TEXT,
    apartmentId TEXT,
    availableBalance TEXT,
    jobId TEXT,
    financialStatus TEXT,
    dailyFoodBudget TEXT,
    weeklyExtraBudget TEXT
);

CREATE TABLE checkin_journal_staging (
    participantId TEXT,
    timestamp TEXT,
    venueId TEXT,
    venueType TEXT
);

CREATE TABLE financial_journal_staging (
    participantId TEXT,
    timestamp TEXT,
    category TEXT,
    amount TEXT
);

CREATE TABLE social_network_staging (
    timestamp TEXT,
    participantIdFrom TEXT,
    participantIdTo TEXT
);

CREATE TABLE travel_journal_staging (
    participantId TEXT,
    travelStartTime TEXT,
    travelStartLocationId TEXT,
    travelEndTime TEXT,
    travelEndLocationId TEXT,
    purpose TEXT,
    checkInTime TEXT,
    checkOutTime TEXT,
    startingBalance TEXT,
    endingBalance TEXT
);
-- Database schema for VAST Challenge data

-- Drop existing tables if they exist
DROP TABLE IF EXISTS participant_status_logs CASCADE;
DROP TABLE IF EXISTS checkin_journal CASCADE;
DROP TABLE IF EXISTS financial_journal CASCADE;
DROP TABLE IF EXISTS travel_journal CASCADE;
DROP TABLE IF EXISTS social_network CASCADE;
DROP TABLE IF EXISTS participants CASCADE;
DROP TABLE IF EXISTS apartments CASCADE;
DROP TABLE IF EXISTS buildings CASCADE;
DROP TABLE IF EXISTS jobs CASCADE;
DROP TABLE IF EXISTS employers CASCADE;
DROP TABLE IF EXISTS pubs CASCADE;
DROP TABLE IF EXISTS restaurants CASCADE;
DROP TABLE IF EXISTS schools CASCADE;

-- Participants table
CREATE TABLE participants (
    participant_id INTEGER PRIMARY KEY,
    household_size INTEGER,
    have_kids BOOLEAN,
    age INTEGER,
    education_level VARCHAR(50),
    interest_group VARCHAR(10),
    joviality DECIMAL(10, 9)
);

-- Buildings table
CREATE TABLE buildings (
    building_id INTEGER PRIMARY KEY,
    location GEOMETRY(POLYGON),
    building_type VARCHAR(50),
    max_occupancy INTEGER,
    units INTEGER[]
);

-- Apartments table
CREATE TABLE apartments (
    apartment_id INTEGER PRIMARY KEY,
    building_id INTEGER,
    max_occupancy INTEGER,
    rent DECIMAL(10, 2),
    FOREIGN KEY (building_id) REFERENCES buildings(building_id)
);

-- Employers table
CREATE TABLE employers (
    employer_id INTEGER PRIMARY KEY,
    building_id INTEGER,
    employer_name VARCHAR(100),
    FOREIGN KEY (building_id) REFERENCES buildings(building_id)
);

-- Jobs table
CREATE TABLE jobs (
    job_id INTEGER PRIMARY KEY,
    employer_id INTEGER,
    hourly_rate DECIMAL(10, 2),
    start_time TIME,
    end_time TIME,
    days_of_week VARCHAR(50),
    education_requirement VARCHAR(50),
    FOREIGN KEY (employer_id) REFERENCES employers(employer_id)
);

-- Pubs table
CREATE TABLE pubs (
    pub_id INTEGER PRIMARY KEY,
    building_id INTEGER,
    pub_name VARCHAR(100),
    food_cost DECIMAL(10, 2),
    FOREIGN KEY (building_id) REFERENCES buildings(building_id)
);

-- Restaurants table
CREATE TABLE restaurants (
    restaurant_id INTEGER PRIMARY KEY,
    building_id INTEGER,
    restaurant_name VARCHAR(100),
    food_cost DECIMAL(10, 2),
    FOREIGN KEY (building_id) REFERENCES buildings(building_id)
);

-- Schools table
CREATE TABLE schools (
    school_id INTEGER PRIMARY KEY,
    building_id INTEGER,
    school_name VARCHAR(100),
    monthly_cost DECIMAL(10, 2),
    FOREIGN KEY (building_id) REFERENCES buildings(building_id)
);

-- Participant Status Logs table (Activity Logs)
CREATE TABLE participant_status_logs (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    current_location GEOMETRY(POINT),
    participant_id INTEGER NOT NULL,
    current_mode VARCHAR(50),
    hunger_status VARCHAR(50),
    sleep_status VARCHAR(50),
    apartment_id INTEGER,
    available_balance DECIMAL(10, 2),
    job_id INTEGER,
    financial_status VARCHAR(50),
    daily_food_budget DECIMAL(10, 2),
    weekly_extra_budget DECIMAL(10, 2),
    FOREIGN KEY (participant_id) REFERENCES participants(participant_id),
    FOREIGN KEY (apartment_id) REFERENCES apartments(apartment_id),
    FOREIGN KEY (job_id) REFERENCES jobs(job_id)
);

-- Checkin Journal table
CREATE TABLE checkin_journal (
    id SERIAL PRIMARY KEY,
    participant_id INTEGER NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    venue_id INTEGER,
    venue_type VARCHAR(50),
    FOREIGN KEY (participant_id) REFERENCES participants(participant_id)
);

-- Financial Journal table
CREATE TABLE financial_journal (
    id SERIAL PRIMARY KEY,
    participant_id INTEGER NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    category VARCHAR(50),
    amount DECIMAL(10, 2),
    FOREIGN KEY (participant_id) REFERENCES participants(participant_id)
);

-- Travel Journal table
CREATE TABLE travel_journal (
    id SERIAL PRIMARY KEY,
    participant_id INTEGER NOT NULL,
    travel_start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    travel_start_location_id INTEGER,
    travel_end_time TIMESTAMP WITH TIME ZONE,
    travel_end_location_id INTEGER,
    purpose VARCHAR(100),
    check_in_time TIMESTAMP WITH TIME ZONE,
    check_out_time TIMESTAMP WITH TIME ZONE,
    starting_balance DECIMAL(10, 2),
    ending_balance DECIMAL(10, 2),
    FOREIGN KEY (participant_id) REFERENCES participants(participant_id)
);

-- Social Network table
CREATE TABLE social_network (
    id SERIAL PRIMARY KEY,
    participant_id INTEGER NOT NULL,
    friend_id INTEGER NOT NULL,
    FOREIGN KEY (participant_id) REFERENCES participants(participant_id),
    FOREIGN KEY (friend_id) REFERENCES participants(participant_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_participant_status_logs_participant_id ON participant_status_logs(participant_id);
CREATE INDEX idx_participant_status_logs_timestamp ON participant_status_logs(timestamp);
CREATE INDEX idx_checkin_journal_participant_id ON checkin_journal(participant_id);
CREATE INDEX idx_checkin_journal_timestamp ON checkin_journal(timestamp);
CREATE INDEX idx_financial_journal_participant_id ON financial_journal(participant_id);
CREATE INDEX idx_financial_journal_timestamp ON financial_journal(timestamp);
CREATE INDEX idx_travel_journal_participant_id ON travel_journal(participant_id);
CREATE INDEX idx_travel_journal_timestamp ON travel_journal(timestamp);
