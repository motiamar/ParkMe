# Shared Selenium fixtures for ParkMe tests.
#
# Prerequisites before running any test:
#   1. Install dependencies:      pip install -r requirements.txt
#   2. Install ChromeDriver:      https://chromedriver.chromium.org/downloads
#                                 (version must match your installed Chrome)
#      Tip — let Selenium manage it automatically with:
#                                 pip install webdriver-manager
#      then swap webdriver.Chrome() for the managed version (see comment below).
#   3. Start the frontend:        cd frontend && npm run dev   (port 5173)
#   4. Start the backend:         cd backend  && dotnet run    (port 5097)
#
# Run all tests:   pytest tests/selenium/ -v
# Run one file:    pytest tests/selenium/test_tc01_location_permission.py -v

import pytest
from selenium import webdriver
from selenium.webdriver.chrome.options import Options


@pytest.fixture(scope="function")
def driver():
    options = Options()

    # Auto-grant geolocation permission so no browser popup blocks the test.
    # Value 1 = Allow, 2 = Block.
    options.add_experimental_option("prefs", {
        "profile.default_content_setting_values.geolocation": 1,
    })

    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--window-size=390,844")   # mobile viewport (iPhone 14 Pro)

    # Uncomment to run without a visible browser window:
    # options.add_argument("--headless=new")

    # --- Option A: rely on ChromeDriver already on PATH (default) ---
    driver = webdriver.Chrome(options=options)

    # --- Option B: let webdriver-manager download/match ChromeDriver automatically ---
    # from selenium.webdriver.chrome.service import Service
    # from webdriver_manager.chrome import ChromeDriverManager
    # driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)

    driver.implicitly_wait(0)   # explicit waits only — never mix with implicit waits

    yield driver

    driver.quit()
