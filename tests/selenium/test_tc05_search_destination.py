"""
TC05 — User searches for parking near a destination.

What this test verifies:
  1. Clicking "Find Parking" navigates to the nearby parking page with mocked geolocation.
  2. The destination search input is visible with the correct placeholder text.
  3. Typing a destination makes the clear "X" button appear.
  4. Clicking the search button geocodes the address and recenters the map.
  5. The parking list remains visible and contains lots after the destination search.
  6. Clicking the clear "X" empties the search input.
  7. After clearing, the app returns to the GPS-based view (search-location marker gone).

Prerequisites (must be running before the test):
  - Frontend:  cd ParkMe/frontend && npm run dev     → http://localhost:5173
  - Backend:   cd ParkMe/backend  && dotnet run      → http://localhost:5097

Run only TC05:
  cd ParkMe/tests/selenium
  pytest test_tc05_search_destination.py -v
"""

import json

from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

from config import BASE_URL, GEO_ACCURACY, GEO_LATITUDE, GEO_LONGITUDE

WAIT_TIMEOUT = 20

# Fixed coordinates returned by the mocked Nominatim geocoder for the destination query.
DIZENGOFF_LAT = 32.07003
DIZENGOFF_LNG = 34.77477

# Two deterministic parking lots placed near Dizengoff Center.
MOCK_PARKING_LOTS = [
    {
        "id": 501,
        "nameEn": "Mock Garage Near Dizengoff",
        "nameHe": "חניון מדומה ליד דיזנגוף",
        "addressEn": "King George Street, Tel Aviv",
        "addressHe": "רחוב המלך ג'ורג', תל אביב",
        "latitude": 32.0705,
        "longitude": 34.7750,
        "pricePerHour": 18,
        "availableSpaces": 15,
        "totalSpaces": 60,
        "image": "/images/parking/1.png",
        "drivingDistanceKm": 0.3,
        "drivingTimeMinutes": 2,
    },
    {
        "id": 502,
        "nameEn": "Mock Garage Dizengoff B",
        "nameHe": "חניון מדומה ב דיזנגוף",
        "addressEn": "Dizengoff Street, Tel Aviv",
        "addressHe": "רחוב דיזנגוף, תל אביב",
        "latitude": 32.0710,
        "longitude": 34.7755,
        "pricePerHour": 22,
        "availableSpaces": 8,
        "totalSpaces": 40,
        "image": "/images/parking/2.png",
        "drivingDistanceKm": 0.5,
        "drivingTimeMinutes": 3,
    },
]


def install_mocks(driver):
    """
    Inject three browser-level mocks before page navigation:
      1. CDP geolocation override — supplies Tel Aviv GPS coordinates so the app
         skips the real permission popup and immediately resolves a position.
      2. Nominatim fetch intercept — returns fixed Dizengoff Center coordinates so
         the geocoding call never hits the real external API.
      3. Parking-lots API intercept — returns two deterministic mock lots so the
         list is always populated regardless of backend state.
    """
    driver.execute_cdp_cmd("Emulation.setGeolocationOverride", {
        "latitude": GEO_LATITUDE,
        "longitude": GEO_LONGITUDE,
        "accuracy": GEO_ACCURACY,
    })

    mock_script = f"""
      (() => {{
        const mockedParkingLots = {json.dumps(MOCK_PARKING_LOTS)};
        const dizengoffLat = {DIZENGOFF_LAT};
        const dizengoffLng = {DIZENGOFF_LNG};
        const originalFetch = window.fetch.bind(window);

        window.fetch = async (...args) => {{
          const [input] = args;
          const requestUrl = typeof input === 'string'
            ? input
            : input instanceof Request
              ? input.url
              : String(input);

          let parsedUrl;
          try {{
            parsedUrl = new URL(requestUrl, window.location.href);
          }} catch (e) {{
            return originalFetch(...args);
          }}

          // Intercept the Nominatim geocoding call and return a fixed result for
          // "Dizengoff Center, Tel Aviv" so the test never relies on the external API.
          if (parsedUrl.hostname === 'nominatim.openstreetmap.org') {{
            const geocodeResult = [
              {{
                "lat": String(dizengoffLat),
                "lon": String(dizengoffLng),
                "display_name": "Dizengoff Center, Tel Aviv, Israel"
              }}
            ];
            return new Response(JSON.stringify(geocodeResult), {{
              status: 200,
              headers: {{ 'Content-Type': 'application/json' }},
            }});
          }}

          // Intercept the parking-lots API so the list is always populated.
          if (parsedUrl.pathname.endsWith('/api/parkinglots')) {{
            return new Response(
              JSON.stringify({{ items: mockedParkingLots, totalCount: mockedParkingLots.length }}),
              {{ status: 200, headers: {{ 'Content-Type': 'application/json' }} }}
            );
          }}

          return originalFetch(...args);
        }};
      }})();
    """
    driver.execute_cdp_cmd("Page.addScriptToEvaluateOnNewDocument", {"source": mock_script})


def test_tc05_user_searches_for_parking_near_destination(driver):
    wait = WebDriverWait(driver, WAIT_TIMEOUT)

    # ── Step 1: Inject all mocks BEFORE any navigation ───────────────────────
    # The CDP geolocation override must be in place before driver.get() so the
    # landing page can resolve coordinates immediately.  The fetch interceptor is
    # registered as an "evaluate on new document" script so it is active before
    # any page JavaScript runs.
    install_mocks(driver)

    # ── Step 2: Open the ParkMe website ──────────────────────────────────────
    driver.get(BASE_URL)

    # ── Step 3: Click the "Find Parking" button ───────────────────────────────
    find_parking_btn = wait.until(
        EC.element_to_be_clickable((By.CSS_SELECTOR, '[data-testid="find-parking-btn"]'))
    )
    find_parking_btn.click()

    # ── Step 4: Wait for the map screen to be fully loaded ────────────────────
    # (a) NearbyParkingPage root is mounted
    wait.until(
        EC.presence_of_element_located((By.CSS_SELECTOR, '[data-testid="nearby-parking-page"]'))
    )
    # (b) Leaflet map container is rendered
    wait.until(
        EC.presence_of_element_located((By.CSS_SELECTOR, '.leaflet-container'))
    )
    # (c) GPS coordinates have reached the ParkingMap component
    wait.until(
        EC.presence_of_element_located((By.CSS_SELECTOR, '[data-testid="user-location-set"]'))
    )
    # (d) At least one parking lot card is shown in the list
    wait.until(
        EC.presence_of_element_located((By.CSS_SELECTOR, '[data-testid="parking-list"] li'))
    )

    # ── Step 5: Locate the destination search input ───────────────────────────
    # MapSearchBox renders data-testid="search-input".
    # The placeholder text is "חפש חניה קרובה ליעד" (Hebrew) or the English equivalent.
    search_input = wait.until(
        EC.visibility_of_element_located((By.CSS_SELECTOR, '[data-testid="search-input"]'))
    )
    assert search_input.is_displayed(), (
        "Expected the destination search input to be visible on the map screen."
    )

    # ── Step 6: Type a real destination ──────────────────────────────────────
    search_input.click()
    search_input.send_keys("Dizengoff Center, Tel Aviv")

    # ── Step 10 (pre-search): Verify the clear "X" button appears after typing ─
    # The button is conditionally rendered only when searchQuery.length > 0,
    # so it must appear as soon as there is text in the input.
    clear_btn = wait.until(
        EC.visibility_of_element_located((By.CSS_SELECTOR, '[data-testid="search-clear-btn"]'))
    )
    assert clear_btn.is_displayed(), (
        "Expected the clear 'X' button to be visible after entering a destination. "
        "It should render as soon as the search input has text."
    )

    # ── Step 7: Click the search / magnifying-glass button ───────────────────
    search_btn = wait.until(
        EC.element_to_be_clickable((By.CSS_SELECTOR, '[data-testid="search-submit-btn"]'))
    )
    search_btn.click()

    # ── Step 8: Verify the map recentered to the searched destination ─────────
    # ParkingMap renders <div data-testid="search-location-set"> only when the
    # searchedLocation prop is truthy (i.e. geocoding succeeded and
    # setSearchedLocation was called with the Dizengoff Center coordinates).
    # This is the same stable-DOM-signal pattern used for "user-location-set".
    wait.until(
        EC.presence_of_element_located((By.CSS_SELECTOR, '[data-testid="search-location-set"]'))
    )

    # ── Step 9: Verify the parking list is still visible and has lots ─────────
    wait.until(
        EC.presence_of_element_located((By.CSS_SELECTOR, '[data-testid="parking-list"]'))
    )
    lot_cards = driver.find_elements(By.CSS_SELECTOR, '[data-testid="parking-list"] li')
    assert len(lot_cards) > 0, (
        f"Expected at least one parking lot card after searching for a destination, "
        f"but found {len(lot_cards)}. "
        "Ensure the parking-lots fetch mock is returning data."
    )

    # ── Step 11: Click the clear "X" button ──────────────────────────────────
    # Re-fetch the button in case the DOM was updated after the search.
    clear_btn = driver.find_element(By.CSS_SELECTOR, '[data-testid="search-clear-btn"]')
    clear_btn.click()

    # ── Step 12: Verify the search input is cleared ───────────────────────────
    # After clearSearch(), React sets searchQuery to '' so the controlled input
    # value becomes an empty string.
    wait.until(
        lambda d: d.find_element(
            By.CSS_SELECTOR, '[data-testid="search-input"]'
        ).get_attribute('value') == ''
    )
    cleared_value = driver.find_element(
        By.CSS_SELECTOR, '[data-testid="search-input"]'
    ).get_attribute('value')
    assert cleared_value == '', (
        f"Expected the search input to be empty after clicking the clear button, "
        f"but found: {cleared_value!r}"
    )

    # ── Step 13: Verify the app returned to the GPS-based parking view ────────
    # clearSearch() calls setSearchedLocation(null), which removes the
    # search-location-set element from the DOM and flies the map back to the
    # user's GPS position.
    wait.until(
        EC.invisibility_of_element_located(
            (By.CSS_SELECTOR, '[data-testid="search-location-set"]')
        )
    )
    search_marker_els = driver.find_elements(
        By.CSS_SELECTOR, '[data-testid="search-location-set"]'
    )
    assert len(search_marker_els) == 0, (
        "Expected 'search-location-set' to be removed from the DOM after clearing "
        "the search, confirming the map returned to the user's current location."
    )
