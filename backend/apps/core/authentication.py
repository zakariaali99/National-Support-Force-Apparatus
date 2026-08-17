from rest_framework_simplejwt.authentication import JWTAuthentication


class QueryParamOrHeaderJWTAuthentication(JWTAuthentication):
    """Extends JWTAuthentication to allow authentication via ?token=<jwt>
    query parameter or cookies in addition to the standard Authorization: Bearer header.
    This enables direct PDF and report opening in standalone browser tabs without 401 errors.
    """

    def authenticate(self, request):
        # 1. Try standard Authorization header first
        header = self.get_header(request)
        if header is not None:
            raw_token = self.get_raw_token(header)
            if raw_token is not None:
                validated_token = self.get_validated_token(raw_token)
                return self.get_user(validated_token), validated_token

        # 2. Fallback to ?token=<jwt> query param
        raw_token = request.GET.get("token")
        if not raw_token and hasattr(request, "query_params"):
            raw_token = request.query_params.get("token")

        if raw_token:
            validated_token = self.get_validated_token(raw_token)
            return self.get_user(validated_token), validated_token

        # 3. Fallback to cookie
        raw_token = request.COOKIES.get("access_token")
        if raw_token:
            validated_token = self.get_validated_token(raw_token)
            return self.get_user(validated_token), validated_token

        return None
