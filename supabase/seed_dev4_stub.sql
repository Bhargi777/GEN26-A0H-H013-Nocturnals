-- Stub seed data for Dev 4 E-Governance Demo
-- Real data needs to be integrated into Dev 1's seed by Dev 1.

INSERT INTO admin_requests (code, requester_id, type, purpose, details, status, current_reviewer_role, decided_by, decision_note, document_path)
VALUES 
('AR-000100', 'student_1_id', 'NOC', 'internship', '{"organisationName": "TechCorp", "startDate": "2026-06-01", "endDate": "2026-08-31"}', 'APPROVED', 'office_staff', 'office_staff_1_id', 'Approved for summer internship', 'admin-documents/AR-000100.pdf');
