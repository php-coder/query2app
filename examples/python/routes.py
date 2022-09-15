from fastapi import APIRouter

router = APIRouter()


@router.get('/v1/categories/count')
def get_v1_categories_count():
    pass

@router.get('/v1/collections/:collectionId/categories/count')
def get_v1_collections_collection_id_categories_count():
    pass

@router.get('/v1/categories')
def get_list_v1_categories():
    pass

@router.post('/v1/categories')
def post_v1_categories():
    pass

@router.get('/v1/categories/:categoryId')
def get_v1_categories_category_id():
    pass

@router.put('/v1/categories/:categoryId')
def put_v1_categories_category_id():
    pass

@router.delete('/v1/categories/:categoryId')
def delete_v1_categories_category_id():
    pass

