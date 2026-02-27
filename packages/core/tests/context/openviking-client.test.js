/**
 * OpenVikingClient Tests
 *
 * Tests for the OpenViking HTTP client implementation.
 */
import { OpenVikingClient } from '../../src/context/openviking-client.js';
// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;
describe('OpenVikingClient', () => {
    let client;
    beforeEach(() => {
        client = new OpenVikingClient({ serverUrl: 'http://localhost:2033/mcp' });
        mockFetch.mockReset();
    });
    describe('constructor', () => {
        it('should create instance with provided config', () => {
            expect(client.isConnected()).toBe(false);
        });
        it('should use default timeout when not specified', () => {
            const clientWithDefaults = new OpenVikingClient({
                serverUrl: 'http://localhost:8080',
            });
            expect(clientWithDefaults.isConnected()).toBe(false);
        });
        it('should accept custom timeout', () => {
            const clientWithTimeout = new OpenVikingClient({
                serverUrl: 'http://localhost:8080',
                timeout: 5000,
            });
            expect(clientWithTimeout.isConnected()).toBe(false);
        });
    });
    describe('connect', () => {
        it('should connect successfully when server is available', async () => {
            mockFetch.mockResolvedValueOnce({ ok: true });
            await client.connect();
            expect(client.isConnected()).toBe(true);
            expect(mockFetch).toHaveBeenCalledWith('http://localhost:2033/mcp', expect.objectContaining({
                method: 'GET',
            }));
        });
        it('should throw when server returns non-OK status', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
            });
            await expect(client.connect()).rejects.toThrow('Failed to connect to OpenViking: Server returned 500');
            expect(client.isConnected()).toBe(false);
        });
        it('should throw when server is not available', async () => {
            mockFetch.mockRejectedValueOnce(new Error('Connection refused'));
            await expect(client.connect()).rejects.toThrow('Failed to connect to OpenViking: Connection refused');
            expect(client.isConnected()).toBe(false);
        });
        it('should handle timeout errors', async () => {
            const abortError = new Error('The operation was aborted');
            abortError.name = 'AbortError';
            mockFetch.mockRejectedValueOnce(abortError);
            await expect(client.connect()).rejects.toThrow('Failed to connect to OpenViking');
        });
    });
    describe('disconnect', () => {
        it('should disconnect successfully', async () => {
            mockFetch.mockResolvedValueOnce({ ok: true });
            await client.connect();
            expect(client.isConnected()).toBe(true);
            await client.disconnect();
            expect(client.isConnected()).toBe(false);
        });
        it('should be safe to call when not connected', async () => {
            await client.disconnect();
            expect(client.isConnected()).toBe(false);
        });
    });
    describe('query', () => {
        it('should throw when not connected', async () => {
            await expect(client.query('test question')).rejects.toThrow('Client not connected');
        });
        it('should query successfully when connected', async () => {
            mockFetch.mockResolvedValueOnce({ ok: true }); // connect
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ result: 'query result' }),
            });
            await client.connect();
            const result = await client.query('test question');
            expect(result).toBe('query result');
            expect(mockFetch).toHaveBeenCalledTimes(2);
        });
        it('should pass query parameters correctly', async () => {
            mockFetch.mockResolvedValueOnce({ ok: true }); // connect
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ result: 'result' }),
            });
            await client.connect();
            await client.query('test question', { topK: 10 });
            const lastCall = mockFetch.mock.calls[1];
            const body = JSON.parse(lastCall?.[1]?.body);
            expect(body.method).toBe('query');
            expect(body.params.question).toBe('test question');
            expect(body.params.topK).toBe(10);
        });
        it('should use default topK when not specified', async () => {
            mockFetch.mockResolvedValueOnce({ ok: true }); // connect
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ result: 'result' }),
            });
            await client.connect();
            await client.query('test question');
            const lastCall = mockFetch.mock.calls[1];
            const body = JSON.parse(lastCall?.[1]?.body);
            expect(body.params.topK).toBe(5);
        });
        it('should handle response with content field', async () => {
            mockFetch.mockResolvedValueOnce({ ok: true }); // connect
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ content: 'content response' }),
            });
            await client.connect();
            const result = await client.query('test question');
            expect(result).toBe('content response');
        });
        it('should handle response with object result', async () => {
            mockFetch.mockResolvedValueOnce({ ok: true }); // connect
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ result: { data: 'nested' } }),
            });
            await client.connect();
            const result = await client.query('test question');
            expect(result).toBe('{"data":"nested"}');
        });
        it('should throw on non-OK response', async () => {
            mockFetch.mockResolvedValueOnce({ ok: true }); // connect
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
            });
            await client.connect();
            await expect(client.query('test')).rejects.toThrow('Query failed: 500');
        });
        it('should handle network errors during query', async () => {
            mockFetch.mockResolvedValueOnce({ ok: true }); // connect
            mockFetch.mockRejectedValueOnce(new Error('Network error'));
            await client.connect();
            await expect(client.query('test')).rejects.toThrow('Query failed: Network error');
        });
    });
    describe('addResource', () => {
        it('should throw when not connected', async () => {
            await expect(client.addResource('/path/to/resource')).rejects.toThrow('Client not connected');
        });
        it('should add resource successfully when connected', async () => {
            mockFetch.mockResolvedValueOnce({ ok: true }); // connect
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ id: 'resource-123' }),
            });
            await client.connect();
            const id = await client.addResource('/test/path');
            expect(id).toBe('resource-123');
        });
        it('should send correct parameters for addResource', async () => {
            mockFetch.mockResolvedValueOnce({ ok: true }); // connect
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ id: 'res-1' }),
            });
            await client.connect();
            await client.addResource('/path/to/file.txt');
            const lastCall = mockFetch.mock.calls[1];
            const body = JSON.parse(lastCall?.[1]?.body);
            expect(body.method).toBe('add_resource');
            expect(body.params.resource_path).toBe('/path/to/file.txt');
        });
        it('should handle response with nested result.id', async () => {
            mockFetch.mockResolvedValueOnce({ ok: true }); // connect
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ result: { id: 'nested-resource-id' } }),
            });
            await client.connect();
            const id = await client.addResource('/test/path');
            expect(id).toBe('nested-resource-id');
        });
        it('should return empty string when no id in response', async () => {
            mockFetch.mockResolvedValueOnce({ ok: true }); // connect
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true }),
            });
            await client.connect();
            const id = await client.addResource('/test/path');
            expect(id).toBe('');
        });
        it('should throw on non-OK response', async () => {
            mockFetch.mockResolvedValueOnce({ ok: true }); // connect
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 403,
            });
            await client.connect();
            await expect(client.addResource('/path')).rejects.toThrow('Add resource failed: 403');
        });
        it('should handle network errors during addResource', async () => {
            mockFetch.mockResolvedValueOnce({ ok: true }); // connect
            mockFetch.mockRejectedValueOnce(new Error('Connection lost'));
            await client.connect();
            await expect(client.addResource('/path')).rejects.toThrow('Add resource failed: Connection lost');
        });
    });
    describe('isConnected', () => {
        it('should return false initially', () => {
            expect(client.isConnected()).toBe(false);
        });
        it('should return true after connect', async () => {
            mockFetch.mockResolvedValueOnce({ ok: true });
            await client.connect();
            expect(client.isConnected()).toBe(true);
        });
        it('should return false after disconnect', async () => {
            mockFetch.mockResolvedValueOnce({ ok: true });
            await client.connect();
            await client.disconnect();
            expect(client.isConnected()).toBe(false);
        });
    });
});
//# sourceMappingURL=openviking-client.test.js.map