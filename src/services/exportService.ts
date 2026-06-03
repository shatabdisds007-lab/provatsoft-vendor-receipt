import { supabaseAdmin } from '@/lib/supabaseAdminClient';

const PAGE_SIZE = 500;

async function* paginateTable(table: string, select: string) {
  let lastId: string | null = null;
  while (true) {
    let query = supabaseAdmin.from(table).select(select).order('id', { ascending: true }).limit(PAGE_SIZE);
    if (lastId) {
      query = query.gt('id', lastId);
    }

    const { data, error } = await query;
    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      break;
    }

    lastId = (data[data.length - 1] as any).id;
    yield data;
  }
}

export function buildExportStream() {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        controller.enqueue(encoder.encode('{'));

        const tables = [
          { key: 'users', table: 'auth.users', select: 'id,email,user_metadata,app_metadata,created_at' },
          { key: 'receipts', table: 'receipt_pdfs', select: 'id,receipt_number,file_name,pdf_url,vendor_id,metadata,created_at' },
          { key: 'subscriptions', table: 'subscriptions', select: 'id,user_id,plan,status,current_usage,usage_limit,reset_date,created_at' },
          { key: 'system_error_logs', table: 'system_error_logs', select: 'id,user_id,error_type,message,route,metadata,correlation_id,created_at' },
          { key: 'email_queue', table: 'email_queue', select: 'id,user_id,receipt_id,recipient_email,subject,status,attempts,last_error,next_try_at,created_at,updated_at' },
        ];

        for (let index = 0; index < tables.length; index += 1) {
          const table = tables[index];
          controller.enqueue(encoder.encode(`"${table.key}":[`));

          let firstRow = true;
          for await (const rows of paginateTable(table.table, table.select)) {
            for (const row of rows) {
              if (!firstRow) {
                controller.enqueue(encoder.encode(','));
              }
              controller.enqueue(encoder.encode(JSON.stringify(row)));
              firstRow = false;
            }
          }

          controller.enqueue(encoder.encode(']'));
          if (index < tables.length - 1) {
            controller.enqueue(encoder.encode(','));
          }
        }

        controller.enqueue(encoder.encode('}'));
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });
}
