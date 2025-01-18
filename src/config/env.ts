interface EnvConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
}

export const env: EnvConfig = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
}

// Validate environment variables
const requiredEnvVars: (keyof EnvConfig)[] = ['supabaseUrl', 'supabaseAnonKey'];

requiredEnvVars.forEach((key) => {
  if (!env[key]) {
    throw new Error(
      `Missing required environment variable: ${key.toUpperCase()}\n` +
      'Please check your .env file and ensure all required variables are set.'
    );
  }
});