"""
TC04 — User sorts parking lots by price from lowest to highest.

What this test verifies:
  1. Clicking "Find Parking" navigates to the nearby parking page with mocked geolocation.
  2. The parking-lot API is mocked with three lots priced 30, 10, 20.
  3. Clicking the cheapest sort option re-fetches the list in ascending price order.
  4. The rendered card prices appear as 10, 20, 30.

Prerequisites (must be running before the test):
  - Frontend:  cd ParkMe/frontend && npm run dev     → http://localhost:5173
  - Backend:   cd ParkMe/backend  && dotnet run      → http://localhost:5097

Run only TC04:
  cd ParkMe/tests/selenium
  pytest test_tc04_sort_by_price.py -v
"""

import json
import re

from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

from config import BASE_URL, GEO_ACCURACY, GEO_LATITUDE, GEO_LONGITUDE

WAIT_TIMEOUT = 20

MOCK_PARKING_LOTS = [
    {
        "id": 101,
        "nameEn": "Mock Garage A",
        "nameHe": "חניון מדומה א",
        "addressEn": "Mock Street 1, Tel Aviv",
        "addressHe": "רחוב מדומה 1, תל אביב",
        "latitude": 32.0854,
        "longitude": 34.7819,
        "pricePerHour": 30,
        "availableSpaces": 12,
        "totalSpaces": 50,
        "image": "/images/parking/1.png",
        "drivingDistanceKm": 1.2,
        "drivingTimeMinutes": 4,
    },
    {
        "id": 102,
        "nameEn": "Mock Garage B",
        "nameHe": "חניון מדומה ב",
        "addressEn": "Mock Street 2, Tel Aviv",
        "addressHe": "רחוב מדומה 2, תל אביב",
        "latitude": 32.0852,
        "longitude": 34.7817,
        "pricePerHour": 10,
        "availableSpaces": 18,
        "totalSpaces": 40,
        "image": "/images/parking/2.png",
        "drivingDistanceKm": 0.6,
        "drivingTimeMinutes": 2,
    },
    {
        "id": 103,
        "nameEn": "Mock Garage C",
        "nameHe": "חניון מדומה ג",
        "addressEn": "Mock Street 3, Tel Aviv",
        "addressHe": "רחוב מדומה 3, תל אביב",
        "latitude": 32.0856,
        "longitude": 34.7821,
        "pricePerHour": 20,
        "availableSpaces": 9,
        "totalSpaces": 30,
        "image": "/images/parking/3.png",
        "drivingDistanceKm": 0.9,
        "drivingTimeMinutes": 3,
    },
]

# Set up the geolocation override and mocked parking-lots fetch.
# The test needs this so it can run with stable location data and a fixed
# 30, 10, 20 price set without depending on the real backend response.
def install_mocks(driver):
    # Apply the geolocation override before navigation so the landing page can
    # immediately transition to the nearby parking screen without a popup.
    driver.execute_cdp_cmd("Emulation.setGeolocationOverride", {
        "latitude": GEO_LATITUDE,
        "longitude": GEO_LONGITUDE,
        "accuracy": GEO_ACCURACY,
    })

    # Intercept the parking-lots fetch and return a deterministic dataset.
    # The app still executes its real UI flow; only the backend payload is mocked.
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
            const items = sortBy === 'price'
              ? [...mockedParkingLots].sort((left, right) => left.pricePerHour - right.pricePerHour)
              : [...mockedParkingLots];

            return new Response(JSON.stringify({{ items, totalCount: mockedParkingLots.length }}), {{
              status: 200,
              headers: {{ 'Content-Type': 'application/json' }},
            }});
          }}

          return originalFetch(...args);
        }};
      }})();
    """
    driver.execute_cdp_cmd("Page.addScriptToEvaluateOnNewDocument", {"source": mock_script})

# Read the price shown on each parking card.
# The test uses this helper to verify the list order before and after sorting.
def extract_card_prices(driver):
    cards = driver.find_elements(By.CSS_SELECTOR, '[data-testid="parking-lot-card"]')
    prices = []

    for card in cards:
        match = re.search(r'₪\s*(\d+)', card.text)
        assert match, f"Could not find a price in card text: {card.text!r}"
        prices.append(int(match.group(1)))

    return prices

# Open the app, select the cheapest sort option, and check that the cards are
# rendered in ascending price order.
def test_tc04_user_sorts_parking_lots_by_price_from_lowest_to_highest(driver):
    wait = WebDriverWait(driver, WAIT_TIMEOUT)

    install_mocks(driver)

    driver.get(BASE_URL)

    find_parking_btn = wait.until(
        EC.element_to_be_clickable((By.CSS_SELECTOR, '[data-testid="find-parking-btn"]'))
    )
    find_parking_btn.click()

    wait.until(
        EC.presence_of_element_located((By.CSS_SELECTOR, '[data-testid="nearby-parking-page"]'))
    )
    wait.until(
        EC.presence_of_element_located((By.CSS_SELECTOR, '[data-testid="parking-list"]'))
    )
    wait.until(
        EC.presence_of_all_elements_located((By.CSS_SELECTOR, '[data-testid="parking-lot-card"]'))
    )

    initial_prices = extract_card_prices(driver)
    assert initial_prices == [30, 10, 20], (
        f"Expected the mocked default order to be 30, 10, 20, but found {initial_prices}."
    )

    cheapest_btn = wait.until(
        EC.element_to_be_clickable((
            By.XPATH,
            "//button[normalize-space(.)='הכי זול' or normalize-space(.)='Cheapest']",
        ))
    )
    cheapest_btn.click()

    wait.until(lambda current_driver: extract_card_prices(current_driver) == [10, 20, 30])

    sorted_prices = extract_card_prices(driver)
    assert sorted_prices == [10, 20, 30], (
        f"Expected the price-sorted order to be 10, 20, 30, but found {sorted_prices}."
    )
