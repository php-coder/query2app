import psycopg2
import psycopg2.extras

from fastapi import APIRouter, Depends, HTTPException, status

from pydantic import BaseModel

from typing import Optional

from db import db_connection

router = APIRouter()

class CreateCategoryDto(BaseModel):
    name: Optional[str] = None
    name_ru: Optional[str] = None
    slug: Optional[str] = None
    user_id: Optional[int] = None


@router.get('/v1/categories/count')
def get_v1_categories_count(conn=Depends(db_connection)):
    try:
        with conn:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                cur.execute("SELECT COUNT(*) AS counter FROM categories")
                result = cur.fetchone()
                if result is None:
                    raise HTTPException(status_code = status.HTTP_404_NOT_FOUND)
                return result
    finally:
        conn.close()


@router.get('/v1/categories/stat')
def get_v1_categories_stat(conn=Depends(db_connection)):
    try:
        with conn:
            with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
                result = {}
                cur.execute("SELECT COUNT(*) FROM categories")
                result['total'] = cur.fetchone()[0]
                cur.execute("SELECT COUNT(*) FROM categories WHERE name_ru IS NOT NULL")
                result['in_russian'] = cur.fetchone()[0]
                cur.execute("SELECT COUNT(*) FROM categories WHERE name IS NOT NULL")
                result['in_english'] = cur.fetchone()[0]
                cur.execute("SELECT COUNT(*) FROM categories WHERE name IS NOT NULL AND name_ru IS NOT NULL")
                result['fully_translated'] = cur.fetchone()[0]
                return result
    finally:
        conn.close()


@router.get('/v1/collections/{collectionId}/categories/count')
def get_v1_collections_collection_id_categories_count(collectionId, conn=Depends(db_connection)):
    try:
        with conn:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                cur.execute(
                    """
                    SELECT COUNT(DISTINCT s.category_id) AS counter
                      FROM collections_series cs
                      JOIN series s
                        ON s.id = cs.series_id
                     WHERE cs.collection_id = %(collectionId)s
                    """, {"collectionId": collectionId})
                result = cur.fetchone()
                if result is None:
                    raise HTTPException(status_code = status.HTTP_404_NOT_FOUND)
                return result
    finally:
        conn.close()


@router.get('/v1/categories')
def get_list_v1_categories(conn=Depends(db_connection)):
    try:
        with conn:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                cur.execute(
                    """
                    SELECT id
                         , name
                         , name_ru
                         , slug
                     FROM categories
                    """)
                return cur.fetchall()
    finally:
        conn.close()


@router.post('/v1/categories', status_code = status.HTTP_204_NO_CONTENT)
def post_v1_categories(body: CreateCategoryDto, conn=Depends(db_connection)):
    try:
        with conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT
                      INTO categories
                         ( name
                         , name_ru
                         , slug
                         , created_at
                         , created_by
                         , updated_at
                         , updated_by
                         )
                    VALUES
                        ( %(name)s
                        , %(name_ru)s
                        , %(slug)s
                        , NOW()
                        , %(user_id)s
                        , NOW()
                        , %(user_id)s
                        )
                    """, {"name": body.name, "name_ru": body.name_ru, "slug": body.slug, "user_id": body.user_id, "user_id": body.user_id})
    finally:
        conn.close()


@router.get('/v1/categories/{categoryId}')
def get_v1_categories_category_id(categoryId, conn=Depends(db_connection)):
    try:
        with conn:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                cur.execute(
                    """
                    SELECT id
                         , name
                         , name_ru
                         , slug
                      FROM categories
                     WHERE id = %(categoryId)s
                    """, {"categoryId": categoryId})
                result = cur.fetchone()
                if result is None:
                    raise HTTPException(status_code = status.HTTP_404_NOT_FOUND)
                return result
    finally:
        conn.close()


@router.put('/v1/categories/{categoryId}', status_code = status.HTTP_204_NO_CONTENT)
def put_v1_categories_category_id():
    pass


@router.delete('/v1/categories/{categoryId}', status_code = status.HTTP_204_NO_CONTENT)
def delete_v1_categories_category_id():
    pass
