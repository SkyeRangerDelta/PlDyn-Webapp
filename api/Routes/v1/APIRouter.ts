// Main router handler
import { Router } from '@oak/oak/router';
import { JellyfinRouter } from './JellyfinRouter.ts';

const APIRouter = new Router();

APIRouter
  .get('/status', (ctx) => {
    const appMemory = Deno.memoryUsage();
    const systemMemory = Deno.systemMemoryInfo();
    const uptime = Deno.osUptime();

    ctx.response.body = {
      hostname: Deno.hostname(),
      appMemory: {
        resident: appMemory.rss,
        residentFormatted: humanizeBytes( appMemory.rss ),
        heapTotal: Deno.memoryUsage().heapTotal,
        heapTotalFormatted: humanizeBytes( appMemory.heapTotal ),
        heapUsed: Deno.memoryUsage().heapUsed,
        heapUsedFormatted: humanizeBytes( appMemory.heapUsed ),
      },
      systemMemory: {
        total: systemMemory.total,
        totalFormatted: humanizeBytes( systemMemory.total ),
        free: Deno.systemMemoryInfo().free,
        freeFormatted: humanizeBytes( systemMemory.free ),
      },
      osUptimeSeconds: uptime,
      osUpTimeFormatted: humanizeTime( uptime ),
    };
  });

APIRouter.use('/jellyfin', JellyfinRouter.routes(), JellyfinRouter.allowedMethods());

function humanizeBytes( byteCount: number ) {
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  let i = 0;

  while ( byteCount >= 1024 ) {
    byteCount /= 1024;
    i++;
  }

  return `${byteCount.toFixed(2)}${units[i]}`;
}

function humanizeTime( seconds: number ) {
  const units = ['s', 'm', 'h', 'd', 'w', 'y'];
  let i = 0;

  while ( seconds >= 60 ) {
    seconds /= 60;
    i++;
  }

  return `${seconds.toFixed(2)}${units[i]}`;
}

export { APIRouter };