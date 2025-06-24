export interface JobInterface {
  name: string;
  data: any;
  options?: {
    attempts?: number;
    backoff?: {
      type: 'fixed' | 'exponential';
      delay: number;
    };
    timeout?: number;
  };
}
