-- E-commerce Sample Data
-- Insert realistic test data for development and testing

-- Insert categories
INSERT INTO categories (name, description) VALUES
('Electronics', 'Electronic devices and gadgets'),
('Books', 'Physical and digital books'),
('Clothing', 'Apparel and fashion items');

-- Insert products
INSERT INTO products (name, price, category_id) VALUES
('Laptop Pro', 1299.99, 1),
('Wireless Mouse', 29.99, 1),
('USB-C Cable', 12.99, 1),
('The Pragmatic Programmer', 49.99, 2),
('Clean Code', 39.99, 2),
('Cotton T-Shirt', 19.99, 3),
('Denim Jeans', 79.99, 3);

-- Insert customers
INSERT INTO customers (name, email) VALUES
('John Doe', 'john.doe@example.com'),
('Jane Smith', 'jane.smith@example.com'),
('Bob Johnson', 'bob.johnson@example.com');

-- Insert orders
INSERT INTO orders (customer_id, created_at, total) VALUES
(1, CURRENT_TIMESTAMP - INTERVAL '5 days', 1342.97),
(2, CURRENT_TIMESTAMP - INTERVAL '3 days', 129.97),
(3, CURRENT_TIMESTAMP - INTERVAL '1 day', 99.98);

-- Insert order items
INSERT INTO order_items (order_id, product_id, quantity, price) VALUES
(1, 1, 1, 1299.99),
(1, 2, 1, 29.99),
(1, 3, 1, 12.99),
(2, 4, 1, 49.99),
(2, 5, 1, 39.99),
(2, 6, 1, 19.99),
(3, 7, 1, 79.99),
(3, 6, 1, 19.99);
