'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function scanReceipt(formData: FormData) {
    const file = formData.get('receipt') as File;

    if (!file) {
        return { error: 'No se subió ninguna imagen.' };
    }

    if (!process.env.GEMINI_API_KEY) {
        return { error: '[v2.5] Clave de API de Gemini no configurada en el servidor.' };
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

        // Usamos 1.5-flash que es extremadamente estable y rápido para OCR
        const model = genAI.getGenerativeModel({
            model: 'gemini-1.5-flash',
            generationConfig: {
                responseMimeType: 'application/json',
            }
        });

        const prompt = `
            Eres un experto en extracción de datos de boletas chilenas (SII, facturas).
            Extrae estos datos en JSON:
            {
                "description": "Nombre del comercio o glosa corta",
                "amount": total pagado como número,
                "date": "YYYY-MM-DD",
                "category": "Comida|Transporte|Oficina|Software|Servicios|Otros"
            }
            Importante: 
            - Si es chilena, el monto es el TOTAL. 
            - Si no hay fecha usa null.
            - Responde SOLO con el JSON.
        `;

        console.log('Sending request to Gemini 1.5 Flash...');
        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64,
                    mimeType: 'image/jpeg' // Forzamos jpeg ya que comprimimos a eso
                }
            }
        ]);

        const response = await result.response;
        const text = response.text();
        console.log(`Raw text: ${text}`);

        try {
            const data = JSON.parse(text);
            return { success: true, data };
        } catch (parseError) {
            console.error('Parse error:', text);
            return { error: 'La IA devolvió un formato ilegible.' };
        }

    } catch (error: any) {
        console.error('Error scanning receipt:', error);

        if (error.message?.includes('429')) return { error: '[v2.5] Cuota excedida. Reintenta en 1 min.' };
        if (error.message?.includes('401')) return { error: '[v2.5] Error de autenticación con la IA.' };

        return { error: `[v2.5] Error del servidor: ${error.message || 'Error desconocido'}` };
    }
}
