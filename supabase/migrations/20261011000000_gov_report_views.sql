-- Views for e-governance and service requests reports

CREATE OR REPLACE VIEW gov_service_tickets_summary AS
SELECT 
  status,
  category,
  COUNT(*) as count
FROM service_tickets
GROUP BY status, category;

CREATE OR REPLACE VIEW gov_repeated_issues AS
SELECT 
  room_id,
  category,
  COUNT(*) as issue_count
FROM service_tickets
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY room_id, category
HAVING COUNT(*) >= 3;

CREATE OR REPLACE VIEW gov_admin_requests_summary AS
SELECT 
  type,
  status,
  COUNT(*) as count
FROM admin_requests
GROUP BY type, status;

CREATE OR REPLACE VIEW gov_admin_requests_duration AS
SELECT 
  type,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (decided_at - created_at)) / 86400.0) as median_days
FROM admin_requests
WHERE decided_at IS NOT NULL
GROUP BY type;
