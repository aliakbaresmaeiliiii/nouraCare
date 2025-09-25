-- Seed data for Forum Categories
-- This data will populate the forum with initial categories

INSERT INTO categories (id, name, description, slug, color, icon, `order`, is_active, created_at, updated_at) VALUES
-- Pregnancy-related categories
(UUID(), 'Pregnancy Journey', 'Share your pregnancy experiences, milestones, and journey from conception to delivery', 'pregnancy-journey', '#FF6B6B', 'pregnancy', 1, TRUE, NOW(), NOW()),
(UUID(), 'First Trimester', 'Early pregnancy discussions, symptoms, and support for weeks 1-12', 'first-trimester', '#FF9F43', 'baby-bump', 2, TRUE, NOW(), NOW()),
(UUID(), 'Second Trimester', 'Mid-pregnancy topics, baby development, and preparation', 'second-trimester', '#10AC84', 'baby-heartbeat', 3, TRUE, NOW(), NOW()),
(UUID(), 'Third Trimester', 'Late pregnancy, labor preparation, and final weeks', 'third-trimester', '#0ABDE3', 'baby-carriage', 4, TRUE, NOW(), NOW()),

-- Parenting categories
(UUID(), 'Newborn Care', 'Tips and support for caring for your newborn (0-3 months)', 'newborn-care', '#54A0FF', 'baby-bottle', 5, TRUE, NOW(), NOW()),
(UUID(), 'Infant Development', 'Milestones and development for babies 3-12 months', 'infant-development', '#5F27CD', 'baby-rattle', 6, TRUE, NOW(), NOW()),
(UUID(), 'Toddler Parenting', 'Parenting challenges and joys for 1-3 year olds', 'toddler-parenting', '#FF9FF3', 'baby-walker', 7, TRUE, NOW(), NOW()),

-- Health and Wellness
(UUID(), 'Nutrition & Diet', 'Healthy eating during pregnancy and for your family', 'nutrition-diet', '#00D2D3', 'nutrition', 8, TRUE, NOW(), NOW()),
(UUID(), 'Mental Health', 'Emotional wellbeing, stress management, and self-care', 'mental-health', '#FF6B9D', 'mental-health', 9, TRUE, NOW(), NOW()),
(UUID(), 'Fitness & Exercise', 'Safe exercise routines and physical activity during pregnancy', 'fitness-exercise', '#1DD1A1', 'fitness', 10, TRUE, NOW(), NOW()),

-- Practical categories
(UUID(), 'Baby Gear & Products', 'Reviews and recommendations for baby products and gear', 'baby-gear-products', '#F368E0', 'baby-gear', 11, TRUE, NOW(), NOW()),
(UUID(), 'Breastfeeding & Formula', 'Feeding support, tips, and troubleshooting', 'breastfeeding-formula', '#FF9F43', 'breastfeeding', 12, TRUE, NOW(), NOW()),
(UUID(), 'Sleep Solutions', 'Sleep tips and challenges for parents and babies', 'sleep-solutions', '#54A0FF', 'sleep', 13, TRUE, NOW(), NOW()),

-- Community and Support
(UUID(), 'Relationships & Family', 'Navigating relationships during pregnancy and parenthood', 'relationships-family', '#5F27CD', 'family', 14, TRUE, NOW(), NOW()),
(UUID(), 'Work & Career Balance', 'Balancing work, career, and family life', 'work-career-balance', '#00D2D3', 'work', 15, TRUE, NOW(), NOW()),
(UUID(), 'Community Support', 'General support, advice, and community discussions', 'community-support', '#FF6B9D', 'community', 16, TRUE, NOW(), NOW());

-- Sample Topics for each category (optional - can be created by users)
-- INSERT INTO topics (id, title, description, category_id, created_by, created_at, updated_at) VALUES
-- (UUID(), 'First Trimester Nutrition Tips', 'What foods are best during the first trimester? Share your experiences!', (SELECT id FROM categories WHERE slug = 'first-trimester'), 1, NOW(), NOW()),
-- (UUID(), 'Dealing with Morning Sickness', 'Tips and remedies for managing morning sickness', (SELECT id FROM categories WHERE slug = 'first-trimester'), 1, NOW(), NOW()),
-- (UUID(), 'Baby Registry Must-Haves', 'What items are essential for your baby registry?', (SELECT id FROM categories WHERE slug = 'baby-gear-products'), 1, NOW(), NOW());
