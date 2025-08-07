-- Insertar productos de ejemplo
INSERT INTO products (name, description, price, stock, category, min_stock) VALUES
('Laptop HP', 'Laptop HP Pavilion 15.6"', 850000, 5, 'Electrónicos', 2),
('Mouse Logitech', 'Mouse inalámbrico Logitech MX Master', 45000, 15, 'Accesorios', 5),
('Teclado Mecánico', 'Teclado mecánico RGB', 75000, 8, 'Accesorios', 3),
('Monitor Samsung', 'Monitor Samsung 24" Full HD', 180000, 3, 'Electrónicos', 1),
('Auriculares Sony', 'Auriculares inalámbricos Sony WH-1000XM4', 120000, 6, 'Audio', 2)
ON CONFLICT DO NOTHING;
