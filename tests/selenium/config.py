import os

# Frontend base URL — override with the PARKME_URL environment variable if needed
BASE_URL = os.environ.get("PARKME_URL", "http://localhost:5173")

# Mocked geolocation — central Tel Aviv (Azrieli area)
GEO_LATITUDE  = 32.0853
GEO_LONGITUDE = 34.7818
GEO_ACCURACY  = 100  # metres reported to the browser
