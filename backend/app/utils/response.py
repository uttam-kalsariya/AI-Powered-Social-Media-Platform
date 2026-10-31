from flask import jsonify

def api_response(data=None, message=None, status_code=200):
    payload = {}
    if message:
        payload['message'] = message
    if data is not None:
        payload['data'] = data
    return jsonify(payload), status_code

def api_error(error_message, status_code=400):
    return jsonify({"error": error_message}), status_code
