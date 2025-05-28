# Scripts de Configuración Automática - Papelón Store

## 🚀 Configuración Rápida

Este proyecto incluye scripts automatizados para configurar completamente la base de datos con datos de prueba.

### Comandos Disponibles

#### 📋 Configuración Principal
```bash
npm run setup
# o también:
npm run seed
npm run db:setup
npm run db:seed
```

**¿Qué hace este comando?**
- 🧹 Limpia todas las tablas existentes
- 👥 Crea 3 usuarios del sistema (admin, vendedor, cajero)
- 📂 Crea 6 categorías de productos
- 📦 Crea 16 productos con stock
- 🏢 Crea 4 proveedores
- 👤 Crea 5 clientes
- 📊 Genera datos de ejemplo (compras y ventas)
- 📈 Crea movimientos de inventario

#### 🔍 Verificación
```bash
npm run verify
# o también:
npm run db:verify
```

Verifica que la base de datos esté configurada correctamente y muestra un resumen de todos los datos.

#### 🗄️ Otros Comandos Útiles
```bash
npm run prisma:studio    # Abre Prisma Studio para ver la DB
npm run db:reset         # Resetea completamente la DB
npm run db:migrate       # Ejecuta migraciones pendientes
npm run prisma:generate  # Regenera el cliente de Prisma
```

## 🔐 Credenciales de Acceso

Después de ejecutar `npm run setup`, puedes hacer login con cualquiera de estas credenciales:

| Usuario | Contraseña | Rol |
|---------|------------|-----|
| `admin` | `admin123` | ADMIN |
| `vendedor1` | `vendedor123` | SELLER |
| `cajero1` | `cajero123` | SELLER |

## 📊 Datos Generados

### Categorías
- **Cuadernos** - Cuadernos de diferentes tipos y tamaños
- **Escritura** - Lápices, plumas, marcadores, etc.
- **Oficina** - Artículos generales de oficina
- **Escolar** - Materiales para estudiantes
- **Arte** - Materiales para arte y manualidades
- **Tecnología** - Productos tecnológicos y electrónicos

### Productos (16 items)
- Cuaderno Profesional Rayado 100 Hojas
- Cuaderno Universitario Cuadriculado 200 Hojas
- Libreta Pequeña Rayada 80 Hojas
- Lápiz Mirado No. 2
- Pluma BIC Cristal Negra
- Marcador Sharpie Negro
- Bolígrafo Pilot G2 Azul
- Paquete de 500 Hojas Blancas Bond
- Grapadora Estándar
- Clips Metálicos 100 Piezas
- Regla de 30cm Transparente
- Compás Escolar Metálico
- Calculadora Básica
- Colores de Madera 12 Piezas
- Acuarelas 18 Colores
- USB 32GB

### Proveedores (4 empresas)
- Papelera Principal S.A. de C.V.
- Distribuidora Escolar Morelos
- Tecnología Educativa del Norte
- Arte y Manualidades Express

### Clientes (5 registros)
- Ana Cliente Frecuente
- Escuela Primaria Benito Juárez
- Oficina Contable Torres
- Juan Pérez
- Instituto Técnico Regional

## 🛠️ Uso Típico

1. **Primera vez configurando el proyecto:**
   ```bash
   npm install
   npm run setup
   npm run dev
   ```

2. **Verificar que todo esté bien:**
   ```bash
   npm run verify
   ```

3. **Si necesitas resetear la DB:**
   ```bash
   npm run db:reset
   npm run setup
   ```

4. **Para explorar la base de datos:**
   ```bash
   npm run prisma:studio
   ```

## 📁 Estructura de Scripts

```
scripts/
├── setup-database.js     # Script principal de configuración
└── verify-setup.js       # Script de verificación
```

### setup-database.js
- ✅ Configuración completa y automática
- 🎨 Output con colores para mejor UX
- 🔄 Limpieza automática antes de crear datos
- 📊 Resumen detallado al final
- 🛡️ Manejo de errores robusto

### verify-setup.js
- 🔍 Verificación rápida de la configuración
- 📈 Conteo de registros por tabla
- 🔐 Muestra credenciales disponibles
- ✅ Confirmación visual del estado

## 🎯 Características

- **Idempotente**: Puedes ejecutar `npm run setup` múltiples veces sin problemas
- **Datos Realistas**: Productos, precios y datos basados en una papelería real
- **Relaciones Completas**: Todos los modelos están conectados apropiadamente
- **Movimientos de Inventario**: Se generan automáticamente con las transacciones
- **Contraseñas Seguras**: Todas las contraseñas están hasheadas con bcrypt

## 🚨 Notas Importantes

- Los scripts limpian completamente la base de datos antes de insertar datos
- Asegúrate de tener configurada la variable `DATABASE_URL` en tu `.env`
- Los datos son para desarrollo/testing, no para producción
- Si cambias el schema de Prisma, ejecuta `npx prisma generate` antes de usar los scripts

---

¡Listo para comenzar! 🎉 Ejecuta `npm run setup` y tendrás tu base de datos completamente configurada.
