'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function scanReceipt(formData: FormData) {
    const file = formData.get('receipt') as File;

    if (!file) {
        return { error: 'No se subió ninguna imagen.' };
    }

    if (!process.env.GEMINI_API_KEY) {
        return { error: 'Clave de API de Gemini no configurada.' };
    }

    try {
        console.log('Server Action: scanReceipt called');
        console.log(`File: ${file.name}, Size: ${file.size}, Type: ${file.type}`);
        console.log(`API Key configured: ${!!process.env.GEMINI_API_KEY}`);

        // Convertir File a Base64
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64 = buffer.toString('base64');
        console.log('Image converted to base64');

        // Configurar modelo - Usando 2.0 ya que 1.5 puede estar deprecado en 2026
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        const prompt = `
            Analiza esta imagen de una boleta, recibo o factura, especialmente de formatos chilenos (SII, RUT, etc.).
            Extrae la siguiente información en formato JSON estricto (sin markdown):
            {
                "description": "Una descripción corta y clara del gasto (ej: Compra en Líder, Almuerzo, Uber). Si es una boleta chilena, busca el nombre del comercio.",
                "amount": 12345 (el monto TOTAL final pagado, como número entero o decimal),
                "date": "YYYY-MM-DD" (la fecha de la boleta. Si no la encuentras o es ilegible, usa null),
                "category": "Asigna una de estas categorías: Comida, Transporte, Oficina, Software, Servicios, Otros. Elige la que mejor se adapte al gasto."
            }
            Reglas importantes:
            1. Si es una boleta de Chile, pon especial atención al "TOTAL" o "VALOR TOTAL".
            2. La descripción debe ser amigable.
            3. Si el monto tiene puntos como separadores de miles (formato chileno 1.000), asegúrate de devolverlo como número limpio (1000).
            4. Devuelve SOLO el objeto JSON, nada más.
        `;

        console.log('Sending request to Gemini...');
        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64,
                    mimeType: file.type
                }
            }
        ]);

        console.log('Response received from Gemini');
        const response = await result.response;
        const text = response.text();
        console.log(`Raw response text: ${text}`);

        // Limpiar JSON (a veces Gemini devuelve ```json ... ```)
        const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const data = JSON.parse(jsonString);
        console.log(`Parsed data: ${JSON.stringify(data)}`);

        return { success: true, data };

    } catch (error: any) {
        console.error('Error scanning receipt:', error);

        // Handle Rate Limiting (429)
        if (error.message?.includes('429') || error.status === 429) {
            return { error: 'Cuota de IA excedida. Por favor espera un minuto e intenta de nuevo.' };
        }

        return { error: 'Error al analizar la boleta con IA.' };
    }
}
