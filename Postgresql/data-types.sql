-- Integer Types
CREATE TABLE integer_examples (
    id SERIAL PRIMARY KEY,           -- Auto-incrementing integer
    small_num SMALLINT,             -- -32,768 to 32,767
    regular_num INTEGER,            -- -2,147,483,648 to 2,147,483,647
    big_num BIGINT,                 -- Very large range
    auto_small SMALLSERIAL,         -- Auto-incrementing smallint
    auto_big BIGSERIAL              -- Auto-incrementing bigint
);

-- Insert examples
INSERT INTO integer_examples (small_num, regular_num, big_num) 
VALUES (100, 1000000, 9223372036854775807);

-- Check ranges
SELECT 
    pg_typeof(small_num) as small_type,
    pg_typeof(regular_num) as regular_type,
    pg_typeof(big_num) as big_type
FROM integer_examples;



-- Numeric Types
-- Numeric examples
CREATE TABLE financial_data (
    id SERIAL PRIMARY KEY,
    price NUMERIC(10,2),            -- 10 digits total, 2 after decimal
    precise_value NUMERIC(20,10),   -- High precision
    unlimited_precision NUMERIC     -- No limit (slower)
);

-- Insert precise values
INSERT INTO financial_data (price, precise_value, unlimited_precision)
VALUES 
    (999.99, 1234567890.1234567890, 12345678901234567890.123456789012345);

-- Calculations maintain precision
SELECT 
    price * 1.08 as price_with_tax,
    precise_value / 3 as divided_value
FROM financial_data;

-- Rounding functions
SELECT 
    ROUND(price, 1) as rounded_price,
    CEIL(price) as ceiling_price,
    FLOOR(price) as floor_price
FROM financial_data;



-- Floating-Point Types
-- Floating-point examples
CREATE TABLE scientific_data (
    id SERIAL PRIMARY KEY,
    measurement_real REAL,          -- 4-byte floating-point
    measurement_double DOUBLE PRECISION  -- 8-byte floating-point
);

-- Insert scientific notation
INSERT INTO scientific_data (measurement_real, measurement_double)
VALUES 
    (1.23e10, 1.234567890123456789),
    (-4.56e-5, 9.87654321098765432e20);

-- Precision comparison
SELECT 
    measurement_real,
    measurement_double,
    measurement_real::NUMERIC(20,10) as real_as_numeric,
    measurement_double::NUMERIC(30,15) as double_as_numeric
FROM scientific_data;

-- Mathematical functions
SELECT 
    SQRT(measurement_double) as square_root,
    EXP(measurement_real) as exponential,
    LOG(ABS(measurement_double)) as natural_log
FROM scientific_data;

-- ## Storing Money
-- Money type example
CREATE TABLE financial_records (
    id SERIAL PRIMARY KEY,
    amount_money MONEY,             -- Uses locale settings
    amount_numeric NUMERIC(15,2),   -- Recommended approach
    currency_code CHAR(3)
);

-- Insert money values
INSERT INTO financial_records (amount_money, amount_numeric, currency_code)
VALUES 
    ('$1,234.56', 1234.56, 'USD'),
    ('€999.99', 999.99, 'EUR'),
    ('-¥500', -500.00, 'JPY');

-- Money arithmetic
SELECT 
    amount_money + '$100'::MONEY as increased_money,
    amount_numeric * 1.1 as increased_numeric,
    amount_money::NUMERIC as money_to_numeric
FROM financial_records;

-- Formatting money
SELECT 
    amount_numeric,
    TO_CHAR(amount_numeric, '999,999.99') as formatted_amount,
    currency_code || ' ' || amount_numeric as with_currency
FROM financial_records;


-- ## NaNs and Infinity
-- Special numeric values
CREATE TABLE special_values (
    id SERIAL PRIMARY KEY,
    value_real REAL,
    value_double DOUBLE PRECISION,
    value_numeric NUMERIC
);

-- Insert special values
INSERT INTO special_values (value_real, value_double, value_numeric)
VALUES 
    ('NaN', 'NaN', 'NaN'),
    ('Infinity', 'Infinity', NULL),  -- NUMERIC doesn't support infinity
    ('-Infinity', '-Infinity', NULL);

-- Check for special values
SELECT 
    value_real,
    value_real = 'NaN' as is_nan_real,
    value_double > 0 AND value_double = 'Infinity' as is_positive_infinity
FROM special_values;

-- Mathematical operations with NaN
SELECT 
    'NaN'::REAL + 5 as nan_plus_five,
    'NaN'::REAL * 0 as nan_times_zero,
    'Infinity'::REAL - 'Infinity'::REAL as infinity_operation
;

-- Use COALESCE to handle NaN
SELECT 
    COALESCE(NULLIF(value_real, 'NaN'), 0) as cleaned_value
FROM special_values;


-- ## Casting Types
-- Casting examples
CREATE TABLE casting_demo (
    id SERIAL PRIMARY KEY,
    text_number TEXT,
    integer_value INTEGER,
    decimal_value NUMERIC(10,2)
);

INSERT INTO casting_demo (text_number, integer_value, decimal_value)
VALUES ('123.45', 100, 99.99);

-- Explicit casting methods
SELECT 
    text_number::NUMERIC as cast_operator,
    CAST(text_number AS NUMERIC) as cast_function,
    integer_value::TEXT as int_to_text,
    decimal_value::INTEGER as decimal_to_int
FROM casting_demo;

-- Safe casting with error handling
SELECT 
    text_number,
    CASE 
        WHEN text_number ~ '^[0-9]+\.?[0-9]*$' 
        THEN text_number::NUMERIC 
        ELSE NULL 
    END as safe_cast
FROM casting_demo;

-- Date casting examples
SELECT 
    '2023-12-25'::DATE as string_to_date,
    '2023-12-25 14:30:00'::TIMESTAMP as string_to_timestamp,
    EXTRACT(YEAR FROM '2023-12-25'::DATE) as extracted_year;

-- JSON casting
SELECT 
    '{"name": "John", "age": 30}'::JSON as text_to_json,
    '{"name": "John", "age": 30}'::JSONB as text_to_jsonb;


-- ## Character Types
-- Character type examples
CREATE TABLE text_examples (
    id SERIAL PRIMARY KEY,
    fixed_char CHAR(10),           -- Fixed length, padded
    variable_char VARCHAR(50),      -- Variable length with limit
    unlimited_text TEXT,           -- Unlimited length
    name_field NAME                -- Internal PostgreSQL type
);

-- Insert text data
INSERT INTO text_examples (fixed_char, variable_char, unlimited_text)
VALUES 
    ('ABC', 'Variable text', 'This is unlimited text that can be very long...'),
    ('XYZ', 'Short', 'Another text entry');

-- String functions
SELECT 
    fixed_char,
    LENGTH(fixed_char) as char_length,
    TRIM(fixed_char) as trimmed_char,
    UPPER(variable_char) as upper_case,
    LOWER(variable_char) as lower_case,
    SUBSTRING(unlimited_text, 1, 20) as first_20_chars
FROM text_examples;

-- String operations
SELECT 
    variable_char || ' - ' || unlimited_text as concatenated,
    POSITION('text' IN unlimited_text) as text_position,
    REPLACE(variable_char, 'Variable', 'Changed') as replaced_text,
    SPLIT_PART(variable_char, ' ', 1) as first_word
FROM text_examples;

-- Pattern matching
SELECT 
    variable_char,
    variable_char LIKE '%text%' as contains_text,
    variable_char ~ '^[A-Z]' as starts_with_capital,
    variable_char ILIKE '%TEXT%' as case_insensitive_match
FROM text_examples;


-- ## Check Constraints
-- Check constraint examples
CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE,
    age INTEGER CHECK (age >= 18 AND age <= 120),
    salary NUMERIC(10,2) CHECK (salary > 0),
    department VARCHAR(50) CHECK (department IN ('HR', 'IT', 'Finance', 'Marketing')),
    hire_date DATE CHECK (hire_date <= CURRENT_DATE),
    
    -- Table-level constraint
    CONSTRAINT valid_employee CHECK (
        (age >= 18 AND salary >= 30000) OR 
        (age >= 16 AND salary >= 15000 AND department = 'Intern')
    )
);

-- Insert valid data
INSERT INTO employees (name, email, age, salary, department, hire_date)
VALUES ('John Doe', 'john@company.com', 25, 50000, 'IT', '2023-01-15');

-- These will fail due to constraints
-- INSERT INTO employees (name, age, salary, department) 
-- VALUES ('Too Young', 15, 40000, 'IT');  -- Age constraint violation

-- Multi-column check constraint
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    price NUMERIC(10,2),
    discount_price NUMERIC(10,2),
    category VARCHAR(50),
    
    CONSTRAINT valid_discount CHECK (
        discount_price IS NULL OR 
        (discount_price < price AND discount_price > 0)
    ),
    CONSTRAINT electronics_price CHECK (
        category != 'Electronics' OR price >= 10.00
    )
);

-- Add constraint to existing table
ALTER TABLE employees 
ADD CONSTRAINT email_format 
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Drop constraint
ALTER TABLE employees DROP CONSTRAINT email_format;


-- ## Domain Types

-- Create domain types
CREATE DOMAIN email_type AS VARCHAR(255)
    CHECK (VALUE ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

CREATE DOMAIN phone_type AS VARCHAR(20)
    CHECK (VALUE ~ '^\+?[1-9]\d{1,14}$');

CREATE DOMAIN positive_money AS NUMERIC(12,2)
    CHECK (VALUE > 0)
    DEFAULT 0.00;

CREATE DOMAIN us_postal_code AS VARCHAR(10)
    CHECK (VALUE ~ '^\d{5}(-\d{4})?$');

-- Use domains in table creation
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email email_type,
    phone phone_type,
    credit_limit positive_money,
    zip_code us_postal_code
);

-- Insert data using domains
INSERT INTO customers (name, email, phone, credit_limit, zip_code)
VALUES 
    ('Alice Johnson', 'alice@email.com', '+1234567890', 5000.00, '12345'),
    ('Bob Smith', 'bob@company.org', '555-0123', 3000.50, '90210-1234');

-- Domain with more complex logic
CREATE DOMAIN password_type AS TEXT
    CHECK (
        LENGTH(VALUE) >= 8 AND
        VALUE ~ '[A-Z]' AND      -- At least one uppercase
        VALUE ~ '[a-z]' AND      -- At least one lowercase  
        VALUE ~ '[0-9]' AND      -- At least one digit
        VALUE ~ '[^A-Za-z0-9]'   -- At least one special character
    );

-- View domain information
SELECT 
    domain_name,
    data_type,
    character_maximum_length,
    domain_default,
    is_nullable
FROM information_schema.domains
WHERE domain_schema = 'public';

-- Alter domain
ALTER DOMAIN positive_money SET DEFAULT 100.00;
ALTER DOMAIN email_type ADD CONSTRAINT email_length_check CHECK (LENGTH(VALUE) >= 5);

-- Drop domain (only if not used)
-- DROP DOMAIN phone_type CASCADE;


-- ## Binary Data
-- Binary data table
CREATE TABLE file_storage (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255),
    content_type VARCHAR(100),
    file_data BYTEA,
    file_size INTEGER,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert binary data (hex format)
INSERT INTO file_storage (filename, content_type, file_data)
VALUES 
    ('sample.txt', 'text/plain', '\x48656c6c6f20576f726c64'),  -- "Hello World" in hex
    ('image.png', 'image/png', '\x89504e470d0a1a0a');          -- PNG header

-- Insert using decode function
INSERT INTO file_storage (filename, content_type, file_data)
VALUES ('data.bin', 'application/octet-stream', 
        decode('deadbeef', 'hex'));

-- Binary operations
SELECT 
    filename,
    LENGTH(file_data) as size_bytes,
    encode(file_data, 'hex') as hex_representation,
    encode(file_data, 'base64') as base64_representation,
    convert_from(file_data, 'UTF8') as as_text  -- If it's text data
FROM file_storage;

-- Binary functions
SELECT 
    filename,
    MD5(file_data) as md5_hash,
    SHA256(file_data) as sha256_hash,
    get_byte(file_data, 0) as first_byte,
    set_byte(file_data, 0, 255) as modified_data
FROM file_storage;

-- Substring operations on binary data
SELECT 
    filename,
    substring(file_data FROM 1 FOR 4) as first_4_bytes,
    position('\x0a'::bytea IN file_data) as newline_position
FROM file_storage;

-- Large object (LO) alternative for very large files
SELECT lo_create(0) as loid;  -- Returns large object ID
-- Use lo_import, lo_export for file operations


-- ## UUIDs
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- For gen_random_uuid()

-- UUID examples
CREATE TABLE user_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID DEFAULT uuid_generate_v4(),  -- Alternative method
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert with automatic UUID generation
INSERT INTO user_accounts (username, email)
VALUES 
    ('john_doe', 'john@example.com'),
    ('jane_smith', 'jane@example.com');

-- Insert with explicit UUID
INSERT INTO user_accounts (id, username, email)
VALUES ('550e8400-e29b-41d4-a716-446655440000', 'admin', 'admin@example.com');

-- UUID generation functions
SELECT 
    gen_random_uuid() as random_uuid,
    uuid_generate_v1() as time_based_uuid,
    uuid_generate_v4() as random_v4_uuid,
    uuid_generate_v1mc() as time_based_mac_uuid;

-- UUID operations
SELECT 
    id,
    id::TEXT as uuid_as_text,
    LENGTH(id::TEXT) as uuid_length,
    SUBSTRING(id::TEXT FROM 1 FOR 8) as first_segment
FROM user_accounts;

-- Related tables with UUID foreign keys
CREATE TABLE user_profiles (
    profile_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_account_id UUID REFERENCES user_accounts(id),
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    bio TEXT
);

-- Join tables with UUIDs
SELECT 
    ua.username,
    ua.email,
    up.first_name,
    up.last_name
FROM user_accounts ua
LEFT JOIN user_profiles up ON ua.id = up.user_account_id;

-- UUID indexing (automatically created for PRIMARY KEY)
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_account_id);

-- Convert between UUID formats
SELECT 
    id,
    REPLACE(id::TEXT, '-', '') as uuid_without_dashes,
    '{' || id::TEXT || '}' as uuid_with_braces
FROM user_accounts;


-- ## Boolean Types
-- Boolean examples
CREATE TABLE feature_flags (
    id SERIAL PRIMARY KEY,
    feature_name VARCHAR(100),
    is_enabled BOOLEAN DEFAULT FALSE,
    is_beta BOOLEAN,
    is_deprecated BOOLEAN DEFAULT FALSE,
    user_configurable BOOLEAN NOT NULL DEFAULT TRUE
);

-- Insert boolean data
INSERT INTO feature_flags (feature_name, is_enabled, is_beta, is_deprecated)
VALUES 
    ('dark_mode', TRUE, FALSE, FALSE),
    ('new_dashboard', FALSE, TRUE, FALSE),
    ('old_api', FALSE, NULL, TRUE),  -- NULL means unknown/not applicable
    ('premium_feature', 't', 'f', 'f');  -- Alternative syntax

-- Boolean queries
SELECT 
    feature_name,
    is_enabled,
    is_beta,
    CASE 
        WHEN is_enabled THEN 'Active'
        WHEN is_enabled IS FALSE THEN 'Inactive'
        ELSE 'Unknown'
    END as status
FROM feature_flags;

-- Boolean operations
SELECT 
    feature_name,
    is_enabled AND NOT is_deprecated as should_show,
    is_enabled OR is_beta as in_any_environment,
    is_beta IS NULL as beta_status_unknown,
    COALESCE(is_beta, FALSE) as beta_with_default
FROM feature_flags;

-- Three-valued logic examples
CREATE TABLE user_preferences (
    user_id INTEGER PRIMARY KEY,
    email_notifications BOOLEAN,  -- TRUE, FALSE, or NULL (not set)
    sms_notifications BOOLEAN,
    push_notifications BOOLEAN DEFAULT TRUE
);

INSERT INTO user_preferences (user_id, email_notifications, sms_notifications)
VALUES 
    (1, TRUE, FALSE),
    (2, FALSE, NULL),    -- SMS preference not set
    (3, NULL, TRUE);     -- Email preference not set

-- Handle NULL booleans
SELECT 
    user_id,
    email_notifications,
    CASE 
        WHEN email_notifications IS TRUE THEN 'Enabled'
        WHEN email_notifications IS FALSE THEN 'Disabled'
        WHEN email_notifications IS NULL THEN 'Not Set'
    END as email_status,
    COALESCE(sms_notifications, FALSE) as sms_with_default
FROM user_preferences;

-- Boolean aggregations
SELECT 
    COUNT(*) as total_features,
    COUNT(*) FILTER (WHERE is_enabled) as enabled_count,
    BOOL_AND(user_configurable) as all_user_configurable,
    BOOL_OR(is_deprecated) as any_deprecated
FROM feature_flags;


-- ## Enums
-- Create enum types
CREATE TYPE order_status AS ENUM (
    'pending',
    'confirmed', 
    'processing',
    'shipped',
    'delivered',
    'cancelled'
);

CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high', 'urgent');

CREATE TYPE user_role AS ENUM ('guest', 'user', 'moderator', 'admin', 'superuser');

-- Use enums in table
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER,
    status order_status DEFAULT 'pending',
    priority priority_level DEFAULT 'medium',
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50),
    role user_role DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert enum data
INSERT INTO orders (customer_id, status, priority, notes)
VALUES 
    (101, 'confirmed', 'high', 'Rush order'),
    (102, 'processing', 'low', 'Regular order'),
    (103, 'shipped', 'urgent', 'Express delivery');

INSERT INTO users (username, role)
VALUES 
    ('john_doe', 'user'),
    ('admin_user', 'admin'),
    ('mod_alice', 'moderator');

-- Query with enums
SELECT 
    id,
    customer_id,
    status,
    priority,
    status::TEXT as status_text  -- Convert enum to text
FROM orders
WHERE status IN ('confirmed', 'processing', 'shipped')
ORDER BY 
    priority DESC,  -- Enums have natural ordering
    order_date;

-- Enum comparisons (based on definition order)
SELECT 
    username,
    role,
    role > 'user' as is_elevated_user,
    role = 'admin' as is_admin
FROM users
ORDER BY role;  -- Orders by enum definition sequence

-- View enum values
SELECT 
    enumlabel,
    enumsortorder
FROM pg_enum 
WHERE enumtypid = 'order_status'::regtype
ORDER BY enumsortorder;

-- Add new enum value
ALTER TYPE order_status ADD VALUE 'refunded' AFTER 'cancelled';

-- Enum with functions
SELECT 
    status,
    COUNT(*) as order_count,
    CASE status
        WHEN 'pending' THEN 1
        WHEN 'confirmed' THEN 2
        WHEN 'processing' THEN 3
        WHEN 'shipped' THEN 4
        WHEN 'delivered' THEN 5
        ELSE 0
    END as status_priority
FROM orders
GROUP BY status
ORDER BY status_priority;

-- Convert between enum and text
SELECT 
    'confirmed'::order_status as text_to_enum,
    'high'::priority_level::TEXT as enum_to_text;


-- ## Timestamps
-- Timestamp types
CREATE TABLE event_log (
    id SERIAL PRIMARY KEY,
    event_name VARCHAR(100),
    created_timestamp TIMESTAMP,                    -- No timezone info
    created_timestamptz TIMESTAMP WITH TIME ZONE,  -- Stores timezone
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    scheduled_for TIMESTAMP WITH TIME ZONE,
    duration INTERVAL
);

-- Insert timestamp data
INSERT INTO event_log (
    event_name, 
    created_timestamp, 
    created_timestamptz, 
    scheduled_for,
    duration
) VALUES 
    ('User Login', '2023-12-25 14:30:00', '2023-12-25 14:30:00-05:00', 
     '2023-12-26 09:00:00+00:00', '1 hour 30 minutes'),
    ('Data Backup', CURRENT_TIMESTAMP, NOW(), 
     NOW() + INTERVAL '1 day', '2 hours 15 minutes'),
    ('System Maintenance', '2023-12-31 23:59:59', '2023-12-31 23:59:59+00:00',
     '2024-01-01 02:00:00+00:00', '3 hours');

-- Timestamp functions and operations
SELECT 
    event_name,
    created_timestamp,
    created_timestamptz,
    EXTRACT(YEAR FROM created_timestamp) as year,
    EXTRACT(MONTH FROM created_timestamp) as month,
    EXTRACT(DAY FROM created_timestamp) as day,
    EXTRACT(HOUR FROM created_timestamp) as hour,
    EXTRACT(EPOCH FROM created_timestamp) as unix_timestamp
FROM event_log;

-- Date arithmetic
SELECT 
    event_name,
    scheduled_for,
    scheduled_for + INTERVAL '1 week' as one_week_later,
    scheduled_for - INTERVAL '2 days' as two_days_before,
    AGE(scheduled_for, created_timestamptz) as time_until_event,
    duration,
    scheduled_for + duration as estimated_end_time
FROM event_log;

-- Formatting timestamps
SELECT 
    event_name,
    TO_CHAR(created_timestamp, 'YYYY-MM-DD HH24:MI:SS') as formatted_timestamp,
    TO_CHAR(created_timestamptz, 'Day, Month DD, YYYY at HH12:MI AM') as friendly_format,
    TO_CHAR(created_timestamp, 'YYYY-MM-DD"T"HH24:MI:SS') as iso_format
FROM event_log;

-- Timestamp ranges and comparisons
SELECT 
    event_name,
    created_timestamp,
    CASE 
        WHEN created_timestamp > NOW() - INTERVAL '1 hour' THEN 'Recent'
        WHEN created_timestamp > NOW() - INTERVAL '1 day' THEN 'Today'
        WHEN created_timestamp > NOW() - INTERVAL '1 week' THEN 'This Week'
        ELSE 'Older'
    END as recency
FROM event_log
WHERE created_timestamp BETWEEN '2023-12-01' AND '2023-12-31 23:59:59'
ORDER BY created_timestamp DESC;

-- Generate series of timestamps
SELECT 
    generate_series(
        '2023-12-01 00:00:00'::TIMESTAMP,
        '2023-12-07 23:59:59'::TIMESTAMP,
        '1 day'::INTERVAL
    ) as daily_series;

-- Working with different precisions
CREATE TABLE precise_timing (
    id SERIAL PRIMARY KEY,
    timestamp_0 TIMESTAMP(0),  -- No fractional seconds
    timestamp_3 TIMESTAMP(3),  -- Milliseconds
    timestamp_6 TIMESTAMP(6)   -- Microseconds
);

INSERT INTO precise_timing (timestamp_0, timestamp_3, timestamp_6)
VALUES (NOW(), NOW(), NOW());

SELECT 
    timestamp_0,
    timestamp_3, 
    timestamp_6,
    EXTRACT(MICROSECONDS FROM timestamp_6) as microseconds
FROM precise_timing;


-- ## Dates and Times
-- Date and time types
CREATE TABLE scheduling_system (
    id SERIAL PRIMARY KEY,
    event_date DATE,
    event_time TIME,
    event_timestamp TIMESTAMP,
    event_timestamptz TIMESTAMP WITH TIME ZONE,
    duration INTERVAL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert various date/time formats
INSERT INTO scheduling_system (
    event_date, 
    event_time, 
    event_timestamp, 
    event_timestamptz,
    duration
) VALUES 
    ('2023-12-25', '14:30:00', '2023-12-25 14:30:00', '2023-12-25 14:30:00+00:00', '2 hours'),
    ('December 31, 2023', '23:59', '2023-12-31 23:59:59', NOW() + INTERVAL '1 week', '30 minutes'),
    (CURRENT_DATE, CURRENT_TIME, NOW(), NOW(), '1 day 2 hours 30 minutes');

-- Date arithmetic and functions
SELECT 
    event_date,
    event_date + INTERVAL '30 days' as thirty_days_later,
    event_date - INTERVAL '1 week' as one_week_before,
    event_date + 7 as seven_days_later,  -- Add days directly
    EXTRACT(DOW FROM event_date) as day_of_week,  -- 0=Sunday, 6=Saturday
    EXTRACT(DOY FROM event_date) as day_of_year,
    EXTRACT(WEEK FROM event_date) as week_number
FROM scheduling_system;

-- Date formatting and parsing
SELECT 
    event_date,
    TO_CHAR(event_date, 'Day, Month DD, YYYY') as formatted_date,
    TO_CHAR(event_date, 'FMDay, FMMonth FMDD, YYYY') as formatted_no_padding,
    TO_CHAR(event_date, 'YYYY-MM-DD') as iso_date,
    TO_CHAR(event_date, 'MM/DD/YYYY') as us_format,
    TO_CHAR(event_date, 'DD/MM/YYYY') as european_format
FROM scheduling_system;

-- Time operations
SELECT 
    event_time,
    event_time + INTERVAL '2 hours 30 minutes' as later_time,
    event_time - INTERVAL '45 minutes' as earlier_time,
    EXTRACT(HOUR FROM event_time) as hour_24,
    TO_CHAR(event_time, 'HH12:MI AM') as hour_12_format,
    DATE_TRUNC('hour', event_timestamp) as truncated_to_hour
FROM scheduling_system;

-- Generate date series for reporting
SELECT 
    date_series,
    TO_CHAR(date_series, 'Day') as day_name,
    EXTRACT(DOW FROM date_series) as day_number,
    CASE EXTRACT(DOW FROM date_series)
        WHEN 0 THEN 'Weekend'
        WHEN 6 THEN 'Weekend' 
        ELSE 'Weekday'
    END as day_type
FROM generate_series(
    '2023-12-01'::DATE,
    '2023-12-31'::DATE,
    '1 day'::INTERVAL
) as date_series;

-- Age calculations
CREATE TABLE people (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    birth_date DATE,
    hire_date DATE
);

INSERT INTO people (name, birth_date, hire_date) VALUES
    ('Alice Johnson', '1985-06-15', '2020-03-01'),
    ('Bob Smith', '1992-12-03', '2021-08-15'),
    ('Carol Davis', '1978-09-22', '2019-01-10');

SELECT 
    name,
    birth_date,
    AGE(birth_date) as current_age,
    AGE('2023-12-25', birth_date) as age_on_christmas,
    hire_date,
    AGE(hire_date) as years_employed,
    EXTRACT(YEAR FROM AGE(birth_date)) as age_years
FROM people;

-- Date ranges and overlaps
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    event_name VARCHAR(100),
    start_date DATE,
    end_date DATE
);

INSERT INTO events (event_name, start_date, end_date) VALUES
    ('Summer Campaign', '2023-06-01', '2023-08-31'),
    ('Holiday Sale', '2023-12-01', '2024-01-15'),
    ('Spring Launch', '2024-03-15', '2024-05-30');

-- Find overlapping date ranges
SELECT 
    a.event_name as event_a,
    b.event_name as event_b,
    GREATEST(a.start_date, b.start_date) as overlap_start,
    LEAST(a.end_date, b.end_date) as overlap_end,
    CASE 
        WHEN a.end_date < b.start_date OR b.end_date < a.start_date 
        THEN 'No Overlap'
        ELSE 'Overlaps'
    END as overlap_status
FROM events a
CROSS JOIN events b
WHERE a.id != b.id AND a.id < b.id;

-- Working with fiscal years and quarters
SELECT 
    event_date,
    CASE 
        WHEN EXTRACT(MONTH FROM event_date) >= 4 
        THEN EXTRACT(YEAR FROM event_date)
        ELSE EXTRACT(YEAR FROM event_date) - 1
    END as fiscal_year,  -- Assuming fiscal year starts April 1
    
    CASE 
        WHEN EXTRACT(MONTH FROM event_date) IN (4,5,6) THEN 'Q1'
        WHEN EXTRACT(MONTH FROM event_date) IN (7,8,9) THEN 'Q2'
        WHEN EXTRACT(MONTH FROM event_date) IN (10,11,12) THEN 'Q3'
        ELSE 'Q4'
    END as fiscal_quarter
FROM scheduling_system;

-- Last day of month calculations
SELECT 
    event_date,
    DATE_TRUNC('month', event_date) as first_of_month,
    DATE_TRUNC('month', event_date) + INTERVAL '1 month' - INTERVAL '1 day' as last_of_month,
    DATE_TRUNC('week', event_date) as start_of_week,
    DATE_TRUNC('year', event_date) as start_of_year
FROM scheduling_system;
