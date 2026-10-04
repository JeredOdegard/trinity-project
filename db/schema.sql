create table if not exists bags (
  code text primary key,
  bag_no serial unique,
  created_at timestamptz not null default now()
);

create table if not exists messages (
  id serial primary key,
  code text unique references bags(code),
  body text not null check (char_length(body) between 1 and 280),
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);

-- Seed message: what the very first bag gets matched with.
insert into messages (code, body)
select null, 'From all of us at Grace: may this cup be a small mercy in your day.'
where not exists (select 1 from messages where code is null);
