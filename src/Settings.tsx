import { LANGUAGES, type Lang } from './i18n';
import type { Prefs } from './prefs';
import type { LedgerData } from './ledger';

export default function Settings(props: {
  tr: (k: string) => string;
  prefs: Prefs;
  setPrefs: (fn: (p: Prefs) => Prefs) => void;
  data: LedgerData;
  onExport: () => void;
  onImport: (f: File) => void;
  onExportCsv: () => void;
}) {
  const { tr, prefs } = props;
  return (
    <div className="card form">
      <h2>{tr('settings')}</h2>

      <label>
        {tr('language')}
        <select
          value={prefs.lang}
          onChange={(e) => props.setPrefs((p) => ({ ...p, lang: e.target.value as Lang }))}
        >
          {LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>
              {l.label}
            </option>
          ))}
        </select>
      </label>

      <label className="toggle-row">
        <input
          type="checkbox"
          checked={prefs.largeText}
          onChange={(e) => props.setPrefs((p) => ({ ...p, largeText: e.target.checked }))}
        />
        {tr('largeText')}
      </label>

      <h3 className="section-title">{tr('backup')}</h3>
      <div className="action-row">
        <button className="btn primary" onClick={props.onExport}>
          ⬇ {tr('exportData')}
        </button>
        <button className="btn ghost" onClick={props.onExportCsv}>
          📄 {tr('exportCsv')}
        </button>
        <label className="btn ghost file-btn">
          ⬆ {tr('importData')}
          <input
            type="file"
            accept="application/json,.json"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) props.onImport(f);
              e.target.value = '';
            }}
          />
        </label>
      </div>

      <p className="privacy-note">{tr('privacy')}</p>
    </div>
  );
}
