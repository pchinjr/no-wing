/**
 * QCliArgumentParser - Parse and validate Q CLI arguments for pass-through
 */

export interface ParsedQCliArgs {
  command?: string;
  subcommand?: string;
  options: string[];
  flags: string[];
  isValid: boolean;
  errors?: string[];
}

export interface QCliCommand {
  name: string;
  description: string;
  subcommands?: string[];
  commonOptions?: string[];
  requiresInteractive?: boolean;
}

export class QCliArgumentParser {
  private static readonly KNOWN_COMMANDS: QCliCommand[] = [
    {
      name: 'chat',
      description: 'Start interactive chat session',
      requiresInteractive: true
    },
    {
      name: 'help',
      description: 'Show help information',
      commonOptions: ['--help', '-h']
    },
    {
      name: 'version',
      description: 'Show version information',
      commonOptions: ['--version', '-v']
    }
  ];

  private static readonly GLOBAL_OPTIONS = [
    '--help', '-h',
    '--version', '-v',
    '--verbose',
    '--quiet', '-q',
    '--profile',
    '--region'
  ];

  private static readonly DANGEROUS_OPTIONS = [
    '--config',
    '--credentials',
    '--profile' // We'll override this with service account profile
  ];

  /**
   * Parse Q CLI arguments from command line
   */
  parseArguments(args: string[]): ParsedQCliArgs {
    if (!args || args.length === 0) {
      // Default to chat command if no arguments provided
      return {
        command: 'chat',
        options: [],
        flags: [],
        isValid: true
      };
    }

    const result: ParsedQCliArgs = {
      options: [],
      flags: [],
      isValid: true,
      errors: []
    };

    let i = 0;
    
    // First argument might be a command
    if (args[i] && !args[i].startsWith('-')) {
      const potentialCommand = args[i].toLowerCase();
      const knownCommand = QCliArgumentParser.KNOWN_COMMANDS.find(cmd => cmd.name === potentialCommand);
      
      if (knownCommand) {
        result.command = potentialCommand;
        i++;
      } else {
        // Unknown command, but let Q CLI handle it
        result.command = potentialCommand;
        i++;
      }
    }

    // Parse remaining arguments
    while (i < args.length) {
      const arg = args[i];
      
      if (arg.startsWith('--')) {
        // Long option
        if (arg.includes('=')) {
          // Option with value: --option=value
          const [option, value] = arg.split('=', 2);
          if (this.isDangerousOption(option)) {
            result.errors?.push(`Option ${option} is not allowed (service account will provide appropriate value)`);
            result.isValid = false;
          } else {
            result.options.push(arg);
          }
        } else {
          // Option that might have separate value: --option value
          if (this.isDangerousOption(arg)) {
            result.errors?.push(`Option ${arg} is not allowed (service account will provide appropriate value)`);
            result.isValid = false;
            // Skip next argument if it's the value for this option
            if (i + 1 < args.length && !args[i + 1].startsWith('-')) {
              i++;
            }
          } else if (this.isOptionWithValue(arg) && i + 1 < args.length && !args[i + 1].startsWith('-')) {
            // Option with separate value
            result.options.push(arg, args[i + 1]);
            i++;
          } else {
            // Flag option
            result.flags.push(arg);
          }
        }
      } else if (arg.startsWith('-') && arg.length > 1) {
        // Short option(s)
        if (arg.length === 2) {
          // Single short option: -h
          const option = arg;
          if (this.isDangerousOption(option)) {
            result.errors?.push(`Option ${option} is not allowed (service account will provide appropriate value)`);
            result.isValid = false;
          } else if (this.isOptionWithValue(option) && i + 1 < args.length && !args[i + 1].startsWith('-')) {
            // Short option with separate value
            result.options.push(option, args[i + 1]);
            i++;
          } else {
            // Short flag
            result.flags.push(option);
          }
        } else {
          // Multiple short options: -abc
          for (let j = 1; j < arg.length; j++) {
            const shortFlag = `-${arg[j]}`;
            if (this.isDangerousOption(shortFlag)) {
              result.errors?.push(`Option ${shortFlag} is not allowed (service account will provide appropriate value)`);
              result.isValid = false;
            } else {
              result.flags.push(shortFlag);
            }
          }
        }
      } else {
        // Positional argument or subcommand
        if (!result.command) {
          result.command = arg;
        } else if (!result.subcommand) {
          result.subcommand = arg;
        } else {
          // Additional positional arguments
          result.options.push(arg);
        }
      }
      
      i++;
    }

    return result;
  }

  /**
   * Validate parsed arguments for security and compatibility
   */
  validateArguments(parsed: ParsedQCliArgs): { valid: boolean; errors: string[] } {
    const errors: string[] = [...(parsed.errors || [])];

    // Check for dangerous combinations
    if (parsed.command === 'help' && parsed.options.length === 0 && parsed.flags.length === 0) {
      // Plain help command is fine
    } else if (parsed.command === 'version' && parsed.options.length === 0 && parsed.flags.length === 0) {
      // Plain version command is fine
    }

    // Validate command exists
    if (parsed.command) {
      const knownCommand = QCliArgumentParser.KNOWN_COMMANDS.find(cmd => cmd.name === parsed.command);
      if (!knownCommand) {
        // Unknown command - let Q CLI handle it, but warn
        console.warn(`Warning: Unknown Q CLI command '${parsed.command}' - passing through to Q CLI`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Build Q CLI command array for execution
   */
  buildQCliCommand(parsed: ParsedQCliArgs): string[] {
    const command: string[] = [];

    // Add command
    if (parsed.command) {
      command.push(parsed.command);
    }

    // Add subcommand
    if (parsed.subcommand) {
      command.push(parsed.subcommand);
    }

    // Add flags
    command.push(...parsed.flags);

    // Add options
    command.push(...parsed.options);

    return command;
  }

  /**
   * Get help text for Q CLI integration
   */
  getUsageHelp(): string {
    return `
🚀 Q CLI Integration Usage:

Basic usage:
  no-wing launch                    # Start Q chat session
  no-wing launch chat               # Start Q chat session (explicit)
  no-wing launch --help             # Show Q CLI help
  no-wing launch --version          # Show Q CLI version

Advanced usage:
  no-wing launch chat --verbose     # Start chat with verbose output
  no-wing launch help               # Show Q CLI help

🛡️ Security Notes:
  • Q CLI runs with service account identity (${process.env.USER} → q-assistant-{project})
  • AWS credentials automatically provided by service account
  • Git identity automatically set to Q Assistant
  • Some options (--profile, --credentials) are overridden for security

🔧 Service Account Context:
  • All Q operations use dedicated service account credentials
  • Git commits will show "Q Assistant (project)" as author
  • AWS operations use q-assistant-{project} IAM user
  • Complete audit trail of Q vs human actions
`;
  }

  /**
   * Check if option is dangerous and should be blocked
   */
  private isDangerousOption(option: string): boolean {
    return QCliArgumentParser.DANGEROUS_OPTIONS.includes(option);
  }

  /**
   * Check if option expects a value
   */
  private isOptionWithValue(option: string): boolean {
    const optionsWithValues = [
      '--profile', '--region', '--output',
      '-p', '-r', '-o'
    ];
    return optionsWithValues.includes(option);
  }

  /**
   * Get command information
   */
  getCommandInfo(commandName: string): QCliCommand | undefined {
    return QCliArgumentParser.KNOWN_COMMANDS.find(cmd => cmd.name === commandName);
  }

  /**
   * Check if command requires interactive session
   */
  requiresInteractive(parsed: ParsedQCliArgs): boolean {
    if (!parsed.command) return true; // Default chat is interactive
    
    const commandInfo = this.getCommandInfo(parsed.command);
    return commandInfo?.requiresInteractive || false;
  }
}
