export async function sendVerificationEmail(_env: unknown, to: string, url: string): Promise<void> {
  console.info(`[email-verification] ${to}: ${url}`);
}
