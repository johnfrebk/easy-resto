// Backup & Restore: exporta e importa todos los datos de localStorage

const KEYS = ['pos_products', 'pos_orders', 'pos_inv_logs', 'pos_users'];

export function exportBackup() {
  const data: Record<string, unknown> = {};
  for (const key of KEYS) {
    const val = localStorage.getItem(key);
    if (val) data[key] = JSON.parse(val);
  }
  data._exportedAt = new Date().toISOString();
  data._app = 'Abby-RestoPOS';

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `abby-restopos-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importBackup(jsonString: string) {
  const data = JSON.parse(jsonString);
  if (!data._app || data._app !== 'Abby-RestoPOS') {
    throw new Error('Archivo de respaldo inválido');
  }
  for (const key of KEYS) {
    if (data[key]) {
      localStorage.setItem(key, JSON.stringify(data[key]));
    }
  }
}
