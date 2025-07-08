import test from 'tape';

// Test Q CLI process management functionality
test('QCliProcessManagement - command building', (t) => {
  // Test Q CLI command building logic
  const buildQCliCommand = (username, envFile, projectDir, qCliArgs) => {
    return [
      'sudo', '-u', username,
      '-i', 'bash', '-c',
      `source ${envFile} && cd ${projectDir} && q ${qCliArgs.join(' ')}`
    ];
  };

  const username = 'q-assistant-test';
  const envFile = '/home/q-assistant-test/.no-wing/env';
  const projectDir = '/home/q-assistant-test/workspace/project';
  const qCliArgs = ['chat', '--verbose'];

  const command = buildQCliCommand(username, envFile, projectDir, qCliArgs);

  t.equal(command[0], 'sudo', 'Should start with sudo');
  t.equal(command[1], '-u', 'Should use -u flag');
  t.equal(command[2], username, 'Should use correct username');
  t.equal(command[3], '-i', 'Should use interactive shell');
  t.equal(command[4], 'bash', 'Should use bash');
  t.equal(command[5], '-c', 'Should use -c flag');
  t.ok(command[6].includes('source'), 'Should source environment file');
  t.ok(command[6].includes('cd'), 'Should change to project directory');
  t.ok(command[6].includes('q chat --verbose'), 'Should include Q CLI command');

  t.end();
});

test('QCliProcessManagement - environment variables', (t) => {
  // Test environment variable setup for Q CLI
  const buildEnvironment = (config) => {
    return {
      ...process.env,
      HOME: config.homeDirectory,
      USER: config.username,
      AWS_PROFILE: config.awsProfile,
      GIT_AUTHOR_NAME: config.gitIdentity.name,
      GIT_AUTHOR_EMAIL: config.gitIdentity.email,
      GIT_COMMITTER_NAME: config.gitIdentity.name,
      GIT_COMMITTER_EMAIL: config.gitIdentity.email
    };
  };

  const config = {
    homeDirectory: '/home/q-assistant-test',
    username: 'q-assistant-test',
    awsProfile: 'q-assistant-test',
    gitIdentity: {
      name: 'Q Assistant (test)',
      email: 'q-assistant+test@no-wing.dev'
    }
  };

  const env = buildEnvironment(config);

  t.equal(env.HOME, config.homeDirectory, 'Should set HOME directory');
  t.equal(env.USER, config.username, 'Should set USER');
  t.equal(env.AWS_PROFILE, config.awsProfile, 'Should set AWS_PROFILE');
  t.equal(env.GIT_AUTHOR_NAME, config.gitIdentity.name, 'Should set GIT_AUTHOR_NAME');
  t.equal(env.GIT_AUTHOR_EMAIL, config.gitIdentity.email, 'Should set GIT_AUTHOR_EMAIL');
  t.equal(env.GIT_COMMITTER_NAME, config.gitIdentity.name, 'Should set GIT_COMMITTER_NAME');
  t.equal(env.GIT_COMMITTER_EMAIL, config.gitIdentity.email, 'Should set GIT_COMMITTER_EMAIL');

  t.end();
});

test('QCliProcessManagement - signal handling logic', (t) => {
  // Test signal handling logic
  const handleSignal = (signal, qProcess) => {
    const result = {
      signal,
      action: null,
      timeout: null
    };

    if (qProcess && !qProcess.killed) {
      result.action = 'SIGTERM';
      result.timeout = 5000; // 5 seconds before SIGKILL
    }

    return result;
  };

  // Test with active process
  const activeProcess = { killed: false };
  const activeResult = handleSignal('SIGINT', activeProcess);
  
  t.equal(activeResult.signal, 'SIGINT', 'Should capture signal type');
  t.equal(activeResult.action, 'SIGTERM', 'Should send SIGTERM first');
  t.equal(activeResult.timeout, 5000, 'Should have 5 second timeout');

  // Test with killed process
  const killedProcess = { killed: true };
  const killedResult = handleSignal('SIGINT', killedProcess);
  
  t.equal(killedResult.signal, 'SIGINT', 'Should capture signal type');
  t.equal(killedResult.action, null, 'Should not send signal to killed process');

  // Test with no process
  const noProcessResult = handleSignal('SIGINT', null);
  
  t.equal(noProcessResult.signal, 'SIGINT', 'Should capture signal type');
  t.equal(noProcessResult.action, null, 'Should not send signal when no process');

  t.end();
});

test('QCliProcessManagement - termination logic', (t) => {
  // Test termination logic
  const terminateSession = (qProcess, force = false) => {
    if (!qProcess || qProcess.killed) {
      return {
        status: 'no_process',
        message: 'No active Q CLI session to terminate'
      };
    }

    if (force) {
      return {
        status: 'force_killed',
        signal: 'SIGKILL',
        message: 'Q CLI session force terminated'
      };
    } else {
      return {
        status: 'graceful_termination',
        signal: 'SIGTERM',
        timeout: 5000,
        message: 'Attempting graceful termination'
      };
    }
  };

  // Test graceful termination
  const activeProcess = { killed: false };
  const gracefulResult = terminateSession(activeProcess, false);
  
  t.equal(gracefulResult.status, 'graceful_termination', 'Should attempt graceful termination');
  t.equal(gracefulResult.signal, 'SIGTERM', 'Should use SIGTERM for graceful');
  t.equal(gracefulResult.timeout, 5000, 'Should have timeout for graceful');

  // Test force termination
  const forceResult = terminateSession(activeProcess, true);
  
  t.equal(forceResult.status, 'force_killed', 'Should force kill when requested');
  t.equal(forceResult.signal, 'SIGKILL', 'Should use SIGKILL for force');

  // Test no process
  const noProcessResult = terminateSession(null);
  
  t.equal(noProcessResult.status, 'no_process', 'Should handle no process case');
  t.ok(noProcessResult.message.includes('No active'), 'Should have appropriate message');

  // Test killed process
  const killedProcess = { killed: true };
  const killedResult = terminateSession(killedProcess);
  
  t.equal(killedResult.status, 'no_process', 'Should handle killed process same as no process');

  t.end();
});

test('QCliProcessManagement - session logging structure', (t) => {
  // Test session logging structure for process events
  const createSessionLog = (event, sessionConfig, additionalData = {}) => {
    return {
      timestamp: new Date().toISOString(),
      event,
      sessionId: sessionConfig.sessionId,
      user: sessionConfig.username,
      project: sessionConfig.projectName,
      gitIdentity: sessionConfig.gitIdentity,
      awsProfile: sessionConfig.awsProfile,
      ...additionalData
    };
  };

  const sessionConfig = {
    sessionId: 'q-test-123',
    username: 'q-assistant-test',
    projectName: 'test-project',
    gitIdentity: {
      name: 'Q Assistant (test)',
      email: 'q-assistant+test@no-wing.dev'
    },
    awsProfile: 'q-assistant-test'
  };

  // Test session start log
  const startLog = createSessionLog('session_start', sessionConfig, {
    qCliCommand: ['chat', '--verbose'],
    workingDirectory: '/home/q-assistant-test/workspace/project'
  });

  t.equal(startLog.event, 'session_start', 'Should log session start event');
  t.equal(startLog.sessionId, sessionConfig.sessionId, 'Should include session ID');
  t.equal(startLog.user, sessionConfig.username, 'Should include username');
  t.equal(startLog.project, sessionConfig.projectName, 'Should include project name');
  t.deepEqual(startLog.gitIdentity, sessionConfig.gitIdentity, 'Should include git identity');
  t.equal(startLog.awsProfile, sessionConfig.awsProfile, 'Should include AWS profile');
  t.ok(startLog.qCliCommand, 'Should include Q CLI command');
  t.ok(startLog.workingDirectory, 'Should include working directory');

  // Test session end log
  const endLog = createSessionLog('session_end', sessionConfig, {
    exitCode: 0,
    duration: 1234
  });

  t.equal(endLog.event, 'session_end', 'Should log session end event');
  t.equal(endLog.exitCode, 0, 'Should include exit code');
  t.equal(endLog.duration, 1234, 'Should include duration');

  // Test session error log
  const errorLog = createSessionLog('session_error', sessionConfig, {
    error: {
      message: 'Q CLI process failed',
      name: 'ProcessError',
      stack: 'Error stack trace...'
    }
  });

  t.equal(errorLog.event, 'session_error', 'Should log session error event');
  t.ok(errorLog.error, 'Should include error details');
  t.equal(errorLog.error.message, 'Q CLI process failed', 'Should include error message');
  t.equal(errorLog.error.name, 'ProcessError', 'Should include error name');
  t.ok(errorLog.error.stack, 'Should include error stack');

  t.end();
});

test('QCliProcessManagement - process options validation', (t) => {
  // Test spawn options for Q CLI process
  const buildSpawnOptions = (config) => {
    return {
      stdio: 'inherit',
      env: {
        ...process.env,
        HOME: config.homeDirectory,
        USER: config.username,
        AWS_PROFILE: config.awsProfile,
        GIT_AUTHOR_NAME: config.gitIdentity.name,
        GIT_AUTHOR_EMAIL: config.gitIdentity.email,
        GIT_COMMITTER_NAME: config.gitIdentity.name,
        GIT_COMMITTER_EMAIL: config.gitIdentity.email
      }
    };
  };

  const config = {
    homeDirectory: '/home/q-assistant-test',
    username: 'q-assistant-test',
    awsProfile: 'q-assistant-test',
    gitIdentity: {
      name: 'Q Assistant (test)',
      email: 'q-assistant+test@no-wing.dev'
    }
  };

  const options = buildSpawnOptions(config);

  t.equal(options.stdio, 'inherit', 'Should use inherit stdio for interactive Q CLI');
  t.ok(options.env, 'Should have environment variables');
  t.equal(typeof options.env, 'object', 'Environment should be object');
  t.ok(options.env.HOME, 'Should have HOME in environment');
  t.ok(options.env.USER, 'Should have USER in environment');
  t.ok(options.env.AWS_PROFILE, 'Should have AWS_PROFILE in environment');
  t.ok(options.env.GIT_AUTHOR_NAME, 'Should have GIT_AUTHOR_NAME in environment');

  t.end();
});

test('QCliProcessManagement - command validation', (t) => {
  // Test Q CLI command validation
  const validateQCliCommand = (qCliArgs) => {
    const errors = [];
    
    if (!Array.isArray(qCliArgs)) {
      errors.push('Q CLI arguments must be an array');
      return { valid: false, errors, defaulted: false };
    }
    
    if (qCliArgs.length === 0) {
      // Default to chat is acceptable
      return { valid: true, errors: [], defaulted: true };
    }
    
    // Check for dangerous arguments
    const dangerousArgs = ['--profile', '--credentials', '--config'];
    const hasDangerous = qCliArgs.some(arg => 
      dangerousArgs.some(dangerous => arg.startsWith(dangerous))
    );
    
    if (hasDangerous) {
      errors.push('Dangerous arguments detected (service account will override)');
    }
    
    return {
      valid: errors.length === 0,
      errors,
      defaulted: false
    };
  };

  // Test valid commands
  const validResult = validateQCliCommand(['chat', '--verbose']);
  t.true(validResult.valid, 'Valid command should pass validation');
  t.equal(validResult.errors.length, 0, 'Valid command should have no errors');
  t.false(validResult.defaulted, 'Explicit command should not be defaulted');

  // Test empty command (defaults to chat)
  const emptyResult = validateQCliCommand([]);
  t.true(emptyResult.valid, 'Empty command should be valid (defaults to chat)');
  t.true(emptyResult.defaulted, 'Empty command should be marked as defaulted');

  // Test dangerous command
  const dangerousResult = validateQCliCommand(['chat', '--profile=test']);
  t.false(dangerousResult.valid, 'Dangerous command should fail validation');
  t.true(dangerousResult.errors.length > 0, 'Dangerous command should have errors');
  t.ok(dangerousResult.errors[0].includes('Dangerous'), 'Should mention dangerous arguments');

  // Test invalid input
  const invalidResult = validateQCliCommand('not-an-array');
  t.false(invalidResult.valid, 'Non-array input should fail validation');
  t.ok(invalidResult.errors[0].includes('array'), 'Should mention array requirement');

  t.end();
});
