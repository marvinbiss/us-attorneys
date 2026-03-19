import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Unmock logger so we test the real implementation (global mock is in setup.ts)
vi.unmock('@/lib/logger')

// We need to test the logger module, but it reads process.env.NODE_ENV at module load time.
// We'll import it dynamically in some tests.

describe('logger', () => {
  let logger: typeof import('@/lib/logger')

  beforeEach(async () => {
    vi.resetModules()
    // In test (non-production), all log levels should be output
    logger = await import('@/lib/logger')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('createLogger (default)', () => {
    it('exports a default logger instance', () => {
      expect(logger.logger).toBeDefined()
      expect(typeof logger.logger.debug).toBe('function')
      expect(typeof logger.logger.info).toBe('function')
      expect(typeof logger.logger.warn).toBe('function')
      expect(typeof logger.logger.error).toBe('function')
    })

    it('exports named child loggers', () => {
      expect(logger.apiLogger).toBeDefined()
      expect(logger.dbLogger).toBeDefined()
      expect(logger.authLogger).toBeDefined()
      expect(logger.seoLogger).toBeDefined()
      expect(logger.ingestLogger).toBeDefined()
      expect(logger.paymentLogger).toBeDefined()
    })

    it('logger.info outputs to console.log', () => {
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
      logger.logger.info('test message')
      expect(spy).toHaveBeenCalled()
      expect(spy.mock.calls[0][0]).toContain('[INFO]')
      expect(spy.mock.calls[0][0]).toContain('test message')
    })

    it('logger.warn outputs to console.warn', () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      logger.logger.warn('warning message')
      expect(spy).toHaveBeenCalled()
      expect(spy.mock.calls[0][0]).toContain('[WARN]')
      expect(spy.mock.calls[0][0]).toContain('warning message')
    })

    it('logger.error outputs to console.error', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
      logger.logger.error('error message', new Error('test error'))
      expect(spy).toHaveBeenCalled()
      expect(spy.mock.calls[0][0]).toContain('[ERROR]')
      expect(spy.mock.calls[0][0]).toContain('error message')
      expect(spy.mock.calls[0][0]).toContain('test error')
    })

    it('logger.debug outputs to console.log in non-production', () => {
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
      logger.logger.debug('debug message')
      expect(spy).toHaveBeenCalled()
      expect(spy.mock.calls[0][0]).toContain('[DEBUG]')
    })
  })

  describe('log message format', () => {
    it('includes ISO timestamp', () => {
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
      logger.logger.info('test')
      const output = spy.mock.calls[0][0] as string
      // Should start with [timestamp]
      expect(output).toMatch(/^\[\d{4}-\d{2}-\d{2}T/)
    })

    it('includes context data as JSON', () => {
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
      logger.logger.info('test', { userId: '123', action: 'login' })
      const output = spy.mock.calls[0][0] as string
      expect(output).toContain('"userId":"123"')
      expect(output).toContain('"action":"login"')
    })
  })

  describe('child logger', () => {
    it('includes component tag in output', () => {
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
      logger.apiLogger.info('request received')
      const output = spy.mock.calls[0][0] as string
      expect(output).toContain('[api]')
      expect(output).toContain('request received')
    })

    it('child of child merges context', () => {
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
      const childLogger = logger.apiLogger.child({ attorneyId: 'atty-1' })
      childLogger.info('fetched')
      const output = spy.mock.calls[0][0] as string
      expect(output).toContain('[api]')
      expect(output).toContain('"attorneyId":"atty-1"')
    })

    it('does not include component key in serialized context (avoids redundancy)', () => {
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
      logger.apiLogger.info('test')
      const output = spy.mock.calls[0][0] as string
      // component appears as [api] tag but not in JSON
      expect(output).toContain('[api]')
      // The JSON context should not contain "component":"api"
      const jsonPart = output.slice(output.indexOf('{'))
      if (jsonPart.startsWith('{')) {
        expect(jsonPart).not.toContain('"component"')
      }
    })
  })

  describe('api sub-logger', () => {
    it('api.request logs with debug level', () => {
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
      logger.logger.api.request('/api/attorneys', 'GET')
      expect(spy).toHaveBeenCalled()
      expect(spy.mock.calls[0][0]).toContain('API GET /api/attorneys')
    })

    it('api.success logs with info level', () => {
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
      logger.logger.api.success('/api/attorneys')
      expect(spy).toHaveBeenCalled()
      expect(spy.mock.calls[0][0]).toContain('API success: /api/attorneys')
    })

    it('api.error logs with error level', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
      logger.logger.api.error('/api/attorneys', new Error('DB down'))
      expect(spy).toHaveBeenCalled()
      expect(spy.mock.calls[0][0]).toContain('API error: /api/attorneys')
    })
  })

  describe('error handling', () => {
    it('handles Error objects in error method', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const err = new Error('connection failed')
      logger.logger.error('DB error', err)
      const output = spy.mock.calls[0][0] as string
      expect(output).toContain('connection failed')
      expect(output).toContain('"name":"Error"')
    })

    it('handles non-Error objects in error method', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
      logger.logger.error('weird error', { code: 500, msg: 'fail' })
      const output = spy.mock.calls[0][0] as string
      expect(output).toContain('weird error')
    })

    it('handles undefined error parameter', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
      logger.logger.error('no error object')
      expect(spy).toHaveBeenCalled()
    })
  })
})
