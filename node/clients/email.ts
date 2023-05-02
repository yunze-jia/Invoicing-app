import { ExternalClient, InstanceOptions, IOContext } from "@vtex/api";

export default class Email extends ExternalClient{
    constructor(context: IOContext, options?: InstanceOptions){
        super(`http://${context.account}.vtexcommercestable.com.br/`,context,{
            ...options,
            headers:{
                ...options?.headers,
                VtexIdClientAutCookie: context.authToken,
                requestervtexidclientautcookie: context.authToken,
                'X-Vtex-Use-Https': 'true'
            }
        })
    }

    public async notify(account:string, payload:any){
        console.log({account});
        
        return this.http.post(`api/mail-service/pvt/sendmail`,payload);
    }

}