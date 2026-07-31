// Base Repository — provides core CRUD operations on Supabase
import { type PostgrestError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export class BaseRepository<T extends { id: string }> {
  constructor(
    protected readonly tableName: string,
    protected readonly dbClient: typeof supabase = supabase,
  ) {}

  protected handleError(error: PostgrestError): never {
    console.error(`[Database Error] [${this.tableName}]`, error);
    throw new Error(`Database error: ${error.message} (code: ${error.code})`);
  }

  async find(id: string): Promise<T | null> {
    const { data, error } = await this.dbClient
      .from(this.tableName as any)
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) this.handleError(error);
    return data as T | null;
  }

  async list(orderBy: string = "created_at", ascending: boolean = false): Promise<T[]> {
    const { data, error } = await this.dbClient
      .from(this.tableName as any)
      .select("*")
      .order(orderBy, { ascending });

    if (error) this.handleError(error);
    return (data || []) as unknown as T[];
  }

  async create(data: Partial<T>): Promise<T> {
    const { data: created, error } = await this.dbClient
      .from(this.tableName as any)
      .insert(data as any)
      .select()
      .single();

    if (error) this.handleError(error);
    return created as unknown as T;
  }

  async update(id: string, data: Partial<T>): Promise<T> {
    const { data: updated, error } = await this.dbClient
      .from(this.tableName as any)
      .update(data as any)
      .eq("id", id)
      .select()
      .single();

    if (error) this.handleError(error);
    return updated as unknown as T;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.dbClient
      .from(this.tableName as any)
      .delete()
      .eq("id", id);

    if (error) this.handleError(error);
  }
}
