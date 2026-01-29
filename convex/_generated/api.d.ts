/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as lib_access from "../lib/access.js";
import type * as lib_constants from "../lib/constants.js";
import type * as lib_dates from "../lib/dates.js";
import type * as lib_permissions from "../lib/permissions.js";
import type * as lib_slugs from "../lib/slugs.js";
import type * as locations from "../locations.js";
import type * as parishes from "../parishes.js";
import type * as schedules from "../schedules.js";
import type * as setup from "../setup.js";
import type * as tokens from "../tokens.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "lib/access": typeof lib_access;
  "lib/constants": typeof lib_constants;
  "lib/dates": typeof lib_dates;
  "lib/permissions": typeof lib_permissions;
  "lib/slugs": typeof lib_slugs;
  locations: typeof locations;
  parishes: typeof parishes;
  schedules: typeof schedules;
  setup: typeof setup;
  tokens: typeof tokens;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
