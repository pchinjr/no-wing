import chalk from 'chalk';

export function nothingCommand(): void {
  console.log(chalk.blue(`
╭───────────────╮
│   🐺 WINTER   │
│     IS        │
│   COMING      │
╰──────┬────────╯
       │
       ▼
 ❄️ You know nothing, Jon Snow ❄️
`));

  console.log(chalk.cyan('🤖 Q says: "Neither do I. But together… we\'ll learn everything."'));
  console.log(chalk.gray('\n💡 Hint: Try "no-wing init" to get started with real onboarding!'));
}
