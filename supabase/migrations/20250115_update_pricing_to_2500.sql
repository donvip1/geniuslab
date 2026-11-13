-- Update all exam categories to new pricing: ₦2,500 for 3 months
UPDATE exam_categories
SET monthly_price = 2500
WHERE monthly_price = 1000;

-- Update exam_settings default payment amount
UPDATE exam_settings
SET payment_amount = 2500
WHERE payment_amount = 1000;

-- Add comment explaining the pricing structure
COMMENT ON COLUMN exam_categories.monthly_price IS 'Subscription price in Naira - Currently ₦2,500 for 3 months access';
