// Utilidades compartidas para hablar con Claude.
import Anthropic from '@anthropic-ai/sdk';

export function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('Falta ANTHROPIC_API_KEY en el entorno.');
  }
  return new Anthropic();
}

// Extrae el JSON de la respuesta, tolerando structured outputs o texto plano.
export function extractJson(message) {
  if (message.parsed_output) return message.parsed_output;
  for (const block of message.content) {
    if (block.type === 'text') {
      const text = block.text.trim();
      try {
        return JSON.parse(text);
      } catch {
        const match = text.match(/\{[\s\S]*\}/);
        if (match) return JSON.parse(match[0]);
      }
    }
  }
  throw new Error('No se pudo extraer JSON de la respuesta del modelo.');
}
