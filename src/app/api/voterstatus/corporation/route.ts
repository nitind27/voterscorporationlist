import pool from '@/lib/db';
import { NextResponse } from 'next/server';
import type { RowDataPacket } from 'mysql2';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const offset = (page - 1) * limit;

    // Build WHERE clause for search
    let whereClause = '';
    let queryParams: any[] = [];
    
    if (search) {
      whereClause = `WHERE (
        Voter_Id LIKE ? OR
        full_name LIKE ? OR
        ENG_Full_name LIKE ? OR
        Booth_Number LIKE ? OR
        Booth_Name LIKE ? OR
        Booth_Address LIKE ? OR
        House_Number LIKE ? OR
        updated_mobile_no LIKE ? OR
        Updated_colony LIKE ? OR
        assigned_colony_name LIKE ?
      )`;
      const searchPattern = `%${search}%`;
      queryParams = [
        searchPattern, searchPattern, searchPattern, searchPattern, searchPattern,
        searchPattern, searchPattern, searchPattern, searchPattern, searchPattern
      ];
    }

    // Get total count with search filter
    const [countResult] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM tbl_voters_search ${whereClause}`,
      queryParams
    );
    const total = countResult[0].total;

    // Get paginated data with search filter
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM tbl_voters_search
       ${whereClause}
       ORDER BY updated_at DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
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
