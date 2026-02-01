export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('[Instrumentation] NEO4J_URI:', process.env.NEO4J_URI);
    console.log('[Instrumentation] NEO4J_USER:', process.env.NEO4J_USER);
    console.log('[Instrumentation] NEO4J_PASSWORD set:', !!process.env.NEO4J_PASSWORD);
    
    const { seedDatabase } = await import('./lib/seed');
    await seedDatabase();
  }
}
