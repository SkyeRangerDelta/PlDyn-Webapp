export function humanizeBytes( byteCount: number ) {
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  let i = 0;

  while ( byteCount >= 1024 ) {
    byteCount /= 1024;
    i++;
  }

  return `${byteCount.toFixed(2)}${units[i]}`;
}

export function humanizeTime( seconds: number ) {
  const units = ['s', 'm', 'h', 'd', 'w', 'y'];
  let i = 0;

  while ( seconds >= 60 ) {
    seconds /= 60;
    i++;
  }

  return `${seconds.toFixed(2)}${units[i]}`;
}