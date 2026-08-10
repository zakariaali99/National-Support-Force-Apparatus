from rest_framework.pagination import PageNumberPagination


class StandardResultsSetPagination(PageNumberPagination):
    """Default pagination for the API.

    An unpaginated /api/members/ returning thousands of rows with nested
    documents/history would be the first real-world performance complaint,
    so this is wired in globally via REST_FRAMEWORK.DEFAULT_PAGINATION_CLASS
    rather than opted into per-viewset.
    """

    page_size = 25
    page_size_query_param = "page_size"
    max_page_size = 200
