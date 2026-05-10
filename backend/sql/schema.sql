CREATE DATABASE IF NOT EXISTS __DB_NAME__
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE __DB_NAME__;

CREATE TABLE IF NOT EXISTS roles (
  id_rol INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS puestos (
  id_puesto INT AUTO_INCREMENT PRIMARY KEY,
  puesto VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS empleados (
  id_empleado INT AUTO_INCREMENT PRIMARY KEY,
  nombres VARCHAR(100) NOT NULL,
  apellidos VARCHAR(100) NOT NULL,
  id_puesto INT NOT NULL,
  telefono VARCHAR(20),
  correo VARCHAR(100),
  FOREIGN KEY (id_puesto) REFERENCES puestos(id_puesto)
);

CREATE TABLE IF NOT EXISTS usuarios (
  id_usuario INT AUTO_INCREMENT PRIMARY KEY,
  nombre_usuario VARCHAR(50) NOT NULL UNIQUE,
  correo VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  id_rol INT NOT NULL,
  id_empleado INT,
  activo BOOLEAN DEFAULT TRUE,
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_rol) REFERENCES roles(id_rol),
  FOREIGN KEY (id_empleado) REFERENCES empleados(id_empleado)
);

CREATE TABLE IF NOT EXISTS categorias (
  id_categoria INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  imagen VARCHAR(255) NULL
);

ALTER TABLE categorias
  ADD COLUMN IF NOT EXISTS imagen VARCHAR(255) NULL AFTER nombre;

ALTER TABLE categorias
  MODIFY COLUMN imagen VARCHAR(255) NULL;

CREATE TABLE IF NOT EXISTS subcategorias (
  id_subcategoria INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  id_categoria INT NOT NULL,
  FOREIGN KEY (id_categoria) REFERENCES categorias(id_categoria)
);

CREATE TABLE IF NOT EXISTS marcas (
  id_marca INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  imagen VARCHAR(255) NULL
);

ALTER TABLE marcas
  ADD COLUMN IF NOT EXISTS imagen VARCHAR(255) NULL AFTER nombre;

ALTER TABLE marcas
  MODIFY COLUMN imagen VARCHAR(255) NULL;

CREATE TABLE IF NOT EXISTS productos (
  id_producto INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  id_marca INT,
  id_subcategoria INT NOT NULL,
  precio_compra DECIMAL(10,2) NOT NULL,
  precio_venta DECIMAL(10,2) NOT NULL,
  imagen LONGTEXT,
  imagen_secundaria LONGTEXT,
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_marca) REFERENCES marcas(id_marca),
  FOREIGN KEY (id_subcategoria) REFERENCES subcategorias(id_subcategoria)
);

ALTER TABLE productos
  MODIFY COLUMN descripcion TEXT NULL;

ALTER TABLE productos
  MODIFY COLUMN imagen LONGTEXT NULL;

ALTER TABLE productos
  ADD COLUMN IF NOT EXISTS imagen_secundaria LONGTEXT NULL AFTER imagen;

CREATE TABLE IF NOT EXISTS inventario (
  id_inventario INT AUTO_INCREMENT PRIMARY KEY,
  id_producto INT NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  UNIQUE KEY unique_inventory_product (id_producto),
  FOREIGN KEY (id_producto) REFERENCES productos(id_producto)
);

CREATE TABLE IF NOT EXISTS movimientos_inventario (
  id_movimiento INT AUTO_INCREMENT PRIMARY KEY,
  id_producto INT NOT NULL,
  tipo ENUM('entrada', 'salida') NOT NULL,
  cantidad INT NOT NULL,
  referencia VARCHAR(50) NOT NULL,
  id_referencia INT NOT NULL,
  fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_producto) REFERENCES productos(id_producto)
);

CREATE TABLE IF NOT EXISTS proveedores (
  id_proveedor INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  nit VARCHAR(20),
  direccion VARCHAR(150),
  telefono VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS clientes (
  id_cliente INT AUTO_INCREMENT PRIMARY KEY,
  nombres VARCHAR(100) NOT NULL,
  apellidos VARCHAR(100) NOT NULL,
  nit VARCHAR(20),
  telefono VARCHAR(20),
  correo VARCHAR(100),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE clientes
  ADD COLUMN IF NOT EXISTS created_at DATETIME DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE IF NOT EXISTS compras (
  id_compra INT AUTO_INCREMENT PRIMARY KEY,
  id_proveedor INT NOT NULL,
  id_empleado INT NOT NULL,
  fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_proveedor) REFERENCES proveedores(id_proveedor),
  FOREIGN KEY (id_empleado) REFERENCES empleados(id_empleado)
);

CREATE TABLE IF NOT EXISTS compras_detalle (
  id_compra_detalle INT AUTO_INCREMENT PRIMARY KEY,
  id_compra INT NOT NULL,
  id_producto INT NOT NULL,
  cantidad INT NOT NULL,
  precio_unitario DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (id_compra) REFERENCES compras(id_compra),
  FOREIGN KEY (id_producto) REFERENCES productos(id_producto)
);

CREATE TABLE IF NOT EXISTS ventas (
  id_venta INT AUTO_INCREMENT PRIMARY KEY,
  id_cliente INT NOT NULL,
  id_empleado INT NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  descuento DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  metodo_pago ENUM('efectivo', 'tarjeta', 'transferencia') NOT NULL DEFAULT 'efectivo',
  monto_recibido DECIMAL(10,2) NULL,
  cambio DECIMAL(10,2) NOT NULL DEFAULT 0,
  referencia_pago VARCHAR(120) NULL,
  estado ENUM('pendiente', 'pagada', 'cancelada') NOT NULL DEFAULT 'pagada',
  fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente),
  FOREIGN KEY (id_empleado) REFERENCES empleados(id_empleado)
);

ALTER TABLE ventas
  ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER id_empleado;

ALTER TABLE ventas
  ADD COLUMN IF NOT EXISTS descuento DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER subtotal;

ALTER TABLE ventas
  ADD COLUMN IF NOT EXISTS total DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER descuento;

ALTER TABLE ventas
  ADD COLUMN IF NOT EXISTS metodo_pago ENUM('efectivo', 'tarjeta', 'transferencia') NOT NULL DEFAULT 'efectivo' AFTER total;

ALTER TABLE ventas
  ADD COLUMN IF NOT EXISTS monto_recibido DECIMAL(10,2) NULL AFTER metodo_pago;

ALTER TABLE ventas
  ADD COLUMN IF NOT EXISTS cambio DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER monto_recibido;

ALTER TABLE ventas
  ADD COLUMN IF NOT EXISTS referencia_pago VARCHAR(120) NULL AFTER cambio;

ALTER TABLE ventas
  ADD COLUMN IF NOT EXISTS estado ENUM('pendiente', 'pagada', 'cancelada') NOT NULL DEFAULT 'pagada' AFTER referencia_pago;

CREATE TABLE IF NOT EXISTS ventas_detalle (
  id_venta_detalle INT AUTO_INCREMENT PRIMARY KEY,
  id_venta INT NOT NULL,
  id_producto INT NOT NULL,
  cantidad INT NOT NULL,
  precio_unitario DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (id_venta) REFERENCES ventas(id_venta),
  FOREIGN KEY (id_producto) REFERENCES productos(id_producto)
);

CREATE TABLE IF NOT EXISTS pagos (
  id_pago INT AUTO_INCREMENT PRIMARY KEY,
  id_venta INT NOT NULL,
  metodo_pago ENUM('efectivo', 'tarjeta', 'transferencia') NOT NULL,
  monto DECIMAL(10,2) NOT NULL,
  monto_recibido DECIMAL(10,2) NULL,
  cambio DECIMAL(10,2) NOT NULL DEFAULT 0,
  referencia VARCHAR(120) NULL,
  estado ENUM('pendiente', 'confirmado', 'rechazado') NOT NULL DEFAULT 'confirmado',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_venta) REFERENCES ventas(id_venta)
);

CREATE TABLE IF NOT EXISTS pedidos (
  id_pedido INT AUTO_INCREMENT PRIMARY KEY,
  id_cliente INT NOT NULL,
  repartidor_id INT NULL,
  estado ENUM('pendiente', 'confirmado', 'cancelado') NOT NULL DEFAULT 'confirmado',
  estado_pedido VARCHAR(50) NOT NULL DEFAULT 'pago_confirmado',
  estado_entrega VARCHAR(50) NOT NULL DEFAULT 'pago_confirmado',
  tracking_code VARCHAR(60) NULL,
  direccion_entrega TEXT NULL,
  referencia_entrega VARCHAR(255) NULL,
  zona_entrega VARCHAR(120) NULL,
  telefono_entrega VARCHAR(30) NULL,
  nombre_recibe VARCHAR(150) NULL,
  tiempo_estimado_minutos INT NULL,
  costo_envio DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente)
);

ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS repartidor_id INT NULL AFTER id_cliente;

ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS estado_pedido VARCHAR(50) NOT NULL DEFAULT 'pago_confirmado' AFTER estado;

ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS estado_entrega VARCHAR(50) NOT NULL DEFAULT 'pago_confirmado' AFTER estado_pedido;

ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS tracking_code VARCHAR(60) NULL AFTER estado_entrega;

ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS direccion_entrega TEXT NULL AFTER tracking_code;

ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS referencia_entrega VARCHAR(255) NULL AFTER direccion_entrega;

ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS zona_entrega VARCHAR(120) NULL AFTER referencia_entrega;

ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS telefono_entrega VARCHAR(30) NULL AFTER zona_entrega;

ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS nombre_recibe VARCHAR(150) NULL AFTER telefono_entrega;

ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS tiempo_estimado_minutos INT NULL AFTER nombre_recibe;

ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS costo_envio DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER tiempo_estimado_minutos;

ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS created_at DATETIME DEFAULT CURRENT_TIMESTAMP AFTER fecha;

ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at;

CREATE TABLE IF NOT EXISTS pedidos_detalle (
  id_pedido_detalle INT AUTO_INCREMENT PRIMARY KEY,
  id_pedido INT NOT NULL,
  id_producto INT NOT NULL,
  cantidad INT NOT NULL,
  precio_unitario DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (id_pedido) REFERENCES pedidos(id_pedido),
  FOREIGN KEY (id_producto) REFERENCES productos(id_producto)
);

CREATE TABLE IF NOT EXISTS carritos (
  id_carrito INT AUTO_INCREMENT PRIMARY KEY,
  id_cliente INT NOT NULL,
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_cart_customer (id_cliente),
  FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente)
);

CREATE TABLE IF NOT EXISTS carritos_detalle (
  id_carrito_detalle INT AUTO_INCREMENT PRIMARY KEY,
  id_carrito INT NOT NULL,
  id_producto INT NOT NULL,
  cantidad INT NOT NULL,
  fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_cart_product (id_carrito, id_producto),
  FOREIGN KEY (id_carrito) REFERENCES carritos(id_carrito),
  FOREIGN KEY (id_producto) REFERENCES productos(id_producto)
);

CREATE TABLE IF NOT EXISTS pedido_estados_historial (
  id_historial INT AUTO_INCREMENT PRIMARY KEY,
  id_pedido INT NOT NULL,
  estado VARCHAR(50) NOT NULL,
  descripcion VARCHAR(255) NULL,
  usuario_id INT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_pedido) REFERENCES pedidos(id_pedido),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id_usuario)
);

CREATE TABLE IF NOT EXISTS solicitudes_acceso (
  id_solicitud INT AUTO_INCREMENT PRIMARY KEY,
  nombres VARCHAR(120) NOT NULL,
  correo VARCHAR(120) NOT NULL,
  telefono VARCHAR(30),
  mensaje VARCHAR(255),
  estado ENUM('pendiente', 'aprobado', 'rechazado') NOT NULL DEFAULT 'pendiente',
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  KEY idx_solicitud_correo (correo),
  KEY idx_solicitud_estado (estado)
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id_token INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  token_hash VARCHAR(128) NOT NULL,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  KEY idx_password_reset_user (id_usuario),
  KEY idx_password_reset_expires (expires_at),
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);

INSERT INTO roles (nombre)
SELECT 'Administrador'
WHERE NOT EXISTS (
  SELECT 1 FROM roles WHERE nombre = 'Administrador'
);

INSERT INTO roles (nombre)
SELECT 'Vendedor'
WHERE NOT EXISTS (
  SELECT 1 FROM roles WHERE nombre = 'Vendedor'
);

INSERT INTO roles (nombre)
SELECT 'Cliente'
WHERE NOT EXISTS (
  SELECT 1 FROM roles WHERE nombre = 'Cliente'
);

INSERT INTO roles (nombre)
SELECT 'Repartidor'
WHERE NOT EXISTS (
  SELECT 1 FROM roles WHERE nombre = 'Repartidor'
);

INSERT INTO puestos (puesto)
SELECT 'Encargado general'
WHERE NOT EXISTS (
  SELECT 1 FROM puestos WHERE puesto = 'Encargado general'
);

INSERT INTO empleados (nombres, apellidos, id_puesto, telefono, correo)
SELECT 'Admin', 'Sistema', p.id_puesto, '0000-0000', 'admin@libreria.local'
FROM puestos p
WHERE p.puesto = 'Encargado general'
  AND NOT EXISTS (
    SELECT 1 FROM empleados WHERE correo = 'admin@libreria.local'
  );

INSERT INTO usuarios (nombre_usuario, correo, password, id_rol, id_empleado, activo)
SELECT
  'admin',
  'admin@libreria.local',
  '$2b$10$cttjlwu6g8brglm4AVHAX.twfgIOlYy66WpxS3OaXiiVkBXvszU7e',
  r.id_rol,
  e.id_empleado,
  TRUE
FROM roles r
INNER JOIN empleados e ON e.correo = 'admin@libreria.local'
WHERE r.nombre = 'Administrador'
  AND NOT EXISTS (
    SELECT 1
    FROM usuarios
    WHERE nombre_usuario = 'admin' OR correo = 'admin@libreria.local'
  );

INSERT INTO categorias (nombre)
SELECT 'Escolar'
WHERE NOT EXISTS (
  SELECT 1 FROM categorias WHERE nombre = 'Escolar'
);

INSERT INTO categorias (nombre)
SELECT 'Oficina'
WHERE NOT EXISTS (
  SELECT 1 FROM categorias WHERE nombre = 'Oficina'
);

INSERT INTO categorias (nombre)
SELECT 'Arte'
WHERE NOT EXISTS (
  SELECT 1 FROM categorias WHERE nombre = 'Arte'
);

INSERT INTO subcategorias (nombre, id_categoria)
SELECT 'Cuadernos', c.id_categoria
FROM categorias c
WHERE c.nombre = 'Escolar'
  AND NOT EXISTS (
    SELECT 1 FROM subcategorias WHERE nombre = 'Cuadernos'
  );

INSERT INTO subcategorias (nombre, id_categoria)
SELECT 'Lapiceros', c.id_categoria
FROM categorias c
WHERE c.nombre = 'Escolar'
  AND NOT EXISTS (
    SELECT 1 FROM subcategorias WHERE nombre = 'Lapiceros'
  );

INSERT INTO subcategorias (nombre, id_categoria)
SELECT 'Papeleria', c.id_categoria
FROM categorias c
WHERE c.nombre = 'Oficina'
  AND NOT EXISTS (
    SELECT 1 FROM subcategorias WHERE nombre = 'Papeleria'
  );

INSERT INTO subcategorias (nombre, id_categoria)
SELECT 'Dibujo', c.id_categoria
FROM categorias c
WHERE c.nombre = 'Arte'
  AND NOT EXISTS (
    SELECT 1 FROM subcategorias WHERE nombre = 'Dibujo'
  );

INSERT INTO marcas (nombre)
SELECT 'Faber-Castell'
WHERE NOT EXISTS (
  SELECT 1 FROM marcas WHERE nombre = 'Faber-Castell'
);

INSERT INTO marcas (nombre)
SELECT 'Norma'
WHERE NOT EXISTS (
  SELECT 1 FROM marcas WHERE nombre = 'Norma'
);

INSERT INTO marcas (nombre)
SELECT 'Bic'
WHERE NOT EXISTS (
  SELECT 1 FROM marcas WHERE nombre = 'Bic'
);

INSERT INTO clientes (nombres, apellidos, nit, telefono, correo)
SELECT 'Consumidor', 'Final', 'CF', '0000-0000', 'consumidor@local'
WHERE NOT EXISTS (
  SELECT 1 FROM clientes WHERE correo = 'consumidor@local'
);
