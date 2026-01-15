-- Interval
CREATE TABLE interval_example (
    id SERIAL PRIMARY KEY,
    interval_value INTERVAL
);

INSERT INTO interval_example (interval_value) VALUES ('1 day');
