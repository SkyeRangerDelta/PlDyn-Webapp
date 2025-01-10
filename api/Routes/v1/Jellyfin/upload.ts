import { Router } from '@oak/oak/router';

const router = new Router;

router.post('/upload', async (ctx) => {
  if ( !ctx.request.hasBody || ctx.request.body.type() !== 'form-data' ) {
    ctx.response.status = 400;
    ctx.response.body = { message: 'Invalid request' };
    return;
  }

  const formData = await ctx.request.body.formData();

  console.log( 'Form data:', formData );

  ctx.response.status = 200;
  ctx.response.body = { message: 'Done' };
});

export default {
  name: 'Upload',
  router: router
};
