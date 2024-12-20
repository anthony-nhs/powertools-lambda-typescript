import type { ZodSchema, z } from 'zod';
import { ParseError } from '../errors.js';
import { APIGatewayProxyEventV2Schema } from '../schemas/apigwv2.js';
import type { ParsedResult } from '../types/index.js';
import { Envelope, envelopeDiscriminator } from './envelope.js';

/**
 * API Gateway V2 envelope to extract data within body key
 */
export const ApiGatewayV2Envelope = {
  /**
   * This is a discriminator to differentiate whether an envelope returns an array or an object
   * @hidden
   */
  [envelopeDiscriminator]: 'object' as const,
  parse<T extends ZodSchema>(data: unknown, schema: T): z.infer<T> {
    return Envelope.parse(
      APIGatewayProxyEventV2Schema.parse(data).body,
      schema
    );
  },

  safeParse<T extends ZodSchema>(
    data: unknown,
    schema: T
  ): ParsedResult<unknown, z.infer<T>> {
    const parsedEnvelope = APIGatewayProxyEventV2Schema.safeParse(data);
    if (!parsedEnvelope.success) {
      return {
        success: false,
        error: new ParseError('Failed to parse API Gateway V2 envelope', {
          cause: parsedEnvelope.error,
        }),
        originalEvent: data,
      };
    }

    const parsedBody = Envelope.safeParse(parsedEnvelope.data.body, schema);

    if (!parsedBody.success) {
      return {
        success: false,
        error: new ParseError('Failed to parse API Gateway V2 envelope body', {
          cause: parsedBody.error,
        }),
        originalEvent: data,
      };
    }

    // use type assertion to avoid type check, we know it's success here
    return parsedBody;
  },
};
