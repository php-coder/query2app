from fastapi import APIRouter

router = APIRouter()


@router.get('/v1/hello')
def greetings():
    return {"hello": "world!"}
