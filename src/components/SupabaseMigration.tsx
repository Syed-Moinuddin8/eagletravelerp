import React, { useState, useEffect } from 'react';
import { migrateLocalStorageToSupabase, exportSupabaseData, checkSupabaseData } from '../services/migrateData';
import { Database, Download, Upload, CheckCircle, AlertTriangle, Loader } from 'lucide-react';

export function SupabaseMigration() {
  const [status, setStatus] = useState<'checking' | 'ready' | 'migrated' | 'error'>('checking');
  const [isMigrating, setIsMigrating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [message, setMessage] = useState('');
  const [dataStatus, setDataStatus] = useState<any>(null);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const status = await checkSupabaseData();
      setDataStatus(status);
      if (status.hasData) {
        setStatus('migrated');
        setMessage(`✅ Supabase is active with ${status.customers} customers and ${status.trips} trips`);
      } else {
        setStatus('ready');
        setMessage('⚠️ No data found in Supabase. Click "Migrate Now" to transfer your data.');
      }
    } catch (error: any) {
      setStatus('error');
      setMessage(`❌ Error checking Supabase: ${error.message}`);
    }
  };

  const handleMigrate = async () => {
    setIsMigrating(true);
    setMessage('🚀 Migrating data to Supabase...');
    
    try {
      const result = await migrateLocalStorageToSupabase();
      
      if (result.success) {
        setStatus('migrated');
        setMessage('✅ ' + result.message);
        await checkStatus();
      } else {
        setStatus('error');
        setMessage('⚠️ ' + result.message + '\n\n' + (result.errors?.join('\n') || ''));
      }
    } catch (error: any) {
      setStatus('error');
      setMessage('❌ Migration failed: ' + error.message);
    } finally {
      setIsMigrating(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      const result = await exportSupabaseData();
      setMessage(result.success ? '✅ ' + result.message : '❌ ' + result.message);
    } catch (error: any) {
      setMessage('❌ Export failed: ' + error.message);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-brand-50 rounded-xl">
          <Database className="w-6 h-6 text-brand-600" />
        </div>
        <div>
          <h3 className="font-bold text-lg text-slate-800">Supabase Database</h3>
          <p className="text-sm text-slate-500">Cloud database sync and backup</p>
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50">
        {status === 'checking' && (
          <>
            <Loader className="w-5 h-5 text-blue-500 animate-spin" />
            <span className="text-sm font-medium text-slate-700">Checking connection...</span>
          </>
        )}
        {status === 'ready' && (
          <>
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <span className="text-sm font-medium text-slate-700">Ready to migrate</span>
          </>
        )}
        {status === 'migrated' && (
          <>
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            <span className="text-sm font-medium text-slate-700">Connected and syncing</span>
          </>
        )}
        {status === 'error' && (
          <>
            <AlertTriangle className="w-5 h-5 text-rose-500" />
            <span className="text-sm font-medium text-slate-700">Error</span>
          </>
        )}
      </div>

      {/* Message */}
      <div className="p-4 bg-slate-50 rounded-xl">
        <pre className="text-xs text-slate-600 whitespace-pre-wrap font-mono">{message}</pre>
      </div>

      {/* Data Status */}
      {dataStatus && status === 'migrated' && (
        <div className="grid grid-cols-3 gap-4">
          <div className="p-3 bg-emerald-50 rounded-xl">
            <p className="text-xs text-emerald-600 font-semibold">Customers</p>
            <p className="text-2xl font-bold text-emerald-700">{dataStatus.customers}</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl">
            <p className="text-xs text-blue-600 font-semibold">Trips</p>
            <p className="text-2xl font-bold text-blue-700">{dataStatus.trips}</p>
          </div>
          <div className="p-3 bg-purple-50 rounded-xl">
            <p className="text-xs text-purple-600 font-semibold">Settings</p>
            <p className="text-2xl font-bold text-purple-700">{dataStatus.settings ? '✓' : '✗'}</p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {status === 'ready' && (
          <button
            onClick={handleMigrate}
            disabled={isMigrating}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isMigrating ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Migrating...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Migrate to Supabase
              </>
            )}
          </button>
        )}
        
        {status === 'migrated' && (
          <>
            <button
              onClick={handleMigrate}
              disabled={isMigrating}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition disabled:opacity-50"
            >
              {isMigrating ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Re-syncing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Re-sync Data
                </>
              )}
            </button>
            
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Export Backup
                </>
              )}
            </button>
          </>
        )}
        
        <button
          onClick={checkStatus}
          className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition"
        >
          Refresh
        </button>
      </div>

      {/* Info */}
      <div className="text-xs text-slate-500 space-y-1 pt-4 border-t">
        <p>• Migration copies all data from browser storage to Supabase cloud database</p>
        <p>• Data is automatically synced on every change after migration</p>
        <p>• Export creates a downloadable JSON backup file</p>
        <p>• Your data remains in localStorage as backup even after migration</p>
      </div>
    </div>
  );
}
