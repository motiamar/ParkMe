"""
TC03 — User sorts parking lots by distance from nearest to farthest.

What this test verifies:
  1. Clicking "Find Parking" navigates to the nearby parking page with mocked geolocation.
  2. The parking-lot API is mocked with three lots whose distances (1.2, 0.4, 0.9 km) are
     intentionally out of order so sorting can be demonstrated.
  3. Clicking the distance sort button triggers a re-fetch with ?sortBy=distance.
  4. The mock returns the lots sorted ascending by drivingDistanceKm: 0.4, 0.9, 1.2.
  5. The rendered card distance labels confirm that order.
  6. No location-permission error appears.

Prerequisites (must be running before the test):
  - Frontend:  cd ParkMe/frontend && npm run dev     → http://localhost:5173
  - Backend:   cd ParkMe/backend  && dotnet run      → http://localhost:5097

Run only TC03:
  cd ParkMe/tests/selenium
  py -m pytest test_tc03_sort_by_distance.py -v
"""

import json
import re

from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

from config import BASE_URL, GEO_ACCURACY, GEO_LATITUDE, GEO_LONGITUDE

WAIT_TIMEOUT = 20

# Three lots with distances intentionally unsorted: 1.2, 0.4, 0.9 km.
# After clicking sort-by-distance the expected card order is: 0.4, 0.9, 1.2.
MOCK_PARKING_LOTS = [
    {
        "id": 201,
        "nameEn": "Mock Garage A",
        "nameHe": "חניון מדומה א",
        "addressEn": "Mock Street 1, Tel Aviv",
        "addressHe": "רחוב מדומה 1, תל אביב",
        "latitude": 32.0860,
        "longitude": 34.7825,
        "pricePerHour": 20,
        "availableSpaces": 10,
        "totalSpaces": 40,
        "image": "/images/parking/1.png",
        "drivingDistanceKm": 1.2,
        "drivingTimeMinutes": 4,
    },
    {
        "id": 202,
        "nameEn": "Mock Garage B",
        "nameHe": "חניון מדומה ב",
        "addressEn": "Mock Street 2, Tel Aviv",
        "addressHe": "רחוב מדומה 2, תל אביב",
        "latitude": 32.0855,
        "longitude": 34.7820,
        "pricePerHour": 15,
        "availableSpaces": 5,
        "totalSpaces": 30,
        "image": "/images/parking/2.png",
        "drivingDistanceKm": 0.4,
        "drivingTimeMinutes": 2,
    },
    {
        "id": 203,
        "nameEn": "Mock Garage C",
        "nameHe": "חניון מדומה ג",
        "addressEn": "Mock Street 3, Tel Aviv",
        "addressHe": "רחוב מדומה 3, תל אביב",
        "latitude": 32.0858,
        "longitude": 34.7822,
        "pricePerHour": 25,
        "availableSpaces": 8,
        "totalSpaces": 50,
        "image": "/images/parking/3.png",
        "drivingDistanceKm": 0.9,
        "drivingTimeMinutes": 3,
    },
]


def install_mocks(driver):
    """Inject CDP geolocation override and a fetch interceptor for the parking-lots API."""

    # Override navigator.geolocation so the app receives Tel Aviv coordinates
    # without showing a real browser permission popup.
    driver.execute_cdp_cmd("Emulation.setGeolocationOverride", {
        "latitude": GEO_LATITUDE,
        "longitude": GEO_LONGITUDE,
        "accuracy": GEO_ACCURACY,
    })

    # Intercept /api/parkinglots and return deterministic mock data.
    # When sortBy=distance the mock sorts by drivingDistanceKm ascending,
    # mirroring what the real backend would do.
    mock_script = f"""
      (() => {{
        const mockedParkingLots = {json.dumps(MOCK_PARKING_LOTS)};
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
          }} catch (error) {{
            return originalFetch(...args);
          }}

          if (parsedUrl.pathname.endsWith('/api/parkinglots')) {{
            const sortBy = parsedUrl.searchParams.get('sortBy');
            const items = sortBy === 'distance'
              ? [...mockedParkingLots].sort((a, b) => a.drivingDistanceKm - b.drivingDistanceKm)
              : [...mockedParkingLots];

            return new Response(
              JSON.stringify({{ items, totalCount: mockedParkingLots.length }}),
              {{ status: 200, headers: {{ 'Content-Type': 'application/json' }} }}
            );
          }}

          return originalFetch(...args);
        }};
      }})();
    """
    driver.execute_cdp_cmd("Page.addScriptToEvaluateOnNewDocument", {"source": mock_script})


def parse_distance_km(text):
    """
    Extract a numeric distance in km from the text of a parking-lot-distance element.

    Supported formats:
      '↗ 1.2 km'       →  1.2
      '0.4 km'         →  0.4
      '850 m'          →  0.85
      'מרחק: 0.7 ק״מ'  →  0.7

    Returns a float (km), or None if no numeric value can be parsed.
    """
    # Check for km / ק (Hebrew abbreviation) first — avoids matching the "m" inside "km".
    km_match = re.search(r'([\d.]+)\s*(?:km|ק)', text, re.IGNORECASE)
    if km_match:
        return float(km_match.group(1))

    # Check for bare metres: "850 m" (word boundary keeps it from matching mid-word).
    m_match = re.search(r'([\d.]+)\s*m\b', text, re.IGNORECASE)
    if m_match:
        return float(m_match.group(1)) / 1000.0

    return None


def extract_card_distances(driver):
    """
    Return a list of float distances (km) read from every visible parking-lot-distance span.
    Fails with a clear message if any card's distance text cannot be parsed.
    """
    distance_elements = driver.find_elements(
        By.CSS_SELECTOR, '[data-testid="parking-lot-distance"]'
    )
    assert distance_elements, (
        "No [data-testid='parking-lot-distance'] elements found. "
        "Ensure ParkingLotCard renders that attribute on the distance span."
    )

    distances = []
    for el in distance_elements:
        raw = el.text
        km = parse_distance_km(raw)
        assert km is not None, (
            f"Could not parse a numeric distance from card text: {raw!r}"
        )
        distances.append(round(km, 2))

    return distances


def test_tc03_user_sorts_parking_lots_by_distance(driver):
    wait = WebDriverWait(driver, WAIT_TIMEOUT)

    # ── Step 1: Inject mocks BEFORE any navigation ──────────────────────────────
    # The CDP geolocation override must be in place before driver.get() so that
    # when the landing page calls navigator.geolocation the coordinates are ready.
    # The fetch interceptor is registered as a "evaluate on new document" script
    # so it runs before any page JS, ensuring every /api/parkinglots call is caught.
    install_mocks(driver)

    # ── Step 2: Open the ParkMe website ─────────────────────────────────────────
    driver.get(BASE_URL)

    # ── Step 3: Click "Find Parking" ─────────────────────────────────────────────
    find_parking_btn = wait.until(
        EC.element_to_be_clickable((By.CSS_SELECTOR, '[data-testid="find-parking-btn"]'))
    )
    find_parking_btn.click()

    # ── Step 4: Wait for the NearbyParkingPage to mount ─────────────────────────
    wait.until(
        EC.presence_of_element_located((By.CSS_SELECTOR, '[data-testid="nearby-parking-page"]'))
    )

    # ── Step 5: Wait for the Leaflet map to render ───────────────────────────────
    wait.until(
        EC.presence_of_element_located((By.CSS_SELECTOR, '.leaflet-container'))
    )

    # ── Step 6: Wait for the parking list ul to appear ───────────────────────────
    wait.until(
        EC.presence_of_element_located((By.CSS_SELECTOR, '[data-testid="parking-list"]'))
    )

    # ── Step 7: Wait until at least two cards are visible ────────────────────────
    # Sorting cannot be verified with a single card — we need at least two to
    # establish that an ordering was applied.
    wait.until(lambda d: len(d.find_elements(
        By.CSS_SELECTOR, '[data-testid="parking-lot-card"]')) >= 2)

    cards = driver.find_elements(By.CSS_SELECTOR, '[data-testid="parking-lot-card"]')
    assert len(cards) >= 2, (
        f"Expected at least 2 parking lot cards to verify sort order, found {len(cards)}. "
        "Check that the mock fetch interceptor is returning data correctly."
    )

    # ── Step 8: Confirm the initial (unsorted) order before clicking sort ────────
    # The mock returns lots in insertion order: 1.2, 0.4, 0.9 km.
    # This baseline check proves the sort button actually changed something.
    initial_distances = extract_card_distances(driver)
    assert initial_distances == [1.2, 0.4, 0.9], (
        f"Expected the default mocked order [1.2, 0.4, 0.9] km, but found {initial_distances}. "
        "The fetch interceptor may not be active or the page reordered the data."
    )

    # ── Step 9: Click the distance sort button ───────────────────────────────────
    sort_btn = wait.until(
        EC.element_to_be_clickable((By.CSS_SELECTOR, '[data-testid="sort-by-distance"]'))
    )
    sort_btn.click()

    # ── Step 10: Wait for the cards to re-render in ascending distance order ─────
    # The app fires a new /api/parkinglots?sortBy=distance fetch; the mock returns
    # lots sorted by drivingDistanceKm.  We poll until the DOM reflects that order.
    wait.until(lambda d: extract_card_distances(d) == [0.4, 0.9, 1.2])

    # ── Step 11: Assert the final sorted order ────────────────────────────────────
    sorted_distances = extract_card_distances(driver)
    assert sorted_distances == [0.4, 0.9, 1.2], (
        f"Expected distance-sorted order [0.4, 0.9, 1.2] km, but found {sorted_distances}. "
        "The sort button may not have triggered a re-fetch or the UI did not update."
    )

    # ── Step 12: Verify no location-permission error is shown ────────────────────
    # LandingPage renders <p data-testid="location-error"> when geolocation fails.
    # If the CDP override worked correctly this element must be absent.
    error_elements = driver.find_elements(By.CSS_SELECTOR, '[data-testid="location-error"]')
    assert len(error_elements) == 0, (
        "A location-permission error element was found. "
        "The CDP geolocation override may not have been applied before navigation."
    )
