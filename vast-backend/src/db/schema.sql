-- Simplified SQLite schema matching actual CSV column names
-- With SpatiaLite spatial support

-- Initialize SpatiaLite
SELECT InitSpatialMetadata(1);

-- Drop tables
DROP TABLE IF EXISTS participant_status_logs;
DROP TABLE IF EXISTS checkin_journal;
DROP TABLE IF EXISTS financial_journal;
DROP TABLE IF EXISTS travel_journal;
DROP TABLE IF EXISTS social_network;
DROP TABLE IF EXISTS apartments;
DROP TABLE IF EXISTS jobs;
DROP TABLE IF EXISTS pubs;
DROP TABLE IF EXISTS restaurants;
DROP TABLE IF EXISTS schools;
DROP TABLE IF EXISTS employers;
DROP TABLE IF EXISTS participants;
DROP TABLE IF EXISTS buildings;
DROP TABLE IF EXISTS buildingUnits;

-- Core tables
CREATE TABLE participants (
    participantId INTEGER PRIMARY KEY,
    householdSize INTEGER,
    haveKids BOOLEAN,
    age INTEGER,
    educationLevel TEXT CHECK (educationLevel IN ('Low', 'HighSchoolOrCollege', 'Bachelors', 'Graduate')),
    interestGroup TEXT CHECK (interestGroup IN ('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J')),
    joviality REAL
);

CREATE TABLE buildings (
    buildingId INTEGER PRIMARY KEY,
    buildingType TEXT CHECK (buildingType IN ('Commercial', 'Residental', 'School')),
    maxOccupancy INTEGER
);

CREATE TABLE buildingUnits (
    buildingId INTEGER NOT NULL,
    unitId INTEGER NOT NULL,
    PRIMARY KEY (buildingId, unitId)
    --F OREIGN KEY (buildingId) REFERENCES buildings(buildingId)
);

CREATE TABLE apartments (
    apartmentId INTEGER PRIMARY KEY,
    rentalCost REAL,
    maxOccupancy INTEGER,
    numberOfRooms INTEGER,
    buildingId INTEGER NOT NULL
    --FOREIGN KEY (buildingId) REFERENCES buildings(buildingId)
);

CREATE TABLE employers (
    employerId INTEGER PRIMARY KEY,
    buildingId INTEGER NOT NULL
    --FOREIGN KEY (buildingId) REFERENCES buildings(buildingId)
);

CREATE TABLE jobs (
    jobId INTEGER PRIMARY KEY,
    employerId INTEGER NOT NULL,
    hourlyRate REAL,
    startTime TIME,
    endTime TIME,
    daysToWork TEXT,
    worksMonday BOOLEAN,
    worksTuesday BOOLEAN,
    worksWednesday BOOLEAN,
    worksThursday BOOLEAN,
    worksFriday BOOLEAN,
    worksSaturday BOOLEAN,
    worksSunday BOOLEAN,
    educationRequirement TEXT CHECK (educationRequirement IN ('Low', 'HighSchoolOrCollege', 'Bachelors', 'Graduate'))
    --FOREIGN KEY (employerId) REFERENCES employers(employerId)
);

CREATE TABLE pubs (
    pubId INTEGER PRIMARY KEY,
    hourlyCost REAL,
    maxOccupancy INTEGER,
    buildingId INTEGER NOT NULL
    --FOREIGN KEY (buildingId) REFERENCES buildings(buildingId)
);

CREATE TABLE restaurants (
    restaurantId INTEGER PRIMARY KEY,
    foodCost REAL,
    maxOccupancy INTEGER,
    buildingId INTEGER NOT NULL
    --FOREIGN KEY (buildingId) REFERENCES buildings(buildingId)
);

CREATE TABLE schools (
    schoolId INTEGER PRIMARY KEY,
    monthlyCost REAL,
    maxEnrollment INTEGER,
    buildingId INTEGER NOT NULL
    --FOREIGN KEY (buildingId) REFERENCES buildings(buildingId)
);

-- Activity logs
CREATE TABLE participant_status_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME,
    participantId INTEGER NOT NULL,
    currentMode TEXT CHECK (currentMode IN ('AtHome', 'AtRecreation', 'Transport', 'AtRestaurant', 'AtWork')),
    hungerStatus TEXT,
    sleepStatus TEXT,
    apartmentId INTEGER,
    availableBalance REAL,
    jobId INTEGER,
    financialStatus TEXT,
    dailyFoodBudget REAL,
    weeklyExtraBudget REAL
    --FOREIGN KEY (participantId) REFERENCES participants(participantId),
    --FOREIGN KEY (apartmentId) REFERENCES apartments(apartmentId),
    --FOREIGN KEY (jobId) REFERENCES jobs(jobId)
);

CREATE TABLE checkin_journal (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    participantId INTEGER NOT NULL,
    timestamp DATETIME,
    venueId INTEGER NOT NULL,
    venueType TEXT CHECK (venueType IN ('Apartment', 'Pub', 'Restaurant', 'Workplace'))
    --FOREIGN KEY (participantId) REFERENCES participants(participantId)
);

CREATE TABLE financial_journal (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    participantId INTEGER NOT NULL,
    timestamp DATETIME,
    category TEXT CHECK (category IN ('Education', 'Food', 'Recreation', 'RentAdjustment', 'Shelter', 'Wage')),
    amount REAL
);

CREATE TABLE travel_journal (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    participantId INTEGER NOT NULL,
    travelStartTime DATETIME,
    travelEndTime DATETIME,
    travelStartLocationId INTEGER NOT NULL,
    travelEndLocationId INTEGER NOT NULL,
    purpose TEXT CHECK (purpose IN ('Coming Back From Restaurant', 'Eating', 'Going Back to Home', 'Recreation (Social Gathering)', 'Work/Home Commute')),
    checkInTime DATETIME,
    checkOutTime DATETIME,
    startingBalance REAL,
    endingBalance REAL

    --FOREIGN KEY (participantId) REFERENCES participants(participantId),
    --FOREIGN KEY (travelStartLocationId) REFERENCES buildings(buildingId),
    --FOREIGN KEY (travelEndLocationId) REFERENCES buildings(buildingId)
);

CREATE TABLE social_network (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME,
    participantIdFrom INTEGER NOT NULL,
    participantIdTo INTEGER NOT NULL
    --FOREIGN KEY (participantIdFrom) REFERENCES participants(participantId),
    --FOREIGN KEY (participantIdTo) REFERENCES participants(participantId)
);

-- Add SpatiaLite geometry columns
SELECT AddGeometryColumn('buildings', 'location', 4326, 'POLYGON', 'XY');
SELECT AddGeometryColumn('apartments', 'location', 4326, 'POINT', 'XY');
SELECT AddGeometryColumn('employers', 'location', 4326, 'POINT', 'XY');
SELECT AddGeometryColumn('pubs', 'location', 4326, 'POINT', 'XY');
SELECT AddGeometryColumn('restaurants', 'location', 4326, 'POINT', 'XY');
SELECT AddGeometryColumn('schools', 'location', 4326, 'POINT', 'XY');
SELECT AddGeometryColumn('participant_status_logs', 'currentLocation', 4326, 'POINT', 'XY');

-- Create spatial indexes for performance
SELECT CreateSpatialIndex('buildings', 'location');
SELECT CreateSpatialIndex('apartments', 'location');
SELECT CreateSpatialIndex('employers', 'location');
SELECT CreateSpatialIndex('pubs', 'location');
SELECT CreateSpatialIndex('restaurants', 'location');
SELECT CreateSpatialIndex('schools', 'location');
SELECT CreateSpatialIndex('participant_status_logs', 'currentLocation');