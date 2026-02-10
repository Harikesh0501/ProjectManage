import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ShieldAlert, Search, RefreshCw } from 'lucide-react';
import API_URL from '../config';

const AuditLogViewer = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_URL}/api/audit`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setLogs(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const filteredLogs = logs.filter(log =>
        log.action.toLowerCase().includes(filter.toLowerCase()) ||
        log.user?.email.toLowerCase().includes(filter.toLowerCase()) ||
        log.resource?.toLowerCase().includes(filter.toLowerCase())
    );

    const formatDetails = (details) => {
        if (!details) return '-';
        if (typeof details === 'string') return details;
        if (Object.keys(details).length === 0) return '-';
        return Object.entries(details)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ');
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold dark:text-white text-slate-900 flex items-center gap-2">
                    <ShieldAlert className="w-6 h-6 text-red-500" />
                    Audit Logs
                </h2>
                <button
                    onClick={fetchLogs}
                    className="p-2 dark:bg-slate-800 bg-slate-100 dark:text-slate-300 text-slate-600 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                    title="Refresh Logs"
                >
                    <RefreshCw className="w-4 h-4" />
                </button>
            </div>

            <div className="dark:bg-slate-800/50 bg-white border dark:border-slate-700 border-slate-200 rounded-lg p-4 shadow-sm">
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search logs by action, user, or resource..."
                        className="w-full dark:bg-slate-900 bg-slate-50 dark:text-white text-slate-900 pl-10 pr-4 py-2 rounded-lg border dark:border-slate-700 border-slate-200 outline-none focus:border-blue-500"
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                    />
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="dark:text-slate-400 text-slate-500 text-sm border-b dark:border-slate-700 border-slate-200">
                                <th className="p-3 font-medium">Timestamp</th>
                                <th className="p-3 font-medium">User</th>
                                <th className="p-3 font-medium">Action</th>
                                <th className="p-3 font-medium">Resource</th>
                                <th className="p-3 font-medium">Details</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {loading ? (
                                <tr><td colSpan="5" className="p-4 text-center text-slate-500">Loading...</td></tr>
                            ) : filteredLogs.length > 0 ? (
                                filteredLogs.map(log => (
                                    <tr key={log._id} className="border-b dark:border-slate-700/50 border-slate-100 dark:hover:bg-slate-700/20 hover:bg-slate-50">
                                        <td className="p-3 dark:text-slate-400 text-slate-500 font-mono text-xs">
                                            {new Date(log.createdAt).toLocaleString()}
                                        </td>
                                        <td className="p-3 dark:text-blue-300 text-blue-600 font-medium">
                                            {log.user?.email || 'System'}
                                        </td>
                                        <td className="p-3">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${log.action.includes('DELETE') ? 'bg-red-500/20 text-red-400' :
                                                log.action.includes('CREATE') ? 'bg-green-500/20 text-green-400' :
                                                    'bg-blue-500/20 text-blue-400'
                                                }`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="p-3 dark:text-slate-300 text-slate-700">
                                            {log.resource || '-'}
                                        </td>
                                        <td className="p-3 text-slate-500 max-w-xs truncate" title={formatDetails(log.details)}>
                                            {formatDetails(log.details)}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="5" className="p-8 text-center text-slate-500">No logs found</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AuditLogViewer;
