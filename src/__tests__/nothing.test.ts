import { nothingCommand } from '../cli/nothing';

// Mock console.log to capture output
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();

describe('nothing command', () => {
  afterEach(() => {
    mockConsoleLog.mockClear();
  });

  afterAll(() => {
    mockConsoleLog.mockRestore();
  });

  it('should display the Jon Snow easter egg', () => {
    nothingCommand();
    
    expect(mockConsoleLog).toHaveBeenCalledWith(
      expect.stringContaining('🐺 WINTER')
    );
    
    expect(mockConsoleLog).toHaveBeenCalledWith(
      expect.stringContaining('You know nothing, Jon Snow')
    );
    
    expect(mockConsoleLog).toHaveBeenCalledWith(
      expect.stringContaining('Q says: "Neither do I. But together… we\'ll learn everything."')
    );
  });

  it('should provide a helpful hint', () => {
    nothingCommand();
    
    expect(mockConsoleLog).toHaveBeenCalledWith(
      expect.stringContaining('Try "no-wing init"')
    );
  });
});
