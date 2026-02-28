import { Router, RouterContext } from '@oak/oak';

const router = new Router();

router.post('/logout', async (ctx: RouterContext<string>) => {
  const host = ctx.request.url.hostname;
  const isSecure = host !== 'localhost' && host !== '127.0.0.1';

  await ctx.cookies.set('pldyn-auth', '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
    secure: isSecure,
  });

  ctx.response.status = 200;
  ctx.response.body = { message: 'Logged out' };
});

export default {
  name: 'Logout',
  router: router
};
