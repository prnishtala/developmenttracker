import { unstable_noStore as noStore } from 'next/cache';
import { getAuditLogs } from '@/lib/data';

export default async function AuditPage() {
  noStore();
  const logs = await getAuditLogs(300);

  return (
    <div className="space-y-4">
      <header className="rounded-2xl bg-brand-500 p-4 text-white">
        <h1 className="text-2xl font-bold">Access Audit History</h1>
        <p className="text-sm opacity-90">Latest write actions, reminders, and subscription events.</p>
      </header>

      <section className="overflow-x-auto rounded-2xl bg-white p-4 shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <th className="px-2 py-2">Time</th>
              <th className="px-2 py-2">Event</th>
              <th className="px-2 py-2">Action</th>
              <th className="px-2 py-2">Entity</th>
              <th className="px-2 py-2">Date</th>
              <th className="px-2 py-2">IP</th>
              <th className="px-2 py-2">Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-slate-100 align-top text-slate-700">
                <td className="px-2 py-2 whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                <td className="px-2 py-2">{log.event_type}</td>
                <td className="px-2 py-2">{log.action}</td>
                <td className="px-2 py-2">
                  {log.entity_type}
                  {log.entity_id ? `:${log.entity_id}` : ''}
                </td>
                <td className="px-2 py-2 whitespace-nowrap">{log.event_date ?? '-'}</td>
                <td className="px-2 py-2 whitespace-nowrap">{log.request_ip ?? '-'}</td>
                <td className="px-2 py-2">
                  <pre className="max-w-md whitespace-pre-wrap break-all rounded bg-slate-50 p-2 text-xs text-slate-600">
                    {log.payload ? JSON.stringify(log.payload) : '-'}
                  </pre>
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={7} className="px-2 py-6 text-center text-sm text-slate-500">
                  No audit events yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
