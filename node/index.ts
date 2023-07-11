import type {
  ClientsConfig,
  IOContext,
  RecorderState,
  SegmentData,
  ServiceContext,
} from '@vtex/api'
import { LRUCache, Service, method } from '@vtex/api'

import { Clients } from './clients'
import { getBuyerEmail, getBuyerInvoiceDetails } from './middlewares/buyer'
import { getOrderDetails } from './middlewares/getOrder'
import { orderHooks } from './middlewares/orderHooks'
import { ordersWebhook, trigger } from './middlewares/ordersWebhook'
import { sellerInvoiceInfo } from './middlewares/seller'

const TIMEOUT_MS = 800
const TREE_SECONDS_MS = 3 * 1000
const CONCURRENCY = 10
// const os = require('os')
// const { exec } = require('child_process')
// Create a LRU memory cache for the Status client.
// The @vtex/api HttpClient respects Cache-Control headers and uses the provided cache.
const memoryCache = new LRUCache<string, any>({ max: 5000 })

metrics.trackCache('status', memoryCache)

// This is the configuration for clients available in `ctx.clients`.
const clients: ClientsConfig<Clients> = {
  // We pass our custom implementation of the clients bag, containing the Status client.
  implementation: Clients,
  options: {
    // All IO Clients will be initialized with these options, unless otherwise specified.
    default: {
      retries: 2,
      timeout: TIMEOUT_MS,
    },
    events: {
      exponentialTimeoutCoefficient: 2,
      exponentialBackoffCoefficient: 2,
      initialBackoffDelay: 50,
      retries: 1,
      timeout: TREE_SECONDS_MS,
      concurrency: CONCURRENCY,
    },
    // This key will be merged with the default options and add this cache to our Status client.
    status: {
      memoryCache,
    },
  },
}

declare global {
  // We declare a global Context type just to avoid re-writing ServiceContext<Clients, State> in every handler and resolver
  type Context = ServiceContext<Clients, State>

  interface CustomIOContext extends IOContext {
    currentProfile: CurrentProfile
    segment?: SegmentData
    orderFormId?: string
    ownerId?: string
  }

  interface CurrentProfile {
    email: string
    userId: string
  }

  interface CustomContext {
    vtex: CustomIOContext
  }

  // The shape of our State object found in `ctx.state`. This is used as state bag to communicate between middlewares.
  interface State extends RecorderState {
    code: number
  }
}

// Export a service that defines route handlers and client options.
export default new Service({
  clients,
  routes: {
    // `status` is the route ID from service.json. It maps to an array of middlewares (or a single handler).
    ordersWebhook: method({
      POST: [ordersWebhook],
    }),
    createOrderHooks: method({
      GET: [orderHooks],
    }),
    getOrder: method({
      POST: [getOrderDetails],
    }),
    buyerInvoice: method({
      GET: [getBuyerInvoiceDetails],
    }),
    sellerInvoiceInfo: method({
      POST: [sellerInvoiceInfo],
    }),
    buyerEncrptEnvoice: method({
      GET: [getBuyerEmail],
    }),
  },
  events: {
    trigger,
  },
})
