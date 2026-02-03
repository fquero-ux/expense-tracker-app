'use server';

import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export async function scanReceipt(formData: FormData) {
    const file = formData.get('receipt') as File;

    if (!file) {
        return { error: 'No se subió ninguna imagen.' };
    }

    if (!process.env.ANTHROPIC_API_KEY) {
        return { error: '[v4.1-Claude] Clave de API de Anthropic no configurada en el servidor.' };
    }

    try {
        console.log('Server Action: scanReceipt (Claude) called');

        // Convertir File a Base64
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64 = buffer.toString('base64');
        const mediaType = 'image/jpeg';

        const prompt = `
            Eres un experto en extracción de datos de boletas chilenas (SII, facturas).
            Lee la imagen adjunta y extrae estos datos en formato JSON puro, sin texto adicional:
            {
                "description": "Nombre del comercio o glosa corta",
                "amount": total pagado como número entero,
                "date": "YYYY-MM-DD",
                "category": "Comida|Transporte|Oficina|Software|Servicios|Otros"
            }
            Importante: 
            - Si es una boleta chilena, el monto es el TOTAL final. 
            - Si no encuentras la fecha, usa null.
            - Responde únicamente con el objeto JSON.
        `;

        const message = await anthropic.messages.create({
            model: 'claude-3-5-sonnet-latest',
            max_tokens: 1024,
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'image',
                            source: {
                                type: 'base64',
                                media_type: mediaType,
                                data: base64,
                            },
                        },
                        {
                            type: 'text',
                            text: prompt,
                        },
                    ],
                },
            ],
        });

        // Extraer el texto de la respuesta
        const content = message.content[0];
        if (content.type !== 'text') {
            throw new Error('La respuesta de la IA no es texto.');
        }

        const text = content.text;
        console.log(`Claude Raw text: ${text}`);

        try {
            // Limpiar posible markdown si Claude lo incluye
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            const jsonText = jsonMatch ? jsonMatch[0] : text;
            const data = JSON.parse(jsonText);

            return { success: true, data };
        } catch (parseError) {
            console.error('Parse error:', text);
            return { error: 'La IA devolvió un formato ilegible.' };
        }

    } catch (error: any) {
        console.error('Error scanning receipt (Claude):', error);

        if (error.status === 401) return { error: '[v4.1] Error de autenticación con Anthropic (Key inválida).' };
        if (error.status === 429) return { error: '[v4.1] Cuota excedida en Claude. Reintenta pronto.' };

        return { error: `[v4.1-Claude] Error del servidor: ${error.message || 'Error desconocido'}` };
    }
}
