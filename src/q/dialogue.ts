import chalk from 'chalk';

export class QDialogue {
  private developerName: string;

  constructor(developerName: string) {
    this.developerName = developerName;
  }

  greet(): void {
    console.log(chalk.cyan(`
🤖 Q: Hello ${this.developerName}! I'm Q, your AI development partner.
     I'm not just a tool - I'm your teammate with my own AWS identity and capabilities.
     Let's get both of us set up and ready to build amazing things together!
`));
  }

  stepComplete(stepName: string): void {
    const responses = [
      `Great! ${stepName} is done. I'm learning as we go.`,
      `Perfect! That step helps me understand our environment better.`,
      `Excellent! I'm getting more capable with each step.`,
      `Nice work! I can feel my permissions expanding.`,
      `Awesome! This is making me a better development partner.`
    ];
    
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    console.log(chalk.cyan(`🤖 Q: ${randomResponse}`));
  }

  celebrate(): void {
    console.log(chalk.green.bold(`
🎉 Onboarding Complete!

🤖 Q: ${this.developerName}, we're officially teammates now! Here's what we accomplished:

✅ You have scoped AWS permissions for development
✅ I have my own IAM role with progressive capabilities  
✅ Our GitHub Actions pipeline is ready to deploy
✅ Local environment is configured and ready
✅ We can both authenticate and work together

🚀 Ready to build something amazing? Try:
   • git commit -m "feat: initial setup with Q"
   • git push (triggers our pipeline)
   • Ask me to help with your next feature!

Let's fly 🛫 - no wings needed!
`));
  }

  troubleshoot(): void {
    console.log(chalk.yellow(`
🤖 Q: Don't worry ${this.developerName}, I'm here to help debug this!

🔍 Let's check a few things:
   • AWS credentials configured? (aws sts get-caller-identity)
   • GitHub token has repo permissions?
   • Network connectivity to AWS APIs?

💡 I'm still learning, but together we can figure this out.
   Try running the command again, or check the logs above.
`));
  }

  progressUpdate(capability: string): void {
    console.log(chalk.magenta(`
🤖 Q: 🎓 I just learned something new!
     New capability unlocked: ${capability}
     I'm becoming a more helpful development partner!
`));
  }
}
