CREATE DATABASE IF NOT EXISTS resumeiq_db;
USE resumeiq_db;

CREATE TABLE IF NOT EXISTS resume_analysis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    resume_name VARCHAR(255),
    candidate_name VARCHAR(255),
    profession VARCHAR(255),
    overall_score INT,
    analysis_json JSON,
    questions_json JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS quiz_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    analysis_id INT,
    total_questions INT,
    correct_answers INT,
    wrong_answers INT,
    percentage DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (analysis_id) REFERENCES resume_analysis(id) ON DELETE CASCADE
);
