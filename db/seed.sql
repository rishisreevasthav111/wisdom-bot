-- ==============================================================================
-- Seniors' Wisdom / Senior Signal Exchange
-- Sample Seed Data for PostgreSQL + pgvector
-- ==============================================================================

-- 1. Course Tip: OS xv6 labs (matching Claude screenshot)
INSERT INTO tips (
    id,
    author_id,
    text,
    category,
    course_code,
    course_name,
    professor,
    company,
    author_batch,
    anonymous,
    created_at
) VALUES (
    '9b1c4e7a-e490-449e-b9e7-78921a2c1d34',
    '3f2a8742-cbf1-4ef8-a53d-82d2c129e841',
    'Do all the xv6 labs, they''re half the exam',
    'course',
    'OS',
    'Operating Systems',
    NULL,
    NULL,
    '2023 batch',
    true,
    '2026-11-15 10:42:00+00'
) ON CONFLICT (id) DO NOTHING;

-- 2. Course Tip: OS Galvin Textbook
INSERT INTO tips (
    id,
    author_id,
    text,
    category,
    course_code,
    course_name,
    professor,
    company,
    author_batch,
    anonymous,
    created_at
) VALUES (
    '8c2d5f8b-f501-550f-c0f8-89032b3d2e45',
    '2e1b7631-bae0-3df7-942c-71c1b018d730',
    'Read Galvin chapters 5-9 properly, don''t skip them. End-sem questions are framed straight from the exercises, especially deadlock and paging numericals.',
    'course',
    'OS',
    'Operating Systems',
    'Prof. Meera Iyer',
    NULL,
    '2024 batch',
    false,
    now()
) ON CONFLICT (id) DO NOTHING;

-- 3. Professor Tip: Prof. Deshpande (DBMS)
INSERT INTO tips (
    id,
    author_id,
    text,
    category,
    course_code,
    course_name,
    professor,
    company,
    author_batch,
    anonymous,
    created_at
) VALUES (
    '7b1c4e6a-d380-338d-b8e6-67810a1b0c23',
    '1d0a6520-a9df-2ce6-831b-60b0a907c620',
    'Prof. Deshpande''s lab tests are strictly timed. Focus heavily on complex joins, GROUP BY with HAVING, and write out dependency closure steps for full marks.',
    'professor',
    'DBMS',
    'DBMS',
    'Prof. Anil Deshpande',
    NULL,
    '2025 batch',
    false,
    now()
) ON CONFLICT (id) DO NOTHING;

-- 4. Company Tip: Amazon SDE Placement
INSERT INTO tips (
    id,
    author_id,
    text,
    category,
    course_code,
    course_name,
    professor,
    company,
    author_batch,
    anonymous,
    created_at
) VALUES (
    '6a0b3d59-c27f-227c-a7d5-5670f90a9b12',
    '0c9f541f-98ce-1bd5-720a-5faff8f6b51f',
    'Amazon online assessment focuses heavily on 2 Medium LeetCode problems and the Work Style simulation. Be thorough with STAR format for leadership principles.',
    'company',
    NULL,
    NULL,
    NULL,
    'Amazon',
    '2025 batch',
    true,
    now()
) ON CONFLICT (id) DO NOTHING;

-- 5. Company Tip: Google SWE Placement
INSERT INTO tips (
    id,
    author_id,
    text,
    category,
    course_code,
    course_name,
    professor,
    company,
    author_batch,
    anonymous,
    created_at
) VALUES (
    '5f9a2c48-b16e-116b-96c4-456fe8f98a01',
    '9b8e430e-87bd-0ac4-61f9-4e9ee7e5a40e',
    'Google interviews prioritize communication and edge case handling over speed. Think out loud, clarify constraints first, and write clean modular code.',
    'company',
    NULL,
    NULL,
    NULL,
    'Google',
    '2024 batch',
    false,
    now()
) ON CONFLICT (id) DO NOTHING;
