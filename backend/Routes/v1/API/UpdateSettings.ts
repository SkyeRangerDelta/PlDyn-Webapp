import { Router, RouterContext } from '@oak/oak';
import { DBHandler } from "../../../Utilities/DBHandler.ts";
import { ClientSettings } from "../../../../frontend/src/app/customTypes.ts";

const router = new Router();

router
  .post('/UpdateSettings', async (ctx: RouterContext<string>) => {
    const Mongo: DBHandler = ctx.state.Mongo;
    const userId = ctx.state.userId as string | undefined;

    if (!userId || typeof userId !== 'string') {
      ctx.response.status = 401;
      ctx.response.body = { status: 401, message: 'Unauthorized', success: false };
      return;
    }

    const body = await ctx.request.body.json();
    const { clientSettings } = body;

    if (!clientSettings || typeof clientSettings !== 'object') {
      ctx.response.status = 400;
      ctx.response.body = { status: 400, message: 'Invalid settings', success: false };
      return;
    }

    // Allowlist of settable fields
    const allowed: Partial<ClientSettings> = {};
    if (typeof clientSettings.lastUsedEditor === 'string') {
      allowed.lastUsedEditor = clientSettings.lastUsedEditor;
    }

    await Mongo.updateOne('UserSettings', { jfId: userId }, { $set: { clientSettings: allowed } });

    ctx.response.body = { status: 200, message: 'Settings updated', success: true };
  });

export default {
  name: 'UpdateSettings',
  router: router
};
