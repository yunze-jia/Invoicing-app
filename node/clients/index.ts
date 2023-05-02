import { IOClients } from '@vtex/api'
import Email from './email'
import OrderClient from './orderClient'
import OrderHooks from './orderHooks'

import Status from './status'

// Extend the default IOClients implementation with our own custom clients.
export class Clients extends IOClients {
  public get status() {
    return this.getOrSet('status', Status)
  }

  public get orderClient(){
    return this.getOrSet('orderClient',OrderClient)
  }

  public get orderHooks(){
    return this.getOrSet('orderHooks',OrderHooks)
  }

  public get email(){
    return this.getOrSet('email',Email)
  }
}
