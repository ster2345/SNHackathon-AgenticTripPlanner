def get_claims(event):
    """
    Extract authentication claims from API Gateway.

    Supports HTTP API JWT authorizers as well as the older
    REST API/Cognito authorizer structure.
    """

    request_context = event.get("requestContext", {})
    authorizer = request_context.get("authorizer", {})

    # HTTP API + JWT authorizer
    jwt = authorizer.get("jwt", {})
    claims = jwt.get("claims")

    if claims:
        return claims

    # REST API / Cognito authorizer
    claims = authorizer.get("claims")

    if claims:
        return claims

    return {}


def get_user_id(event):
    claims = get_claims(event)

    return claims.get("sub")


def get_user_email(event):
    claims = get_claims(event)

    return claims.get("email")