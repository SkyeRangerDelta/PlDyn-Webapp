import { Router, RouterContext } from 'https://deno.land/x/oak/mod.ts';
import { humanizeBytes, humanizeTime } from "../../../Utilities/Formatters.ts";

const router = new Router();

router
  .get('/status', ( ctx: RouterContext<string> ) => {
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

export default {
  name: 'Status',
  router: router
};