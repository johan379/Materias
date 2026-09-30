-- Pegar en Supabase > SQL Editor > New query > Run
-- (El backend también crea estas tablas solo al arrancar; esto es por si prefieres crearlas a mano.)

create table if not exists usuarios (
  id serial primary key,
  nombre varchar(120) not null,
  email varchar(255) not null unique,
  password_hash varchar(255) not null,
  creado_en timestamptz not null default now()
);

create table if not exists materias (
  id serial primary key,
  usuario_id integer not null references usuarios(id) on delete cascade,
  nombre varchar(120) not null,
  color varchar(7) not null default '#4f46e5',
  profesor varchar(120)
);
create index if not exists ix_materias_usuario_id on materias(usuario_id);

create table if not exists horarios (
  id serial primary key,
  materia_id integer not null references materias(id) on delete cascade,
  dia_semana integer not null,
  hora_inicio time not null,
  hora_fin time not null,
  salon varchar(60)
);
create index if not exists ix_horarios_materia_id on horarios(materia_id);

create table if not exists tareas (
  id serial primary key,
  usuario_id integer not null references usuarios(id) on delete cascade,
  materia_id integer references materias(id) on delete set null,
  titulo varchar(200) not null,
  descripcion text,
  fecha_entrega timestamptz not null,
  recordatorio_minutos integer,
  completada boolean not null default false
);
create index if not exists ix_tareas_usuario_id on tareas(usuario_id);
create index if not exists ix_tareas_materia_id on tareas(materia_id);
create index if not exists ix_tareas_fecha_entrega on tareas(fecha_entrega);

-- Solo el backend (con la contraseña de la base) debe leer estas tablas,
-- no la API pública de Supabase:
alter table usuarios enable row level security;
alter table materias enable row level security;
alter table horarios enable row level security;
alter table tareas enable row level security;
