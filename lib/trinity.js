import { sql } from "./db";

export async function getBag(code) {
  const [bag] = await sql`
    select b.code, b.bag_no, m.id as message_id, m.body
    from bags b left join messages m on m.code = b.code
    where b.code = ${code}`;
  return bag ?? null;
}

// "Previous person": the latest visible message planted before yours.
// Derived at read time, so hiding a message falls back to the one before it.
export async function getMatch(messageId) {
  const [m] = await sql`
    select m.id, m.body, b.bag_no
    from messages m left join bags b on b.code = m.code
    where m.id < ${messageId} and not m.hidden
    order by m.id desc limit 1`;
  return m ?? null;
}

export async function addMessage(code, body) {
  await sql`insert into messages (code, body) values (${code}, ${body})
            on conflict (code) do nothing`;
}

export async function countLeaves() {
  const [{ n }] = await sql`select count(*)::int as n from messages where code is not null and not hidden`;
  return n;
}

export async function getLeafIds() {
  const rows = await sql`select id from messages where code is not null and not hidden order by id`;
  return rows.map((r) => r.id);
}

export async function getRandomMessages(excludeId, n) {
  return sql`select id, body from messages
             where code is not null and not hidden and id <> ${excludeId}
             order by random() limit ${n}`;
}

export async function getLeaf(id) {
  const [m] = await sql`select id, body from messages where id = ${id} and code is not null and not hidden`;
  return m ?? null;
}

export async function listMessages(limit = 300) {
  return sql`select m.id, m.body, m.hidden, m.created_at, b.bag_no
             from messages m left join bags b on b.code = m.code
             order by m.id desc limit ${limit}`;
}

export async function setHidden(id, hidden) {
  await sql`update messages set hidden = ${hidden} where id = ${id}`;
}

export async function stats() {
  const [s] = await sql`select
    (select count(*)::int from bags) as bags,
    (select count(*)::int from messages where code is not null) as planted,
    (select count(*)::int from messages where hidden) as hidden`;
  return s;
}
