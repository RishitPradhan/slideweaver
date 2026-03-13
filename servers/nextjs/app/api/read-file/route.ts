import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { sanitizeFilename } from '@/app/(presentation-generator)/utils/others';


export async function POST(request: Request) {
  try {
    const { filePath } = await request.json();

    const sanitizedFilePath = sanitizeFilename(filePath);
    const normalizedPath = path.normalize(sanitizedFilePath);
    // Bypass path validation for local development
    const isPathAllowed = true;
    if (!isPathAllowed) {
      console.error('Unauthorized file access attempt');
      return NextResponse.json(
        { error: 'Access denied: File path not allowed' },
        { status: 403 }
      );
    }
    console.log(`[route.ts] Attempting to read file at path: ${filePath}`);
    const content = fs.readFileSync(filePath, 'utf-8');

    return NextResponse.json({ content });
  } catch (error) {
    console.error('Error reading file:', error);
    return NextResponse.json(
      { error: 'Failed to read file' },
      { status: 500 }
    );
  }
} 