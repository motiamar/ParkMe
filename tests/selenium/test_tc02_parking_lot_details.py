"""
TC02 — User can view parking lot details.

What this test verifies:
  1. After geolocation is granted, the nearby parking page loads.
  2. At least one parking lot card is shown in the list panel.
  3. Clicking the first card opens the details view.
  4. The details view shows a non-empty name, address, price, and availability.
  5. No location-permission error is displayed at any point.

Prerequisites (must be running before the test):
  - Frontend:  cd ParkMe/frontend && npm run dev     → http://localhost:5173
  - Backend:   cd ParkMe/backend  && dotnet run      → http://localhost:5097
    (The backend supplies the parking lot data; without it no cards appear and
     the test fails at the "wait for first card" step.)

Run only TC02:
  cd ParkMe/tests/selenium
  py -m pytest test_tc02_parking_lot_details.py -v
"""

from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.action_chains import ActionChains

from config import BASE_URL, GEO_LATITUDE, GEO_LONGITUDE, GEO_ACCURACY

WAIT_TIMEOUT = 20


def test_tc02_user_can_view_parking_lot_details(driver):
    wait = WebDriverWait(driver, WAIT_TIMEOUT)

    # ── Step 1: Inject geolocation mock BEFORE navigation ───────────────────
    # Same CDP override used in TC01.  Must run before the page loads so that
    # when the app calls navigator.geolocation.getCurrentPosition() the browser
    # returns our Tel Aviv coordinates without showing any OS permission dialog.
    driver.execute_cdp_cmd("Emulation.setGeolocationOverride", {
        "latitude":  GEO_LATITUDE,
        "longitude": GEO_LONGITUDE,
        "accuracy":  GEO_ACCURACY,
    })

    # ── Step 2: Open the ParkMe website ─────────────────────────────────────
    driver.get(BASE_URL)

    # ── Step 3: Click "Find Parking" ────────────────────────────────────────
    # Wait until the button is both visible and enabled (isLoading = false).
    find_parking_btn = wait.until(
        EC.element_to_be_clickable((By.CSS_SELECTOR, '[data-testid="find-parking-btn"]'))
    )
    find_parking_btn.click()

    # ── Step 4: Wait for the nearby parking page to appear ──────────────────
    # NearbyParkingPage mounts its root div with data-testid="nearby-parking-page".
    # Its presence proves that onFindParking() fired and navigation completed.
    wait.until(
        EC.presence_of_element_located(
            (By.CSS_SELECTOR, '[data-testid="nearby-parking-page"]')
        )
    )

    # ── Step 5: Wait for the Leaflet map to finish mounting ──────────────────
    # ".leaflet-container" is injected by Leaflet itself after the MapContainer
    # component has mounted and the tile layer has started loading.
    wait.until(
        EC.presence_of_element_located((By.CSS_SELECTOR, '.leaflet-container'))
    )

    # ── Step 6: Wait for the parking list container ──────────────────────────
    wait.until(
        EC.presence_of_element_located((By.CSS_SELECTOR, '[data-testid="parking-list"]'))
    )

    # ── Step 7: Wait until at least one parking lot card exists ──────────────
    # Each card is a <li data-testid="parking-lot-card"> inside the list.
    # The backend fetch is async, so this may take a moment after the map loads.
    wait.until(
        EC.presence_of_element_located(
            (By.CSS_SELECTOR, '[data-testid="parking-lot-card"]')
        )
    )

    cards = driver.find_elements(By.CSS_SELECTOR, '[data-testid="parking-lot-card"]')
    assert len(cards) > 0, (
        f"Expected at least 1 parking lot card, found {len(cards)}. "
        "Ensure the backend is running and returning data."
    )

    # ── Step 8: Click the first parking lot card ─────────────────────────────
    # Scroll the card into the visible viewport first, then click.
    # The panel starts at 62 vh (SNAP_PEEK) so the first card is normally
    # already visible, but the scroll guard ensures reliability in all states.
    first_card = cards[0]
    driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", first_card)
    wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, '[data-testid="parking-lot-card"]')))
    first_card.click()

    # ── Step 9: Wait for the details view to replace the list ────────────────
    # ParkingLotDetails mounts with data-testid="parking-details" when selectedLot
    # is set in NearbyParkingPage.  The list/map view is unmounted at the same time.
    wait.until(
        EC.presence_of_element_located(
            (By.CSS_SELECTOR, '[data-testid="parking-details"]')
        )
    )

    # ── Step 10a: Verify a non-empty parking lot name is displayed ───────────
    name_el = driver.find_element(By.CSS_SELECTOR, '[data-testid="parking-details-name"]')
    name_text = name_el.text.strip()
    assert name_text, (
        "Parking lot name is empty in the details view — "
        "check that the backend lot object has nameEn or nameHe."
    )

    # ── Step 10b: Verify a non-empty address is displayed ────────────────────
    # The address paragraph is prefixed with "⊙ " in the JSX; strip it away.
    address_el = driver.find_element(By.CSS_SELECTOR, '[data-testid="parking-details-address"]')
    address_text = address_el.text.strip().lstrip('⊙').strip()
    assert address_text, (
        "Parking lot address is empty in the details view — "
        "check that the backend lot object has addressEn or addressHe."
    )

    # ── Step 10c: Verify a price or 'Free' label is displayed ────────────────
    price_el = driver.find_element(By.CSS_SELECTOR, '[data-testid="parking-details-price"]')
    price_text = price_el.text.strip()
    assert price_text, (
        "Parking lot price is empty in the details view — "
        "check that the backend lot object has pricePerHour."
    )

    # ── Step 10d: Verify an availability status is displayed ─────────────────
    avail_el = driver.find_element(By.CSS_SELECTOR, '[data-testid="parking-details-availability"]')
    avail_text = avail_el.text.strip()
    assert avail_text, (
        "Parking lot availability is empty in the details view — "
        "check that the backend lot object has availableSpaces."
    )

    # ── Step 11: Verify no location error was ever shown ─────────────────────
    error_elements = driver.find_elements(
        By.CSS_SELECTOR, '[data-testid="location-error"]'
    )
    assert len(error_elements) == 0, (
        "A location-permission error element was found in the DOM. "
        "The CDP geolocation override may not have been applied in time."
    )
