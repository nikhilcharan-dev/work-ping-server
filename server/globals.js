import { asyncHandler } from "./utils/async.handler.js";
import { AppError } from "./utils/app.error.js";

globalThis.asyncHandler = asyncHandler;
globalThis.AppError = AppError;