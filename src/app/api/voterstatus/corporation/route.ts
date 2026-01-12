import pool from '@/lib/db';
import { NextResponse } from 'next/server';
import type { RowDataPacket } from 'mysql2';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    // Get total count
    const [countResult] = await pool.query<RowDataPacket[]>(
      'SELECT COUNT(*) as total FROM tbl_voters_search WHERE updated_at IS NOT NULL'
    );
    const total = countResult[0].total;

    // Get paginated data
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM tbl_voters_search
       WHERE updated_at IS NOT NULL
       ORDER BY updated_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      data: rows,
      pagination: {
        currentPage: page,
        totalPages,
        totalRecords: total,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error('corporation GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch corporation list data' }, { status: 500 });
  }
}
