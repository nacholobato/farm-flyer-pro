# Guía de Configuración: Sistema de Recursos

## 📋 Resumen
Esta guía te ayudará a configurar el sistema de gestión de recursos (PDFs y documentos) en tu aplicación Farm Flyer Pro.

## 🚀 Pasos de Configuración

### Paso 1: Crear el Bucket de Almacenamiento en Supabase

Tienes dos opciones:

#### Opción A: Usar el SQL Editor (Recomendado)

1. Ve a tu proyecto de Supabase: https://supabase.com/dashboard
2. Navega a **SQL Editor** en el menú lateral
3. Crea una nueva query
4. Copia y pega el contenido del archivo `supabase/setup_storage_bucket.sql`
5. Haz clic en **Run** para ejecutar el script
6. Verifica que aparezca el bucket en la pestaña de resultados

#### Opción B: Usar la Interfaz de Storage

1. Ve a tu proyecto de Supabase
2. Navega a **Storage** en el menú lateral
3. Haz clic en **New bucket**
4. Configura el bucket con estos valores:
   - **Name**: `resources`
   - **Public bucket**: DESACTIVADO (private)
   - **File size limit**: 50 MB
   - **Allowed MIME types**: 
     - `application/pdf`
     - `application/msword`
     - `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
     - `application/vnd.ms-excel`
     - `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
     - `text/plain`
5. Haz clic en **Create bucket**

### Paso 2: Ejecutar la Migración de Base de Datos

Ahora necesitas ejecutar la migración para crear la tabla `resources` y las políticas de seguridad:

1. Ve al **SQL Editor** de Supabase
2. Crea una nueva query
3. Copia y pega el contenido del archivo:
   `supabase/migrations/20251217191500_create_resources_table.sql`
4. Haz clic en **Run**
5. Verifica que no haya errores

### Paso 3: Verificar las Políticas de Storage

Después de ejecutar la migración, verifica las políticas:

1. En Supabase, ve a **Storage** > **Policies**
2. Selecciona el bucket `resources`
3. Deberías ver 4 políticas:
   - ✅ Users can view resource files in their organization
   - ✅ Users can upload resource files for their organization
   - ✅ Users can update resource files in their organization
   - ✅ Users can delete resource files in their organization

Si no aparecen, ejecuta nuevamente la sección de políticas del archivo de migración.

### Paso 4: Probar el Sistema

1. Inicia tu aplicación: `npm run dev`
2. Inicia sesión en la aplicación
3. Navega a **Recursos** en el menú lateral
4. Haz clic en **Subir Recurso**
5. Completa el formulario:
   - Selecciona un archivo PDF
   - Ingresa un título
   - Selecciona una categoría
   - (Opcional) Agrega una descripción
6. Haz clic en **Subir Recurso**
7. El archivo debería aparecer en tu lista de recursos

## 🎯 Características del Sistema

### ✨ Funcionalidades Implementadas:

- ✅ **Subir archivos**: PDFs, Word, Excel, TXT
- ✅ **Organización por categorías**: 9 categorías predefinidas
- ✅ **Descargas seguras**: URLs firmadas con expiración de 1 hora
- ✅ **Control de acceso**: Solo miembros de la organización pueden ver/editar
- ✅ **Gestión completa**: Ver, descargar, eliminar recursos
- ✅ **Metadata**: Título, descripción, categoría, tamaño de archivo
- ✅ **UI moderna**: Cards con iconos, hover effects, badges

### 📁 Categorías Disponibles:

1. **Clima y Meteorología** - Para datos climatológicos
2. **Información de Cultivos** - Manuales de cultivos específicos
3. **Mercados y Precios** - Información de mercado
4. **Manejo de Plagas** - Guías de control de plagas
5. **Educación e Investigación** - Papers, estudios, investigaciones
6. **Datos y Estadísticas** - Reportes estadísticos
7. **Equipamiento** - Manuales de equipos
8. **Regulaciones** - Normativas y regulaciones
9. **Otros** - Cualquier otro tipo de documento

### 🔒 Seguridad:

- **Row Level Security (RLS)**: Solo miembros de tu organización pueden acceder
- **Storage Policies**: Archivos protegidos por permisos
- **URLs firmadas**: Links de descarga temporal y seguros
- **Validación de tipos**: Solo archivos permitidos

## 🛠️ Archivos Creados/Modificados:

### Nuevos archivos:
- `src/pages/Resources.tsx` - Página principal actualizada
- `src/components/ResourceUploadDialog.tsx` - Diálogo de subida
- `src/hooks/useResources.tsx` - Hooks para gestión de recursos
- `src/types/database.ts` - Tipos TypeScript actualizados
- `supabase/migrations/20251217191500_create_resources_table.sql` - Migración
- `supabase/setup_storage_bucket.sql` - Script de configuración del bucket

### Archivos modificados:
- `src/App.tsx` - Ruta agregada
- `src/components/layout/AppLayout.tsx` - Link en navegación

## ❓ Solución de Problemas

### Error "bucket not found"
- **Causa**: El bucket no está creado en Supabase
- **Solución**: Sigue el Paso 1 de esta guía

### Error al subir archivos
- **Causa**: Políticas de storage no configuradas
- **Solución**: Ejecuta nuevamente la migración completa (Paso 2)

### "No organization found"
- **Causa**: El usuario no está asociado a una organización
- **Solución**: Asegúrate de completar el proceso de configuración de organización

### Archivo no se descarga
- **Causa**: Error generando URL firmada
- **Solución**: Verifica que el archivo existe en Storage y que las políticas estén correctas

## 📝 Próximos Pasos Sugeridos:

- [ ] Subir tus primeros PDFs de referencia
- [ ] Organizar documentos por categoría
- [ ] Compartir recursos con tu equipo
- [ ] Considerar agregar búsqueda/filtros (futura mejora)
- [ ] Agregar preview de PDFs (futura mejora)

## 🤝 Soporte

Si tienes problemas, revisa:
1. La consola del navegador para errores JavaScript
2. Los logs de Supabase en el Dashboard
3. Que tu usuario tenga una organización asignada
4. Que las políticas de RLS estén activas

---

¡Éxito con tu sistema de recursos! 🎉
