-- Update all exam categories pricing from 1000 to 2500
UPDATE exam_categories
SET monthly_price = 2500
WHERE monthly_price = 1000;

-- Update exam_settings payment amount
UPDATE exam_settings
SET payment_amount = 2500
WHERE payment_amount = 1000;

-- Verify the changes
SELECT id, name, monthly_price FROM exam_categories;
SELECT payment_amount FROM exam_settings LIMIT 1;
