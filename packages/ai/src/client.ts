import OpenAI from 'openai';

export const openai = new OpenAI({
  apiKey: process.env['OPENAI_API_KEY'],
});

export const MODEL = 'gpt-4o';
export const MAX_TOKENS = 1024;
