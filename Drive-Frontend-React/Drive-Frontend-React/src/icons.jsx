const PATHS = {
  folder: 'M10 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-8z',
  file: 'M6 2a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm7 1.5L18.5 9H13z',
  plus: 'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6z',
  search: 'M15.5 14h-.8l-.3-.3A6.5 6.5 0 1 0 14 15.5l.3.3v.8l5 5 1.5-1.5zm-6 0a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9z',
  grid: 'M3 3h8v8H3zm10 0h8v8h-8zM3 13h8v8H3zm10 0h8v8h-8z',
  list: 'M3 5h18v2H3zm0 6h18v2H3zm0 6h18v2H3z',
  download: 'M5 20h14v-2H5zM19 9h-4V3H9v6H5l7 7z',
  trash: 'M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6zM19 4h-3.5l-1-1h-5l-1 1H5v2h14z',
  upload: 'M9 16h6v-6h4l-7-7-7 7h4zM5 18h14v2H5z',
  newfolder: 'M20 6h-8l-2-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2zm-1 8h-3v3h-2v-3h-3v-2h3V9h2v3h3z',
  chevron: 'M9 6l6 6-6 6-1.4-1.4L12.2 12 7.6 7.4z'
};

export function Icon({ name, size = 24, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true" focusable="false">
      <path d={PATHS[name]} />
    </svg>
  );
}

export function typeColor(item) {
  if (item.kind === 'FOLDER') return '#5f6368';
  const t = (item.mediaType || '').toLowerCase();
  if (t.includes('pdf') || t.startsWith('video')) return '#d93025';
  if (t.startsWith('image') || t.includes('sheet') || t.includes('excel')) return '#188038';
  if (t.includes('word') || t.includes('document') || t.startsWith('text')) return '#1a73e8';
  if (t.includes('zip') || t.includes('compressed')) return '#f9ab00';
  return '#5f6368';
}
