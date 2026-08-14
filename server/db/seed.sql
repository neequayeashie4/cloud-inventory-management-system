-- Realistic demo data for screenshots/video — run AFTER db/seed-users.js
-- (stock_movements.user_id needs a real user row to reference).
-- Usage: mysql -u <user> -p <db_name> < db/seed.sql

-- 5 categories
INSERT INTO categories (name, description) VALUES
  ('Beverages', 'Soft drinks, juices, water and other drinkable goods'),
  ('Grains & Cereals', 'Rice, maize, wheat flour and related staples'),
  ('Dairy', 'Milk, cheese, yoghurt and other dairy products'),
  ('Household Supplies', 'Cleaning agents, paper products and general home goods'),
  ('Personal Care', 'Soap, toothpaste, cosmetics and hygiene products');

-- 6 suppliers
INSERT INTO suppliers (name, contact_person, email, phone, address) VALUES
  ('Golden Harvest Distributors', 'Kwame Owusu', 'orders@goldenharvest.gh', '+233-24-555-0101', 'Spintex Road, Accra'),
  ('BlueWave Beverages Ltd', 'Ama Serwaa', 'sales@bluewave.gh', '+233-20-555-0102', 'Tema Industrial Area, Tema'),
  ('Nkrumah Dairy Cooperative', 'Yaw Boateng', 'info@nkrumahdairy.gh', '+233-27-555-0103', 'Kumasi Road, Kumasi'),
  ('CleanHome Supplies Co', 'Efua Mensah', 'contact@cleanhome.gh', '+233-26-555-0104', 'Ring Road, Accra'),
  ('Savannah Grains Ltd', 'Ibrahim Alhassan', 'sales@savannahgrains.gh', '+233-24-555-0105', 'Tamale Central Market, Tamale'),
  ('PureCare Personal Products', 'Abena Asante', 'orders@purecare.gh', '+233-20-555-0106', 'Osu Oxford Street, Accra');

-- 25 products
INSERT INTO products (sku, name, description, category_id, supplier_id, unit_price, quantity, reorder_level) VALUES
  ('BEV-001', 'Bottled Water 500ml (Pack of 24)', 'Purified drinking water', 1, 2, 36.00, 120, 20),
  ('BEV-002', 'Orange Juice 1L', '100% natural orange juice', 1, 2, 18.50, 60, 15),
  ('BEV-003', 'Cola Soft Drink 350ml (Pack of 12)', 'Carbonated cola drink', 1, 2, 42.00, 8, 10),
  ('BEV-004', 'Ginger Beer 500ml', 'Traditional spiced ginger beer', 1, 2, 12.00, 45, 10),
  ('BEV-005', 'Pineapple Juice 1L', 'Cold-pressed pineapple juice', 1, 2, 20.00, 30, 10),
  ('GRN-001', 'Long Grain Rice 25kg', 'Premium parboiled rice', 2, 5, 320.00, 40, 8),
  ('GRN-002', 'Maize Flour 5kg', 'Finely milled maize flour', 2, 5, 45.00, 65, 15),
  ('GRN-003', 'Wheat Flour 5kg', 'All-purpose wheat flour', 2, 5, 48.00, 5, 12),
  ('GRN-004', 'Millet 10kg', 'Whole grain millet', 2, 5, 90.00, 25, 10),
  ('GRN-005', 'Brown Rice 10kg', 'Unpolished brown rice', 2, 5, 135.00, 18, 10),
  ('DRY-001', 'Fresh Milk 1L', 'Pasteurised whole milk', 3, 3, 15.00, 50, 15),
  ('DRY-002', 'Cheddar Cheese 200g', 'Aged cheddar block', 3, 3, 38.00, 22, 8),
  ('DRY-003', 'Natural Yoghurt 500g', 'Unsweetened plain yoghurt', 3, 3, 22.00, 3, 10),
  ('DRY-004', 'Butter 250g', 'Salted dairy butter', 3, 3, 28.00, 34, 10),
  ('DRY-005', 'Evaporated Milk 400g (Tin)', 'Unsweetened evaporated milk', 3, 3, 9.50, 80, 20),
  ('HH-001', 'Liquid Dish Soap 750ml', 'Grease-cutting dish soap', 4, 4, 14.00, 55, 15),
  ('HH-002', 'Laundry Detergent 2kg', 'Powder laundry detergent', 4, 4, 55.00, 27, 10),
  ('HH-003', 'Toilet Tissue (Pack of 12)', '2-ply soft toilet tissue', 4, 4, 32.00, 6, 12),
  ('HH-004', 'Bleach 1L', 'Household disinfectant bleach', 4, 4, 16.50, 40, 10),
  ('HH-005', 'Kitchen Towels (Pack of 4)', 'Absorbent paper towels', 4, 4, 24.00, 19, 10),
  ('PC-001', 'Antibacterial Soap Bar (Pack of 3)', 'Moisturising antibacterial soap', 5, 6, 12.50, 70, 15),
  ('PC-002', 'Toothpaste 150ml', 'Fluoride toothpaste with mint', 5, 6, 11.00, 48, 15),
  ('PC-003', 'Shampoo 400ml', 'Nourishing daily shampoo', 5, 6, 26.00, 4, 10),
  ('PC-004', 'Body Lotion 500ml', 'Cocoa butter body lotion', 5, 6, 29.50, 33, 10),
  ('PC-005', 'Hand Sanitizer 250ml', '70% alcohol hand sanitizer', 5, 6, 15.00, 60, 15);

-- 40 stock movements, referencing the demo admin (id 1) / staff (id 2)
-- accounts created by db/seed-users.js. Adjust IDs if your users table
-- differs.
INSERT INTO stock_movements (product_id, user_id, type, quantity, reference, note, created_at) VALUES
  (1, 1, 'IN', 200, 'PO-1001', 'Initial stock intake', DATE_SUB(NOW(), INTERVAL 20 DAY)),
  (1, 2, 'OUT', 80, 'SO-2001', 'Retail order fulfilment', DATE_SUB(NOW(), INTERVAL 18 DAY)),
  (2, 1, 'IN', 90, 'PO-1002', 'Initial stock intake', DATE_SUB(NOW(), INTERVAL 20 DAY)),
  (2, 2, 'OUT', 30, 'SO-2002', 'Retail order fulfilment', DATE_SUB(NOW(), INTERVAL 17 DAY)),
  (3, 1, 'IN', 24, 'PO-1003', 'Initial stock intake', DATE_SUB(NOW(), INTERVAL 20 DAY)),
  (3, 2, 'OUT', 16, 'SO-2003', 'Wholesale order', DATE_SUB(NOW(), INTERVAL 15 DAY)),
  (4, 1, 'IN', 60, 'PO-1004', 'Initial stock intake', DATE_SUB(NOW(), INTERVAL 20 DAY)),
  (4, 2, 'OUT', 15, 'SO-2004', 'Retail order fulfilment', DATE_SUB(NOW(), INTERVAL 14 DAY)),
  (5, 1, 'IN', 40, 'PO-1005', 'Initial stock intake', DATE_SUB(NOW(), INTERVAL 20 DAY)),
  (5, 2, 'OUT', 10, 'SO-2005', 'Retail order fulfilment', DATE_SUB(NOW(), INTERVAL 13 DAY)),
  (6, 1, 'IN', 50, 'PO-1006', 'Initial stock intake', DATE_SUB(NOW(), INTERVAL 19 DAY)),
  (6, 2, 'OUT', 10, 'SO-2006', 'Wholesale order', DATE_SUB(NOW(), INTERVAL 12 DAY)),
  (7, 1, 'IN', 80, 'PO-1007', 'Initial stock intake', DATE_SUB(NOW(), INTERVAL 19 DAY)),
  (7, 2, 'OUT', 15, 'SO-2007', 'Retail order fulfilment', DATE_SUB(NOW(), INTERVAL 11 DAY)),
  (8, 1, 'IN', 30, 'PO-1008', 'Initial stock intake', DATE_SUB(NOW(), INTERVAL 19 DAY)),
  (8, 2, 'OUT', 25, 'SO-2008', 'Wholesale order', DATE_SUB(NOW(), INTERVAL 10 DAY)),
  (9, 1, 'IN', 35, 'PO-1009', 'Initial stock intake', DATE_SUB(NOW(), INTERVAL 18 DAY)),
  (9, 2, 'OUT', 10, 'SO-2009', 'Retail order fulfilment', DATE_SUB(NOW(), INTERVAL 9 DAY)),
  (10, 1, 'IN', 25, 'PO-1010', 'Initial stock intake', DATE_SUB(NOW(), INTERVAL 18 DAY)),
  (10, 2, 'OUT', 7, 'SO-2010', 'Retail order fulfilment', DATE_SUB(NOW(), INTERVAL 8 DAY)),
  (11, 1, 'IN', 70, 'PO-1011', 'Initial stock intake', DATE_SUB(NOW(), INTERVAL 18 DAY)),
  (11, 2, 'OUT', 20, 'SO-2011', 'Retail order fulfilment', DATE_SUB(NOW(), INTERVAL 7 DAY)),
  (12, 1, 'IN', 30, 'PO-1012', 'Initial stock intake', DATE_SUB(NOW(), INTERVAL 17 DAY)),
  (12, 2, 'OUT', 8, 'SO-2012', 'Retail order fulfilment', DATE_SUB(NOW(), INTERVAL 6 DAY)),
  (13, 1, 'IN', 15, 'PO-1013', 'Initial stock intake', DATE_SUB(NOW(), INTERVAL 17 DAY)),
  (13, 2, 'OUT', 12, 'SO-2013', 'Retail order fulfilment', DATE_SUB(NOW(), INTERVAL 5 DAY)),
  (14, 1, 'IN', 40, 'PO-1014', 'Initial stock intake', DATE_SUB(NOW(), INTERVAL 17 DAY)),
  (14, 2, 'OUT', 6, 'SO-2014', 'Retail order fulfilment', DATE_SUB(NOW(), INTERVAL 4 DAY)),
  (15, 1, 'IN', 100, 'PO-1015', 'Initial stock intake', DATE_SUB(NOW(), INTERVAL 16 DAY)),
  (15, 2, 'OUT', 20, 'SO-2015', 'Wholesale order', DATE_SUB(NOW(), INTERVAL 3 DAY)),
  (16, 1, 'IN', 65, 'PO-1016', 'Initial stock intake', DATE_SUB(NOW(), INTERVAL 16 DAY)),
  (16, 2, 'OUT', 10, 'SO-2016', 'Retail order fulfilment', DATE_SUB(NOW(), INTERVAL 2 DAY)),
  (17, 1, 'IN', 35, 'PO-1017', 'Initial stock intake', DATE_SUB(NOW(), INTERVAL 16 DAY)),
  (17, 2, 'OUT', 8, 'SO-2017', 'Retail order fulfilment', DATE_SUB(NOW(), INTERVAL 1 DAY)),
  (18, 1, 'IN', 20, 'PO-1018', 'Initial stock intake', DATE_SUB(NOW(), INTERVAL 15 DAY)),
  (18, 2, 'OUT', 14, 'SO-2018', 'Wholesale order', DATE_SUB(NOW(), INTERVAL 1 DAY)),
  (19, 1, 'IN', 50, 'PO-1019', 'Initial stock intake', DATE_SUB(NOW(), INTERVAL 15 DAY)),
  (19, 2, 'OUT', 10, 'SO-2019', 'Retail order fulfilment', NOW()),
  (20, 1, 'IN', 25, 'PO-1020', 'Initial stock intake', DATE_SUB(NOW(), INTERVAL 15 DAY)),
  (20, 2, 'OUT', 6, 'SO-2020', 'Retail order fulfilment', NOW());
