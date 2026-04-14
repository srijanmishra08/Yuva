import { NextRequest } from 'next/server';
import { eventConfigHandlers } from '@/lib/config-helpers';

export const GET = (req: NextRequest) => eventConfigHandlers.GET(req);
export const PUT = (req: NextRequest) => eventConfigHandlers.PUT(req);
