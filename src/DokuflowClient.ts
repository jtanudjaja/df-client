import DokuflowModelClient from './DokuflowModelClient';

const dokuflowLaxBaseUrl = 'https://lax.dokuflow.com';

type DokuflowClientConfig = {
  spaceName: string;
  apiKey: string;
};

class DokuflowClient {
  constructor(readonly config: DokuflowClientConfig) {}

  model<T>(modelId: string): DokuflowModelClient<T> {
    return new DokuflowModelClient<T>({
      baseUrl: `${dokuflowLaxBaseUrl}/${this.config.spaceName}/${modelId}`,
      apiKey: this.config.apiKey,
    });
  }
}

export default DokuflowClient;
