declare module 'midtrans-client' {
  export class Snap {
    constructor(config: {
      isProduction: boolean;
      serverKey: string;
      clientKey?: string;
    });
    createTransaction(parameter: any): Promise<{ token: string }>;
  }

  export class CoreApi {
    constructor(config: {
      isProduction: boolean;
      serverKey: string;
      clientKey?: string;
    });
    transaction: {
      status(orderId: string): Promise<any>;
    };
  }
}
