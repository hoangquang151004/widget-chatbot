# Common SQL Patterns for SaaS

Dưới đây là các mẫu truy vấn SQL phổ biến được tối ưu cho hệ thống đa tenant.

## 1. Truy vấn Doanh thu (Revenue)

```sql
SELECT 
    SUM(o.total_amount) as total_revenue,
    DATE_TRUNC('month', o.created_at) as month
FROM orders o
JOIN users u ON o.user_id = u.id
WHERE o.status = 'completed'
  AND u.department_id = 'DEPT_ID' -- Filter theo role Employee
GROUP BY 2
ORDER BY 2 DESC
LIMIT 100;
```

## 2. Thống kê hiệu suất nhân viên

```sql
SELECT 
    u.name,
    COUNT(t.id) as task_completed
FROM users u
LEFT JOIN tasks t ON u.id = t.assigned_to
WHERE t.status = 'done'
  AND t.completed_at >= NOW() - INTERVAL '30 days'
GROUP BY u.id, u.name
ORDER BY task_completed DESC
LIMIT 50;
```

## 3. Tìm kiếm với điều kiện phức tạp (ILIKE)

```sql
SELECT 
    id, name, email
FROM customers
WHERE (name ILIKE '%keyword%' OR email ILIKE '%keyword%')
  AND tenant_id = 'TENANT_ID'
LIMIT 20;
```
