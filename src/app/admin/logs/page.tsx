"use client";

import { useEffect, useState } from "react";

export default function LogsPage() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    fetch("/api/superadmin/logs")
      .then((res) => res.json())
      .then(setLogs);
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Portal Activity Logs</h1>

      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-3">Action</th>
            <th className="p-3">Admin</th>
            <th className="p-3">Time</th>
          </tr>
        </thead>

        <tbody>
          {logs.map((log: any) => (
            <tr key={log.id} className="border-t">
              <td className="p-3">{log.action}</td>
              <td className="p-3">{log.actor_admin_id}</td>
              <td className="p-3">
                {new Date(log.created_at).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}