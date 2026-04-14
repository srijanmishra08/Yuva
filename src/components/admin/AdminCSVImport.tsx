'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import Papa from 'papaparse';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { Upload, FileText, CheckCircle, AlertTriangle } from 'lucide-react';

interface Props {
  onSuccess: () => void;
}

interface CSVRow {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  institution: string;
  class_year: string;
  experience?: string;
  pref1?: string;
  pref2?: string;
  payment_type?: string;
}

export default function AdminCSVImport({ onSuccess }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<CSVRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ success: number; errors: string[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setResult(null);

    Papa.parse<CSVRow>(f, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setPreview(results.data.slice(0, 5));
      },
    });
  }

  async function handleImport() {
    if (!file) return;
    setImporting(true);

    const { data: session } = await supabase.auth.getSession();
    if (!session.session) { setImporting(false); return; }

    Papa.parse<CSVRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const res = await fetch('/api/admin/csv-import', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.session!.access_token}`,
          },
          body: JSON.stringify({ rows: results.data }),
        });

        if (res.ok) {
          const data = await res.json();
          setResult(data);
          toast.success(`Imported ${data.success} delegates!`);
          onSuccess();
        } else {
          toast.error('Import failed');
        }
        setImporting(false);
      },
    });
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center text-gold">
          <Upload size={18} />
        </div>
        <div>
          <h2 className="font-montserrat font-700 text-cream">CSV Import</h2>
          <p className="text-white/40 text-sm font-montserrat">Bulk import delegates from a CSV file</p>
        </div>
      </div>

      {/* Required Fields Info */}
      <div className="yuva-card p-5 mb-5">
        <p className="font-montserrat font-700 text-gold text-sm mb-3">Required CSV Columns</p>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
          {['first_name', 'last_name', 'email', 'phone', 'institution', 'class_year', 'experience', 'pref1', 'pref2', 'payment_type'].map(col => (
            <span key={col} className="font-montserrat text-xs bg-charcoal-dark rounded-lg px-2.5 py-1.5 text-white/60 border border-white/10">
              {col}
            </span>
          ))}
        </div>
        <p className="font-montserrat text-xs text-white/30 mt-3">
          payment_type values: RAZORPAY | CASH | COMPLIMENTARY
        </p>
      </div>

      {/* File Drop */}
      <div
        onClick={() => fileRef.current?.click()}
        className={`yuva-card p-10 text-center cursor-pointer border-2 border-dashed transition-all duration-200 ${
          file ? 'border-gold/50 bg-gold/5' : 'border-white/20 hover:border-gold/30 hover:bg-white/5'
        }`}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          onChange={handleFile}
          className="hidden"
        />
        {file ? (
          <>
            <FileText size={32} className="text-gold mx-auto mb-3" />
            <p className="font-montserrat font-600 text-cream">{file.name}</p>
            <p className="font-montserrat text-xs text-white/40 mt-1">{(file.size / 1024).toFixed(1)} KB — Click to change</p>
          </>
        ) : (
          <>
            <Upload size={32} className="text-white/20 mx-auto mb-3" />
            <p className="font-montserrat font-600 text-cream">Drop CSV file here</p>
            <p className="font-montserrat text-xs text-white/40 mt-1">or click to browse</p>
          </>
        )}
      </div>

      {/* Preview */}
      {preview.length > 0 && (
        <div className="yuva-card p-5 mt-5 overflow-x-auto">
          <p className="font-montserrat font-600 text-gold text-sm mb-3">Preview (first 5 rows)</p>
          <table className="w-full text-xs font-montserrat">
            <thead>
              <tr>
                {Object.keys(preview[0]).slice(0, 6).map(k => (
                  <th key={k} className="text-white/40 text-left px-2 py-1 uppercase tracking-wider">{k}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview.map((row, i) => (
                <tr key={i} className="border-t border-white/10">
                  {Object.values(row).slice(0, 6).map((val, j) => (
                    <td key={j} className="text-white/70 px-2 py-1.5 truncate max-w-[100px]">{String(val)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Import Button */}
      {file && (
        <div className="mt-5">
          <motion.button
            onClick={handleImport}
            disabled={importing}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="yuva-btn-primary w-full"
          >
            {importing ? 'Importing...' : `Import Delegates from CSV →`}
          </motion.button>
        </div>
      )}

      {/* Result */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="yuva-card p-5 mt-5"
        >
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle size={20} className="text-green-400" />
            <p className="font-montserrat font-700 text-green-400">
              {result.success} delegates imported successfully
            </p>
          </div>
          {result.errors.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={14} className="text-yellow-400" />
                <p className="text-yellow-400 font-montserrat text-sm font-600">{result.errors.length} errors</p>
              </div>
              <ul className="space-y-1">
                {result.errors.map((e, i) => (
                  <li key={i} className="text-white/50 text-xs font-montserrat">{e}</li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
