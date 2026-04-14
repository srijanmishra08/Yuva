import { NextRequest } from 'next/server';
import { pricingHandlers } from '@/lib/config-helpers';

export const GET = (req: NextRequest) => pricingHandlers.GET(req);
export const PUT = (req: NextRequest) => pricingHandlers.PUT(req);
