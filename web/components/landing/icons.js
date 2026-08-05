export function icon(name, className = 'h-5 w-5') {
  const icons = {
    menu: `<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M4 7h16M4 12h16M4 17h16"/>`,
    close: `<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M6 6l12 12M18 6L6 18"/>`,
    arrowRight: `<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M5 12h14m-6-6 6 6-6 6"/>`,
    shield: `<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M12 3 5 6v5c0 4.5 3 8.2 7 9.5 4-1.3 7-5 7-9.5V6l-7-3Z"/>`,
    file: `<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M8 3h6l4 4v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm6 0v4h4"/>`,
    search: `<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm10 2-4.3-4.3"/>`,
    archive: `<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M4 8V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2M4 8h16v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8Zm4 5h8"/>`,
    bolt: `<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M13 3 6 14h5l-1 7 8-12h-5l0-6Z"/>`,
    lock: `<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M8 11V8a4 4 0 1 1 8 0v3m-9 0h10v8a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-8Z"/>`,
    grid: `<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 0h7v7h-7v-7Z"/>`,
    users: `<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1m14 0v-1a5 5 0 0 0-3-4.6M12 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7-1a2.5 2.5 0 1 0 0-5"/>`,
    discord: `<path fill="currentColor" d="M19.3 5.1A16.5 16.5 0 0 0 15.2 4l-.3.6c1.5.4 2.3 1 3.1 1.7A12.8 12.8 0 0 0 8.9 5.7c.8-.7 1.7-1.3 3.1-1.7L11.7 4A16.3 16.3 0 0 0 7.6 5.1C4.6 9.6 3.8 13.9 4.2 18.2A16.4 16.4 0 0 0 9.3 20l.7-1a10.7 10.7 0 0 1-1.1-.5l.3-.2c2.5 1.2 5.2 1.2 7.6 0l.3.2c-.3.2-.7.4-1.1.5l.7 1a16.4 16.4 0 0 0 5.1-1.8c.5-5 .1-9.3-2.5-13.1ZM9.7 15.4c-.8 0-1.5-.8-1.5-1.7s.6-1.7 1.5-1.7 1.5.8 1.5 1.7-.7 1.7-1.5 1.7Zm4.6 0c-.8 0-1.5-.8-1.5-1.7s.6-1.7 1.5-1.7 1.5.8 1.5 1.7-.7 1.7-1.5 1.7Z"/>`,
    eye: `<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.75"/>`,
    eyeOff: `<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="m4 4 16 16M10 6.1A10.5 10.5 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-2.3 3.2M7 7.4A16 16 0 0 0 2 12s3.5 7 10 7a10 10 0 0 0 4-.8M10.5 10.5a3 3 0 0 0 4.2 4.2"/>`,
    spinner: `<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-opacity="0.25" stroke-width="1.75"/><path stroke="currentColor" stroke-linecap="round" stroke-width="1.75" d="M21 12a9 9 0 0 0-9-9"/>`,
    check: `<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="m5 13 4 4L19 7"/>`,
    alert: `<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M12 9v4m0 4h.01M10.3 4.3 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0Z"/>`,
    arrowLeft: `<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M19 12H5m6-6-6 6 6 6"/>`,
    settings: `<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M19.4 13a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V19a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H5a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H10a1.7 1.7 0 0 0 1-1.5V5a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V10c0 .7.4 1.3 1 1.5H19a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>`,
    bell: `<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0a3 3 0 1 1-6 0"/>`,
    chevronDown: `<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="m6 9 6 6 6-6"/>`,
    home: `<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z"/>`,
    book: `<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/>`,
  };

  const content = icons[name] ?? '';
  const strokeProps = name === 'discord' ? '' : 'fill="none" stroke="currentColor"';

  return `<svg class="${className}" viewBox="0 0 24 24" aria-hidden="true" ${strokeProps}>${content}</svg>`;
}
