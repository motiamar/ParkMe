# ParkMe — Selenium End-to-End Tests

## Prerequisites

1. **Python 3.10+** with the required packages:
   ```
   pip install -r requirements.txt
   ```

2. **ChromeDriver** matching your installed Chrome version.  
   Either place it on your `PATH`, or install `webdriver-manager` and uncomment the managed driver block in `conftest.py`.

3. **Frontend running** on port 5173:
   ```
   cd ParkMe/frontend
   npm run dev
   ```

4. **Backend running** on port 5097:
   ```
   cd ParkMe/backend
   dotnet run
   ```

---

## Running the tests

Run all tests:
```
pytest tests/selenium/ -v
```

Run a single test file:
```
pytest tests/selenium/test_tc01_location_permission.py -v
```

---

## Test cases

| File | TC | Description |
|------|----|-------------|
| `test_tc01_location_permission.py` | TC01 | User grants geolocation and sees nearby parking |
| `test_tc02_parking_lot_details.py` | TC02 | User taps a parking card and sees its details |
| `test_tc03_sort_by_distance.py`    | TC03 | User sorts the list by distance (nearest first) |
| `test_tc04_sort_by_price.py`       | TC04 | User sorts the list by price (cheapest first) |
| `test_tc05_search_destination.py`  | TC05 | User searches for parking near a typed destination |

---

## TC05 — Search for parking near a destination

**What it verifies:**
- The destination search input is visible on the map screen.
- Typing a destination makes the clear "X" button appear.
- Clicking the search button geocodes the address and recenters the map.
- The parking list remains populated after a destination search.
- Clicking the clear "X" empties the input and returns the map to the GPS-based view.

**Mocks used (no external network calls needed):**
- Geolocation is overridden via CDP with fixed Tel Aviv coordinates.
- The Nominatim geocoding fetch is intercepted and returns fixed Dizengoff Center coordinates.
- The parking-lots API fetch is intercepted and returns two deterministic mock lots.

**Run TC05 only:**
```
pytest tests/selenium/test_tc05_search_destination.py -v
```
