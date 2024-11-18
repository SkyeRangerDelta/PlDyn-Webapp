// Main router handler
import { Router } from '@oak/oak/router';
import { APIRouter } from "./v1/APIRouter.ts";
import { JellyfinRouter } from "./v1/JellyfinRouter.ts";

const MainRouter = new Router();

MainRouter.use('/api/v1/jellyfin', JellyfinRouter.routes(), JellyfinRouter.allowedMethods());
MainRouter.use('/api/v1', APIRouter.routes(), APIRouter.allowedMethods());

export { MainRouter };