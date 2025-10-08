declare module 'openai' {
  interface OpenAIResponseCreateParams {
    model: string;
    temperature?: number;
    input: Array<{
      role: string;
      content: Array<{ type: string; text: string }>;
    }>;
    tools?: any;
    response_format?: any;
  }

  interface OpenAIResponse {
    id: string;
    model: string;
    output_text?: string;
    usage?: any;
  }

  export default class OpenAI {
    constructor(options: { apiKey: string; baseURL?: string });
    responses: {
      create(params: OpenAIResponseCreateParams): Promise<OpenAIResponse>;
    };
  }
}
