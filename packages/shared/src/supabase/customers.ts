import type { SupabaseClient } from "@supabase/supabase-js";
import type { CustomerMode } from "../business-context";
import type { FoundOneDatabase } from "./client";

type Client = SupabaseClient<FoundOneDatabase>;

// ── 타입 ──────────────────────────────────────────────────────────────────

export type Customer = {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  notes?: string;
  tags: string[];
  customerMode: CustomerMode;
  totalVisits: number;
  totalSpent: number;
  lastVisitAt?: string;
  firstVisitAt?: string;
  meta: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
};

export type CustomerVisit = {
  id: string;
  customerId: string;
  visitType: string;
  visitDate: string;
  amount: number;
  serviceName?: string;
  staffName?: string;
  notes?: string;
  meta: Record<string, unknown>;
};

export type CreateCustomerInput = {
  name: string;
  phone?: string;
  email?: string;
  notes?: string;
  tags?: string[];
  customerMode: CustomerMode;
  meta?: Record<string, unknown>;
};

export type CreateVisitInput = {
  customerId: string;
  visitType?: string;
  visitDate?: string;
  amount?: number;
  serviceName?: string;
  staffName?: string;
  notes?: string;
  meta?: Record<string, unknown>;
};

// ── 매핑 ──────────────────────────────────────────────────────────────────

type CustomerRow = FoundOneDatabase["public"]["Tables"]["customers"]["Row"];
type VisitRow = FoundOneDatabase["public"]["Tables"]["customer_visits"]["Row"];

function mapCustomer(row: CustomerRow): Customer {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
    notes: row.notes ?? undefined,
    tags: row.tags ?? [],
    customerMode: row.customer_mode as CustomerMode,
    totalVisits: row.total_visits,
    totalSpent: row.total_spent,
    lastVisitAt: row.last_visit_at ?? undefined,
    firstVisitAt: row.first_visit_at ?? undefined,
    meta: row.meta ?? {},
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

function mapVisit(row: VisitRow): CustomerVisit {
  return {
    id: row.id,
    customerId: row.customer_id,
    visitType: row.visit_type,
    visitDate: row.visit_date,
    amount: row.amount,
    serviceName: row.service_name ?? undefined,
    staffName: row.staff_name ?? undefined,
    notes: row.notes ?? undefined,
    meta: row.meta ?? {},
  };
}

// ── 고객 CRUD ─────────────────────────────────────────────────────────────

export async function loadCustomers(client: Client): Promise<Customer[]> {
  const { data, error } = await client
    .from("customers")
    .select("*")
    .eq("is_active", true)
    .order("last_visit_at", { ascending: false, nullsFirst: false });

  if (error) throw error;
  return (data ?? []).map(mapCustomer);
}

export async function createCustomer(
  client: Client,
  input: CreateCustomerInput
): Promise<Customer> {
  const { data: { user } } = await client.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await client
    .from("customers")
    .insert({
      user_id: user.id,
      name: input.name,
      phone: input.phone ?? null,
      email: input.email ?? null,
      notes: input.notes ?? null,
      tags: input.tags ?? [],
      customer_mode: input.customerMode,
      meta: (input.meta ?? {}),
      first_visit_at: new Date().toISOString(),
    } as never)
    .select()
    .single();

  if (error) throw error;
  return mapCustomer(data);
}

export async function updateCustomer(
  client: Client,
  id: string,
  updates: Partial<CreateCustomerInput>
): Promise<void> {
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.phone !== undefined) payload.phone = updates.phone;
  if (updates.email !== undefined) payload.email = updates.email;
  if (updates.notes !== undefined) payload.notes = updates.notes;
  if (updates.tags !== undefined) payload.tags = updates.tags;
  if (updates.meta !== undefined) payload.meta = updates.meta;

  const { error } = await client
    .from("customers")
    .update(payload as never)
    .eq("id", id);

  if (error) throw error;
}

export async function deleteCustomer(client: Client, id: string): Promise<void> {
  const { error } = await client
    .from("customers")
    .update({ is_active: false, updated_at: new Date().toISOString() } as never)
    .eq("id", id);

  if (error) throw error;
}

// ── 방문 기록 CRUD ────────────────────────────────────────────────────────

export async function loadCustomerVisits(
  client: Client,
  customerId: string
): Promise<CustomerVisit[]> {
  const { data, error } = await client
    .from("customer_visits")
    .select("*")
    .eq("customer_id", customerId)
    .order("visit_date", { ascending: false })
    .limit(50);

  if (error) throw error;
  return (data ?? []).map(mapVisit);
}

export async function addCustomerVisit(
  client: Client,
  input: CreateVisitInput
): Promise<CustomerVisit> {
  const { data: { user } } = await client.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const now = new Date().toISOString();

  const { data, error } = await client
    .from("customer_visits")
    .insert({
      customer_id: input.customerId,
      user_id: user.id,
      visit_type: input.visitType ?? "visit",
      visit_date: input.visitDate ?? now,
      amount: input.amount ?? 0,
      service_name: input.serviceName ?? null,
      staff_name: input.staffName ?? null,
      notes: input.notes ?? null,
      meta: (input.meta ?? {}),
    } as never)
    .select()
    .single();

  if (error) throw error;

  // 고객 요약 업데이트 (last_visit_at)
  try {
    await client.from("customers").update({ last_visit_at: input.visitDate ?? now, updated_at: now } as never).eq("id", input.customerId);
  } catch { /* ignore */ }

  return mapVisit(data);
}

// ── 통계 ──────────────────────────────────────────────────────────────────

export type CustomerStats = {
  totalCustomers: number;
  activeCustomers: number;    // 최근 30일 방문
  newThisMonth: number;       // 이번 달 신규
  avgVisits: number;          // 평균 방문 횟수
  avgSpent: number;           // 평균 지출
  topTags: string[];          // 많이 쓰이는 태그
};

export function calculateCustomerStats(customers: Customer[]): CustomerStats {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const thisMonth = now.toISOString().slice(0, 7);

  const active = customers.filter(c => c.lastVisitAt && c.lastVisitAt >= thirtyDaysAgo);
  const newThisMonth = customers.filter(c => c.createdAt?.startsWith(thisMonth));
  const totalVisits = customers.reduce((s, c) => s + c.totalVisits, 0);
  const totalSpent = customers.reduce((s, c) => s + c.totalSpent, 0);

  const tagCounts: Record<string, number> = {};
  for (const c of customers) {
    for (const tag of c.tags) {
      tagCounts[tag] = (tagCounts[tag] ?? 0) + 1;
    }
  }
  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag]) => tag);

  return {
    totalCustomers: customers.length,
    activeCustomers: active.length,
    newThisMonth: newThisMonth.length,
    avgVisits: customers.length > 0 ? Math.round(totalVisits / customers.length) : 0,
    avgSpent: customers.length > 0 ? Math.round(totalSpent / customers.length) : 0,
    topTags,
  };
}
