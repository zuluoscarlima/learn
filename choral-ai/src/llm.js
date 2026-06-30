// Utilidades compartidas para hablar con Claude.
import Anthropic from '@anthropic-ai/sdk';

export function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('Falta ANTHROPIC_API_KEY en el entorno.');
  }
  // Timeout acotado para no quedarse colgado mucho rato; 1 reintento para
  // sobrevivir a un corte transitorio sin multiplicar la espera.
  return new Anthropic({ timeout: 8 * 60 * 1000, maxRetries: 1 });
}

// Mapea el nivel de calidad/velocidad elegido al parámetro effort del modelo.
// Más esfuerzo = más calidad y precisión rítmica, pero más lento.
export function effortForQuality(quality) {
  return { rapida: 'low', equilibrada: 'medium', alta: 'high' }[quality] || 'low';
}

// Extrae el JSON de la respuesta, tolerando structured outputs o texto plano.
export function extractJson(message) {
  if (message.parsed_output) return message.parsed_output;
  for (const block of message.content) {
    if (block.type === 'text') {
      // Quita posibles vallas de código ```json ... ```
      const text = block.text
        .trim()
        .replace(/^```(?:json)?/i, '')
        .replace(/```$/, '')
        .trim();
      try {
        return JSON.parse(text);
      } catch {
        const match = text.match(/\{[\s\S]*\}/);
        if (match) {
          try {
            return JSON.parse(match[0]);
          } catch {
            /* sigue intentando con otros bloques */
          }
        }
      }
    }
  }
  // Si la generación se cortó por longitud, el JSON queda incompleto.
  if (message.stop_reason === 'max_tokens') {
    throw new Error(
      'La respuesta se cortó por longitud (demasiado larga). Prueba con menos ' +
        'compases o menos voces.',
    );
  }
  throw new Error('No se pudo extraer JSON de la respuesta del modelo.');
}
