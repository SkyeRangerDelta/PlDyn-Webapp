// Main router handler
import { Router } from '@oak/oak/router';
import { APIRouter } from "./v1/APIRouter.ts";

const MainRouter = new Router();

MainRouter.use('/api/v1', APIRouter.routes(), APIRouter.allowedMethods());

export { MainRouter };