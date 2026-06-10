"""
TC01 — User allows location permission and sees nearby parking lots.

What this test verifies:
  1. Clicking "Find Parking" triggers the browser geolocation API.
  2. When permission is granted and coordinates are returned, the app
     navigates away from the landing page to the map/list page.
  3. The Leaflet map renders and receives the user's position.
  4. At least one nearby parking lot card appears in the list panel.
  5. No location-permission error is shown.

Prerequisites (must be running before the test):
  - Frontend:  cd ParkMe/frontend && npm run dev     → http://localhost:5173
  - Backend:   cd ParkMe/backend  && dotnet run      → http://localhost:5097
    (The backend supplies real parking lot data; without it the list stays empty
     and the "Verify parking lots" assertion will fail.)

Run:
  cd ParkMe/tests/selenium
  pytest test_tc01_location_permission.py -v
"""

from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

from config import BASE_URL, GEO_LATITUDE, GEO_LONGITUDE, GEO_ACCURACY

# How long (seconds) to wait for each element before failing
WAIT_TIMEOUT = 20


def test_tc01_user_allows_location_sees_nearby_parking(driver):
    wait = WebDriverWait(driver, WAIT_TIMEOUT)

    # ── Step 1: Inject geolocation mock BEFORE any page navigation ──────────
    # Chrome DevTools Protocol overrides navigator.geolocation.getCurrentPosition
    # so that when the app calls it (after the user clicks "Find Parking"), it
    # immediately resolves with our Tel Aviv coordinates instead of showing a
    # real permission popup.
    driver.execute_cdp_cmd("Emulation.setGeolocationOverride", {
        "latitude":  GEO_LATITUDE,
        "longitude": GEO_LONGITUDE,
        "accuracy":  GEO_ACCURACY,
    })

    # ── Step 2: Open the ParkMe website ─────────────────────────────────────
    driver.get(BASE_URL)

    # ── Step 3: Wait for the "Find Parking" button and click it ─────────────
    # The button is only active while isLoading is false.
    find_parking_btn = wait.until(
        EC.element_to_be_clickable((By.CSS_SELECTOR, '[data-testid="find-parking-btn"]'))
    )
    find_parking_btn.click()

    # ── Step 4: Verify the map page replaced the landing page ───────────────
    # NearbyParkingPage mounts its root div with data-testid="nearby-parking-page".
    # Its presence means onFindParking() was called successfully — geolocation
    # returned our mocked coordinates and navigation happened.
    wait.until(
        EC.presence_of_element_located(
            (By.CSS_SELECTOR, '[data-testid="nearby-parking-page"]')
        )
    )

    # ── Step 5: Verify the Leaflet map container has rendered ────────────────
    # ".leaflet-container" is added by Leaflet itself when the map mounts.
    wait.until(
        EC.presence_of_element_located((By.CSS_SELECTOR, '.leaflet-container'))
    )

    # ── Step 5b: Verify user position reached the map ───────────────────────
    # ParkingMap renders a hidden <div data-testid="user-location-set"> only
    # when userPosition is truthy.  This is a stable DOM signal; Leaflet renders
    # the actual blue dot into an SVG canvas without predictable attributes.
    wait.until(
        EC.presence_of_element_located(
            (By.CSS_SELECTOR, '[data-testid="user-location-set"]')
        )
    )

    # ── Step 6: Verify nearby parking lots appear in the list ────────────────
    # Wait for the <ul data-testid="parking-list"> to exist …
    wait.until(
        EC.presence_of_element_located((By.CSS_SELECTOR, '[data-testid="parking-list"]'))
    )
    # … then wait until at least one <li> (parking lot card) is inside it.
    # The backend fetch is async so this may take a moment.
    wait.until(
        EC.presence_of_element_located(
            (By.CSS_SELECTOR, '[data-testid="parking-list"] li')
        )
    )

    lot_cards = driver.find_elements(
        By.CSS_SELECTOR, '[data-testid="parking-list"] li'
    )
    assert len(lot_cards) > 0, (
        f"Expected at least 1 parking lot card in the list, found {len(lot_cards)}. "
        "Ensure the backend is running and returning data."
    )

    # ── Step 7: Verify no location-permission error is shown ─────────────────
    # If geolocation is denied, LandingPage renders <p data-testid="location-error">.
    # We must be on the map page already, but we double-check for safety.
    error_elements = driver.find_elements(
        By.CSS_SELECTOR, '[data-testid="location-error"]'
    )
    assert len(error_elements) == 0, (
        "A location-permission error element was found in the DOM. "
        "The CDP geolocation override may not have been applied in time."
    )
