# Bouquet Setlists

Aplicación web para gestionar setlists de un grupo musical.

## Stack

- **Frontend**: React + Vite + Tailwind CSS
- **Base de datos**: Supabase (PostgreSQL)
- **Despliegue**: Vercel

## Requisitos

- Node.js 18+

## Instalación

```bash
cd bouquet-setlists
npm install
```

## Configuración de Supabase

### 1. Crear proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta
2. Crea un nuevo proyecto
3. Espera a que se aprovisione la base de datos

### 2. Crear tablas

Ejecuta este SQL en el editor de SQL de Supabase:

```sql
-- Tabla de canciones
CREATE TABLE songs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  duration TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de setlists
CREATE TABLE setlists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_name TEXT NOT NULL,
  date DATE NOT NULL,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de relación setlist-songs
CREATE TABLE setlist_songs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  setlist_id UUID REFERENCES setlists(id) ON DELETE CASCADE NOT NULL,
  song_id UUID REFERENCES songs(id) ON DELETE CASCADE NOT NULL,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar Row Level Security (opcional)
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE setlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE setlist_songs ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso público (para desarrollo)
CREATE POLICY "Allow public access" ON songs FOR ALL USING (true);
CREATE POLICY "Allow public access" ON setlists FOR ALL USING (true);
CREATE POLICY "Allow public access" ON setlist_songs FOR ALL USING (true);
```

### 3. Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

Para obtener las credenciales:
- **URL**: Settings > API > Project URL
- **Anon Key**: Settings > API > Project API keys > `anon` key

## Ejecutar localmente

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

## Desplegar en Vercel

### Opción 1: Desde Vercel Dashboard

1. Ve a [vercel.com](https://vercel.com) e inicia sesión
2. Click en "Add New..." > "Project"
3. Importa tu repositorio de Git
4. En "Environment Variables", añade:
   - `VITE_SUPABASE_URL` = tu URL de Supabase
   - `VITE_SUPABASE_ANON_KEY` = tu anon key
5. Click en "Deploy"

### Opción 2: Desde CLI

```bash
npm i -g vercel
vercel
```

Sigue las instrucciones para desplegar.

## Estructura del proyecto

```
src/
├── components/
│   ├── Layout.jsx      # Layout principal con navegación
│   └── Toast.jsx       # Componente para notificaciones
├── lib/
│   └── supabase.js    # Cliente de Supabase y servicios
├── pages/
│   ├── SongsPage.jsx       # Gestión de canciones
│   ├── SetlistsPage.jsx   # Lista de setlists
│   └── SetlistDetailPage.jsx  # Detalle de setlist
├── App.jsx
├── main.jsx
└── index.css
```

## Funcionalidades

- **Canciones**: Crear, editar, eliminar y buscar canciones
- **Setlists**: Crear setlists con fecha y ubicación
- **Gestión de setlist**: Añadir canciones, reordenar con drag & drop, exportar a PDF
- **Persistencia**: Todos los datos se guardan en Supabase