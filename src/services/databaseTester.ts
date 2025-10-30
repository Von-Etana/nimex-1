import { supabase } from '../lib/supabase';

interface DatabaseTestResult {
  table: string;
  status: 'success' | 'failed' | 'empty';
  error?: string;
  recordCount?: number;
  sampleData?: any;
}

class DatabaseTester {
  private tables = [
    'profiles',
    'products',
    'categories',
    'orders',
    'order_items',
    'vendors',
    'vendor_profiles',
    'chats',
    'messages',
    'transactions',
    'admin_users',
    'admin_roles',
    'admin_role_assignments',
    'admin_permissions',
    'kyc_submissions',
    'reviews',
    'favorites',
    'notifications',
    'ads',
    'market_locations',
    'product_tags',
    'delivery_requests',
    'escrow_transactions',
    'flutterwave_transactions',
    'paystack_transactions'
  ];

  async testAllTables(): Promise<DatabaseTestResult[]> {
    const results: DatabaseTestResult[] = [];

    for (const table of this.tables) {
      try {
        const result = await this.testTable(table);
        results.push(result);
      } catch (error) {
        results.push({
          table,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return results;
  }

  private async testTable(tableName: string): Promise<DatabaseTestResult> {
    try {
      // Test basic SELECT query
      const { data, error, count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });

      if (error) {
        return {
          table: tableName,
          status: 'failed',
          error: error.message
        };
      }

      // Get sample data if table has records
      let sampleData = null;
      if (count && count > 0) {
        const { data: sample } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);

        if (sample && sample.length > 0) {
          sampleData = sample[0];
        }
      }

      return {
        table: tableName,
        status: count === 0 ? 'empty' : 'success',
        recordCount: count || 0,
        sampleData
      };
    } catch (error) {
      return {
        table: tableName,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async testDatabaseConnection(): Promise<{
    connected: boolean;
    error?: string;
    tables?: DatabaseTestResult[];
  }> {
    try {
      // Test basic connection with a simple query
      const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });

      if (error) {
        return {
          connected: false,
          error: `Connection failed: ${error.message}`
        };
      }

      // Test all tables
      const tables = await this.testAllTables();

      return {
        connected: true,
        tables
      };
    } catch (error) {
      return {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown connection error'
      };
    }
  }

  async runComprehensiveTest(): Promise<{
    connection: { connected: boolean; error?: string };
    tables: DatabaseTestResult[];
    summary: {
      total: number;
      successful: number;
      failed: number;
      empty: number;
    };
  }> {
    const connectionTest = await this.testDatabaseConnection();
    const tables = connectionTest.tables || [];

    const summary = {
      total: tables.length,
      successful: tables.filter(t => t.status === 'success').length,
      failed: tables.filter(t => t.status === 'failed').length,
      empty: tables.filter(t => t.status === 'empty').length,
    };

    return {
      connection: {
        connected: connectionTest.connected,
        error: connectionTest.error
      },
      tables,
      summary
    };
  }
}

export const databaseTester = new DatabaseTester();
export type { DatabaseTestResult };