-- Script completo para configurar la base de datos de inventario
-- Ejecutar este script completo en Supabase SQL Editor

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Eliminar tablas existentes si existen (para reinstalación limpia)
DROP TABLE IF EXISTS balance_transfers CASCADE;
DROP TABLE IF EXISTS cash_movements CASCADE;
DROP TABLE IF EXISTS sales CASCADE;
DROP TABLE IF EXISTS products CASCADE;

-- Crear tabla de productos
CREATE TABLE products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    category VARCHAR(100),
    min_stock INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de ventas
CREATE TABLE sales (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    product_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de movimientos de caja
CREATE TABLE cash_movements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
    amount DECIMAL(10,2) NOT NULL,
    description TEXT NOT NULL,
    movement_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de traslados de saldos
CREATE TABLE balance_transfers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    from_date DATE NOT NULL,
    to_date DATE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    transfer_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar performance
CREATE INDEX idx_sales_date ON sales(sale_date);
CREATE INDEX idx_sales_product_id ON sales(product_id);
CREATE INDEX idx_cash_movements_date ON cash_movements(movement_date);
CREATE INDEX idx_products_category ON products(category);

-- Configurar Row Level Security (RLS)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE balance_transfers ENABLE ROW LEVEL SECURITY;

-- Crear políticas para permitir todas las operaciones (para desarrollo)
CREATE POLICY "Enable all operations for products" ON products FOR ALL USING (true);
CREATE POLICY "Enable all operations for sales" ON sales FOR ALL USING (true);
CREATE POLICY "Enable all operations for cash_movements" ON cash_movements FOR ALL USING (true);
CREATE POLICY "Enable all operations for balance_transfers" ON balance_transfers FOR ALL USING (true);

-- Insertar datos de ejemplo
INSERT INTO products (name, description, price, stock, category, min_stock) VALUES
('Laptop HP', 'Laptop HP Pavilion 15.6"', 850000, 5, 'Electrónicos', 2),
('Mouse Logitech', 'Mouse inalámbrico Logitech MX Master', 45000, 15, 'Accesorios', 5),
('Teclado Mecánico', 'Teclado mecánico RGB', 75000, 8, 'Accesorios', 3),
('Monitor Samsung', 'Monitor Samsung 24" Full HD', 180000, 3, 'Electrónicos', 1),
('Auriculares Sony', 'Auriculares inalámbricos Sony WH-1000XM4', 120000, 6, 'Audio', 2);

-- Mensaje de confirmación
SELECT 'Base de datos configurada correctamente. Todas las tablas han sido creadas.' as status;
