from fastapi import APIRouter

router = APIRouter()


@router.get('/custom/route')
def customRoute():
    return { "custom": True }

@router.get('/custom/exception')
def customException():
    raise RuntimeError('expected error')
