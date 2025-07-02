export const createMockResponse = (
  data: any,
  options: {
    status?: number;
    statusText?: string;
    headers?: Record<string, string>;
  } = {},
): Response => {
  const { status = 200, statusText = 'OK', headers = {} } = options;

  const mockHeaders = new Map();
  // Always set content-type for proper JSON handling
  mockHeaders.set('content-type', 'application/json');
  Object.entries(headers).forEach(([key, value]) => {
    mockHeaders.set(key, value);
  });

  return {
    ok: status >= 200 && status < 300,
    status,
    statusText,
    headers: {
      get: (name: string) => mockHeaders.get(name) || null,
    },
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    // Add other required Response properties as needed
    redirected: false,
    type: 'basic' as ResponseType,
    url: '',
    clone: jest.fn(),
    body: null,
    bodyUsed: false,
    arrayBuffer: jest.fn(),
    blob: jest.fn(),
    formData: jest.fn(),
  } as any as Response;
};

export const mockFetch = (response: Response) => {
  ((global as any).fetch as jest.Mock).mockResolvedValueOnce(response);
};

export const mockFetchError = (error: Error) => {
  ((global as any).fetch as jest.Mock).mockRejectedValueOnce(error);
};
